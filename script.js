// ================================ // FIREBASE CONFIG (SUBSTITUA PELOS SEUS DADOS) // ================================ const firebaseConfig = { apiKey: "SUA_API_KEY", authDomain: "SEU_PROJETO.firebaseapp.com", projectId: "SEU_PROJETO", };

firebase.initializeApp(firebaseConfig); const db = firebase.firestore();

// ================================ // UTILIDADES DE TEMPO // ================================ function agora() { return new Date().getTime(); }

function minutos(ms) { return ms / 60000; }

// ================================ // RENDER JOGOS AO VIVO / ≤10 MIN // ================================ async function carregarJogosAtivos() { const container = document.getElementById("liveGames"); container.innerHTML = "";

const snap = await db.collectionGroup("jogos").get(); const now = agora();

snap.forEach(doc => { const j = doc.data(); const start = j.startTime;

const pre10 = j.status === "pre" && minutos(start - now) <= 10 && start >= now;
const live = j.status === "live";

if (pre10 || live) {
  const div = document.createElement("div");
  div.className = "game";
  div.innerHTML = `
    <strong>${j.home} x ${j.away}</strong><br>
    Mercado: ${j.market}<br>
    Odd: ${j.odd} | EV: ${j.ev.toFixed(3)}<br>
    Status: ${j.status.toUpperCase()}
  `;
  container.appendChild(div);
}

}); }

// ================================ // HISTÓRICO (ANO / MÊS / DIA) // ================================ async function carregarPastas() { const cont = document.getElementById("folders"); cont.innerHTML = "";

const snap = await db.collection("jogos").get();

snap.forEach(anoDoc => { const anoDiv = criarPasta(anoDoc.id, () => carregarMeses(anoDoc.id)); cont.appendChild(anoDiv); }); }

function criarPasta(nome, onClick) { const div = document.createElement("div"); div.className = "folder"; div.textContent = nome; div.onclick = onClick; return div; }

async function carregarMeses(ano) { const snap = await db.collection("jogos").doc(ano).listCollections(); abrirModal(ano, snap.map(c => c.id), carregarDias.bind(null, ano)); }

async function carregarDias(ano, mes) { const snap = await db.collection("jogos").doc(ano).collection(mes).get(); abrirModal(${ano}/${mes}, snap.docs.map(d => d.id), carregarJogosDia.bind(null, ano, mes)); }

async function carregarJogosDia(ano, mes, dia) { const cont = document.getElementById("modalGames"); cont.innerHTML = "";

const snap = await db.collection("jogos").doc(ano).collection(mes).doc(dia).collection("jogos").get();

snap.forEach(doc => { const j = doc.data(); const div = document.createElement("div"); div.className = "game"; div.innerHTML = <strong>${j.home} x ${j.away}</strong><br> Mercado: ${j.market}<br> Odd: ${j.odd} | EV: ${j.ev.toFixed(3)}<br> Status: ${j.status}; cont.appendChild(div); }); }

// ================================ // MODAL // ================================ function abrirModal(titulo, itens, onClick) { const modal = document.getElementById("modal"); const title = document.getElementById("modalTitle"); const cont = document.getElementById("modalGames");

title.textContent = titulo; cont.innerHTML = "";

itens.forEach(i => { const div = document.createElement("div"); div.className = "folder"; div.textContent = i; div.onclick = () => onClick(i); cont.appendChild(div); });

modal.style.display = "flex"; }

function closeModal() { document.getElementById("modal").style.display = "none"; }

// ================================ // INIT // ================================ carregarJogosAtivos(); carregarPastas();

setInterval(carregarJogosAtivos, 60000);