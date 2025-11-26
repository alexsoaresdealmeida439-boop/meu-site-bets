
const API_KEY = "23b89636f57128671e479701eaad2a37";

class ProfessionalBetManager {
  constructor() {
    this.games = new Map();
    this.currentView = 'welcome';
    this.currentPath = [];
    this.loadFromStorage();
    this.init();
  }

  init() {
    this.loadTodayGames();
    this.loadChampionships();
    setInterval(() => this.updateLiveGames(), 30000);
    this.showWelcomeView();
    setTimeout(() => this.injectScannerBox(), 1500);
  }

  /* ================================
     🔥 CAIXA COLAR + PROCESSAR
  =================================*/
  injectScannerBox() {
    const center = document.querySelector('.folder-header');
    if (!center || document.getElementById('scannerBox')) return;

    const div = document.createElement('div');
    div.id = 'scannerBox';
    div.style.marginTop = '15px';

    div.innerHTML = `
      <textarea id="scannerInput" 
        placeholder="COLAR"
        style="width:100%;height:120px;padding:10px;"></textarea>

      <button onclick="betManager.processScannerText()" 
        style="margin-top:8px;padding:8px 16px;font-weight:bold;">
        PROCESSAR
      </button>
    `;

    center.appendChild(div);
  }

  processScannerText() {
    const texto = document.getElementById('scannerInput').value;
    if (!texto) return;

    const blocos = texto.split(/\n\s*\n/);

    blocos.forEach(bloco => {
      const linhas = bloco.split('\n').map(l => l.trim());

      const jogoLinha = linhas.find(l => l.toLowerCase().includes(' x '));
      const oddsLinha = linhas.find(l => l.match(/\d+\.\d+\/\d+\.\d+\/\d+\.\d+/));

      if (!jogoLinha || !oddsLinha) return;

      const odds = oddsLinha.match(/\d+\.\d+\/\d+\.\d+\/\d+\.\d+/)[0];
      const jogoNome = jogoLinha.toLowerCase();

      for (let game of this.games.values()) {
        const apiName = game.teams.toLowerCase().replace('vs', 'x');

        if (apiName.includes(jogoNome.split(' x ')[0]) &&
            apiName.includes(jogoNome.split(' x ')[1])) {

          game.odds = odds;
        }
      }
    });

    this.saveToStorage();
    this.renderCurrentView();
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
          leagueId: game.league.id,
          time: this.formatTime(game.fixture.date),
          odds: "___/___/___",
          apostei: "N",
          acertei: "N",
          timestamp: new Date(game.fixture.date).getTime(),
          originalDate: date,
          status: game.fixture.status.short,
          fixtureDate: game.fixture.date
        });
      }
    });
    this.saveToStorage();
  }

  /* ================================
     VIEW
  =================================*/
  showWelcomeView() {
    document.getElementById('welcomeSection').style.display = 'flex';
    document.getElementById('currentFolder').style.display = 'none';
  }

  showTodayGames() {
    this.currentView = 'today';
    document.getElementById('welcomeSection').style.display = 'none';
    document.getElementById('currentFolder').style.display = 'block';
    this.renderCurrentView();
  }

  renderCurrentView() {
    let jogos = Array.from(this.games.values());

    jogos.sort((a, b) => {
      if (a.odds !== "___/___/___" && b.odds === "___/___/___") return -1;
      if (a.odds === "___/___/___" && b.odds !== "___/___/___") return 1;
      return a.timestamp - b.timestamp;
    });

    const container = document.getElementById('folderContent');
    container.innerHTML = jogos.map(j => this.createGameCard(j)).join('');
  }

  createGameCard(game) {
    return `
      <div class="game-card">
        <div><b>${game.teams}</b> — ${game.time}</div>
        <input value="${game.odds}" readonly />
      </div>
    `;
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

  loadChampionships() {}
  updateLiveGames() {}
}

const betManager = new ProfessionalBetManager();
