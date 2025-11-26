
const API_KEY = "23b89636f57128671e479701eaad2a37";

class ProfessionalBetManager {
    constructor() {
        this.games = new Map();
        this.loadFromStorage();
        this.init();
    }

    init() {
        this.loadTodayGames();
        setInterval(() => this.updateLiveGames(), 30000);
    }

    async loadTodayGames() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const res = await fetch(
                `https://v3.football.api-sports.io/fixtures?date=${today}&timezone=America/Sao_Paulo`,
                { headers: { "x-apisports-key": API_KEY } }
            );
            const data = await res.json();
            if (data.response) this.processGames(data.response, today);
        } catch (e) {
            console.error(e);
        }
    }

    processGames(apiGames, date) {
        apiGames.forEach(g => {
            const id = String(g.fixture.id);
            if (!this.games.has(id)) {
                this.games.set(id, {
                    id,
                    teams: `${g.teams.home.name} vs ${g.teams.away.name}`,
                    time: new Date(g.fixture.date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
                    league: g.league.name,
                    odds: "___/___/___"
                });
            }
        });
        this.saveToStorage();
        this.render();
    }

    // 🔥 FUNÇÃO PRINCIPAL DO SCANNER
    processScannerText(text) {
        const blocks = text.split(/\n\s*\n/);
        blocks.forEach(block => {
            const lines = block.split("\n").map(l => l.trim()).filter(Boolean);

            const matchGame = lines.find(l => l.toLowerCase().includes(" x "));
            const matchOdds = lines.find(l => /\d+\.\d+\/\d+\.\d+\/\d+\.\d+/.test(l));

            if (!matchGame || !matchOdds) return;

            const [home, away] = matchGame.toLowerCase().split(" x ").map(this.normalize);
            const odds = matchOdds;

            this.games.forEach(game => {
                const [gHome, gAway] = game.teams.toLowerCase().split(" vs ").map(this.normalize);
                if (home.includes(gHome) || gHome.includes(home)) {
                    if (away.includes(gAway) || gAway.includes(away)) {
                        game.odds = odds;
                    }
                }
            });
        });

        this.saveToStorage();
        this.render();
    }

    normalize(str) {
        return str
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9 ]/g, "")
            .trim();
    }

    render() {
        const container = document.getElementById("folderContent");
        if (!container) return;

        container.innerHTML = [...this.games.values()].map(g => `
            <div class="game-card">
                <b>${g.teams}</b><br>
                Hora: ${g.time}<br>
                Odds: <input value="${g.odds}" readonly>
            </div>
        `).join("");
    }

    updateLiveGames() {}

    saveToStorage() {
        localStorage.setItem("betGames", JSON.stringify([...this.games.entries()]));
    }

    loadFromStorage() {
        const data = localStorage.getItem("betGames");
        if (data) this.games = new Map(JSON.parse(data));
    }
}

const betManager = new ProfessionalBetManager();

// ✅ ACIONADOR DO BOTÃO PROCESSAR
window.processarScanner = () => {
    const text = document.getElementById("scannerInput").value;
    betManager.processScannerText(text);
};
