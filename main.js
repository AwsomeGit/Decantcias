const sheetURL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQsmuT-sX_hT2VXW9_7AbpfRkS1plqwYKV3zrzUVDUf44aEhUZU7btUwp_QUwDoNbv3VANut3ZntOzK/pub?gid=751988153&single=true&output=csv";

const WHATSAPP_NUMBER = "5493517883411";

// Solo estas marcas como “home”
const MAIN_BRANDS = ["Lattafa", "Armaf", "Zimaya", "Afnan", "Maison Alhambra"];

// ------------------------
// Util
// ------------------------
function moneyAR(n) {
  const v = Number(n);
  return `$${(Number.isFinite(v) ? v : 0).toLocaleString("es-AR")}`;
}

function toNumber(raw) {
  if (raw == null) return 0;
  const s = String(raw).trim();
  if (!s) return 0;
  const cleaned = s
    .replace(/\$/g, "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

// Convierte distintos formatos de Google Drive a URL directa (uc)
function driveToDirect(url) {
  if (!url) return "";
  const u = String(url).trim();

  let m = u.match(/\/file\/d\/([^/]+)\//);
  if (m?.[1]) return `https://drive.google.com/uc?export=view&id=${m[1]}`;

  m = u.match(/[?&]id=([^&]+)/);
  if (m?.[1]) return `https://drive.google.com/uc?export=view&id=${m[1]}`;

  m = u.match(/\/uc\?(?:.*&)?id=([^&]+)/);
  if (m?.[1]) return `https://drive.google.com/uc?export=view&id=${m[1]}`;

  return u;
}

function getField(obj, keys) {
  for (const k of keys) {
    if (obj[k] != null && String(obj[k]).trim() !== "") return obj[k];
  }
  return "";
}

// Logos por marca (carpeta fotos)
function getBrandLogo(marcaRaw) {
  if (!marcaRaw) return "";
  const m = marcaRaw.toLowerCase().trim();

  const map = {
    afnan: "fotos/afnan.png",
    armaf: "fotos/armaflogo.jpg",
    lattafa: "fotos/lattafalogo.jpg",
    zimaya: "fotos/zimayalogo.jpg",
    "al wataniah": "fotos/alwatanialogo.png",
    "alwataniah": "fotos/alwatanialogo.png",
    "maison alhambra": "fotos/maisonalhambra.png",
  };

  for (const key in map) {
    if (m.includes(key)) return map[key];
  }
  return "";
}

// Imágenes del sheet
function normalizeImgPath(url) {
  if (!url) return "";
  let u = String(url).trim().replace(/^"|"$/g, "");
  if (!u) return "";

  if (/^https?:\/\//i.test(u) || u.includes("drive.google.com")) return driveToDirect(u);
  if (u.startsWith("fotos/")) return u;
  return `fotos/${u}`;
}

function normBrand(s) {
  return String(s || "").trim().toLowerCase();
}

function isMainBrand(brand) {
  const b = normBrand(brand);
  return MAIN_BRANDS.some((x) => normBrand(x) === b);
}

function prettyBrand(brand) {
  const b = normBrand(brand);
  const found = MAIN_BRANDS.find((x) => normBrand(x) === b);
  return found || String(brand || "").trim();
}

// ------------------------
// State
// ------------------------
let PRODUCTS = [];
let ACTIVE = null;
let activeImgIdx = 0;
let qtyBottle = 0;
let decantEnabled = false;
let qtyDecant = 1;

const CART_KEY = "decantcias_cart_v1";
let CART = JSON.parse(localStorage.getItem(CART_KEY) || "[]");

// ------------------------
// DOM refs
// ------------------------
const el = {};

function cacheDom() {
  el.brands = document.getElementById("brands");
  el.brandView = document.getElementById("brandView");
  el.brandBack = document.getElementById("brandBack");
  el.brandTitle = document.getElementById("brandTitle");
  el.brandProducts = document.getElementById("brandProducts");
  el.products = document.getElementById("products");

  // Product modal
  el.overlay = document.getElementById("modalOverlay");
  el.close = document.getElementById("modalClose");
  el.img = document.getElementById("modalImg");
  el.thumbs = document.getElementById("modalThumbs");
  el.title = document.getElementById("modalTitle");
  el.desc = document.getElementById("modalDesc");
  el.price = document.getElementById("modalPrice");

  el.qtyMinus = document.getElementById("qtyMinus");
  el.qtyPlus = document.getElementById("qtyPlus");
  el.qtyVal = document.getElementById("qtyVal");

  el.decToggle = document.getElementById("decantToggle");
  el.decMinus = document.getElementById("decMinus");
  el.decPlus = document.getElementById("decPlus");
  el.decVal = document.getElementById("decVal");

  el.addBtn = document.getElementById("addToCartBtn");

  // Cart
  el.cartCount = document.getElementById("cartCount");
  el.openCartBtn = document.getElementById("openCartBtn");
  el.cartOverlay = document.getElementById("cartOverlay");
  el.cartClose = document.getElementById("cartClose");
  el.cartItems = document.getElementById("cartItems");
  el.cartTotal = document.getElementById("cartTotal");
  el.waBtn = document.getElementById("waBtn");
  el.clearCartBtn = document.getElementById("clearCartBtn");
}

// ------------------------
// Views
// ------------------------
function hideBrandSection() {
  el.brandView?.classList.add("hidden");
  if (el.brandProducts) el.brandProducts.innerHTML = "";
  if (el.brandTitle) el.brandTitle.textContent = "";
}

function showBrandSection() {
  el.brandView?.classList.remove("hidden");
}

function showAllCatalog(scroll = true) {
  hideBrandSection();
  if (!el.products) return;

  el.products.classList.remove("hidden");
  renderGrid(PRODUCTS, el.products);

  if (scroll) el.products.scrollIntoView({ behavior: "smooth", block: "start" });
}

function hideAllCatalog() {
  el.products?.classList.add("hidden");
  if (el.products) el.products.innerHTML = "";
}

// ------------------------
// Render grid
// ------------------------
function renderGrid(items, mountEl) {
  const target = mountEl || el.products;
  if (!target) return;

  target.innerHTML = "";

  items.forEach((p) => {
    const card = document.createElement("div");
    card.className = "product";

    const firstImg =
      Array.isArray(p.imgs) && p.imgs.length ? String(p.imgs[0]).trim() : "";

    const logo = getBrandLogo(p.marca);

    card.innerHTML = `
      <div class="product-card">
        <div class="card-thumb">
          ${
            firstImg
              ? `<img src="${firstImg}" alt="${(p.marca || "")} ${(p.nombre || "")}" loading="lazy"
                     onerror="this.style.display='none'">`
              : ""
          }
        </div>

        <div class="card-info">
          ${
            logo
              ? `<div class="brand-logo">
                   <img src="${logo}" alt="${p.marca}" loading="lazy"
                        onerror="this.style.display='none'">
                 </div>`
              : ""
          }
          <p class="title">${(p.marca || "").trim()} ${(p.nombre || "").trim()}</p>
          <p class="sub">${moneyAR(p.precio)}</p>
        </div>
      </div>
    `;

    card.addEventListener("click", () => openModalByProduct(p));
    target.appendChild(card);
  });
}

// ------------------------
// Brands (home)
// ------------------------
function renderBrands(products) {
  if (!el.brands) return;

  const present = new Map();
  for (const p of products) {
    if (!isMainBrand(p.marca)) continue;
    present.set(normBrand(p.marca), prettyBrand(p.marca));
  }

 const brandsList = MAIN_BRANDS
  .map((b) => (present.has(normBrand(b)) ? present.get(normBrand(b)) : null))
  .filter(Boolean)
  .sort((a, b) =>
    a.localeCompare(b, "es", { sensitivity: "base" })
  );

  el.brands.innerHTML = "";

  brandsList.forEach((brand) => {
    const card = document.createElement("div");
    card.className = "product";

    const logo = getBrandLogo(brand);

    card.innerHTML = `
      <div class="product-card">
        <div class="card-thumb">
          ${
            logo
              ? `<img src="${logo}" alt="${brand}" loading="lazy"
                     onerror="this.style.display='none'">`
              : ""
          }
        </div>
        <div class="card-info">
          <p class="title">${brand}</p>
          <p class="sub">Ver productos</p>
        </div>
      </div>
    `;

    card.addEventListener("click", () => openBrand(brand));
    el.brands.appendChild(card);
  });
}

function openBrand(brandName) {
  // IMPORTANTE: no “pantalla nueva”, solo muestra la sección de abajo
  hideAllCatalog(); // para que no quede mezclado con el catálogo completo

  const key = normBrand(brandName);
  const filtered = PRODUCTS
  .filter((p) => normBrand(p.marca) === key)
  .sort((a, b) =>
    (a.nombre || "").localeCompare(b.nombre || "", "es", {
      sensitivity: "base",
    })
  );


  if (el.brandTitle) el.brandTitle.textContent = brandName;
  if (el.brandProducts) renderGrid(filtered, el.brandProducts);

  showBrandSection();
  el.brandView?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function closeBrand() {
  hideBrandSection();
  // vuelve a marcas (no hacemos scroll forzado)
}

// ------------------------
// Load + parse
// ------------------------
async function cargarPerfumes() {
  try {
    const res = await fetch(sheetURL, { cache: "no-store" });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);

    const csvText = await res.text();
    const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });

    PRODUCTS = (parsed.data || []).map((row) => {
      const clean = {};
      for (const k in row) {
        const kk = (k || "").replace(/^\uFEFF/, "").trim();
        clean[kk] = (row[k] ?? "").toString().trim();
      }

      const imagenRaw = getField(clean, ["imagenURL", "imagenUrl", "imagen"]);
      const imgs = String(imagenRaw || "")
        .split("|")
        .map((s) => normalizeImgPath(s))
        .filter(Boolean);

      return {
        marca: getField(clean, ["marca", "Marca"]),
        nombre: getField(clean, ["nombre", "Nombre"]),
        descripcion: getField(clean, ["descripcion", "Descripción", "Descripcion", "description"]),
        stock: toNumber(getField(clean, ["stock", "Stock"])),
        precio: toNumber(getField(clean, ["precio", "Precio"])),
        precioDecant: toNumber(getField(clean, ["Precio Decant","PrecioDecant","precioDecant","decant"])),
        ml: toNumber(getField(clean, ["ml","ML","Ml"])),
        imgs,
        raw: clean,
      };
    });

    renderBrands(PRODUCTS);
    updateCartBadge();
    } catch (e) {
    console.error("Error cargando perfumes:", e);
    if (el.products) el.products.innerHTML = `<p style="padding:12px">No se pudo cargar el catálogo.</p>`;
    if (el.brands) el.brands.innerHTML = `<p style="padding:12px">No se pudo cargar el catálogo.</p>`;
  }
}

// ------------------------
// Product Modal
// ------------------------
function openModalByProduct(product) {
  if (!el.overlay) return;

  ACTIVE = product;
  activeImgIdx = 0;
  qtyBottle = 0;
  decantEnabled = false;
  qtyDecant = 1;

  el.title.textContent = `${ACTIVE.marca} ${ACTIVE.nombre}`;
  el.desc.textContent = ACTIVE.descripcion || "";
  el.price.textContent = moneyAR(ACTIVE.precio);

  // Perfume (X ml)
  const perfumeLabel = el.overlay.querySelector(".qty-label");
  if (perfumeLabel) {
    const ml = Number(ACTIVE.ml || 0);
    perfumeLabel.textContent = ml > 0 ? `Perfume (${ml} ml)` : "Perfume";
  }

  // Decant 5ML + precio
  const dPrice = ACTIVE.precioDecant || 0;
  const decantPriceLabel = el.overlay.querySelector(".decant-price");
  if (decantPriceLabel) decantPriceLabel.textContent = `Decant 5ML ${moneyAR(dPrice)}`;

  el.qtyVal.textContent = String(qtyBottle);
  el.decToggle.checked = false;
  el.decVal.textContent = String(qtyDecant);

  renderModalImages();
  el.overlay.classList.remove("hidden");
}

function closeModal() {
  el.overlay?.classList.add("hidden");
}

function renderModalImages() {
  const imgs = ACTIVE?.imgs || [];
  const current = imgs[activeImgIdx];

  if (current) {
    el.img.src = current;
    el.img.style.display = "block";
  } else {
    el.img.removeAttribute("src");
    el.img.style.display = "none";
  }

  el.thumbs.innerHTML = "";
  imgs.forEach((src, i) => {
    const t = document.createElement("div");
    t.className = "thumb" + (i === activeImgIdx ? " active" : "");
    t.innerHTML = `<img src="${src}" alt="">`;
    t.addEventListener("click", (e) => {
      e.stopPropagation();
      activeImgIdx = i;
      renderModalImages();
    });
    el.thumbs.appendChild(t);
  });
}

// ------------------------
// Cart
// ------------------------
function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(CART));
}

