/* Base de données locale (IndexedDB) — CRUD produits */
const DB = (() => {
  const NAME = "celica-db", STORE = "products", VERSION = 1;
  const SEED_VERSION = 2; // augmentez ce nombre pour re-synchroniser les produits d'exemple
  let dbp;

  function open() {
    if (dbp) return dbp;
    dbp = new Promise((resolve, reject) => {
      const req = indexedDB.open(NAME, VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbp;
  }

  async function tx(mode, fn) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const t = db.transaction(STORE, mode);
      const req = fn(t.objectStore(STORE));
      t.oncomplete = () => resolve(req && req.result);
      t.onerror = () => reject(t.error);
    });
  }

  // Chemins RELATIFS (sans "/" au début) vers des images qui existent dans img/
  const seed = [
    { type: "Voiture", name: "Toyota Celica GT-Four ST205", model: "T200", year: 1995, price: 9500000, stock: 1, desc: "Moteur 3S-GTE, transmission intégrale, excellent état.", image: "img/9.png" },
    { type: "Voiture", name: "Toyota Celica SS-II", model: "T230", year: 2002, price: 6800000, stock: 2, desc: "Boîte manuelle 6 vitesses, entretien complet.", image: "img/10.png" },
    { type: "Voiture", name: "Toyota Celica GT Liftback", model: "A60", year: 1983, price: 5200000, stock: 1, desc: "Collection, peinture d'origine.", image: "img/11.png" },
    { type: "Pièce", name: "Kit embrayage renforcé", model: "T180", year: 0, price: 185000, stock: 8, desc: "Compatible 3S-GTE.", image: "img/12.png" },
    { type: "Pièce", name: "Phare avant droit", model: "T200", year: 0, price: 95000, stock: 4, desc: "Neuf, homologué.", image: "img/6.jpg" },
    { type: "Pièce", name: "Jeu de plaquettes de frein", model: "T230", year: 0, price: 45000, stock: 15, desc: "Avant, céramique.", image: "img/13.png" }
  ];

  return {
    async init() {
      const done = Number(localStorage.getItem("celica-seed") || 0);
      if (done >= SEED_VERSION) return;
      // Remplace uniquement les produits d'exemple, pas ceux ajoutés via l'admin
      const existing = await tx("readonly", s => s.getAll());
      await tx("readwrite", s => {
        existing.filter(p => p.seed).forEach(p => s.delete(p.id));
        seed.forEach(p => s.add({ ...p, seed: true }));
      });
      localStorage.setItem("celica-seed", String(SEED_VERSION));
    },
    all: () => tx("readonly", s => s.getAll()),
    get: id => tx("readonly", s => s.get(Number(id))),
    add: p => tx("readwrite", s => s.add(p)),
    update: p => tx("readwrite", s => s.put(p)),
    remove: id => tx("readwrite", s => s.delete(Number(id)))
  };
})();

/* Réglages simples (numéro WhatsApp, mot de passe admin) */
const Settings = {
  get whatsapp() { return localStorage.getItem("celica-wa") || "24100000000"; },
  set whatsapp(v) { localStorage.setItem("celica-wa", v); },
  get password() { return localStorage.getItem("celica-pw") || "celica2026"; },
  set password(v) { localStorage.setItem("celica-pw", v); }
};

const fmt = n => new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));