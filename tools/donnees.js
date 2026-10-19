// Entretien des données Firestore (lancé par GitHub, jamais de secret dans le code) :
//  - « emails »  : retire l'adresse e-mail des anciens messages de la Communauté (ils sont publics)
//  - « purge »   : supprime les statistiques de plus de 13 mois et les rapports de bugs de plus de 12 mois
//  - « stats »   : écrit un résumé des statistiques des 30 derniers jours dans le fichier donné
const admin = require("firebase-admin");
admin.initializeApp({ credential: admin.credential.applicationDefault(), projectId: "programme-kine" });
const db = admin.firestore(), FV = admin.firestore.FieldValue;
async function emails() {
  const s = await db.collection("messages").get(); let n = 0, b = db.batch(), k = 0;
  for (const d of s.docs) if ("email" in d.data()) { b.update(d.ref, { email: FV.delete() }); n++; if (++k === 400) { await b.commit(); b = db.batch(); k = 0; } }
  if (k) await b.commit();
  console.log(n + " message(s) nettoyé(s) sur " + s.size);
}
async function purge(col, months) {
  const lim = new Date(Date.now() - months * 30.5 * 864e5); let n = 0;
  for (;;) {
    const s = await db.collection(col).where("t", "<", lim).limit(400).get(); if (s.empty) break;
    const b = db.batch(); s.docs.forEach(d => b.delete(d.ref)); await b.commit(); n += s.size;
  }
  console.log(col + " : " + n + " document(s) de plus de " + months + " mois supprimé(s)");
}
async function stats(out) {
  const since = new Date(Date.now() - 30 * 864e5);
  const s = await db.collection("stats").where("t", ">=", since).get();
  const rows = s.docs.map(d => { const o = d.data(); o.t = o.t && o.t.toDate ? o.t.toDate().toISOString() : null; return o; });
  require("fs").writeFileSync(out || "stats.json", JSON.stringify(rows));
  console.log(rows.length + " envoi(s) de statistiques sur 30 jours");
}
(async () => {
  const m = process.argv[2];
  if (m === "emails") await emails();
  else if (m === "purge") { await purge("stats", 13); await purge("bugs", 12); }
  else if (m === "stats") await stats(process.argv[3]);
  else throw new Error("tâche inconnue : " + m);
})().catch(e => { console.error("Erreur :", e.message); process.exit(1); });
