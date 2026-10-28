// Base en mémoire qui imite fbCab / fbPat (tests du suivi au cabinet, sans Firebase)
window.__db = { patients: {}, codes: {}, demandes: {}, liens: {} };
(function(){
  var D = window.__db, n = 0;
  function id(){ return "p" + (++n) + Math.random().toString(36).slice(2,6); }
  function full(pid){ var p = D.patients[pid]; if(!p) return null; var o = JSON.parse(JSON.stringify(p.doc)); o.id = pid;
    o.bilans = Object.keys(p.bilans).map(function(k){ var b = JSON.parse(JSON.stringify(p.bilans[k])); b.id=k; return b; }).sort(function(a,b){ return a.d < b.d ? 1 : -1; });
    o.seances = Object.keys(p.seances).map(function(k){ var b = JSON.parse(JSON.stringify(p.seances[k])); b.id=k; return b; }).sort(function(a,b){ return a.d < b.d ? 1 : (a.d > b.d ? -1 : (a.id < b.id ? 1 : -1)); });
    o.maison = Object.keys(p.maison).map(function(k){ return p.maison[k]; }); o.membres = p.membres; o.journal = Object.keys(p.journal || {}).map(function(k){ var x = JSON.parse(JSON.stringify(p.journal[k])); x.id = k; return x; }); o.notes = Object.keys(p.notes).map(function(k){ var x=p.notes[k]; x.id=k; return x; }); o.quest = Object.keys(p.quest || {}).map(function(k){ var x = JSON.parse(JSON.stringify(p.quest[k])); x.id = k; return x; }); return o; }
  var R = function(v){ return new Promise(function(r){ setTimeout(function(){ r(v); }, 30); }); };
  window.fbCab = {
    list: function(){ return R(Object.keys(D.patients).map(function(k){ var o = JSON.parse(JSON.stringify(D.patients[k].doc)); o.id=k; o.maison = Object.keys(D.patients[k].maison).sort().reverse().slice(0,2).map(function(w){ return D.patients[k].maison[w]; }); return o; })); },
    demandes: function(){ return R(Object.keys(D.demandes).map(function(k){ var o = JSON.parse(JSON.stringify(D.demandes[k])); o.id=k; return o; })); },
    accept: function(uid, d){ var k = id(); D.patients[k] = { doc: d, bilans: {}, seances: {}, maison: {}, notes: {}, journal: {}, membres: 1 }; D.liens[uid] = { pid: k }; delete D.demandes[uid]; return R(k); },
    pushSave: function(){ return R(); }, pushDel: function(){ return R(); },
    refuse: function(uid){ D.liens[uid] = { non: true }; delete D.demandes[uid]; return R(); },
    get: function(pid){ return R(full(pid)); },
    create: function(d){ var k = id(); D.patients[k] = { doc: d, bilans: {}, seances: {}, maison: {}, notes: {}, journal: {}, membres: 0 }; return R(k); },
    save: function(pid, d){ Object.assign(D.patients[pid].doc, JSON.parse(JSON.stringify(d))); return R(); },
    bilan: function(pid, bid, d){ bid = bid || id(); D.patients[pid].bilans[bid] = JSON.parse(JSON.stringify(d)); return R(bid); },
    bilanDel: function(pid, bid){ delete D.patients[pid].bilans[bid]; return R(); },
    seance: function(pid, d){ var k = id(); D.patients[pid].seances[k] = JSON.parse(JSON.stringify(d)); return R(k); },
    note: function(pid, sid, d){ D.patients[pid].notes[sid] = d; return R(); },
    code: function(pid){ var c = "K7M2QX"; D.codes[c] = pid; D.patients[pid].doc.code = c; D.patients[pid].doc.codeExp = new Date(Date.now()+14*864e5).toISOString(); return R(c); },
    remove: function(pid){ delete D.patients[pid]; return R(); },
    questSend: function(pid, d){ var k = id(); D.patients[pid].quest = D.patients[pid].quest || {}; D.patients[pid].quest[k] = JSON.parse(JSON.stringify(d)); return R(k); },
    questDel: function(pid, k){ delete D.patients[pid].quest[k]; return R(); }
  };
  window.fbPat = {
    join: function(c){ var pid = D.codes[c]; if(!pid) return Promise.reject(new Error("code")); D.patients[pid].membres = 1; delete D.codes[c]; return R(pid); },
    get: function(pid){ var o = full(pid); if (o) { delete o.notes; } return R(o); },
    google: function(){ return D.google || null; },
    login: function(){ return D.login || null; },
    linkLogin: function(pid, id, pw){ if (D.logins && D.logins[id]) return Promise.reject({ code: "auth/email-already-in-use" }); D.logins = D.logins || {}; D.logins[id] = { pw: pw, pid: pid }; D.login = id; return R(pid); },
    restoreLogin: function(id, pw){ var l = (D.logins || {})[id]; if (!l || l.pw !== pw) return Promise.reject({ code: "auth/invalid-credential" }); D.login = id; return R(l.pid); },
    journalPut: function(pid, id, d){ D.patients[pid].journal = D.patients[pid].journal || {}; D.patients[pid].journal[id] = JSON.parse(JSON.stringify(d)); return R(); },
    journalGet: function(pid){ var j = D.patients[pid].journal || {}; return R(Object.keys(j).map(function(k){ var x = JSON.parse(JSON.stringify(j[k])); x.id = k; return x; })); },
    linkGoogle: function(pid){ D.google = "samir@gmail.com"; D.acces = pid; return R(pid); },
    restoreGoogle: function(){ return R(D.acces || null); },
    request: function(d){ D.demandes.anonP = { prenom: d.prenom, nom: d.nom, msg: d.msg }; return R(); },
    cancel: function(){ delete D.demandes.anonP; return R(); },
    requestState: function(){ var l = D.liens.anonP; if (l) { delete D.liens.anonP; return R(l.pid ? { pid: l.pid } : { refused: true }); } return R(D.demandes.anonP ? { pending: true } : { none: true }); },
    questDone: function(pid, k, d){ var q = D.patients[pid].quest[k]; if (q.fini) return Promise.reject(new Error("permission")); Object.assign(q, JSON.parse(JSON.stringify(d))); return R(); },
    home: function(pid, w, d){ d.w = w; D.patients[pid].maison[w] = d; return R(); }
  };
})();
