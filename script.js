// ===== FIREBASE CONFIG =====
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  projectId: "SEU_PROJETO"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ===== TEMPO =====
const agora = () => Date.now();
const minutos = ms => ms / 60000;

// ===== JOGOS AGORA =====
async function carregarJogosAtivos() {
  const container = document.getElementById("liveGames");
  container.innerHTML = "";

  const snap = await db.collectionGroup("jogos").get();
  const now = agora();

  snap.forEach(doc => {
    const j = doc.data();
    const start = j.startTime;

    const pre10 = j.status === "pre" && start >= now && minutos(start - now) <= 10;
    const live = j.status === "live";

    if (pre10 || live) {
      const div = document.createElement("div");
      div.className = "game";
      div.innerHTML = `
        <strong>${j.home} x ${j.away}</strong><br>
        Mercado: ${j.market}<br>
        Odd: ${j.odd} | EV: ${j.ev}<br>
        Status: ${j.status.toUpperCase()}
      `;
      container.appendChild(div);
    }
  });
}

// ===== HISTÓRICO =====
async function carregarPastas() {
  const cont = document.getElementById("folders");
  cont.innerHTML = "";

  const snap = await db.collection("jogos").get();
  snap.forEach(ano => {
    const d = document.createElement("div");
    d.className = "folder";
    d.textContent = ano.id;
    d.onclick = () => abrirAno(ano.id);
    cont.appendChild(d);
  });
}

async function abrirAno(ano) {
  const cols = await db.collection("jogos").doc(ano).listCollections();
  abrirModal(ano, cols.map(c => c.id), mes => abrirMes(ano, mes));
}

async function abrirMes(ano, mes) {
  const dias = await db.collection("jogos").doc(ano).collection(mes).get();
  abrirModal(`${ano}/${mes}`, dias.docs.map(d => d.id), dia => abrirDia(ano, mes, dia));
}

async function abrirDia(ano, mes, dia) {
  const cont = document.getElementById("modalGames");
  cont.innerHTML = "";

  const snap = await db.collection("jogos").doc(ano).collection(mes).doc(dia).collection("jogos").get();
  snap.forEach(doc => {
    const j = doc.data();
    const div = document.createElement("div");
    div.className = "game";
    div.innerHTML = `
      <strong>${j.home} x ${j.away}</strong><br>
      Mercado: ${j.market}<br>
      Odd: ${j.odd} | EV: ${j.ev}<br>
      Status: ${j.status}
    `;
    cont.appendChild(div);
  });
}

// ===== MODAL =====
function abrirModal(titulo, itens, onClick) {
  document.getElementById("modalTitle").textContent = titulo;
  const cont = document.getElementById("modalGames");
  cont.innerHTML = "";

  itens.forEach(i => {
    const d = document.createElement("div");
    d.className = "folder";
    d.textContent = i;
    d.onclick = () => onClick(i);
    cont.appendChild(d);
  });

  document.getElementById("modal").style.display = "flex";
}

function closeModal() {
  document.getElementById("modal").style.display = "none";
}

// ===== INIT =====
carregarJogosAtivos();
carregarPastas();
setInterval(carregarJogosAtivos, 60000);