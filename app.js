(() => {
  "use strict";

  const VAT_RATE = 0.055;
  const STORAGE_KEY = "ambre-roasters-cart-v1";

  // Prix en centimes HT, pour 250 g
  const PRODUCTS = [
    { id: "aurore", name: "Aurore", origin: "Éthiopie · Yirgacheffe", roast: "Claire", intensity: 2, price: 1450, notes: "Bergamote, jasmin, pêche blanche. Un café floral et délicat.", bg: "#d9a15b", accent: "#f3d9a8" },
    { id: "solstice", name: "Solstice", origin: "Kenya · Nyeri", roast: "Claire", intensity: 3, price: 1590, notes: "Cassis, pamplemousse rose, acidité vive et sirupeuse.", bg: "#b5513a", accent: "#f2b5a0" },
    { id: "cardamome", name: "Cardamome", origin: "Colombie · Huila", roast: "Moyenne", intensity: 3, price: 1290, notes: "Caramel, pomme cuite, cacao au lait. Rond et gourmand.", bg: "#8b6b3e", accent: "#e8cf9c" },
    { id: "praline", name: "Praliné", origin: "Brésil · Cerrado", roast: "Moyenne", intensity: 4, price: 1190, notes: "Noisette grillée, chocolat noir, finale douce. Idéal en espresso.", bg: "#6b4a2f", accent: "#d9b48a" },
    { id: "nocturne", name: "Nocturne", origin: "Sumatra · Mandheling", roast: "Foncée", intensity: 5, price: 1350, notes: "Cèdre, tabac blond, épices douces. Corsé et profond.", bg: "#3a2a22", accent: "#c27a2c" },
    { id: "braise", name: "Braise", origin: "Guatemala · Antigua", roast: "Foncée", intensity: 4, price: 1390, notes: "Chocolat amer, orange confite, fumée légère.", bg: "#4f2f25", accent: "#e59a5b" },
  ];
  const ROASTS = ["Tous", "Claire", "Moyenne", "Foncée"];

  const $ = (id) => document.getElementById(id);
  const fmt = (cents) => (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

  const state = { filter: "Tous", sort: "featured", cart: loadCart() };

  function loadCart() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!Array.isArray(raw)) return [];
      return raw
        .filter((l) => PRODUCTS.some((p) => p.id === l.id) && Number.isInteger(l.qty) && l.qty > 0)
        .map((l) => ({ id: l.id, qty: Math.min(l.qty, 99) }));
    } catch {
      return [];
    }
  }
  function saveCart() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.cart)); } catch { /* stockage indisponible */ }
  }
  const product = (id) => PRODUCTS.find((p) => p.id === id);

  function totals() {
    const subtotal = state.cart.reduce((s, l) => s + product(l.id).price * l.qty, 0);
    const vat = Math.round(subtotal * VAT_RATE);
    return { subtotal, vat, total: subtotal + vat };
  }

  // ---------- Catalogue ----------
  function renderFilters() {
    $("filters").innerHTML = ROASTS.map(
      (r) => `<button class="chip" data-roast="${r}" aria-pressed="${r === state.filter}">${r === "Tous" ? "Toutes les torréfactions" : r}</button>`
    ).join("");
  }

  function bagHTML(p, cls = "") {
    return `<div class="${cls || "bag"}" style="--bag-accent:${p.accent};background:${p.bg}">${
      cls ? "" : `<small>Ambre</small><b>${p.name}</b><i></i>`
    }</div>`;
  }

  function renderGrid() {
    let list = PRODUCTS.filter((p) => state.filter === "Tous" || p.roast === state.filter);
    const sorts = {
      "price-asc": (a, b) => a.price - b.price,
      "price-desc": (a, b) => b.price - a.price,
      name: (a, b) => a.name.localeCompare(b.name, "fr"),
      intensity: (a, b) => b.intensity - a.intensity,
    };
    if (sorts[state.sort]) list = [...list].sort(sorts[state.sort]);

    $("result-count").textContent = `${list.length} café${list.length > 1 ? "s" : ""}`;
    $("grid").innerHTML = list.length
      ? list.map((p) => `
        <article class="card">
          <div class="visual" style="background:linear-gradient(160deg, ${p.accent}55, ${p.accent}22)">${bagHTML(p)}</div>
          <div class="card-body">
            <p class="origin">${p.origin}</p>
            <h3>${p.name}</h3>
            <p class="notes">${p.notes}</p>
            <div class="meta"><span>Torréfaction ${p.roast.toLowerCase()}</span>
              <span class="dots" title="Intensité ${p.intensity}/5" aria-label="Intensité ${p.intensity} sur 5">${"●".repeat(p.intensity)}${"○".repeat(5 - p.intensity)}</span></div>
            <div class="card-foot">
              <span class="price">${fmt(p.price)} <small>HT · 250 g</small></span>
              <button class="btn" data-add="${p.id}">Ajouter</button>
            </div>
          </div>
        </article>`).join("")
      : `<p class="empty">Aucun café ne correspond à ce filtre.</p>`;
  }

  // ---------- Panier ----------
  function renderCart() {
    const count = state.cart.reduce((s, l) => s + l.qty, 0);
    $("cart-count").textContent = count;
    $("open-cart").setAttribute("aria-label", `Ouvrir le panier, ${count} article${count > 1 ? "s" : ""}`);

    $("cart-items").innerHTML = state.cart.length
      ? state.cart.map((l) => {
          const p = product(l.id);
          return `
          <div class="line">
            ${bagHTML(p, "thumb")}
            <div>
              <h4>${p.name}</h4>
              <p>${fmt(p.price)} HT · 250 g</p>
              <div class="qty">
                <button data-dec="${p.id}" aria-label="Diminuer la quantité de ${p.name}">−</button>
                <span aria-live="polite">${l.qty}</span>
                <button data-inc="${p.id}" aria-label="Augmenter la quantité de ${p.name}">+</button>
              </div>
            </div>
            <div><div class="line-total">${fmt(p.price * l.qty)}</div>
              <button class="remove" data-remove="${p.id}">Retirer</button></div>
          </div>`;
        }).join("")
      : `<p class="empty-cart">Votre panier est vide.<br>Découvrez notre sélection.</p>`;

    const t = totals();
    $("subtotal").textContent = fmt(t.subtotal);
    $("vat").textContent = fmt(t.vat);
    $("total").textContent = fmt(t.total);
    $("checkout").disabled = !state.cart.length;
    $("clear-cart").hidden = !state.cart.length;
  }

  function updateCart(mutator) {
    mutator();
    saveCart();
    renderCart();
  }
  function addToCart(id) {
    updateCart(() => {
      const line = state.cart.find((l) => l.id === id);
      if (line) line.qty = Math.min(99, line.qty + 1);
      else state.cart.push({ id, qty: 1 });
    });
  }
  function changeQty(id, delta) {
    updateCart(() => {
      const line = state.cart.find((l) => l.id === id);
      if (!line) return;
      line.qty = Math.min(99, line.qty + delta);
      if (line.qty <= 0) state.cart = state.cart.filter((l) => l.id !== id);
    });
  }

  let lastFocus = null;
  function openCart() {
    lastFocus = document.activeElement;
    $("drawer").classList.add("open");
    $("drawer").setAttribute("aria-hidden", "false");
    $("overlay").hidden = false;
    $("close-cart").focus();
  }
  function closeCart() {
    $("drawer").classList.remove("open");
    $("drawer").setAttribute("aria-hidden", "true");
    $("overlay").hidden = true;
    if (lastFocus) lastFocus.focus();
  }

  // ---------- Commande ----------
  function checkout() {
    if (!state.cart.length) return;
    const t = totals();
    const number = "AR-" + Date.now().toString(36).toUpperCase().slice(-6);
    $("conf-number").textContent = number;
    $("conf-items").innerHTML = state.cart.map((l) => {
      const p = product(l.id);
      return `<li><span>${l.qty} × ${p.name}</span><span>${fmt(p.price * l.qty)}</span></li>`;
    }).join("");
    $("conf-subtotal").textContent = fmt(t.subtotal);
    $("conf-vat").textContent = fmt(t.vat);
    $("conf-total").textContent = fmt(t.total);

    state.cart = [];
    saveCart();
    renderCart();
    closeCart();
    $("confirmation").hidden = false;
    $("conf-close").focus();
  }

  // ---------- Événements ----------
  document.addEventListener("click", (e) => {
    const t = e.target.closest("button");
    if (!t) return;
    if (t.dataset.add) { addToCart(t.dataset.add); openCart(); }
    else if (t.dataset.inc) changeQty(t.dataset.inc, 1);
    else if (t.dataset.dec) changeQty(t.dataset.dec, -1);
    else if (t.dataset.remove) updateCart(() => { state.cart = state.cart.filter((l) => l.id !== t.dataset.remove); });
    else if (t.dataset.roast) { state.filter = t.dataset.roast; renderFilters(); renderGrid(); }
  });
  $("sort").addEventListener("change", (e) => { state.sort = e.target.value; renderGrid(); });
  $("open-cart").addEventListener("click", openCart);
  $("close-cart").addEventListener("click", closeCart);
  $("overlay").addEventListener("click", closeCart);
  $("checkout").addEventListener("click", checkout);
  $("clear-cart").addEventListener("click", () => updateCart(() => { state.cart = []; }));
  $("conf-close").addEventListener("click", () => {
    $("confirmation").hidden = true;
    document.getElementById("catalogue").scrollIntoView();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!$("confirmation").hidden) $("conf-close").click();
    else if ($("drawer").classList.contains("open")) closeCart();
  });
  // Synchronise plusieurs onglets
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) { state.cart = loadCart(); renderCart(); }
  });

  renderFilters();
  renderGrid();
  renderCart();
})();
