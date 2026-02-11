const sheetURL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQsmuT-sX_hT2VXW9_7AbpfRkS1plqwYKV3zrzUVDUf44aEhUZU7btUwp_QUwDoNbv3VANut3ZntOzK/pub?gid=751988153&single=true&output=csv";

async function cargarPerfumes() {
  try {
    const res = await fetch(sheetURL, { cache: "no-store" });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);

    const csvRaw = await res.text();
    const csv = csvRaw.replace(/\r/g, "").trim(); // limpia CRLF

    const lines = csv.split("\n").filter(Boolean);
    if (lines.length < 2) throw new Error("CSV vacío o sin filas.");

    // Detecta delimitador según la primera línea (headers)
    const firstLine = lines[0];
    const delim = firstLine.includes(";") ? ";" : ",";

    const headers = lines.shift().split(delim).map(h => h.trim());

    const perfumes = lines.map(line => {
      const cols = line.split(delim).map(c => (c ?? "").trim());
      const obj = {};
      headers.forEach((h, i) => (obj[h] = cols[i] ?? ""));
      return obj;
    });

    console.log("Delim:", delim);
    console.log("Headers:", headers);
    console.log("Rows:", perfumes.length, perfumes[0]);

    mostrarPerfumes(perfumes);
  } catch (e) {
    console.error("Error cargando perfumes:", e);
  }
}

function mostrarPerfumes(perfumes) {
  const container = document.getElementById("products");
  if (!container) return console.error("No existe #products");

  container.innerHTML = "";

  perfumes.forEach(p => {
    const imgs = (p.imagenURL || p.imagenUrl || p.imagen || "")
      .split("|")
      .map(s => s.trim())
      .filter(Boolean);

    const imgHTML = imgs[0] ? `<img src="${imgs[0]}" alt="${p.nombre || ""}">` : "";

    container.innerHTML += `
      <div class="product">
        ${imgHTML}
        <h3>${p.nombre || ""}</h3>
        <p>${p.descripcion || ""}</p>
        <b>$${Number(p.precio || 0).toLocaleString("es-AR")}</b>
      </div>
    `;
  });
}

cargarPerfumes();
