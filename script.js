
<script>
const API_KEY = "23b89636f57128671e479701eaad2a37";

class ProfessionalBetManager {
  constructor() {
    this.games = new Map();
    this.loadFromStorage();
    this.init();
  }

  /* ================= INIT ================= */
  init() {
    this.loadTodayGames();
    this.showTodayGames();
    setTimeout(() => this.injectScannerBox(), 1000);
  }

  /* ========= SCANNER (ÚNICO) ============== */
  injectScannerBox() {
    const header = document.querySelector('.folder-header');
    if (!header || document.getElementById('scannerBox')) return;

    const div = document.createElement('div');
    div.id = 'scannerBox';
    div.style.margin = '15px 0';

    div.innerHTML = `
      <textarea id="scannerInput"
        placeholder="Cole aqui o texto do Google Lens"
        style="width:100%;height:120px;padding:10px;"></textarea>

      <button style="margin-top:8px;padding:8px 16px;font-weight:bold;"
        onclick="betManager.processScannerText()">
        PROCESSAR
      </button>
    `;
    header.appendChild(div);
  }

  processScannerText() {
    const texto = document.getElementById('scannerInput').value.trim();
    if (!texto) return;

    const linhas = texto.split('\n');

    linhas.forEach(l => {
      const oddMatch = l.match(/\d+\.\d+\/\d+\.\d+\/\d+\.\d+/);
      if (!oddMatch) return;

      for (let game of this.games.values()) {
        const nome = game.teams.toLowerCase().replace('vs','x');
        if (l.toLowerCase().includes(nome.split(' x ')[0]) &&
            l.toLowerCase().includes(nome.split(' x ')[1])) {
          game.odds = oddMatch[0];
        }
      }
    });

    this.saveToStorage();
    this.render();
  }

  /* ============== API ===================== */
  async loadTodayGames() {
    const today = new Date().toISOString().split('T')[0];
    const res = await fetch(
      `https://v3.football.api-sports.io/fixtures?date=${today}&timezone=America/Sao_Paulo`,
      { headers: { 'x-apisports-key': API_KEY } }
    );
    const data = await res.json();
    if (data.response) this.processGames(data.response, today);
  }

  processGames(games, date) {
    games.forEach(g => {
      const id = g.fixture.id.toString();
      if (this.games.has(id)) return;

      this.games.set(id, {
        id,
        teams: `${g.teams.home.name} vs ${g.teams.away.name}`,
        time: this.formatTime(g.fixture.date),
        odds: "___/___/___",
        apostar: "N",
        acertei: "N",
        ts: new Date(g.fixture.date).getTime()
      });
    });
    this.saveToStorage();
    this.render();
  }

  /* ============== VIEW ==================== */
  showTodayGames() {
    document.getElementById('welcomeSection').style.display = 'none';
    document.getElementById('currentFolder').style.display = 'block';
  }

  render() {
    const cont = document.getElementById('folderContent');
    cont.innerHTML = '';

    [...this.games.values()]
      .sort((a,b)=>a.ts-b.ts)
      .forEach(g => cont.innerHTML += this.card(g));
  }

  card(g) {
    return `
      <div class="game-card" style="border:1px solid #444;padding:10px;margin-bottom:10px;">
        <b>${g.teams}</b> — ${g.time}<br>
        <input value="${g.odds}" readonly style="width:140px;margin:5px 0"><br>

        Apostar?
        <select onchange="betManager.update('${g.id}','apostar',this.value)">
          <option ${g.apostar=='N'?'selected':''}>N</option>
          <option ${g.apostar=='S'?'selected':''}>S</option>
        </select>

        Acertei?
        <select onchange="betManager.update('${g.id}','acertei',this.value)">
          <option ${g.acertei=='N'?'selected':''}>N</option>
          <option ${g.acertei=='S'?'selected':''}>S</option>
        </select>
      </div>
    `;
  }

  update(id, campo, valor) {
    this.games.get(id)[campo] = valor;
    this.saveToStorage();
  }

  /* ============== UTILS =================== */
  formatTime(d) {
    return new Date(d).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
  }

  saveToStorage() {
    localStorage.setItem('betGames', JSON.stringify([...this.games]));
  }

  loadFromStorage() {
    const s = localStorage.getItem('betGames');
    if (s) this.games = new Map(JSON.parse(s));
  }
}

const betManager = new ProfessionalBetManager();
</script>
