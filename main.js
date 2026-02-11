const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQsmuT-sX_hT2VXW9_7AbpfRkS1plqwYKV3zrzUVDUf44aEhUZU7btUwp_QUwDoNbv3VANut3ZntOzK/pub?gid=751988153&single=true&output=csv';

let products = [];
let currentQty = 1;

async function loadData() {
    try {
        const res = await fetch(sheetURL);
        const data = await res.text();
        // Regex para separar por comas ignorando las que están dentro de comillas
        const rows = data.split('\n').slice(1);
        
        products = rows.map((row, index) => {
            const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (cols.length < 5) return null;
            return {
                id: index,
                marca: cols[0]?.replace(/"/g, '').trim(),
                nombre: cols[1]?.replace(/"/g, '').trim(),
                precio: cols[2]?.replace(/[^0-9]/g, '') || "0",
                desc: cols[7]?.replace(/"/g, '').trim() || "Fragancia exclusiva.",
                foto: cols[8]?.trim() || "https://via.placeholder.com/300"
            };
        }).filter(p => p !== null);
        
        renderUI();
    } catch (e) { console.error("Error cargando Excel:", e); }
}

function renderUI() {
    const grid = document.getElementById('main-grid');
    grid.innerHTML = products.map(p => `
        <div class="card" onclick="openModal(${p.id})">
            <img src="${p.foto}">
            <h3>${p.marca}</h3>
            <p style="color:#888">${p.nombre}</p>
            <div class="price-tag" style="font-size:1.1rem">$${parseInt(p.precio).toLocaleString()}</div>
        </div>
    `).join('');
}

function openModal(id) {
    const p = products.find(prod => prod.id === id);
    currentQty = 1;
    document.getElementById('modal-img').src = p.foto;
    document.getElementById('modal-title').innerText = p.marca + " " + p.nombre;
    document.getElementById('modal-price').innerText = "$" + parseInt(p.precio).toLocaleString();
    document.getElementById('modal-desc').innerText = p.desc;
    document.getElementById('prod-qty').innerText = currentQty;
    document.getElementById('productModal').style.display = 'block';
}

function updateQty(v) {
    currentQty = Math.max(1, currentQty + v);
    document.getElementById('prod-qty').innerText = currentQty;
}

function closeModals() {
    document.getElementById('productModal').style.display = 'none';
}

window.onclick = (e) => { if (e.target.className === 'modal') closeModals(); };

loadData();
