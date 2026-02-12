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
  "cartCount"
