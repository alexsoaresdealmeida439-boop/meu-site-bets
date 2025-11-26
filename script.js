
const API_KEY = "23b89636f57128671e479701eaad2a37";

class ProfessionalBetManager {
  constructor() {
    this.games = new Map();
    this.loadFromStorage();
    this.init();
  }

  init() {
    this.bindButtons();
    this.loadTodayGames();
    setTimeout(() => this.injectScannerBox(), 800);
  }

  /* =========================
     BOTÕES
  ========================= */
  bindButtons() {
    const btn = document.getElementById("btnHoje");
    if (btn) btn.onclick = () => this.showTodayGames();
  }

  showTodayGames() {
    document.getElementById("welcomeSection").style.display = "none";
    document.getElementById("currentFolder").style.display = "block";
    this.renderGames();
  }

  /* =========================
     SCANNER
  ========================= */
  injectScannerBox() {
    const header = document.querySelector(".folder-header");
    if (!header || document.getElementById("scannerBox")) return;

    header.insertAdjacentHTML("beforeend", `
      <div id="scannerBox" style="margin-top:15px">
        <textarea id="scannerInput"
          placeholder="COLAR"
          style="width:100%;height:120px;padding:10px"></textarea>
        <button id="btnProcessar"
          style="margin-top:8px;font-weight:bold">PROCESSAR</button>
      </div>
    `);

    document.getElementById("btnProcessar").onclick =
      () => this.processScannerText();
  }

  processScannerText() {
    const texto = document.getElementById("scannerInput").value;
    if (!texto) return alert("Cole o texto do Google Lens");

    const blocos = texto.split(/\n\s*\n/);

    blocos.forEach(bloco => {
      const linhas = bloco.split("\n").map(l => l.trim());

      const jogo = linhas.find(l => l.toLowerCase().includes(" x "));
      const oddsLinha = linhas.find(l => l.match(/\d+\.\d+\/\d+\.\d+\/\d+\.\d+/));
      if (!jogo || !oddsLinha) return;

      const odds = oddsLinha.match(/\d+\.\d+\/\d+\.\d+\/\d+\.\d+/)[0];
      const [a, b] = jogo.toLowerCase().split(" x ").map(t => t.trim());

      this.games.forEach(g => {
        const nome = g.teams.toLowerCase().replace("vs", "x");
        if (nome.includes(a) && nome.includes(b)) g.odds = odds;
      });
    });

    this.saveToStorage();
    this.renderGames();
    alert("Odds inseridas com sucesso");
  }

  /* =========================
     API
  ========================= */
  async loadTodayGames() {
    try {
      const hoje = new Date().toISOString().split("T")[0];
      const r = await fetch(
        `https://v3.football.api-sports.io/fixtures?date=${hoje}&timezone=America/Sao_Paulo`,
        { headers: { "x-apisports-key": API_KEY } }
      );
      const d = await r.json();
      if (d.response) this.processGames(d.response);
    } catch (e) {
      alert("Erro ao carregar jogos");
    }
  }

  processGames(lista) {
    lista.forEach(g => {
      const id = g.fixture.id;
      if (!this.games.has(id)) {
        this.games.set(id, {
          id,
          teams: `${g.teams.home.name} vs ${g.teams.away.name}`,
          time: this.formatTime(g.fixture.date),
          odds: "___/___/___",
          timestamp: new Date(g.fixture.date).getTime()
        });
      }
    });
    this.saveToStorage();
  }

  /* =========================
     RENDER
  ========================= */
  renderGames() {
    const area = document.getElementById("folderContent");
    if (!area) return;

    let jogos = Array.from(this.games.values());
    jogos.sort((a,b) => {
      if (a.odds !== "___/___/___" && b.odds === "___/___/___") return -1;
      if (a.odds === "___/___/___" && b.odds !== "___/___/___") return 1;
      return a.timestamp - b.timestamp;
    });

    area.innerHTML = jogos.map(j => `
      <div class="game-card">
        <b>${j.teams}</b> — ${j.time}<br>
        Odds: ${j.odds}
      </div>
    `).join("");
  }

  formatTime(d) {
    return new Date(d).toLocaleTimeString("pt-BR", {
      hour:"2-digit", minute:"2-digit"
    });
  }

  saveToStorage() {
    localStorage.setItem("betGames", JSON.stringify([...this.games]));
  }

  loadFromStorage() {
    const s = localStorage.getItem("betGames");
    if (s) this.games = new Map(JSON.parse(s));
  }
}

const betManager = new ProfessionalBetManager();
