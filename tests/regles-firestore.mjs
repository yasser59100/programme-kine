// Règles Firestore du suivi au cabinet, testées sur l'émulateur (aucune donnée réelle)
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { doc, getDoc, getDocs, setDoc, deleteDoc, collection, serverTimestamp, Timestamp } from "firebase/firestore";
import { readFileSync } from "node:fs";

const env = await initializeTestEnvironment({ projectId: "demo-kine", firestore: { rules: readFileSync("../firestore.rules", "utf8"), host: "127.0.0.1", port: 8080 } });
const kine = env.authenticatedContext("k1", { email: "yasser59100@gmail.com", email_verified: true }).firestore();
const patient = env.authenticatedContext("anonP").firestore();
const intrus = env.authenticatedContext("anonX").firestore();
const anonyme = env.unauthenticatedContext().firestore();
let ok = 0, ko = 0;
async function t(nom, p) { try { await p; ok++; console.log("ok  ", nom); } catch (e) { ko++; console.log("ÉCHEC", nom, e.message); } }
const futur = Timestamp.fromDate(new Date(Date.now() + 864e5)), passe = Timestamp.fromDate(new Date(Date.now() - 864e5));

await t("le kiné crée une fiche", assertSucceeds(setDoc(doc(kine, "patients/p1"), { alias: "S.B.", parcours: "lca_op", kine: "k1" })));
await t("le kiné ajoute un bilan", assertSucceeds(setDoc(doc(kine, "patients/p1/bilans/b1"), { d: "2026-10-27", m: { quad: { a: [20], s: [30] } } })));
await t("le kiné ajoute une note", assertSucceeds(setDoc(doc(kine, "patients/p1/notes/n1"), { t: "privé" })));
await t("le kiné crée un code", assertSucceeds(setDoc(doc(kine, "codes/ABC234"), { pid: "p1", kine: "k1", exp: futur })));
await t("le kiné crée un code expiré", assertSucceeds(setDoc(doc(kine, "codes/OLD234"), { pid: "p1", kine: "k1", exp: passe })));
await t("sans compte : fiche illisible", assertFails(getDoc(doc(anonyme, "patients/p1"))));
await t("sans compte : code illisible", assertFails(getDoc(doc(anonyme, "codes/ABC234"))));
await t("patient non relié : fiche illisible", assertFails(getDoc(doc(patient, "patients/p1"))));
await t("personne ne liste les codes", assertFails(getDocs(collection(patient, "codes"))));
await t("personne ne liste les fiches", assertFails(getDocs(collection(patient, "patients"))));
await t("code expiré refusé", assertFails(setDoc(doc(patient, "patients/p1/membres/anonP"), { code: "OLD234", t: serverTimestamp() })));
await t("code d'une autre fiche refusé", assertFails(setDoc(doc(patient, "patients/p2/membres/anonP"), { code: "ABC234", t: serverTimestamp() })));
await t("se relier au nom d'un autre refusé", assertFails(setDoc(doc(patient, "patients/p1/membres/anonX"), { code: "ABC234", t: serverTimestamp() })));
await t("le patient lit le code", assertSucceeds(getDoc(doc(patient, "codes/ABC234"))));
await t("le patient se relie avec le code", assertSucceeds(setDoc(doc(patient, "patients/p1/membres/anonP"), { code: "ABC234", t: serverTimestamp() })));
await t("le patient supprime le code utilisé", assertSucceeds(deleteDoc(doc(patient, "codes/ABC234"))));
await t("le patient lit sa fiche", assertSucceeds(getDoc(doc(patient, "patients/p1"))));
await t("le patient lit ses bilans", assertSucceeds(getDocs(collection(patient, "patients/p1/bilans"))));
await t("le patient ne lit pas les notes du kiné", assertFails(getDocs(collection(patient, "patients/p1/notes"))));
await t("le patient ne modifie pas sa fiche", assertFails(setDoc(doc(patient, "patients/p1"), { etape: 5 }, { merge: true })));
await t("le patient n'ajoute pas de bilan", assertFails(setDoc(doc(patient, "patients/p1/bilans/b2"), { d: "x" })));
await t("le patient envoie son résumé", assertSucceeds(setDoc(doc(patient, "patients/p1/maison/2026-W44"), { w: "2026-W44", n: 3, dou: 2, eff: 4, der: "2026-10-27", t: serverTimestamp() })));
await t("résumé avec champ en trop refusé", assertFails(setDoc(doc(patient, "patients/p1/maison/2026-W44"), { w: "2026-W44", n: 3, nom: "Jean", t: serverTimestamp() })));
await t("un autre téléphone ne lit pas la fiche", assertFails(getDoc(doc(intrus, "patients/p1"))));
await t("un autre téléphone n'écrit pas de résumé", assertFails(setDoc(doc(intrus, "patients/p1/maison/2026-W44"), { w: "2026-W44", n: 1, t: serverTimestamp() })));
await t("code déjà utilisé : supprimé", getDoc(doc(intrus, "codes/ABC234")).then(s => { if (s.exists()) throw new Error("le code existe encore"); }));
await t("le kiné lit tout", assertSucceeds(getDocs(collection(kine, "patients/p1/maison"))));
await env.cleanup();
console.log(ok + " réussis, " + ko + " échoués");
process.exit(ko ? 1 : 0);
