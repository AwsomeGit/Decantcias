const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQsmuT-sX_hT2VXW9_7AbpfRkS1plqwYKV3zrzUVDUf44aEhUZU7btUwp_QUwDoNbv3VANut3ZntOzK/pub?gid=751988153&single=true&output=csv";

async function cargarPerfumes() {
  const res = await fetch(sheetURL);
  const csv = await res.text();

  const rows = csv.split("\n").filter(r => r.trim() !== "");
  const headers = rows.shift().split(";"); // porque Sheets exporta con ;

  const perfumes = rows.map(row => {
    const cols = row.split(";");
    let obj = {};
    headers.forEach((h, i) => obj[h.trim()] = (cols[i] || "").trim());
    return obj;
  });

  mostrarPerfumes(perfumes);
}

function mostrarPerfumes(perfumes) {
  const container = document.getElementById("products");
  if (!container) return console.error("No existe #products");

  container.innerHTML = "";

  perfumes.forEach(p => {
    if (!p.nombre) return;

    // 💰 FIX PRECIO
    let precio = (p.precio || "").replace(/[^\d]/g, "");
    precio = Number(precio || 0).toLocaleString("es-AR");

    // 🖼️ MULTI IMAGENES con |
    let imgs = (p.imagenURL || "").split("|");
    let imgHTML = "";

    imgs.forEach(img => {
      img = img.trim();
      if (img) {
        imgHTML += `<img src="${img}" class="product-img">`;
      }
    });

    container.innerHTML += `
      <div class="product">
        <div class="img-box">${imgHTML}</div>
        <h3>${p.nombre}</h3>
        <p>${p.descripcion || ""}</p>
        <b>$${precio}</b>
      </div>
    `;
  });
}

cargarPerfumes();
