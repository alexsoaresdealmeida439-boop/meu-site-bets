
// script.js — Cole este arquivo no GitHub substituindo o anterior

/* === CONFIG === */
// (a API_KEY não é necessária para seu fluxo; mantive variável caso queira usar depois)
const API_KEY = "23b89636f57128671e479701eaad2a37";

/* =========================
   CLASSE PRINCIPAL — ORIGINAL (melhorada)
   ========================= */
class ProfessionalBetManager {
    constructor() {
        this.games = new Map();
        this.currentView = 'welcome';
        this.currentPath = [];
        this.loadFromStorage();
        this.init();
    }

    init() {
        // Tenta carregar dados externos, mas não trava a UI se falhar
        this.loadTodayGames().catch(()=>{});
        this.setupEventListeners();
        this.loadChampionships().catch(()=>{});
        setInterval(() => this.updateLiveGames(), 30000);
        this.showWelcomeView();
    }

    async loadTodayGames() {
        // Tenta carregar via API, mas se falhar, prossegue sem travar
        try {
            const today = new Date().toISOString().split('T')[0];
            // Se não quiser requisição externa, comente o fetch abaixo
            const response = await fetch(
                `https://v3.football.api-sports.io/fixtures?date=${today}&timezone=America/Sao_Paulo`,
                {
                    headers: {
                        'x-apisports-key': API_KEY,
                        'x-rapidapi-host': 'v3.football.api-sports.io'
                    },
                    // evita travar indefinidamente
                    signal: (new AbortController()).signal
                }
            );

            // Se resposta inválida ou bloqueada, cai no catch
            const data = await response.json();
            if (data && data.response) {
                this.processGames(data.response, today);
            } else {
                // sem dados externos — continua com o que tem no storage
                this.renderCurrentView();
            }
        } catch (error) {
            // erro de fetch / CORS / chave inválida -> seguir com dados locais
            console.warn('loadTodayGames: não foi possível buscar da API (seguindo com local).', error);
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
        const now = Date.now();
        for (let [gameId, game] of this.games) {
            const gameTime = game.timestamp;
            const gameFinished = gameTime < (now - (3 * 60 * 60 * 1000));
            if (gameFinished && game.apostei === "N") {
                this.games.delete(gameId);
            }
        }
    }

    setupEventListeners() {
        // reservado para futuras integrações (ex: botões)
    }

    showWelcomeView() {
        const ws = document.getElementById('welcomeSection');
        const cf = document.getElementById('currentFolder');
        if (ws) ws.style.display = 'flex';
        if (cf) cf.style.display = 'none';
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
        const ws = document.getElementById('welcomeSection');
        const cf = document.getElementById('currentFolder');
        if (ws) ws.style.display = 'none';
        if (cf) cf.style.display = 'block';
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
            case 'today': {
                const today = new Date().toISOString().split('T')[0];
                filteredGames = gamesArray.filter(game => game.originalDate === today);
                title = 'JOGOS DE HOJE';
                break;
            }
            case 'year': {
                filteredGames = gamesArray.filter(game => {
                    const year = new Date(game.timestamp).getFullYear();
                    return year === this.currentPath[0];
                });
                title = `ANO ${this.currentPath[0]}`;
                break;
            }
            case 'month': {
                filteredGames = gamesArray.filter(game => {
                    const date = new Date(game.timestamp);
                    return date.getFullYear() === this.currentPath[0] &&
                        date.getMonth() === this.currentPath[1];
                });
                title = `${this.getMonthName(this.currentPath[1])} ${this.currentPath[0]}`;
                break;
            }
            case 'day': {
                filteredGames = gamesArray.filter(game => {
                    const date = new Date(game.timestamp);
                    return date.getFullYear() === this.currentPath[0] &&
                        date.getMonth() === this.currentPath[1] &&
                        date.getDate() === this.currentPath[2];
                });
                title = this.getDayTitle(filteredGames[0]?.originalDate);
                break;
            }
            case 'championship': {
                filteredGames = gamesArray.filter(game => game.leagueId === this.currentPath[0]);
                title = this.currentPath[1] || 'CAMPEONATO';
                break;
            }
            default:
                filteredGames = gamesArray;
        }

        const folderTitle = document.getElementById('folderTitle');
        if (folderTitle) folderTitle.textContent = title;
        this.renderFolderContent(filteredGames);
    }

