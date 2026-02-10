const products = [
    { 
        id: 1, 
        name: "Lattafa Asad", 
        price: 60000, 
        imgs: ["img/asad.jpg", "img/asad2.jpg", "img/asad3.jpg"],
        desc: "Fragancia potente con notas de pimienta negra, piña y vainilla."
    },
    { 
        id: 2, 
        name: "Lattafa Khamrah", 
        price: 65000, 
        imgs: ["img/khamrah.jpg", "img/khamrah2.jpg", "img/khamrah3.jpg"], 
        desc: "Dulce y lujoso con canela, dátiles y praliné."
    },
    { 
        id: 3, 
        name: "Khamrah Qahwa", 
        price: 70000, 
        imgs: ["img/khamrahqhawa.jpg", "img/khamrahqahwa2.jpg", "img/khamraqahwa3.jpg"],
        desc: `Fragancia intensa con café, praliné, canela y vainilla.`
    }
];

let cart = [];
let currentProduct = null;
let currentImgIdx = 0;
let currentQty = 1;

const grid = document.getElementById('main-grid');
products.forEach(p => {
    grid.innerHTML += `
        <div class="card" onclick="openProduct(${p.id})">
            <img src="${p.imgs[0]}" onerror="this.src='https://via.placeholder.com/300?text=Decantcias'">
            <h3>${p.name}</h3>
            <div class="price">$${p.price.toLocaleString()}</div>
        </div>`;
});

function openProduct(id) {
    currentProduct = products.find(p => p.id === id);
    currentImgIdx = 0; currentQty = 1;
    document.getElementById('modal-img').src = currentProduct.imgs[0];
    document.getElementById('modal-title').innerText = currentProduct.name;
    document.getElementById('modal-price').innerText = `$${currentProduct.price.toLocaleString()}`;
    document.getElementById('prod-qty').innerText = currentQty;
    document.getElementById('modal-desc').innerText = currentProduct.desc;
    document.getElementById('productModal').style.display = 'block';
}

function updateQty(val) { currentQty = Math.max(1, currentQty + val); document.getElementById('prod-qty').innerText = currentQty; }
function changeImg(s) { 
    currentImgIdx = (currentImgIdx + s + currentProduct.imgs.length) % currentProduct.imgs.length;
    document.getElementById('modal-img').src = currentProduct.imgs[currentImgIdx]; 
}
function closeModals() { document.getElementById('productModal').style.display = 'none'; document.getElementById('cartModal').style.display = 'none'; }
function openCart() { document.getElementById('cartModal').style.display = 'block'; updateGlobalCart(); }

function addToCart() {
    cart.push({ ...currentProduct, qty: currentQty, cartId: Date.now() });
    updateGlobalCart();
    closeModals();
}

function updateGlobalCart() {
    const total = cart.reduce((s, i) => s + (i.price * i.qty), 0);
    document.getElementById('cart-total').innerText = `$${total.toLocaleString()}`;
    document.getElementById('modal-total').innerText = `$${total.toLocaleString()}`;
    document.getElementById('cart-count').innerText = cart.length;
    const list = document.getElementById('cart-list');
    list.innerHTML = cart.length === 0 ? '<p>Vacío</p>' : cart.map(item => `
        <div class="cart-item">
            <div><strong>${item.qty}x ${item.name}</strong></div>
            <button onclick="event.stopPropagation(); removeFromCart(${item.cartId})" style="color:red; background:none; border:none; cursor:pointer;">✕</button>
        </div>`).join('');
}

function removeFromCart(id) { cart = cart.filter(i => i.cartId !== id); updateGlobalCart(); }

function sendWhatsApp() {
    if(cart.length === 0) return;
    let msg = "✨ Pedido Decantcias ✨\n\n";
    cart.forEach(i => msg += `• ${i.qty}x ${i.name}\n`);
    msg += `\nTotal: $${cart.reduce((s, i) => s + (i.price * i.qty), 0).toLocaleString()}`;
    window.open(`https://wa.me/5493517883411?text=${encodeURIComponent(msg)}`);
}

window.onclick = (e) => { if (e.target.className === 'modal') closeModals(); }
