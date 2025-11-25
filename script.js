
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
        this.setupEventListeners();
        this.loadChampionships();
        setInterval(() => this.updateLiveGames(), 30000);
        this.showWelcomeView();
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
            this.renderCurrentView();
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
                    leagueId: game.league.id,
                    date: this.formatDate(game.fixture.date),
                    time: this.formatTime(game.fixture.date),
                    odds: "___/___/___",
                    apostei: "N",
                    acertei: "N",
                    timestamp: new Date(game.fixture.date).getTime(),
                    originalDate: date,
                    status: game.fixture.status.short,
                    statusElapsed: game.fixture.status.elapsed,
                    fixtureDate: game.fixture.date
                };
                
                this.games.set(gameId, gameData);
            } else {
                // Atualizar status dos jogos existentes
                const existingGame = this.games.get(gameId);
                existingGame.status = game.fixture.status.short;
                existingGame.statusElapsed = game.fixture.status.elapsed;
            }
        });
        
        this.cleanOldGames();
        this.saveToStorage();
        this.updateLiveGames();
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
            const gameFinished = gameTime < (now - (3 * 60 * 60 * 1000));
            
            if (gameFinished && game.apostei === "N") {
                this.games.delete(gameId);
            }
        }
    }

    setupEventListeners() {
        // Event listeners para futuras implementações
    }

    // SISTEMA DE NAVEGAÇÃO
    showWelcomeView() {
        document.getElementById('welcomeSection').style.display = 'flex';
        document.getElementById('currentFolder').style.display = 'none';
        this.currentView = 'welcome';
    }

    showTodayGames() {
        this.currentView = 'today';
        this.currentPath = [];
        this.showFolderView();
        this.renderCurrentView();
    }

    showYearlyFolders() {
        this.currentView = 'yearly';
        this.showFolderView();
        this.renderPeriodFolders();
    }

    showMonthlyFolders() {
        this.currentView = 'monthly';
        this.showFolderView();
        this.renderPeriodFolders();
    }

    showDailyFolders() {
        this.currentView = 'daily';
        this.showFolderView();
        this.renderPeriodFolders();
    }

    showFolderView() {
        document.getElementById('welcomeSection').style.display = 'none';
        document.getElementById('currentFolder').style.display = 'block';
    }

    renderCurrentView() {
        const gamesArray = Array.from(this.games.values());
        
        if (gamesArray.length === 0) {
            this.renderFolderContent([], 'Nenhum jogo encontrado');
            return;
        }

        let filteredGames = [];
        let title = '';

        switch (this.currentView) {
            case 'today':
                const today = new Date().toISOString().split('T')[0];
                filteredGames = gamesArray.filter(game => game.originalDate === today);
                title = 'JOGOS DE HOJE';
                break;
            case 'year':
                filteredGames = gamesArray.filter(game => {
                    const year = new Date(game.timestamp).getFullYear();
                    return year === this.currentPath[0];
                });
                title = `ANO ${this.currentPath[0]}`;
                break;
            case 'month':
                filteredGames = gamesArray.filter(game => {
                    const date = new Date(game.timestamp);
                    return date.getFullYear() === this.currentPath[0] && 
                           date.getMonth() === this.currentPath[1];
                });
                title = `${this.getMonthName(this.currentPath[1])} ${this.currentPath[0]}`;
                break;
            case 'day':
                filteredGames = gamesArray.filter(game => {
                    const date = new Date(game.timestamp);
                    return date.getFullYear() === this.currentPath[0] && 
                           date.getMonth() === this.currentPath[1] &&
                           date.getDate() === this.currentPath[2];
                });
                title = this.getDayTitle(filteredGames[0]?.originalDate);
                break;
            case 'championship':
                filteredGames = gamesArray.filter(game => game.leagueId === this.currentPath[0]);
                title = this.currentPath[1] || 'CAMPEONATO';
                break;
        }

        document.getElementById('folderTitle').textContent = title;
        this.renderFolderContent(filteredGames);
    }

    renderFolderContent(games, emptyMessage = 'Nenhum jogo nesta pasta') {
        const container = document.getElementById('folderContent');
        
        if (games.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📁</div>
                    <h3>${emptyMessage}</h3>
                </div>
            `;
            return;
        }

        // Ordenar jogos por horário
        games.sort((a, b) => a.timestamp - b.timestamp);
        
        container.innerHTML = games.map(game => this.createGameCard(game)).join('');
    }

    renderPeriodFolders() {
        const container = document.getElementById('periodFolders');
        const gamesArray = Array.from(this.games.values());
        
        if (gamesArray.length === 0) {
            container.innerHTML = `
                <div class="empty-folders">
                    <div class="folder-icon">📁</div>
                    <p>Nenhum jogo salvo</p>
                </div>
            `;
            return;
        }

        let foldersHTML = '';

        switch (this.currentView) {
            case 'yearly':
                const years = this.getUniqueYears(gamesArray);
                foldersHTML = years.map(year => `
                    <div class="period-folder" onclick="betManager.openYear(${year})">
                        <div class="folder-name">${year}</div>
                        <div class="folder-count">${this.countGamesByYear(gamesArray, year)} jogos</div>
                    </div>
                `).join('');
                break;
            
            case 'monthly':
                const months = this.getUniqueMonths(gamesArray);
                foldersHTML = months.map(month => `
                    <div class="period-folder" onclick="betManager.openMonth(${month.year}, ${month.month})">
                        <div class="folder-name">${this.getMonthName(month.month)} ${month.year}</div>
                        <div class="folder-count">${month.count} jogos</div>
                    </div>
                `).join('');
                break;
            
            case 'daily':
                const days = this.getUniqueDays(gamesArray);
                foldersHTML = days.map(day => `
                    <div class="period-folder" onclick="betManager.openDay(${day.year}, ${day.month}, ${day.day})">
                        <div class="folder-name">${this.getDayTitle(day.dateString)}</div>
                        <div class="folder-count">${day.count} jogos</div>
                    </div>
                `).join('');
                break;
        }

        container.innerHTML = foldersHTML;
    }

    // Métodos de navegação
    openYear(year) {
        this.currentView = 'year';
        this.currentPath = [year];
        this.renderCurrentView();
    }

    openMonth(year, month) {
        this.currentView = 'month';
        this.currentPath = [year, month];
        this.renderCurrentView();
    }

    openDay(year, month, day) {
        this.currentView = 'day';
        this.currentPath = [year, month, day];
        this.renderCurrentView();
    }

    openChampionship(leagueId, leagueName) {
        this.currentView = 'championship';
        this.currentPath = [leagueId, leagueName];
        this.renderCurrentView();
    }

    // Métodos auxiliares
    getUniqueYears(games) {
        const years = new Set();
        games.forEach(game => {
            const year = new Date(game.timestamp).getFullYear();
            years.add(year);
        });
        return Array.from(years).sort((a, b) => b - a);
    }

    getUniqueMonths(games) {
        const months = new Map();
        games.forEach(game => {
            const date = new Date(game.timestamp);
            const year = date.getFullYear();
            const month = date.getMonth();
            const key = `${year}-${month}`;
            
            if (!months.has(key)) {
                months.set(key, { year, month, count: 0 });
            }
            months.get(key).count++;
        });
        return Array.from(months.values()).sort((a, b) => 
            b.year - a.year || b.month - a.month
        );
    }

    getUniqueDays(games) {
        const days = new Map();
        games.forEach(game => {
            const date = new Date(game.timestamp);
            const year = date.getFullYear();
            const month = date.getMonth();
            const day = date.getDate();
            const key = `${year}-${month}-${day}`;
            
            if (!days.has(key)) {
                days.set(key, { year, month, day, dateString: game.originalDate, count: 0 });
            }
            days.get(key).count++;
        });
        return Array.from(days.values()).sort((a, b) => 
            b.year - a.year || b.month - a.month || b.day - a.day
        );
    }

    countGamesByYear(games, year) {
        return games.filter(game => new Date(game.timestamp).getFullYear() === year).length;
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

    // CAMPEONATOS
    async loadChampionships() {
        try {
            const response = await fetch(
                'https://v3.football.api-sports.io/leagues?current=true',
                {
                    headers: {
                        'x-apisports-key': API_KEY,
                        'x-rapidapi-host': 'v3.football.api-sports.io'
                    }
                }
            );
            
            const data = await response.json();
            
            if (data.response) {
                this.renderChampionships(data.response.slice(0, 12));
            }
        } catch (error) {
            console.error('Erro ao carregar campeonatos:', error);
            this.renderChampionships([]);
        }
    }

    renderChampionships(leagues) {
        const container = document.getElementById('championshipsGrid');
        
        if (leagues.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🏆</div>
                    <h3>Nenhum campeonato encontrado</h3>
                </div>
            `;
            return;
        }

        const championshipsHTML = leagues.map(league => `
            <div class="championship-card" onclick="betManager.openChampionship(${league.league.id}, '${league.league.name.replace(/'/g, "\\'")}')">
                <div class="championship-name">${league.league.name}</div>
                <div class="championship-country">${league.country.name}</div>
            </div>
        `).join('');

        container.innerHTML = championshipsHTML;
    }

    // JOGOS EM ANDAMENTO - CORRIGIDO
    updateLiveGames() {
        const container = document.getElementById('liveGames');
        const gamesArray = Array.from(this.games.values());
        
        const liveGames = gamesArray.filter(game => {
            const now = new Date();
            const gameTime = new Date(game.fixtureDate);
            const timeDiff = (now - gameTime) / (1000 * 60);
            
            return game.status === '1H' || 
                   game.status === '2H' || 
                   game.status === 'HT' || 
                   game.status === 'ET' ||
                   game.status === 'P' ||
                   game.status === 'BT' ||
                   game.status === 'LIVE' ||
                   (timeDiff >= -15 && timeDiff <= 180);
        }).slice(0, 5);

        if (liveGames.length === 0) {
            container.innerHTML = `
                <div class="no-live-games">
                    <div class="empty-state">
                        <div class="empty-icon">⏰</div>
                        <h3>Nenhum jogo ao vivo</h3>
                        <p>Os jogos em andamento aparecerão aqui automaticamente</p>
                        <div class="live-pulse"></div>
                    </div>
                </div>
            `;
            return;
        }

        const liveHTML = liveGames.map(game => {
            let statusText = '🔜 PRÓXIMO';
            let statusClass = 'upcoming';
            
            if (game.status === '1H' || game.status === '2H' || game.status === 'LIVE') {
                statusText = `🔥 AO VIVO ${game.statusElapsed || '0'}'`;
                statusClass = 'live';
            } else if (game.status === 'HT') {
                statusText = '⏸️ INTERVALO';
                statusClass = 'halftime';
            } else if (game.status === 'ET') {
                statusText = '⚡ PRORROGAÇÃO';
                statusClass = 'extratime';
            } else if (game.status === 'P' || game.status === 'BT') {
                statusText = '⏳ PÊNALTIS';
                statusClass = 'penalties';
            }
            
            return `
                <div class="live-game-card ${statusClass}">
                    <div class="live-teams">${game.teams}</div>
                    <div class="live-score">${statusText}</div>
                    <div class="live-time">${game.time} - ${game.league}</div>
                </div>
            `;
        }).join('');

        container.innerHTML = liveHTML;
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
            if (this.currentView !== 'welcome') {
                this.renderCurrentView();
            }
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

// Inicializar o sistema
const betManager = new ProfessionalBetManager();
