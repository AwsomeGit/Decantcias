const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQsmuT-sX_hT2VXW9_7AbpfRkS1plqwYKV3zrzUVDUf44aEhUZU7btUwp_QUwDoNbv3VANut3ZntOzK/pub?gid=751988153&single=true&output=csv";

async function cargarPerfumes() {
  const res = await fetch(sheetURL);
  const csv = await res.text();

  const rows = csv.split("\n");
  const headers = rows.shift().split(";"); // 👈 IMPORTANTE

  const perfumes = rows.map(row => {
    const cols = row.split(";");
    let obj = {};
    headers.forEach((h, i) => obj[h.trim()] = cols[i]?.trim());
    return obj;
  });

  mostrarPerfumes(perfumes);
}

function mostrarPerfumes(perfumes) {
  const container = document.getElementById("products");
  if (!container) return console.error("No existe #products");

  container.innerHTML = "";

  perfumes.forEach(p => {
    let imgs = (p.imagenURL || "")
      .split("|")
      .map(i => i.trim())
      .filter(i => i !== "");

    let imgHTML = imgs[0] ? `<img src="${imgs[0]}">` : "";

    container.innerHTML += `
      <div class="product">
        ${imgHTML}
        <h3>${p.nombre}</h3>
        <p>${p.descripcion}</p>
        <b>$${Number(p.precio || 0).toLocaleString("es-AR")}</b>
      </div>
    `;
  });
}

cargarPerfumes();
