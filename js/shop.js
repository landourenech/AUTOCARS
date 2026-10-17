/* Boutique + panier */
(() => {
  const $ = s => document.querySelector(s);
  let products = [];
  let cart = JSON.parse(localStorage.getItem("celica-cart") || "[]"); // [{id, qty}]

  const saveCart = () => localStorage.setItem("celica-cart", JSON.stringify(cart));

  function render() {
    const type = $("#fType").value, model = $("#fModel").value, q = $("#fSearch").value.trim().toLowerCase();
    const list = products.filter(p =>
      (!type || p.type === type) &&
      (!model || p.model === model) &&
      (!q || (p.name + " " + p.desc).toLowerCase().includes(q))
    );
    $("#grid").innerHTML = list.length ? list.map(p => `
      <article class="card">
        <div class="img">${p.image ? `<img src="${p.image}" alt="${esc(p.name)}">` : "Photo à venir"}</div>
        <div class="body">
          <span class="tag">${esc(p.type)} · ${esc(p.model)}${p.year ? " · " + p.year : ""}</span>
          <h3>${esc(p.name)}</h3>
          <p>${esc(p.desc)}</p>
          <div class="row">
            <span class="price">${fmt(p.price)}</span>
            <button class="btn btn-black" data-add="${p.id}" ${p.stock < 1 ? "disabled" : ""}>${p.stock < 1 ? "Épuisé" : "Ajouter"}</button>
          </div>
        </div>
      </article>`).join("") : `<p class="empty">Aucun produit trouvé.</p>`;
  }

  function renderCart() {
    const lines = cart.map(c => ({ ...c, p: products.find(p => p.id === c.id) })).filter(l => l.p);
    cart = lines.map(({ id, qty }) => ({ id, qty }));
    $("#cartCount").textContent = cart.reduce((a, c) => a + c.qty, 0);
    $("#cartItems").innerHTML = lines.length ? lines.map(l => `
      <div class="cart-line">
        <strong>${esc(l.p.name)}</strong><span>${fmt(l.p.price * l.qty)}</span>
        <div class="qty">
          <button data-dec="${l.id}" aria-label="Moins">−</button>
          <span>${l.qty}</span>
          <button data-inc="${l.id}" aria-label="Plus">+</button>
          <button class="rm" data-rm="${l.id}">Retirer</button>
        </div>
      </div>`).join("") : `<p style="padding:24px 0;color:#6b6b6b">Votre panier est vide.</p>`;
    $("#cartTotal").textContent = fmt(lines.reduce((a, l) => a + l.p.price * l.qty, 0));
    saveCart();
  }

  function openCart(open) {
    $("#drawer").classList.toggle("open", open);
    $("#overlay").classList.toggle("open", open);
    $("#drawer").setAttribute("aria-hidden", String(!open));
  }

  function change(id, delta) {
    const line = cart.find(c => c.id === id);
    const p = products.find(x => x.id === id);
    if (!p) return;
    if (!line) { if (delta > 0) cart.push({ id, qty: 1 }); }
    else {
      line.qty = Math.min(p.stock, line.qty + delta);
      if (line.qty <= 0) cart = cart.filter(c => c.id !== id);
    }
    renderCart();
  }

  document.addEventListener("click", e => {
    const t = e.target;
    if (t.dataset.add) { change(Number(t.dataset.add), 1); openCart(true); }
    else if (t.dataset.inc) change(Number(t.dataset.inc), 1);
    else if (t.dataset.dec) change(Number(t.dataset.dec), -1);
    else if (t.dataset.rm) { cart = cart.filter(c => c.id !== Number(t.dataset.rm)); renderCart(); }
  });

  $("#cartBtn").onclick = () => openCart(true);
  $("#closeCart").onclick = $("#overlay").onclick = () => openCart(false);
  $("#clearCart").onclick = () => { cart = []; renderCart(); };
  ["#fType", "#fModel"].forEach(s => $(s).addEventListener("change", render));
  $("#fSearch").addEventListener("input", render);

  $("#checkout").onclick = () => {
    if (!cart.length) return;
    let total = 0;
    const lines = cart.map(c => {
      const p = products.find(x => x.id === c.id);
      total += p.price * c.qty;
      return `• ${p.name} x${c.qty} — ${fmt(p.price * c.qty)}`;
    });
    const msg = `Bonjour, je souhaite commander :\n${lines.join("\n")}\n\nTotal : ${fmt(total)}`;
    window.open(`https://wa.me/${Settings.whatsapp}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  (async () => {
    $("#year").textContent = new Date().getFullYear();
    $("#waLink").href = `https://wa.me/${Settings.whatsapp}`;
    await DB.init();
    products = await DB.all();
    render();
    renderCart();
  })();
})();