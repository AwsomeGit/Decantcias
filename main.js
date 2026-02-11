const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQsmuT-sX_hT2VXW9_7AbpfRkS1plqwYKV3zrzUVDUf44aEhUZU7btUwp_QUwDoNbv3VANut3ZntOzK/pub?gid=751988153&single=true&output=csv';

let products = [];
let currentQty = 1;

async function loadData() {
    try {
        const res = await fetch(sheetURL);
        const data = await res.text();

        const rows = data.split(/\r?\n/).slice(1);

        products = rows.map((row, index) => {
            const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/"/g,'').trim());

            if (!cols[0] || !cols[1]) return null;

            return {
                id: index,
                marca: cols[0],
                nombre: cols[1],
                precio: cols[2] ? cols[2].replace(/[^0-9]/g,'') : "0",
                desc: cols[3] || "Fragancia exclusiva.",
                foto: cols[4] || "https://via.placeholder.com/300"
            };
        }).filter(Boolean);

        console.log("Productos cargados:", products);
        renderUI();

    } catch (e) {
        console.error("ERROR Google Sheet:", e);
    }
}

function renderUI() {
    const grid = document.getElementById('main-grid');
    grid.innerHTML = products.map(p => `
        <div class="card" onclick="openModal(${p.id})">
            <img src="${p.foto}">
            <h3>${p.marca}</h3>
            <p style="color:#888">${p.nombre}</p>
            <div class="price-tag">$${Number(p.precio).toLocaleString()}</div>
        </div>
    `).join('');
}

function openModal(id) {
    const p = products.find(prod => prod.id === id);
    if (!p) return;

    currentQty = 1;
    document.getElementById('modal-img').src = p.foto;
    document.getElementById('modal-title').innerText = p.marca + " " + p.nombre;
    document.getElementById('modal-price').innerText = "$" + Number(p.precio).toLocaleString();
    document.getElementById('modal-desc').innerText = p.desc;
    document.getElementById('prod-qty').innerText = currentQty;
    document.getElementById('productModal').style.display = 'flex';
}

function updateQty(v) {
    currentQty = Math.max(1, currentQty + v);
    document.getElementById('prod-qty').innerText = currentQty;
}

function closeModals() {
    document.getElementById('productModal').style.display = 'none';
}

window.onclick = (e) => {
    if (e.target.id === 'productModal') closeModals();
};

loadData();
