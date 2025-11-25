
const API_KEY = "23b89636f57128671e479701eaad2a37";

class ProfessionalBetManager {
    constructor() {
        this.games = new Map();
        this.loadFromStorage();
        this.init();
    }

    init() {
        this.displayCurrentDate();
        this.loadTodayGames();
        this.setupEventListeners();
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
        document.getElementById('currentDate').textContent = now.toLocaleDateString('pt-BR', options);
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
            this.renderFolderStructure();
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
        this.renderFolderStructure();
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
        
        for (let [gameId, game] of this.games) {
            const gameTime = game.timestamp;
            const gameFinished = gameTime < (now - (2 * 60 * 60 * 1000));
            
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
        this.renderFolderStructure(filtered);
    }

    renderFolderStructure(gamesArray = null) {
        const games = gamesArray || Array.from(this.games.values());
        const container = document.getElementById('folderStructure');
        
        if (games.length === 0) {
            container.innerHTML = '<div class="loading">Nenhum jogo encontrado</div>';
            return;
        }

        const structure = this.organizeByYearMonthDay(games);
        container.innerHTML = this.generateFolderHTML(structure);
    }

    organizeByYearMonthDay(games) {
        const structure = {};
        
        games.forEach(game => {
            const date = new Date(game.timestamp);
            const year = date.getFullYear();
            const month = date.getMonth();
            const day = date.getDate();
            
            if (!structure[year]) structure[year] = {};
            if (!structure[year][month]) structure[year][month] = {};
            if (!structure[year][month][day]) structure[year][month][day] = [];
            
            structure[year][month][day].push(game);
        });
        
        return structure;
    }

    generateFolderHTML(structure) {
        let html = '';
        
        for (const [year, months] of Object.entries(structure).sort((a,b) => b[0] - a[0])) {
            let yearGamesCount = 0;
            let monthsHTML = '';
            
            for (const [month, days] of Object.entries(months).sort((a,b) => b[0] - a[0])) {
                let monthGamesCount = 0;
                let daysHTML = '';
                
                for (const [day, dayGames] of Object.entries(days).sort((a,b) => b[0] - a[0])) {
                    monthGamesCount += dayGames.length;
                    
                    daysHTML += `
                        <div class="day-folder">
                            <div class="day-header">
                                <div class="day-title">${this.getDayTitle(dayGames[0].originalDate)}</div>
                                <div class="day-count">${dayGames.length} jogo${dayGames.length > 1 ? 's' : ''}</div>
                            </div>
                            <div class="games-grid">
                                ${dayGames.map(game => this.createGameCard(game)).join('')}
                            </div>
                        </div>
                    `;
                }
                
                yearGamesCount += monthGamesCount;
                
                monthsHTML += `
                    <div class="month-folder">
                        <div class="month-header">
                            <div class="month-title">${this.getMonthName(month)}</div>
                            <div class="month-count">${monthGamesCount} jogo${monthGamesCount > 1 ? 's' : ''}</div>
                        </div>
                        <div class="days-grid">
                            ${daysHTML}
                        </div>
                    </div>
                `;
            }
            
            html += `
                <div class="year-folder">
                    <div class="year-header">
                        <div class="year-title">${year}</div>
                        <div class="year-count">${yearGamesCount} jogo${yearGamesCount > 1 ? 's' : ''}</div>
                    </div>
                    <div class="months-grid">
                        ${monthsHTML}
                    </div>
                </div>
            `;
        }
        
        return html;
    }

    getMonthName(month) {
        const months = [
            'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
            'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
        ];
        return months[parseInt(month)];
    }

    getDayTitle(dateString) {
        const date = new Date(dateString);
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        
        if (dateString === today) return 'HOJE';
        if (dateString === yesterday) return 'ONTEM';
        
        return date.toLocaleDateString('pt-BR', { 
            weekday: 'short',
            day: '2-digit',
            month: '2-digit'
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
            this.renderFolderStructure();
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

const betManager = new ProfessionalBetManager();
