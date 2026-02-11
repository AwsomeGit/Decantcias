const csvURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQsmuT-sX_hT2VXW9_7AbpfRkS1plqwYKV3zrzUVDUf44aEhUZU7btUwp_QUwDoNbv3VANut3ZntOzK/pub?gid=751988153&single=true&output=csv';

let allProducts = [];
let currentQty = 1;

async function fetchData() {
    try {
        const response = await fetch(csvURL);
        const text = await response.text();
        const rows = text.split('\n').slice(1);

        allProducts = rows.map((row, index) => {
            // Regex para separar CSV respetando comillas
            const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (cols.length < 5) return null;

            return {
                id: index,
                marca: cols[0]?.replace(/"/g, '').trim(),
                nombre: cols[1]?.replace(/"/g, '').trim(),
                precio: cols[2]?.replace(/[^0-9]/g, '') || "0",
                descripcion: cols[7]?.replace(/"/g, '').trim() || "Fragancia exclusiva de nuestro catálogo.",
                imagen: cols[8]?.trim() || "https://via.placeholder.com/400"
            };
        }).filter(p => p !== null);

        renderUI();
    } catch (e) { console.error("Error cargando datos:", e); }
}

function renderUI() {
    const grid = document.getElementById('main-grid');
    grid.innerHTML = allProducts.map(p => `
        <div class="card" onclick="showProduct(${p.id})">
            <img src="${p.imagen}" onerror="this.src='https://via.placeholder.com/400?text=Decantcias'">
            <h3>${p.marca}<br><span style="color:#888; font-weight:400">${p.nombre}</span></h3>
            <div style="color:var(--oro); font-weight:bold">$${parseInt(p.precio).toLocaleString()}</div>
        </div>
    `).join('');
}

function showProduct(id) {
    const p = allProducts.find(item => item.id === id);
    currentQty = 1;
    
    document.getElementById('modal-img').src = p.imagen;
    document.getElementById('modal-title').innerText = `${p.marca} ${p.nombre}`;
    document.getElementById('modal-price').innerText = `$${parseInt(p.precio).toLocaleString()}`;
    document.getElementById('modal-desc').innerText = p.descripcion;
    document.getElementById('prod-qty').innerText = currentQty;
    
    document.getElementById('productModal').style.display = 'block';
}

function updateQty(step) {
    currentQty = Math.max(1, currentQty + step);
    document.getElementById('prod-qty').innerText = currentQty;
}

function closeModals() {
    document.getElementById('productModal').style.display = 'none';
}

// Cerrar al clickear fuera
window.onclick = (e) => {
    if (e.target.className === 'modal') closeModals();
}

fetchData();