function addToCart() {
  if (!ACTIVE) return;

  if (qtyBottle > 0) {
    CART.push({
      type: "bottle",
      marca: ACTIVE.marca,
      nombre: ACTIVE.nombre,
      ml: ACTIVE.ml || 0,
      unitPrice: ACTIVE.precio,
      qty: qtyBottle,
    });
  }

  if (decantEnabled && qtyDecant > 0) {
    CART.push({
      type: "decant",
      marca: ACTIVE.marca,
      nombre: ACTIVE.nombre,
      ml: 5,
      unitPrice: ACTIVE.precioDecant || 0,
      qty: qtyDecant,
    });
  }

  saveCart();
  updateCartBadge();
  closeModal();
}

function updateCartBadge() {
  const totalItems = CART.reduce((acc, it) => acc + (it.qty || 0), 0);
  if (el.cartCount) el.cartCount.textContent = String(totalItems);
}

function cartItemLabel(it) {
  const mlTxt = it.type === "decant" ? "Decant 5ML" : `Perfume (${it.ml || 0} ml)`;
  return `${it.marca} ${it.nombre} • ${mlTxt}`;
}

function renderCart() {
  if (!el.cartItems) return;

  el.cartItems.innerHTML = "";

  if (!CART.length) {
    el.cartItems.innerHTML = `<div style="padding:10px;opacity:.7">Carrito vacío.</div>`;
    if (el.cartTotal) el.cartTotal.textContent = moneyAR(0);
    return;
  }

  let total = 0;

  CART.forEach((it, i) => {
    const line = (it.unitPrice || 0) * (it.qty || 0);
    total += line;

    const row = document.createElement("div");
    row.className = "cart-item";
    row.innerHTML = `
      <div>
        <div class="name"><b>${cartItemLabel(it)}</b></div>
        <div class="meta" style="opacity:.75">${moneyAR(it.unitPrice)} c/u</div>
      </div>
      <div class="right">
        <div class="qtyline">
          <button class="cart-mini-btn" data-act="minus" data-i="${i}" type="button">−</button>
          <b>${it.qty}</b>
          <button class="cart-mini-btn" data-act="plus" data-i="${i}" type="button">+</button>
        </div>
        <div><b>${moneyAR(line)}</b></div>
        <button class="cart-mini-btn" data-act="del" data-i="${i}" type="button" title="Eliminar">✕</button>
      </div>
    `;
    el.cartItems.appendChild(row);
  });

  if (el.cartTotal) el.cartTotal.textContent = moneyAR(total);

  el.cartItems.onclick = (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const act = btn.dataset.act;
    const idx = Number(btn.dataset.i);
    if (!Number.isFinite(idx)) return;

    if (act === "minus") CART[idx].qty = Math.max(1, (CART[idx].qty || 1) - 1);
    if (act === "plus") CART[idx].qty = (CART[idx].qty || 1) + 1;
    if (act === "del") CART.splice(idx, 1);

    saveCart();
    updateCartBadge();
    renderCart();
  };
}