    renderFolderContent(games, emptyMessage = 'Nenhum jogo nesta pasta') {
        const container = document.getElementById('folderContent');
        if (!container) return;

        if (games.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📁</div>
                    <h3>${emptyMessage}</h3>
                </div>
            `;
            return;
        }

        games.sort((a, b) => a.timestamp - b.timestamp);
        container.innerHTML = games.map(game => this.createGameCard(game)).join('');
    }

    renderPeriodFolders() {
        const container = document.getElementById('periodFolders');
        if (!container) return;
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
            case 'yearly': {
                const years = this.getUniqueYears(gamesArray);
                foldersHTML = years.map(year => `
                    <div class="period-folder" onclick="betManager.openYear(${year})">
                        <div class="folder-name">${year}</div>
                        <div class="folder-count">${this.countGamesByYear(gamesArray, year)} jogos</div>
                    </div>
                `).join('');
                break;
            }
            case 'monthly': {
                const months = this.getUniqueMonths(gamesArray);
                foldersHTML = months.map(month => `
                    <div class="period-folder" onclick="betManager.openMonth(${month.year}, ${month.month})">
                        <div class="folder-name">${this.getMonthName(month.month)} ${month.year}</div>
                        <div class="folder-count">${month.count} jogos</div>
                    </div>
                `).join('');
                break;
            }
            case 'daily': {
                const days = this.getUniqueDays(gamesArray);
                foldersHTML = days.map(day => `
                    <div class="period-folder" onclick="betManager.openDay(${day.year}, ${day.month}, ${day.day})">
                        <div class="folder-name">${this.getDayTitle(day.dateString)}</div>
                        <div class="folder-count">${day.count} jogos</div>
                    </div>
                `).join('');
                break;
            }
        }

        container.innerHTML = foldersHTML;
    }

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

    async loadChampionships() {
        // tenta buscar campeonatos, mas não trava a interface caso falhe
        try {
            const response = await fetch(
                'https://v3.football.api-sports.io/leagues?current=true',
                {
                    headers: {
                        'x-apisports-key': API_KEY,
                        'x-rapidapi-host': 'v3.football.api-sports.io'
                    },
                    signal: (new AbortController()).signal
                }
            );
            const data = await response.json();
            if (data && data.response) {
                this.renderChampionships(data.response.slice(0, 12));
            } else {
                this.renderChampionships([]);
            }
        } catch (error) {
            console.warn('loadChampionships: falha ao buscar (seguindo com vazio).', error);
            this.renderChampionships([]);
        }
    }

    renderChampionships(leagues) {
        const container = document.getElementById('championshipsGrid');
        if (!container) return;

        if (!leagues || leagues.length === 0) {
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

    updateLiveGames() {
        const container = document.getElementById('liveGames');
        if (!container) return;
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
        try {
            const gamesArray = Array.from(this.games.entries());
            localStorage.setItem('betGames', JSON.stringify(gamesArray));
        } catch (err) {
            console.error('Erro ao salvar localStorage:', err);
        }
    }

    loadFromStorage() {
        try {
            const stored = localStorage.getItem('betGames');
            if (stored) {
                const gamesArray = JSON.parse(stored);
                this.games = new Map(gamesArray);
            }
        } catch (err) {
            console.warn('loadFromStorage: dados inválidos ou inexistentes.', err);
            this.games = new Map();
        }
    }
}

/* =========================
   HELPERS E RECEPTOR PARA O APP (OCR -> SITE)
   ========================= */

/**
 * Normaliza texto de times para comparação
 */
function normalizeMatchText(text) {
    if (!text || typeof text !== 'string') return '';
    return text
        .replace(/\s*[xX]\s*/g, ' vs ')
        .replace(/\s*[Vv][Ss]\s*/g, ' vs ')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

/**
 * Parseia uma linha ou objeto recebido do app/ocr
 * Aceita formatos:
 *  - "Time A x Time B | 1.70 / 2.40 / 5.30"
 *  - objeto { teams: "...", odds: "1.70/2.40/5.30", time: "HH:MM" }
 */
function parseInputItem(item) {
    if (!item) return null;

    if (typeof item === 'string') {
        const parts = item.split('|');
        const teamsPart = parts[0] ? parts[0].trim() : '';
        const oddsPart = parts[1] ? parts[1].trim().replace(/\s+/g, ' ') : '';
        let time = null;
        const timeMatch = oddsPart.match(/(\d{1,2}:\d{2})/);
        if (timeMatch) time = timeMatch[1];
        return {
            teams: teamsPart,
            odds: oddsPart.replace(/\s/g, ''),
            time: time || '--:--',
            date: new Date().toISOString().split('T')[0]
        };
    }

    if (typeof item === 'object') {
        return {
            teams: item.teams || (item.home && item.away ? `${item.home} vs ${item.away}` : ''),
            odds: item.odds ? String(item.odds) : (item.odds_home && item.odds_draw && item.odds_away ? `${item.odds_home}/${item.odds_draw}/${item.odds_away}` : '___/___/___'),
            time: item.time || item.hour || '--:--',
            date: item.date || new Date().toISOString().split('T')[0]
        };
    }

    return null;
}

/**
 * Recebe dados escaneados (string com quebras de linha, array de strings ou array de objetos)
 * Atualiza jogos existentes de HOJE ou cria novos.
 * Retorna objeto { updated, created }.
 */
function receiveScannedData(input) {
    if (!input) return { updated: 0, created: 0 };

    let items = [];

    if (typeof input === 'string') {
        const lines = input.split('\n').map(l => l.trim()).filter(l => l);
        items = lines.map(parseInputItem).filter(Boolean);
    } else if (Array.isArray(input)) {
        items = input.map(parseInputItem).filter(Boolean);
    } else if (typeof input === 'object') {
        const parsed = parseInputItem(input);
        if (parsed) items = [parsed];
    }

    if (items.length === 0) return { updated: 0, created: 0 };

    const today = new Date().toISOString().split('T')[0];
    let updated = 0;
    let created = 0;

    items.forEach(it => {
        const normalizedReceived = normalizeMatchText(it.teams);
        const jogosHoje = Array.from(betManager.games.values()).filter(g => g.originalDate === today);

        // Busca exata normalizada
        let found = jogosHoje.find(g => normalizeMatchText(g.teams) === normalizedReceived);

        // Busca parcial tolerante
        if (!found) {
            found = jogosHoje.find(g => normalizeMatchText(g.teams).includes(normalizedReceived) || normalizedReceived.includes(normalizeMatchText(g.teams)));
        }

        if (found) {
            // atualiza odds e horário
            found.odds = it.odds || found.odds;
            if (it.time && it.time !== '--:--') found.time = it.time;
            betManager.saveToStorage();
            updated++;
        } else {
            // cria novo jogo preservando estrutura
            const newId = Date.now().toString() + Math.floor(Math.random() * 1000);
            const novoJogo = {
                id: newId,
                teams: it.teams,
                league: "CAMPEONATO NÃO IDENTIFICADO",
                leagueId: 0,
                date: it.date,
                time: it.time || '--:--',
                odds: it.odds || "___/___/___",
                apostei: "N",
                acertei: "N",
                timestamp: Date.now(),
                originalDate: it.date,
                status: "NS",
                statusElapsed: 0,
                fixtureDate: new Date().toISOString()
            };
            betManager.games.set(newId, novoJogo);
            betManager.saveToStorage();
            created++;
        }
    });

    if (betManager.currentView === 'today' || betManager.currentView === 'welcome' || betManager.currentView === '') {
        betManager.renderCurrentView();
    }

    console.log(`receiveScannedData: updated=${updated} created=${created}`);
    return { updated, created };
}

// expõe função global para chamadas diretas do app/webview
window.receiveScannedData = receiveScannedData;

// canal postMessage para WebView ou app
window.addEventListener("message", (e) => {
    try {
        const data = e.data;
        if (!data) return;
        if (data.type === "SCANNED_GAMES" && data.payload) {
            receiveScannedData(data.payload);
        } else if (data.type === "SCANNED_TEXT" && data.payload) {
            receiveScannedData(data.payload);
        } else {
            if (Array.isArray(data) || typeof data === 'string' || typeof data === 'object') {
                receiveScannedData(data);
            }
        }
    } catch (err) {
        console.error('Erro no listener message:', err);
    }
}, false);

/* =========================
   INICIALIZAÇÃO FINAL
   ========================= */
// cria a instância — importante: apenas uma vez
const betManager = new ProfessionalBetManager();

// DEBUG: instruções rápidas para testar no console
// receiveScannedData("Time 1 x Time 2 | 1.70 / 2.40 / 5.30\nTime 3 x Time 4 | 1.55 / 3.20 / 6.10")
// OR
// window.postMessage({ type: "SCANNED_TEXT", payload: "Time 1 x Time 2 | 1.70 / 2.40 / 5.30" }, "*");
