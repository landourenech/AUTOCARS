/* Admin : connexion + CRUD produits */
(() => {
  const $ = s => document.querySelector(s);
  let image = "";

  function show(logged) {
    $("#loginView").hidden = logged;
    $("#dash").hidden = !logged;
    if (logged) load();
  }

  $("#loginForm").onsubmit = e => {
    e.preventDefault();
    if ($("#pw").value === Settings.password) {
      sessionStorage.setItem("celica-admin", "1");
      $("#loginErr").textContent = "";
      show(true);
    } else $("#loginErr").textContent = "Mot de passe incorrect.";
  };
  $("#logout").onclick = () => { sessionStorage.removeItem("celica-admin"); location.reload(); };

  /* Redimensionne l'image (max 900px) pour garder la base légère */
  function toDataUrl(file) {
    return new Promise(resolve => {
      const r = new FileReader();
      r.onload = () => {
        const img = new Image();
        img.onload = () => {
          const k = Math.min(1, 900 / Math.max(img.width, img.height));
          const c = document.createElement("canvas");
          c.width = img.width * k; c.height = img.height * k;
          c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL("image/jpeg", 0.8));
        };
        img.src = r.result;
      };
      r.readAsDataURL(file);
    });
  }

  $("#pImage").onchange = async e => {
    const f = e.target.files[0];
    if (!f) return;
    image = await toDataUrl(f);
    $("#pPreview").src = image; $("#pPreview").hidden = false;
  };

  function resetForm() {
    $("#pForm").reset(); $("#pId").value = ""; image = "";
    $("#pPreview").hidden = true;
    $("#formTitle").textContent = "Ajouter un produit";
    $("#cancelBtn").hidden = true;
  }
  $("#cancelBtn").onclick = resetForm;

  $("#pForm").onsubmit = async e => {
    e.preventDefault();
    const id = $("#pId").value;
    const p = {
      name: $("#pName").value.trim(),
      type: $("#pType").value,
      model: $("#pModel").value,
      year: Number($("#pYear").value) || 0,
      price: Number($("#pPrice").value),
      stock: Number($("#pStock").value),
      desc: $("#pDesc").value.trim(),
      image
    };
    if (id) { p.id = Number(id); await DB.update(p); } else await DB.add(p);
    resetForm(); load();
  };

  async function load() {
    const list = await DB.all();
    $("#count").textContent = list.length;
    $("#rows").innerHTML = list.map(p => `
      <tr>
        <td>${p.image ? `<img src="${p.image}" alt="">` : ""}</td>
        <td>${esc(p.name)}</td>
        <td class="hide-m">${esc(p.type)}</td>
        <td class="hide-m">${esc(p.model)}</td>
        <td>${fmt(p.price)}</td>
        <td>${p.stock}</td>
        <td style="white-space:nowrap">
          <button class="btn" data-edit="${p.id}">Modifier</button>
          <button class="btn danger" data-del="${p.id}">Supprimer</button>
        </td>
      </tr>`).join("");
  }

  $("#rows").onclick = async e => {
    const t = e.target;
    if (t.dataset.del) {
      if (confirm("Supprimer ce produit ?")) { await DB.remove(t.dataset.del); load(); }
    } else if (t.dataset.edit) {
      const p = await DB.get(t.dataset.edit);
      $("#pId").value = p.id; $("#pName").value = p.name; $("#pType").value = p.type;
      $("#pModel").value = p.model; $("#pYear").value = p.year || ""; $("#pPrice").value = p.price;
      $("#pStock").value = p.stock; $("#pDesc").value = p.desc; image = p.image || "";
      $("#pPreview").src = image; $("#pPreview").hidden = !image;
      $("#formTitle").textContent = "Modifier le produit"; $("#cancelBtn").hidden = false;
      scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  $("#sWa").value = Settings.whatsapp;
  $("#sForm").onsubmit = e => {
    e.preventDefault();
    if ($("#sWa").value.trim()) Settings.whatsapp = $("#sWa").value.replace(/\D/g, "");
    if ($("#sPw").value) Settings.password = $("#sPw").value;
    $("#sPw").value = "";
    alert("Réglages enregistrés.");
  };

  DB.init().then(() => show(sessionStorage.getItem("celica-admin") === "1"));
})();