function openCart() {
  if (!el.cartOverlay) return;
  renderCart();
  el.cartOverlay.classList.remove("hidden");
}

function closeCart() {
  el.cartOverlay?.classList.add("hidden");
}

function buildWhatsAppMessage() {
  if (!CART.length) return "Hola! Quiero hacer un pedido.";

  const grouped = {};
  for (const it of CART) {
    const key = `${it.type}|${it.marca}|${it.nombre}|${it.ml}|${it.unitPrice}`;
    grouped[key] = grouped[key] || { ...it, qty: 0 };
    grouped[key].qty += it.qty || 0;
  }

  let total = 0;
  const lines = Object.values(grouped).map((it) => {
    const lineTotal = (it.unitPrice || 0) * (it.qty || 0);
    total += lineTotal;
    return `• ${cartItemLabel(it)} x${it.qty} = ${moneyAR(lineTotal)}`;
  });

  return ["Hola! Quiero hacer un pedido:", "", ...lines, "", `Total: ${moneyAR(total)}`].join("\n");
}

function goWhatsApp() {
  const msg = buildWhatsAppMessage();
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank");
}

// ------------------------
// Events
// ------------------------
function initFloatingSearch() {
  const fs = document.getElementById("floatingSearch");
  const fsBtn = document.getElementById("floatingSearchBtn");
  const fsInput = document.getElementById("floatingSearchInput");

  if (!fs || !fsBtn || !fsInput) return;

  if (initFloatingSearch._wired) return;
  initFloatingSearch._wired = true;

  const closeSearch = () => {
    fs.classList.remove("active");
    fsInput.value = "";
    hideBrandSection();
    hideAllCatalog();
  };

  fsBtn.addEventListener("click", () => {
    fs.classList.toggle("active");
    if (fs.classList.contains("active")) fsInput.focus();
    else closeSearch();
  });

  fsInput.addEventListener("input", (e) => {
    const q = String(e.target.value || "").toLowerCase().trim();

    if (!q) {
      hideBrandSection();
      hideAllCatalog();
      return;
    }

    const results = PRODUCTS
      .filter((p) => `${p.marca} ${p.nombre}`.toLowerCase().includes(q))
      .sort((a, b) =>
        (`${a.marca} ${a.nombre}`).localeCompare(`${b.marca} ${b.nombre}`, "es", { sensitivity: "base" })
      );

    hideBrandSection();
    el.products.classList.remove("hidden");
    renderGrid(results, el.products);
  });

  // Escape: si el search está abierto, cerralo (sin interferir con modal/carrito)
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (fs.classList.contains("active")) closeSearch();
  });
}

