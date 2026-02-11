const sheetURL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQsmuT-sX_hT2VXW9_7AbpfRkS1plqwYKV3zrzUVDUf44aEhUZU7btUwp_QUwDoNbv3VANut3ZntOzK/pub?gid=751988153&single=true&output=csv";

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

function driveToDirect(url) {
  if (!url) return "";
  const m = url.match(/\/file\/d\/([^/]+)\//);
  if (m?.[1]) return `https://drive.google.com/uc?export=view&id=${m[1]}`;
  return url;
}

function getField(obj, keys) {
  for (const k of keys) {
    if (obj[k] != null && String(obj[k]).trim() !== "") return obj[k];
  }
  return "";
}

// ------------------------
// State
// ------------------------
let PRODUCTS = [];
let ACTIVE = null;
let activeImgIdx = 0;
let qtyBottle = 1;
let decantEnabled = false;
let qtyDecant = 1;

const CART_KEY = "decantcias_cart_v1";
let CART = JSON.parse(localStorage.getItem(CART_KEY) || "[]");

// ------------------------
// DOM refs (modal)
// ------------------------
const el = {};
const REQUIRED_MODAL_IDS = [
  "modalOverlay",
  "modalClose",
  "modalImg",
  "modalThumbs",
  "modalTitle",
  "modalDesc",
  "modalPrice",
  "qtyMinus",
  "qtyPlus",
  "qtyVal",
  "decantToggle",
  "decMinus",
  "decPlus",
  "decVal",
  "addToCartBtn",
  "cartCount",
];

function cacheDom() {
  el.products = document.getElementById("products");

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
  el.cartCount = document.getElementById("cartCount");

  el.decPriceLabel = document.querySelector(".decant-price"); // label a la derecha
  el.perfumeLabel = document.querySelector(".qty-row span");  // label a la izquierda (Perfume x ml)
}

// ------------------------
// Load + parse
// ------------------------
async function cargarPerfumes() {
  cacheDom();
  if (!el.products) return console.error("No existe #products");

  try {
    const res = await fetch(sheetURL, { cache: "no-store" });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);

    const csvText = await res.text();
    const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
    if (parsed.errors?.length) console.error("Parse errors:", parsed.errors);

    PRODUCTS = (parsed.data || []).map(row => {
      const clean = {};
      for (const k in row) {
        const kk = (k || "").replace(/^\uFEFF/, "").trim();
        clean[kk] = (row[k] ?? "").toString().trim();
      }

      const imagenRaw = getField(clean, ["imagenURL", "imagenUrl", "imagen"]);
      const imgs = String(imagenRaw || "")
        .split("|")
        .map(s => driveToDirect(s.trim()))
        .filter(Boolean);

      return {
        marca: getField(clean, ["marca", "Marca"]),
        nombre: getField(clean, ["nombre", "Nombre"]),
        descripcion: getField(clean, ["descripcion", "Descripción", "Descripcion", "description"]),
        stock: toNumber(getField(clean, ["stock", "Stock"])),
        precio: toNumber(getField(clean, ["precio", "Precio"])),
        precioDecant: toNumber(
          getField(clean, ["Precio Decant", "PrecioDecant", "precioDecant", "decant"])
        ),
        ml: toNumber(getField(clean, ["ml", "ML", "Ml"])), // 👈 NUEVO (desde sheet)
        imgs,
        raw: clean,
      };
    });

    renderGrid(PRODUCTS);
    updateCartBadge();
    wireModalEvents();
  } catch (e) {
    console.error("Error cargando perfumes:", e);
    el.products.innerHTML = `<p style="padding:12px">No se pudo cargar el catálogo.</p>`;
  }
}

