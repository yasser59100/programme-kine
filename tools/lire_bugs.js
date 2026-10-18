// Lit les derniers rapports de bugs (Firestore « bugs ») et les écrit dans bugs.json — sans aucun secret.
const admin = require("firebase-admin");
admin.initializeApp({ credential: admin.credential.applicationDefault(), projectId: "programme-kine" });
(async () => {
  const s = await admin.firestore().collection("bugs").orderBy("t", "desc").limit(150).get();
  const out = s.docs.map(d => { const o = d.data(); o.id = d.id; o.t = o.t && o.t.toDate ? o.t.toDate().toISOString() : null; return o; });
  require("fs").writeFileSync(process.argv[2] || "bugs.json", JSON.stringify(out, null, 1));
  console.log(out.length + " rapports");
})().catch(e => { console.error("Erreur :", e.message); process.exit(1); });