function wireEvents() {
  if (wireEvents._wired) return;
  wireEvents._wired = true;

  // Volver en filtrado
  el.brandBack?.addEventListener("click", closeBrand);

  // Abrir catálogo (footer)
  document.querySelectorAll('a[href="#products"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      showAllCatalog(true);
    });
  });

  // Modal producto: X y click afuera
  el.close?.addEventListener("click", closeModal);
  el.overlay?.addEventListener("click", (e) => {
    if (e.target === el.overlay) closeModal();
  });

  el.qtyMinus?.addEventListener("click", () => {
    qtyBottle = Math.max(0, qtyBottle - 1);
    el.qtyVal.textContent = String(qtyBottle);
  });

  el.qtyPlus?.addEventListener("click", () => {
    qtyBottle += 1;
    el.qtyVal.textContent = String(qtyBottle);
  });

  el.decToggle?.addEventListener("change", () => {
    decantEnabled = el.decToggle.checked;
  });

  el.decMinus?.addEventListener("click", () => {
    qtyDecant = Math.max(1, qtyDecant - 1);
    el.decVal.textContent = String(qtyDecant);
  });

  el.decPlus?.addEventListener("click", () => {
    qtyDecant += 1;
    el.decVal.textContent = String(qtyDecant);
  });

  el.addBtn?.addEventListener("click", addToCart);

  // Cart modal
  el.openCartBtn?.addEventListener("click", openCart);
  el.cartClose?.addEventListener("click", closeCart);
  el.cartOverlay?.addEventListener("click", (e) => {
    if (e.target === el.cartOverlay) closeCart();
  });

  el.clearCartBtn?.addEventListener("click", () => {
    CART = [];
    saveCart();
    updateCartBadge();
    renderCart();
  });

  el.waBtn?.addEventListener("click", goWhatsApp);

  // ESC cierra ambos
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (el.overlay && !el.overlay.classList.contains("hidden")) closeModal();
    if (el.cartOverlay && !el.cartOverlay.classList.contains("hidden")) closeCart();
  });
}

function init() {
  cacheDom();
  wireEvents();
  initFloatingSearch();   // 👈 esta línea
  cargarPerfumes();
}

document.addEventListener("DOMContentLoaded", init);
