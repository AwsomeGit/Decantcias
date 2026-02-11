
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
        
        // Dividimos el texto del Excel en filas
        const rows = data.split('\n').slice(1); 

        products = rows.map((row, index) => {
            // Esta línea mágica separa las columnas sin romperse si hay comas en la descripción
            const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            
            if (cols.length < 3) return null;

            // ASIGNACIÓN DE COLUMNAS (A=0, B=1, C=2, etc.)
            const marca = cols[0]?.trim();      // Columna A
            const nombre = cols[1]?.trim();     // Columna B
            const precioStr = cols[2]?.replace(/[^0-9]/g, ""); // Columna C (Precio)
            const descripcion = cols[9]?.trim(); // Columna J (Tu nueva descripción)
            const tamano = cols[5]?.trim();      // Columna F (Tamaño)
            const fotoLink = cols[10]?.trim();   // Columna K (Link de foto)

            return {
                id: index + 1,
                name: `${marca} ${nombre}`,
                price: parseInt(precioStr) || 0,
                // Si no hay foto en el Excel, pone una imagen gris por defecto
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

