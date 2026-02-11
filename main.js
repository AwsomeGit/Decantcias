const sheetURL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQsmuT-sX_hT2VXW9_7AbpfRkS1plqwYKV3zrzUVDUf44aEhUZU7btUwp_QUwDoNbv3VANut3ZntOzK/gviz/tq?tqx=out:csv&gid=751988153";

function driveToDirect(url) {
  if (!url) return "";
  // /file/d/<ID>/view -> uc?export=view&id=<ID>
  const m = url.match(/\/file\/d\/([^/]+)\//);
  if (m?.[1]) return `https://drive.google.com/uc?export=view&id=${m[1]}`;
  return url;
}

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
    });

    if (parsed.errors?.length) console.error("CSV parse errors:", parsed.errors);

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

  perfumes.forEach(p => {
    const nombre = p.nombre || p.Nombre || "";
    const descripcion = p.descripcion || p.Descripcion || "";
    const precioRaw = (p.precio || p.Precio || "").toString();
    const imagenRaw = p.imagenURL || p.imagenUrl || p.imagen || "";

    // precio: convierte "$58.000" o "58.000" a número
    const precioNum = Number(
      precioRaw
        .replace(/\$/g, "")
        .replace(/\./g, "")
        .replace(",", ".")
        .trim()
    );
    const precioOk = Number.isFinite(precioNum) ? precioNum : 0;

    const imgs = imagenRaw
      .split("|")
      .map(s => driveToDirect(s.trim()))
      .filter(Boolean);

    const imgHTML = imgs[0] ? `<img src="${imgs[0]}" alt="${nombre}">` : "";

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