// ------------------------
// Grid: solo marca + nombre
// ------------------------
function renderGrid(items) {
  el.products.innerHTML = "";
  items.forEach((p, idx) => {
    const card = document.createElement("div");
    card.className = "product";
    card.innerHTML = `
      <p class="title">${(p.marca || "").trim()} ${(p.nombre || "").trim()}</p>
      <p class="sub">${moneyAR(p.precio)}</p>
    `;
    card.addEventListener("click", () => openModal(idx));
    el.products.appendChild(card);
  });
}

// ------------------------
// Modal
// ------------------------
function openModal(index) {
  if (!el.overlay) return;

  ACTIVE = PRODUCTS[index];
  activeImgIdx = 0;
  qtyBottle = 1;
  decantEnabled = false;
  qtyDecant = 1;

  el.title.textContent = `${ACTIVE.marca} ${ACTIVE.nombre}`;
  el.desc.textContent = ACTIVE.descripcion || "";
  el.price.textContent = moneyAR(ACTIVE.precio);

 // Label: Perfume (X ml) desde el Sheet
const perfumeLabel = el.overlay?.querySelector(".qty-row > span");
if (perfumeLabel) {
  const ml = Number(ACTIVE.ml || 0);
  perfumeLabel.textContent = ml > 0 ? `Perfume (${ml} ml)` : "Perfume";
}

  // Decant: "Decant 5ML $X" (precio desde sheet)
  const dPrice = ACTIVE.precioDecant || 0;
  if (el.decPriceLabel) {
    el.decPriceLabel.textContent = `Decant 5ML ${moneyAR(dPrice)}`;
  }

  el.qtyVal.textContent = String(qtyBottle);
  el.decToggle.checked = false;
  el.decVal.textContent = String(qtyDecant);

  renderModalImages();
  el.overlay.classList.remove("hidden");
}

function closeModal() {
  if (!el.overlay) return;
  el.overlay.classList.add("hidden");
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
    t.addEventListener("click", () => {
      activeImgIdx = i;
      renderModalImages();
    });
    el.thumbs.appendChild(t);
  });
}

// ------------------------
// Cart
// ------------------------
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
      ml: 5, // decant fijo 5ml
      unitPrice: ACTIVE.precioDecant || 0,
      qty: qtyDecant,
    });
  }

  localStorage.setItem(CART_KEY, JSON.stringify(CART));
  updateCartBadge();
  closeModal();
}

function updateCartBadge() {
  const totalItems = CART.reduce((acc, it) => acc + (it.qty || 0), 0);
  if (el.cartCount) el.cartCount.textContent = `Carrito: ${totalItems}`;
}

// ------------------------
// Events
// ------------------------
function wireModalEvents() {
  if (wireModalEvents._wired) return;

  const missing = REQUIRED_MODAL_IDS.filter(id => !document.getElementById(id));
  if (missing.length) {
    console.warn("Modal incompleto. Faltan IDs:", missing.join(", "));
    return;
  }

  wireModalEvents._wired = true;

  el.close.addEventListener("click", closeModal);
  el.overlay.addEventListener("click", (e) => {
    if (e.target === el.overlay) closeModal();
  });

  el.qtyMinus.addEventListener("click", () => {
    qtyBottle = Math.max(1, qtyBottle - 1);
    el.qtyVal.textContent = String(qtyBottle);
  });

  el.qtyPlus.addEventListener("click", () => {
    qtyBottle += 1;
    el.qtyVal.textContent = String(qtyBottle);
  });

  el.decToggle.addEventListener("change", () => {
    decantEnabled = el.decToggle.checked;
  });

  el.decMinus.addEventListener("click", () => {
    qtyDecant = Math.max(1, qtyDecant - 1);
    el.decVal.textContent = String(qtyDecant);
  });

  el.decPlus.addEventListener("click", () => {
    qtyDecant += 1;
    el.decVal.textContent = String(qtyDecant);
  });

  el.addBtn.addEventListener("click", addToCart);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !el.overlay.classList.contains("hidden")) closeModal();
  });
}

// Ejecutar cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", cargarPerfumes);
