
class ProfessionalBetManager {
    constructor() {
        this.games = new Map();
        this.currentDay = "HOJE";
        this.loadFromStorage();
        this.renderCurrentView();
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById("addGameButton").addEventListener("click", () => {
            const teams = prompt("Times (Ex: Flamengo vs Santos):");
            if (!teams) return;

            const odds = prompt("Odds (Ex: 1.80/3.20/4.50):");
            const time = prompt("Horário (Ex: 20:00):");

            this.addGame(teams, odds, time);
        });

        document.querySelectorAll(".tab-button").forEach(btn => {
            btn.addEventListener("click", () => {
                this.currentDay = btn.dataset.day;
                this.renderCurrentView();
            });
        });
    }

    addGame(teams, odds, time) {
        const id = `${this.currentDay}_${Date.now()}`;
        this.games.set(id, { id, teams, odds, time, day: this.currentDay });
        this.saveToStorage();
        this.renderCurrentView();
    }

    loadFromStorage() {
        const data = localStorage.getItem("betGames");
        if (data) {
            this.games = new Map(JSON.parse(data));
        }
    }

    saveToStorage() {
        localStorage.setItem("betGames", JSON.stringify([...this.games]));
    }

    renderCurrentView() {
        const container = document.getElementById("gamesContainer");
        container.innerHTML = "";

        [...this.games.values()]
            .filter(g => g.day === this.currentDay)
            .forEach(game => {
                const div = document.createElement("div");
                div.className = "game-item";
                div.innerHTML = `
                    <strong>${game.teams}</strong><br>
                    Odds: ${game.odds}<br>
                    Horário: ${game.time}<br>
                    <button onclick="betManager.deleteGame('${game.id}')">Excluir</button>
                `;
                container.appendChild(div);
            });
    }

    deleteGame(id) {
        this.games.delete(id);
        this.saveToStorage();
        this.renderCurrentView();
    }
}

const betManager = new ProfessionalBetManager();



// ===================================================
//  RECEPTOR OFICIAL PARA O APLICATIVO
//  O APP ENVIA: [{ teams, odds, hour }]
// ===================================================
function receiveScan(scannedGames) {
    if (!Array.isArray(scannedGames)) {
        console.error("Formato inválido recebido do app.");
        alert("Erro: dados inválidos.");
        return;
    }

    let atualizados = 0;

    scannedGames.forEach(game => {
        const existe = Array.from(betManager.games.values())
            .find(g => g.teams.toLowerCase().trim() === game.teams.toLowerCase().trim());

        if (existe) {
            existe.odds = game.odds || existe.odds;
            existe.time = game.hour || existe.time;
            atualizados++;
        } else {
            // Se não existe, adiciona automaticamente no dia HOJE
            betManager.addGame(game.teams, game.odds, game.hour);
        }
    });

    betManager.saveToStorage();
    betManager.renderCurrentView();

    alert(`✔ ${atualizados} jogos atualizados via app.`);
}
