
// CONFIGURACIÓN INICIAL
const sheetURL = 'TU_LINK_DE_CSV_AQUÍ'; // <--- PEGA TU LINK ACÁ
let products = [];
let cart = [];
let currentProduct = null;
let currentImgIdx = 0;
let currentQty = 1;

// 1. FUNCIÓN PARA CARGAR PRODUCTOS DESDE GOOGLE SHEETS
async function getProducts() {
    try {
        const response = await fetch(sheetURL);
        const data = await response.text();
        const rows = data.split('\n').slice(1); 

        products = rows.map((row, index) => {
            // Separador inteligente para no romper con las comas de la descripción
            const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            
            if (cols.length < 4) return null;

            // Ajuste según tu nuevo CSV de la hoja "WEB":
            // Col A (0): Marca | Col B (1): Nombre | Col C (2): Precio | Col G (6): Tamaño | Col H (7): Descripción | Col I (8): Foto
            const marca = cols[0]?.replace(/"/g, "").trim();
            const nombre = cols[1]?.replace(/"/g, "").trim();
            const precioStr = cols[2]?.replace(/[^0-9]/g, ""); 
            const tamano = cols[6]?.trim();
            const descripcion = cols[7]?.replace(/"/g, "").trim();
            const fotoLink = cols[8]?.trim();

            return {
                id: index + 1,
                name: `${marca} ${nombre}`,
                price: parseInt(precioStr) || 0,
                imgs: [fotoLink || 'https://via.placeholder.com/300?text=Decantcias'], 
                desc: descripcion || `Tamaño: ${tamano}ml`,
            };
        }).filter(p => p !== null);

        renderGrid();
    } catch (error) {
        console.error("Error cargando el stock:", error);
    }
}

// 2. FUNCIÓN PARA MOSTRAR LOS PRODUCTOS EN LA WEB (Tarjetas)
function renderGrid() {
    const grid = document.getElementById('main-grid');
    if(!grid) return;
    grid.innerHTML = ""; 
    products.forEach(p => {
        grid.innerHTML += `
            <div class="card" onclick="openProduct(${p.id})">
                <img src="${p.imgs[0]}" onerror="this.src='https://via.placeholder.com/300?text=Decantcias'">
                <h3>${p.name}</h3>
                <div class="price">$${p.price.toLocaleString()}</div>
            </div>`;
    });
}

// 3. LAS FUNCIONES DEL MODAL Y CARRITO (Mantenemos las tuyas para que no cambie nada)
function openProduct(id) {
    currentProduct = products.find(p => p.id === id);
    currentImgIdx = 0; 
    currentQty = 1;
    document.getElementById('modal-img').src = currentProduct.imgs[0];
    document.getElementById('modal-title').innerText = currentProduct.name;
    document.getElementById('modal-price').innerText = `$${currentProduct.price.toLocaleString()}`;
    document.getElementById('prod-qty').innerText = currentQty;
    document.getElementById('modal-desc').innerText = currentProduct.desc;
    document.getElementById('productModal').style.display = 'block';
}

function updateQty(val) { 
    currentQty = Math.max(1, currentQty + val); 
    document.getElementById('prod-qty').innerText = currentQty; 
}

function closeModals() { 
    document.getElementById('productModal').style.display = 'none'; 
    document.getElementById('cartModal').style.display = 'none'; 
}

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

function removeFromCart(id) { 
    cart = cart.filter(i => i.cartId !== id); 
    updateGlobalCart(); 
}

function sendWhatsApp() {
    if(cart.length === 0) return;
    let msg = "✨ Pedido Decantcias ✨\n\n";
    cart.forEach(i => msg += `• ${i.qty}x ${i.name}\n`);
    msg += `\nTotal: $${cart.reduce((s, i) => s + (i.price * i.qty), 0).toLocaleString()}`;
    window.open(`https://wa.me/5493517883411?text=${encodeURIComponent(msg)}`);
}

// Iniciar la carga
getProducts();

