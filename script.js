// =========================
// ELEMENTOS
// =========================
const modalInsert = document.getElementById("modal-insert");
const modalMore = document.getElementById("modal-more");
const modalSearch = document.getElementById("modal-search");
const modalNotfound = document.getElementById("modal-notfound");
const modalMariosca = document.getElementById("modal-mariosca");

const pasteArea = document.getElementById("paste-area");
const processResult = document.getElementById("process-result");
const processStatus = document.getElementById("process-status");

const coll = window._FIREBASE.firestore.collection(window._COLL_ROOT);

// =========================
// MODAIS
// =========================
function open(modal) { modal.classList.remove("hidden"); }
function close(modal) { modal.classList.add("hidden"); }

document.getElementById("btn-insert").onclick = () => open(modalInsert);
document.getElementById("close-insert").onclick = () => close(modalInsert);
document.getElementById("close-more").onclick   = () => close(modalMore);
document.getElementById("close-search").onclick = () => close(modalSearch);
document.getElementById("close-notfound").onclick = () => close(modalNotfound);
document.getElementById("close-mariosca").onclick = () => close(modalMariosca);

document.getElementById("mariosca").onclick = () => open(modalMariosca);

// =========================
// PROCESSAR JOGOS
// =========================
document.getElementById("btn-process").onclick = () => {
  const raw = pasteArea.value.trim();
  if (!raw) {
    processStatus.innerText = "Nenhum texto colado.";
    return;
  }

  // EXEMPLO DE EXTRAÇÃO (adaptar para seu padrão real)
  const linhas = raw.split("\n").filter(x => x.trim() !== "");

  const jogos = linhas.map(l => {
    const p = l.split(" ");
    return {
      id: p.join("-").toLowerCase(),
      nome: l,
    };
  });

  processResult.innerHTML = jogos
    .map(j => `<div>${j.nome}</div>`)
    .join("");

  window._TEMP_JOGOS = jogos;
  processStatus.innerText = "Processado.";
};

// =========================
// SALVAR NO FIRESTORE
// =========================
document.getElementById("btn-save").onclick = async () => {
  const jogos = window._TEMP_JOGOS || [];
  if (jogos.length === 0) return;

  processStatus.innerText = "Salvando...";

  for (let j of jogos) {
    await coll.doc(j.id).set(j, { merge: true });
  }

  processStatus.innerText = "Salvo.";
};

// =========================
// CARREGAR TODOS
// =========================
async function carregarTodos() {
  const snap = await coll.get();
  const area = document.getElementById("home-list");

  if (snap.empty) {
    area.innerHTML = `<p class="hint">Sem jogos salvos.</p>`;
    return;
  }

  area.innerHTML = [...snap.docs]
    .map(d => `<div>${d.data().nome}</div>`)
    .join("");
}

carregarTodos();

// =========================
// JOGOS DE HOJE (placeholder)
// =========================
document.getElementById("btn-today").onclick = async () => {
  open(modalMore);
  document.getElementById("more-title").innerText = "Jogos de hoje";

  const snap = await coll.get();
  document.getElementById("more-list").innerHTML = [...snap.docs]
    .map(d => `<div>${d.data().nome}</div>`)
    .join("");
};

// =========================
// BUSCA
// =========================
document.getElementById("btn-search").onclick = () => open(modalSearch);

document.getElementById("search-input").oninput = async function () {
  const q = this.value.toLowerCase();

  if (!q.trim()) {
    document.getElementById("search-result").innerHTML = "";
    return;
  }

  const snap = await coll.get();
  const filtrado = snap.docs.filter(d =>
    d.data().nome.toLowerCase().includes(q)
  );

  document.getElementById("search-result").innerHTML =
    filtrado.length === 0
      ? `<p>Nenhum resultado.</p>`
      : filtrado.map(d => `<div>${d.data().nome}</div>`).join("");
};

// =========================
// BUSCAR POR DATA (MARIOSCA)
// =========================
document.getElementById("mario-date").oninput = async function () {
  const txt = this.value.trim();
  if (txt.length < 8) return;

  const snap = await coll.get();
  const filtrado = snap.docs.filter(d =>
    d.id.includes(txt.replace(/\//g, "-"))
  );

  document.getElementById("mario-results").innerHTML =
    filtrado.length === 0
      ? `<p>Nada encontrado.</p>`
      : filtrado.map(d => `<div>${d.data().nome}</div>`).join("");
};

// =========================
// EXPORTAR JSON
// =========================
document.getElementById("btn-export").onclick = async () => {
  const snap = await coll.get();
  const dados = snap.docs.map(d => d.data());

  const blob = new Blob([JSON.stringify(dados, null, 2)], {
    type: "application/json",
  });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "jogos.json";
  a.click();
};