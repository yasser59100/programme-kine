// KinéForce — notifications du jour (« Le saviez-vous ? » et « Vrai ou faux »)
// Lancé toutes les heures par GitHub Actions. Lit les abonnements dans Firestore (collection « push »),
// envoie la notification du jour à l'heure choisie par chaque patient, une fois par jour.
// Aucune donnée de santé : un abonnement = l'adresse technique du téléphone, l'heure, le fuseau et le type choisi.
import admin from "firebase-admin";
import webpush from "web-push";
import crypto from "node:crypto";
import fs from "node:fs";
import vm from "node:vm";

const RAW = process.env.FIREBASE_SA;
if (!RAW) { console.log("Clé FIREBASE_SA absente : rien à faire."); process.exit(0); }
const sa = JSON.parse(RAW);
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

// Clés VAPID dérivées de la clé du compte de service : un seul secret à gérer
const N = BigInt("0xFFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551");
const d = BigInt("0x" + crypto.createHash("sha256").update("kineforce-vapid|" + sa.private_key).digest("hex")) % (N - 1n) + 1n;
const priv = Buffer.from(d.toString(16).padStart(64, "0"), "hex");
const ecdh = crypto.createECDH("prime256v1"); ecdh.setPrivateKey(priv);
const b64u = (b) => b.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const PUB = b64u(ecdh.getPublicKey()), PRIV = b64u(priv);
webpush.setVapidDetails("mailto:yasser@ladraa-kine.be", PUB, PRIV);
const cfg = await db.doc("config/push").get();
if (!cfg.exists || cfg.data().publicKey !== PUB) { await db.doc("config/push").set({ publicKey: PUB }); console.log("Clé publique publiée."); }

// Contenus : les mêmes fichiers que l'appli
const ctx = { window: {}, document: { readyState: "complete", getElementById: () => null, addEventListener: () => {}, querySelector: () => null }, MutationObserver: function () { this.observe = () => {}; }, console };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync("assets/js/kine-savoir.js", "utf8"), ctx);
const TIPS = ctx.window.KineSavoir.tips;
const src = fs.readFileSync("assets/js/kine-idees.js", "utf8");
const VF = vm.runInNewContext(src.match(/var VF = (\[[\s\S]*?\n  \]);/)[1]);

function local(tz) {
  const f = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" });
  const p = Object.fromEntries(f.formatToParts(new Date()).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, hour: +p.hour, day: Date.UTC(+p.year, +p.month - 1, +p.day) / 86400000 };
}
function message(kind, day) {
  const k = kind === "both" ? (day % 2 ? "vf" : "savoir") : kind;
  if (k === "vf") {
    const v = VF[day % VF.length];
    return { title: "Vrai ou faux du jour", body: "« " + v.q + " » Vrai ou faux ? Yass a la réponse.", url: "./?ouvrir=vf", tag: "kf-jour" };
  }
  const t = TIPS[day % TIPS.length];
  return { title: "Le saviez-vous ?", body: t.title, url: "./?ouvrir=savoir", tag: "kf-jour" };
}

const snap = await db.collection("push").get();
let sent = 0, gone = 0, skip = 0;
for (const doc of snap.docs) {
  const s = doc.data();
  let L;
  try { L = local(s.tz || "Europe/Paris"); } catch (e) { L = local("Europe/Paris"); }
  if (L.hour < (s.hour ?? 9) || s.last === L.date || !s.sub || !s.sub.endpoint) { skip++; continue; }
  try {
    await webpush.sendNotification(s.sub, JSON.stringify(message(s.kind || "both", L.day)), { TTL: 6 * 3600 });
    await doc.ref.update({ last: L.date }); sent++;
  } catch (e) {
    if (e.statusCode === 404 || e.statusCode === 410) { await doc.ref.delete(); gone++; }
    else console.log("Échec", e.statusCode || "", String(e.body || e.message).slice(0, 120));
  }
}
// Nouvelles demandes d'accès : une notification sur le téléphone du kiné (sans aucun nom)
const dem = await db.collection("demandes").get();
const fresh = dem.docs.filter((x) => !x.data().notifie);
if (fresh.length) {
  const subs = await db.collection("kinepush").get();
  const n = fresh.length;
  const msg = { title: n > 1 ? n + " nouvelles demandes d'accès" : "Nouvelle demande d'accès", body: n > 1 ? n + " patients demandent l'accès à leur suivi." : "Un patient demande l'accès à son suivi.", url: "./?ouvrir=demandes", tag: "kf-demandes" };
  let ok = 0;
  for (const k of subs.docs) {
    try { await webpush.sendNotification(k.data().sub, JSON.stringify(msg), { TTL: 24 * 3600 }); ok++; }
    catch (e) { if (e.statusCode === 404 || e.statusCode === 410) await k.ref.delete(); }
  }
  for (const x of fresh) await x.ref.update({ notifie: true });
  console.log(`Demandes : ${n} nouvelle(s), notification envoyée à ${ok} appareil(s) du kiné.`);
}
console.log(`Abonnés : ${snap.size} · envoyées : ${sent} · déjà faites ou pas encore l'heure : ${skip} · abonnements périmés retirés : ${gone}`);
process.exit(0);
