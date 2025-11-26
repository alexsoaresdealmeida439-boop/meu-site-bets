
const API_KEY = "23b89636f57128671e479701eaad2a37";

class ProfessionalBetManager {
  constructor() {
    this.games = new Map();
    this.currentView = 'welcome';
    this.loadFromStorage();
    this.init();
  }

  init() {
    this.loadTodayGames();
    setInterval(() => this.updateLiveGames(), 30000);
    setTimeout(() => this.injectScannerBox(), 1000);
  }

  /* ================================
     🔥 CAIXA COLAR + PROCESSAR
  =================================*/
  injectScannerBox() {
    if (document.getElementById('scannerBox')) return;

    const alvo = document.querySelector('.folder-header');
    if (!alvo) return;

    const box = document.createElement('div');
    box.id = 'scannerBox';
    box.style.margin = '15px 0';

    box.innerHTML = `
      <textarea id="scannerInput"
        placeholder="COLAR"
        style="width:100%;height:140px;padding:10px;"></textarea>

      <button id="btnProcessar"
        style="margin-top:8px;padding:8px 18px;font-weight:bold;">
        PROCESSAR
      </button>
    `;

    alvo.appendChild(box);

    document.getElementById('btnProcessar')
      .addEventListener('click', () => this.processScannerText());
  }

  processScannerText() {
    const texto = document.getElementById('scannerInput').value.trim();
    if (!texto) {
      alert("Nenhum texto colado");
      return;
    }

    const blocos = texto.split(/\n\s*\n/);

    blocos.forEach(bloco => {
      const linhas = bloco.split('\n').map(l => l.trim());

      const jogoLinha = linhas.find(l => l.toLowerCase().includes(' x '));
      const oddsLinha = linhas.find(l =>
        /\d+\.\d+\/\d+\.\d+\/\d+\.\d+/.test(l)
      );

      if (!jogoLinha || !oddsLinha) return;

      const odds = oddsLinha.match(/\d+\.\d+\/\d+\.\d+\/\d+\.\d+/)[0];

      const [timeA, timeB] = jogoLinha
        .toLowerCase()
        .split(' x ')
        .map(t => t.trim());

      this.games.forEach(game => {
        const nome = game.teams
          .toLowerCase()
          .replace('vs', 'x');

        if (nome.includes(timeA) && nome.includes(timeB)) {
          game.odds = odds;
        }
      });
    });

    this.saveToStorage();
    this.renderCurrentView();
    alert("Odds aplicadas com sucesso");
  }

  /* ================================
     API / JOGOS
  =================================*/
  async loadTodayGames() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(
        `https://v3.football.api-sports.io/fixtures?date=${today}&timezone=America/Sao_Paulo`,
        { headers: { 'x-apisports-key': API_KEY } }
      );
      const data = await res.json();
      if (data.response) this.processGames(data.response, today);
    } catch (e) {
      console.error(e);
    }
  }

  processGames(apiGames, date) {
    apiGames.forEach(game => {
      const id = game.fixture.id.toString();
      if (!this.games.has(id)) {
        this.games.set(id, {
          id,
          teams: `${game.teams.home.name} vs ${game.teams.away.name}`,
          league: game.league.name,
          time: this.formatTime(game.fixture.date),
          odds: "___/___/___",
          apostei: "N",
          acertei: "N",
          timestamp: new Date(game.fixture.date).getTime()
        });
      }
    });
    this.saveToStorage();
    this.renderCurrentView();
  }

  /* ================================
     RENDER
  =================================*/
  renderCurrentView() {
    const container = document.getElementById('folderContent');
    if (!container) return;

    const jogos = [...this.games.values()].sort((a, b) => {
      if (a.odds !== "___/___/___" && b.odds === "___/___/___") return -1;
      if (a.odds === "___/___/___" && b.odds !== "___/___/___") return 1;
      return a.timestamp - b.timestamp;
    });

    container.innerHTML = jogos.map(j => `
      <div class="game-card" style="margin-bottom:10px;">
        <div><b>${j.teams}</b> — ${j.time}</div>
        <div>Odds: ${j.odds}</div>
        <div>Apostei? ${j.apostei} | Acertei? ${j.acertei}</div>
      </div>
    `).join('');
  }

  formatTime(d) {
    return new Date(d).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  saveToStorage() {
    localStorage.setItem('betGames', JSON.stringify([...this.games]));
  }

  loadFromStorage() {
    const s = localStorage.getItem('betGames');
    if (s) this.games = new Map(JSON.parse(s));
  }

  updateLiveGames() {}
}

const betManager = new ProfessionalBetManager();
