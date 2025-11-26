
const API_KEY = "23b89636f57128671e479701eaad2a37";

class BetManager {
  constructor() {
    this.games = new Map();
    this.loadStorage();
    this.init();
  }

  /* ========= INIT ========= */
  init() {
    document.addEventListener("DOMContentLoaded", () => {
      this.loadTodayGames().then(() => {
        this.renderToday();
        this.injectScannerBox();
      });
    });
  }

  /* ========= SCANNER ========= */
  injectScannerBox() {
    const header = document.querySelector(".folder-header");
    if (!header || document.getElementById("scannerBox")) return;

    const box = document.createElement("div");
    box.id = "scannerBox";
    box.style.marginTop = "10px";

    box.innerHTML = `
      <textarea id="scannerInput" placeholder="COLAR"
        style="width:100%;height:120px;padding:8px;"></textarea>
      <button id="scannerBtn" style="margin-top:6px">
        PROCESSAR
      </button>
    `;

    header.appendChild(box);

    document.getElementById("scannerBtn").onclick = () => {
      this.processScanner();
    };
  }

  processScanner() {
    const texto = document.getElementById("scannerInput").value.trim();
    if (!texto) return;

    const blocos = texto.split(/\n\s*\n/);

    blocos.forEach(bloco => {
      const linhas = bloco.split("\n").map(l => l.trim());
      const jogo = linhas.find(l => l.includes(" x "));
      const oddsLinha = linhas.find(l => l.match(/\d+\.\d+\/\d+\.\d+\/\d+\.\d+/));
      if (!jogo || !oddsLinha) return;

      const [o1, ox, o2] = oddsLinha.match(/\d+\.\d+/g);
      const nome = jogo.toLowerCase();

      this.games.forEach(game => {
        const apiName = game.teams.toLowerCase().replace(" vs ", " x ");
        if (
          apiName.includes(nome.split(" x ")[0]) &&
          apiName.includes(nome.split(" x ")[1])
        ) {
          game.odds = `${o1}/${ox}/${o2}`;
        }
      });
    });

    this.saveStorage();
    this.renderToday();
  }

  /* ========= API ========= */
  async loadTodayGames() {
    const today = new Date().toISOString().split("T")[0];
    const res = await fetch(
      `https://v3.football.api-sports.io/fixtures?date=${today}&timezone=America/Sao_Paulo`,
      { headers: { "x-apisports-key": API_KEY } }
    );
    const data = await res.json();

    data.response.forEach(g => {
      const id = g.fixture.id.toString();
      if (!this.games.has(id)) {
        this.games.set(id, {
          id,
          teams: `${g.teams.home.name} vs ${g.teams.away.name}`,
          time: this.formatTime(g.fixture.date),
          odds: "___/___/___",
          apostei: "N",
          acertei: "N",
          timestamp: new Date(g.fixture.date).getTime()
        });
      }
    });

    this.saveStorage();
  }

  /* ========= VIEW ========= */
  renderToday() {
    const container = document.getElementById("folderContent");
    if (!container) return;

    let jogos = Array.from(this.games.values());

    jogos.sort((a, b) => {
      if (a.odds !== "___/___/___" && b.odds === "___/___/___") return -1;
      if (a.odds === "___/___/___" && b.odds !== "___/___/___") return 1;
      return a.timestamp - b.timestamp;
    });

    container.innerHTML = jogos.map(j => this.card(j)).join("");
  }

  card(j) {
    return `
      <div class="game-card">
        <div><b>${j.teams}</b> — ${j.time}</div>
        <div>ODDs: <input value="${j.odds}" readonly></div>
        <div>Apostar? ${j.apostei} | Acertei? ${j.acertei}</div>
        <hr>
      </div>
    `;
  }

  /* ========= UTILS ========= */
  formatTime(d) {
    return new Date(d).toLocaleTimeString("pt-BR", {
      hour: "2-digit", minute: "2-digit"
    });
  }

  saveStorage() {
    localStorage.setItem("betGames", JSON.stringify([...this.games]));
  }

  loadStorage() {
    const s = localStorage.getItem("betGames");
    if (s) this.games = new Map(JSON.parse(s));
  }
}

const betManager = new BetManager();
