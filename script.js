
const API_KEY = "23b89636f57128671e479701eaad2a37";

class BetManager {
    constructor() {
        this.games = new Map();
        this.loadFromStorage();
        this.init();
    }

    init() {
        this.displayCurrentDate();
        this.loadTodayGames();
        this.setupEventListeners();
        this.renderGames();
    }

    displayCurrentDate() {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            timeZone: 'America/Sao_Paulo'
        };
        document.getElementById('currentDate').textContent = 
            now.toLocaleDateString('pt-BR', options);
    }

    async loadTodayGames() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const response = await fetch(
                `https://v3.football.api-sports.io/fixtures?date=${today}&timezone=America/Sao_Paulo`,
                {
                    headers: {
                        'x-apisports-key': API_KEY,
                        'x-rapidapi-host': 'v3.football.api-sports.io'
                    }
                }
            );
            
            const data = await response.json();
            
            if (data.response) {
                this.processGames(data.response, today);
            }
        } catch (error) {
            console.error('Erro ao carregar jogos:', error);
        }
    }

    processGames(apiGames, date) {
        apiGames.forEach(game => {
            const gameId = game.fixture.id.toString();
            
            if (!this.games.has(gameId)) {
                const gameData = {
                    id: gameId,
                    teams: `${game.teams.home.name} vs ${game.teams.away.name}`,
                    league: game.league.name,
                    date: this.formatDate(game.fixture.date),
                    time: this.formatTime(game.fixture.date),
                    odds: "___/___/___",
                    apostei: "N",
                    acertei: "N",
                    timestamp: new Date(game.fixture.date).getTime(),
                    originalDate: date
                };
                
                this.games.set(gameId, gameData);
            }
        });
        
        this.cleanOldGames();
        this.saveToStorage();
        this.renderGames();
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    }

    formatTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit',
            timeZone: 'America/Sao_Paulo'
        });
    }

    cleanOldGames() {
        const now = new Date().getTime();
        const oneDayMs = 24 * 60 * 60 * 1000;
        
        for (let [gameId, game] of this.games) {
            const gameTime = game.timestamp;
            const gameFinished = gameTime < (now - (2 * 60 * 60 * 1000)); // 2 horas após o jogo
            
            if (gameFinished && game.apostei === "N") {
                this.games.delete(gameId);
            }
        }
    }

    setupEventListeners() {
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filterGames(e.target.value);
        });
    }

    filterGames(searchTerm) {
        const games = Array.from(this.games.values());
        const filtered = games.filter(game => 
            game.teams.toLowerCase().includes(searchTerm.toLowerCase()) ||
            game.league.toLowerCase().includes(searchTerm.toLowerCase())
        );
        this.renderGames(filtered);
    }

    renderGames(gamesArray = null) {
        const games = gamesArray || Array.from(this.games.values());
        const container = document.getElementById('gamesContainer');
        
        const gamesByDate = this.groupGamesByDate(games);
        container.innerHTML = '';

        for (const [date, dateGames] of gamesByDate) {
            const daySection = this.createDaySection(date, dateGames);
            container.appendChild(daySection);
        }

        if (games.length === 0) {
            container.innerHTML = '<div class="loading">Nenhum jogo encontrado</div>';
        }
    }

    groupGamesByDate(games) {
        const grouped = new Map();
        
        games.sort((a, b) => b.timestamp - a.timestamp);
        
        games.forEach(game => {
            const date = game.originalDate;
            if (!grouped.has(date)) {
                grouped.set(date, []);
            }
            grouped.get(date).push(game);
        });
        
        return new Map([...grouped.entries()].sort().reverse());
    }

    createDaySection(date, games) {
        const section = document.createElement('div');
        section.className = 'day-section';
        
        const title = this.getDayTitle(date);
        section.innerHTML = `
            <div class="day-title">${title}</div>
            <div class="games-grid">
                ${games.map(game => this.createGameCard(game)).join('')}
            </div>
        `;
        
        return section;
    }

    getDayTitle(date) {
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        
        if (date === today) return 'HOJE';
        if (date === yesterday) return 'ONTEM';
        
        const dateObj = new Date(date);
        return dateObj.toLocaleDateString('pt-BR', { 
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        }).toUpperCase();
    }

    createGameCard(game) {
        return `
            <div class="game-card" data-game-id="${game.id}">
                <div class="game-header">
                    <div class="teams">${game.teams}</div>
                    <div class="league">${game.league}</div>
                </div>
                <div class="game-details">
                    <div class="detail-group">
                        <div class="detail-label">DATA</div>
                        <input type="text" class="date-input" value="${game.date}" readonly>
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">HORA</div>
                        <input type="text" class="time-input" value="${game.time}" readonly>
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">ODDS</div>
                        <input type="text" class="odds-input" value="${game.odds}" 
                               placeholder="___/___/___"
                               onchange="betManager.updateGame('${game.id}', 'odds', this.value)">
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">APOSTEI?</div>
                        <select class="sn-select" onchange="betManager.updateGame('${game.id}', 'apostei', this.value)">
                            <option value="N" ${game.apostei === 'N' ? 'selected' : ''}>N</option>
                            <option value="S" ${game.apostei === 'S' ? 'selected' : ''}>S</option>
                        </select>
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">ACERTEI?</div>
                        <select class="sn-select" onchange="betManager.updateGame('${game.id}', 'acertei', this.value)">
                            <option value="N" ${game.acertei === 'N' ? 'selected' : ''}>N</option>
                            <option value="S" ${game.acertei === 'S' ? 'selected' : ''}>S</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
    }

    updateGame(gameId, field, value) {
        const game = this.games.get(gameId);
        if (game) {
            game[field] = value;
            this.saveToStorage();
            this.renderGames();
        }
    }

    saveToStorage() {
        const gamesArray = Array.from(this.games.entries());
        localStorage.setItem('betGames', JSON.stringify(gamesArray));
    }

    loadFromStorage() {
        const stored = localStorage.getItem('betGames');
        if (stored) {
            const gamesArray = JSON.parse(stored);
            this.games = new Map(gamesArray);
        }
    }
}

// Inicializar o gerenciador quando a página carregar
const betManager = new BetManager();
