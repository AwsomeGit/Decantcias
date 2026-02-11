const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQsmuT-sX_hT2VXW9_7AbpfRkS1plqwYKV3zrzUVDUf44aEhUZU7btUwp_QUwDoNbv3VANut3ZntOzK/pub?gid=751988153&single=true&output=csv';

let products = [];
let currentQty = 1;

async function loadProducts() {
    try {
        const res = await fetch(sheetURL);
        const data = await res.text();
        const rows = data.split('\n').slice(1);
        
        products = rows.map((row, index) => {
            const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (cols.length < 5) return null;
            return {
                id: index,
                name: `${cols[0]} ${cols[1]}`.replace(/"/g, '').trim(),
                price: parseInt(cols[2]?.replace(/[^0-9]/g, '')) || 0,
                desc: cols[7]?.replace(/"/g, '').trim() || "Sin descripción disponible.",
                img: cols[8]?.trim() || 'https://via.placeholder.com/300'
            };
        }).filter(p => p !== null);
        renderGrid();
    } catch (e) { console.error("Error:", e); }
}

function renderGrid() {
    const grid = document.getElementById('main-grid');
    grid.innerHTML = products.map(p => `
        <div class="card" onclick="openModal(${p.id})">
            <img src="${p.img}">
            <h3 style="font-size:1rem; margin:10px 0;">${p.name}</h3>
            <div class="price" style="font-size:1.1rem;">$${p.price.toLocaleString()}</div>
        </div>
    `).join('');
}

function openModal(id) {
    const p = products.find(prod => prod.id === id);
    currentQty = 1;
    document.getElementById('modal-img').src = p.img;
    document.getElementById('modal-title').innerText = p.name;
    document.getElementById('modal-price').innerText = '$' + p.price.toLocaleString();
    document.getElementById('modal-desc').innerText = p.desc;
    document.getElementById('prod-qty').innerText = currentQty;
    document.getElementById('productModal').style.display = 'block';
}

function updateQty(val) {
    currentQty = Math.max(1, currentQty + val);
    document.getElementById('prod-qty').innerText = currentQty;
}

function closeModals() {
    document.getElementById('productModal').style.display = 'none';
}

loadProducts();
