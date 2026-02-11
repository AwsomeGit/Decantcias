const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQsmuT-sX_hT2VXW9_7AbpfRkS1plqwYKV3zrzUVDUf44aEhUZU7btUwp_QUwDoNbv3VANut3ZntOzK/pub?gid=751988153&single=true&output=csv";

async function cargarPerfumes() {
  const res = await fetch(sheetURL);
  const data = await res.text();

  const filas = data.split("\n").slice(1); // sin encabezado
  const perfumes = filas.map(fila => {
    const [id, nombre, precio, imagenes, descripcion] = fila.split(",");
    return {
      id,
      nombre,
      precio,
      imagenes: imagenes?.split("|"), // separador de imágenes
      descripcion
    };
  });

  mostrarPerfumes(perfumes);
}

function mostrarPerfumes(perfumes) {
  const contenedor = document.getElementById("productos");
  contenedor.innerHTML = "";

  perfumes.forEach(p => {
    const div = document.createElement("div");
    div.className = "producto";

    div.innerHTML = `
      <img src="${p.imagenes[0]}" alt="${p.nombre}">
      <h3>${p.nombre}</h3>
      <p>${p.descripcion}</p>
      <strong>$${p.precio}</strong>
    `;

    contenedor.appendChild(div);
  });
}

cargarPerfumes();
