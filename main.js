const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQsmuT-sX_hT2VXW9_7AbpfRkS1plqwYKV3zrzUVDUf44aEhUZU7btUwp_QUwDoNbv3VANut3ZntOzK/pub?gid=751988153&single=true&output=csv";

/* CSV parser real (Google Sheets safe) */
function parseCSV(text) {
  const rows = [];
  let row = [];
  let current = "";
  let insideQuotes = false;

  for (let char of text) {
    if (char === '"') insideQuotes = !insideQuotes;
    else if (char === "," && !insideQuotes) {
      row.push(current);
      current = "";
    }
    else if (char === "\n" && !insideQuotes) {
      row.push(current);
      rows.push(row);
      row = [];
      current = "";
    }
    else {
      current += char;
    }
  }

  if (current.length) {
    row.push(current);
    rows.push(row);
  }

  return rows;
}

/* Cargar perfumes */
async function cargarPerfumes() {
  try {
    console.log("Cargando perfumes...");
    const res = await fetch(sheetURL);
    const csv = await res.text();

    const data = parseCSV(csv);
    const headers = data.shift();

    const perfumes = data.map(row => {
      let obj = {};
      headers.forEach((h, i) => obj[h.trim()] = row[i]?.trim());
      return obj;
    });

    console.log("Perfumes cargados:", perfumes);
    mostrarPerfumes(perfumes);

  } catch (e) {
    console.error("ERROR cargando Google Sheets:", e);
  }
}

/* Mostrar perfumes en la web */
function mostrarPerfumes(perfumes) {
  const container = document.getElementById("products");
  if (!container) return console.error("❌ No existe #products en HTML");

  container.innerHTML = "";

  if (!perfumes.length) {
    container.innerHTML = "<p>No hay productos cargados 😭</p>";
    return;
  }

  perfumes.forEach(p => {
    const precio = Number(p.precio || 0).toLocaleString("es-AR");
    const img = p.imagenURL || "https://via.placeholder.com/250x250?text=Sin+Imagen";

    container.innerHTML += `
      <div class="product">
        <img src="${img}" alt="${p.nombre}">
        <h3>${p.nombre}</h3>
        <p>${p.descripcion || ""}</p>
        <b>$${precio}</b>
      </div>
    `;
  });
}

/* Ejecutar */
document.addEventListener("DOMContentLoaded", cargarPerfumes);
