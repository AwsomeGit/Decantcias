const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQsmuT-sX_hT2VXW9_7AbpfRkS1plqwYKV3zrzUVDUf44aEhUZU7btUwp_QUwDoNbv3VANut3ZntOzK/pub?gid=751988153&single=true&output=csv";

async function cargarPerfumes() {
  const res = await fetch(sheetURL);
  const csv = await res.text();

  const rows = csv.split("\n");
  const headers = rows.shift().split(",");

  const perfumes = rows.map(row => {
    const cols = row.split(",");
    let obj = {};
    headers.forEach((h, i) => obj[h.trim()] = cols[i]?.trim());
    return obj;
  });

  mostrarPerfumes(perfumes);
}

function mostrarPerfumes(perfumes) {
  const container = document.getElementById("products");
  if (!container) return console.error("No existe #products en HTML");

  container.innerHTML = "";

  perfumes.forEach(p => {
    container.innerHTML += `
      <div class="product">
        <img src="${p.imagenURL}">
        <h3>${p.nombre}</h3>
        <p>${p.descripcion}</p>
        <b>$${Number(p.precio).toLocaleString("es-AR")}</b>
      </div>
    `;
  });
}

cargarPerfumes();
