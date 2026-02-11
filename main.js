const sheetURL = "TU_LINK_CSV_DE_GOOGLE_SHEET"; // reemplazá

let products = [];
let currentProduct = null;
let currentQty = 1;

// CARGAR DATOS
async function loadData() {
  try {
    const res = await fetch(sheetURL);
    const text = await res.text();
    const rows = text.split("\n").slice(1);

    products = rows.map((row, i) => {
      const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);

      if (!cols[0]) return null;

      return {
        id: i,
        marca: cols[0]?.replace(/"/g,"").trim(),
        nombre: cols[1]?.replace(/"/g,"").trim(),
        precio: parseInt(cols[2]) || 0,
        desc: cols[3]?.replace(/"/g,"").trim() || "Fragancia premium.",
        foto: cols[4]?.replace(/"/g,"").trim() || "https://via.placeholder.com/400"
      };
    }).filter(x => x);

    renderUI();
  } catch(e){
    console.error("ERROR SHEET:", e);
  }
}

// MOSTRAR GRID
function renderUI() {
  const grid = document.getElementById("main-grid");

  grid.innerHTML = products.map(p => `
    <div class="card" onclick="openModal(${p.id})">
        <img src="${p.foto}">
        <h3>${p.marca}</h3>
        <p>${p.nombre}</p>
        <div class="price-tag">$${p.precio.toLocaleString()}</div>
    </div>
  `).join("");
}

// ABRIR MODAL
function openModal(id) {
  currentProduct = products.find(p => p.id === id);
  currentQty = 1;

  document.getElementById("modal-img").src = currentProduct.foto;
  document.getElementById("modal-title").innerText = currentProduct.marca + " " + currentProduct.nombre;
  document.getElementById("modal-price").innerText = "$" + currentProduct.precio.toLocaleString();
  document.getElementById("modal-desc").innerText = currentProduct.desc;
  document.getElementById("prod-qty").innerText = currentQty;

  document.getElementById("productModal").style.display = "flex";
}

// CERRAR MODAL
function closeModal() {
  document.getElementById("productModal").style.display = "none";
}

// CANTIDAD
function updateQty(v) {
  currentQty = Math.max(1, currentQty + v);
  document.getElementById("prod-qty").innerText = currentQty;
}

// COMPRAR WHATSAPP
function buyNow() {
  let msg = `Hola! Quiero comprar:\n\n${currentQty}x ${currentProduct.marca} ${currentProduct.nombre}\nPrecio: $${currentProduct.precio}\n`;
  window.open("https://wa.me/5493517883411?text=" + encodeURIComponent(msg));
}

// CERRAR CLICK AFUERA
window.onclick = (e) => {
  if(e.target.id === "productModal") closeModal();
};

loadData();
