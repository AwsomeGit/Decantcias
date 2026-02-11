const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQsmuT-sX_hT2VXW9_7AbpfRkS1plqwYKV3zrzUVDUf44aEhUZU7btUwp_QUwDoNbv3VANut3ZntOzK/pub?gid=751988153&single=true&output=csv";

async function loadPerfumes() {
  const res = await fetch(sheetURL);
  const csv = await res.text();

  const rows = csv.split("\n").map(r => r.split(";")); // 👈 PUNTO Y COMA
  const headers = rows.shift();

  const perfumes = rows.map(row => {
    let obj = {};
    headers.forEach((h, i) => obj[h.trim()] = row[i]?.trim());
    if (obj.imgs) obj.imgs = obj.imgs.split(",");
    return obj;
  });

  console.log("Perfumes:", perfumes);
  renderPerfumes(perfumes);
}

function renderPerfumes(perfumes) {
  const container = document.getElementById("products");
  container.innerHTML = "";

  perfumes.forEach(p => {
    container.innerHTML += `
      <div class="product">
        <img src="${p.imgs?.[0] || ''}">
        <h3>${p.name}</h3>
        <p>${p.desc}</p>
        <b>$${Number(p.price).toLocaleString("es-AR")}</b>
        <button onclick="buyPerfume('${p.name}')">Comprar</button>
      </div>
    `;
  });
}

function buyPerfume(name) {
  const phone = "549XXXXXXXXXX";
  const msg = encodeURIComponent("Hola! Quiero comprar: " + name);
  window.open(`https://wa.me/${phone}?text=${msg}`);
}

loadPerfumes();
