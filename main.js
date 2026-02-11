const gid = "751988153";

// Opción A (recomendada): gviz CSV (más estable para fetch)
const sheetURL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQsmuT-sX_hT2VXW9_7AbpfRkS1plqwYKV3zrzUVDUf44aEhUZU7btUwp_QUwDoNbv3VANut3ZntOzK/gviz/tq?tqx=out:csv&gid=" +
  gid;

async function cargarPerfumes() {
  const container = document.getElementById("products");
  if (!container) return console.error("No existe #products");

  try {
    const res = await fetch(sheetURL, { cache: "no-store" });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);

    const csvText = await res.text();

    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
    });

    if (parsed.errors?.length) {
      console.error("CSV parse errors:", parsed.errors);
    }

    // Limpia BOM en el primer header si aparece
    const data = (parsed.data || []).map(row => {
      const clean = {};
      for (const k in row) {
        const kk = (k || "").replace(/^\uFEFF/, "").trim();
        clean[kk] = (row[k] ?? "").toString().trim();
      }
      return clean;
    });

    mostrarPerfumes(data);
  } catch (e) {
    console.error("Error cargando perfumes:", e);
    container.innerHTML = `<p style="padding:12px">No se pudo cargar el catálogo.</p>`;
  }
}

function mostrarPerfumes(perfumes) {
  const container = document.getElementById("products");
  container.innerHTML = "";

  if (!perfumes.length) {
    container.innerHTML = `<p style="padding:12px">No hay productos para mostrar.</p>`;
    return;
  }

  perfumes.forEach(p => {
    // Ajustá estos nombres si en tu sheet están distinto (ej: Imagen, imagenUrl, etc.)
    const imagenField = p.imagenURL || p.imagenUrl || p.imagen || "";
    const nombre = p.nombre || p.Nombre || "";
    const descripcion = p.descripcion || p.Descripcion || "";
    const precioRaw = p.precio || p.Precio || "0";

    const imgs = imagenField
      .split("|")
      .map(s => s.trim())
      .filter(Boolean);

    const imgHTML = imgs[0] ? `<img src="${imgs[0]}" alt="${nombre}">` : "";

    const precioNum = Number(String(precioRaw).replace(/\./g, "").replace(",", "."));
    const precioOk = Number.isFinite(precioNum) ? precioNum : 0;

    container.innerHTML += `
      <div class="product">
        ${imgHTML}
        <h3>${nombre}</h3>
        <p>${descripcion}</p>
        <b>$${precioOk.toLocaleString("es-AR")}</b>
      </div>
    `;
  });
}

cargarPerfumes();
