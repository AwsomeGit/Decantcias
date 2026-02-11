const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQsmuT-sX_hT2VXW9_7AbpfRkS1plqwYKV3zrzUVDUf44aEhUZU7btUwp_QUwDoNbv3VANut3ZntOzK/pub?gid=751988153&single=true&output=csv';

let products = [];
let cart = [];
let currentProduct = null;
let currentQty = 1;

async function loadProducts() {
    const res = await fetch(sheetURL);
    const data = await res.text();
    const rows = data.split('\n').slice(1);
    
    products = rows.map((row, index) => {
        const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        if (cols.length < 5) return null;
        return {
            id: index,
            name: `${cols[0]} ${cols[1]}`.replace(/"/g, ''),
            price: parseInt(cols[2]?.replace(/[^0-9]/g, '')) || 0,
            desc: cols[7]?.replace(/"/g, '') || "Sin descripción",
            img: cols[8]?.trim() || 'https://via.placeholder.com/200'
        };
    }).filter(p => p !== null);
    renderGrid();
}

function renderGrid() {
    const grid = document.getElementById('main-grid');
    grid.innerHTML = products.map(p => `
        <div class="card" onclick="openModal(${p.id})">
            <img src="${p.img}">
            <h3>${p.name}</h3>
            <div class="price">$${p.price.toLocaleString()}</div>
        </div>
    `).join('');
}

function openModal(id) {
    currentProduct = products.find(p => p.id === id);
    currentQty = 1;
    document.getElementById('modal-img').src = currentProduct.img;
    document.getElementById('modal-title').innerText = currentProduct.name;
    document.getElementById('modal-price').innerText = '$' + currentProduct.price.toLocaleString();
    document.getElementById('modal-desc').innerText = currentProduct.desc;
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

function addToCart() {
    cart.push({ ...currentProduct, qty: currentQty });
    updateCartUI();
    closeModals();
}

function updateCartUI() {
    const count = cart.reduce((acc, item) => acc + item.qty, 0);
    const total = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    document.getElementById('cart-count').innerText = count;
    document.getElementById('cart-total').innerText = '$' + total.toLocaleString();
}

loadProducts();
