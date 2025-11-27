
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gerenciador de Apostas</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        body {
            background: linear-gradient(135deg, #1a2a3a, #0d1b2a);
            color: #e0e0e0;
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
        }

        header {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 15px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }

        h1 {
            font-size: 2.5rem;
            color: #4fc3f7;
            margin-bottom: 10px;
            text-shadow: 0 0 10px rgba(79, 195, 247, 0.5);
        }

        .subtitle {
            font-size: 1.2rem;
            color: #b0bec5;
        }

        .card {
            background: rgba(255, 255, 255, 0.08);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
            transition: transform 0.3s, box-shadow 0.3s;
        }

        .card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.25);
        }

        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .card-title {
            font-size: 1.4rem;
            color: #4fc3f7;
        }

        button {
            background: linear-gradient(135deg, #2196f3, #1976d2);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s;
            box-shadow: 0 2px 10px rgba(33, 150, 243, 0.3);
        }

        button:hover {
            background: linear-gradient(135deg, #1976d2, #1565c0);
            box-shadow: 0 4px 15px rgba(33, 150, 243, 0.5);
            transform: translateY(-2px);
        }

        .welcome-section {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 40px 20px;
        }

        .welcome-title {
            font-size: 2.8rem;
            margin-bottom: 20px;
            color: #4fc3f7;
            text-shadow: 0 0 15px rgba(79, 195, 247, 0.7);
        }

        .welcome-subtitle {
            font-size: 1.3rem;
            margin-bottom: 30px;
            color: #b0bec5;
            max-width: 600px;
        }

        .welcome-buttons {
            display: flex;
            gap: 20px;
            margin-top: 20px;
        }

        .welcome-btn {
            padding: 15px 30px;
            font-size: 1.1rem;
        }

        .folder-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }

        .folder-title {
            font-size: 1.8rem;
            color: #4fc3f7;
        }

        .folder-actions {
            display: flex;
            gap: 10px;
        }

        .game-card {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: all 0.3s;
        }

        .game-card:hover {
            background: rgba(255, 255, 255, 0.08);
            transform: translateX(5px);
        }

        .game-info {
            flex: 1;
        }

        .game-teams {
            font-weight: bold;
            font-size: 1.1rem;
            margin-bottom: 5px;
        }

        .game-details {
            display: flex;
            gap: 15px;
            color: #b0bec5;
            font-size: 0.9rem;
        }

        .game-odds {
            display: flex;
            gap: 10px;
            align-items: center;
        }

        .odds-input {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 6px;
            padding: 8px 12px;
            color: white;
            width: 120px;
            text-align: center;
        }

        .scanner-box {
            margin-top: 20px;
            padding: 20px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
        }

        .scanner-input {
            width: 100%;
            height: 120px;
            padding: 15px;
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            color: white;
            font-family: monospace;
            resize: vertical;
        }

        .scanner-input::placeholder {
            color: #b0bec5;
        }

        .form-group {
            margin-bottom: 15px;
        }

        .form-label {
            display: block;
            margin-bottom: 5px;
            color: #b0bec5;
        }

        .form-input {
            width: 100%;
            padding: 10px 15px;
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            color: white;
        }

        .form-row {
            display: flex;
            gap: 15px;
        }

        .form-row .form-group {
            flex: 1;
        }

        .hidden {
            display: none;
        }

        .tabs {
            display: flex;
            margin-bottom: 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .tab {
            padding: 12px 25px;
            cursor: pointer;
            border-bottom: 3px solid transparent;
            transition: all 0.3s;
        }

        .tab.active {
            border-bottom: 3px solid #4fc3f7;
            color: #4fc3f7;
        }

        .empty-state {
            text-align: center;
            padding: 40px 20px;
            color: #b0bec5;
        }

        .empty-state-icon {
            font-size: 3rem;
            margin-bottom: 15px;
            color: #546e7a;
        }

        @media (max-width: 768px) {
            .form-row {
                flex-direction: column;
            }
            
            .game-card {
                flex-direction: column;
                align-items: flex-start;
            }
            
            .game-odds {
                margin-top: 10px;
                width: 100%;
                justify-content: space-between;
            }
            
            .welcome-buttons {
                flex-direction: column;
                width: 100%;
            }
            
            .welcome-btn {
                width: 100%;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>Gerenciador de Apostas</h1>
            <p class="subtitle">Controle completo dos seus jogos e odds</p>
        </header>

        <div id="welcomeSection" class="welcome-section">
            <h2 class="welcome-title">Bem-vindo ao Gerenciador</h2>
            <p class="welcome-subtitle">Adicione seus jogos manualmente, organize por data e hora, e acompanhe todas as suas apostas em um só lugar.</p>
            <div class="welcome-buttons">
                <button class="welcome-btn" onclick="betManager.showTodayGames()">Ver Meus Jogos</button>
                <button class="welcome-btn" onclick="betManager.showAddGameForm()">Adicionar Jogo</button>
            </div>
        </div>

        <div id="currentFolder" class="hidden">
            <div class="folder-header">
                <h2 class="folder-title" id="folderTitle">Meus Jogos</h2>
                <div class="folder-actions">
                    <button onclick="betManager.showAddGameForm()">Adicionar Jogo</button>
                    <button onclick="betManager.showWelcomeView()">Voltar</button>
                </div>
            </div>

            <div class="tabs">
                <div class="tab active" onclick="betManager.switchTab('all')">Todos os Jogos</div>
                <div class="tab" onclick="betManager.switchTab('today')">Jogos de Hoje</div>
                <div class="tab" onclick="betManager.switchTab('upcoming')">Próximos Jogos</div>
            </div>

            <div id="folderContent" class="folder-content">
                <!-- Jogos serão renderizados aqui -->
            </div>

            <div class="scanner-box">
                <h3>Scanner de Odds</h3>
                <textarea id="scannerInput" class="scanner-input" placeholder="Cole o texto com os jogos e odds aqui..."></textarea>
                <button onclick="betManager.processScannerText()" style="margin-top: 10px;">Processar Scanner</button>
            </div>
        </div>

        <div id="addGameForm" class="card hidden">
            <div class="card-header">
                <h3 class="card-title">Adicionar Novo Jogo</h3>
                <button onclick="betManager.hideAddGameForm()">Fechar</button>
            </div>
            
            <div class="form-group">
                <label class="form-label">Times (Ex: Flamengo vs Vasco)</label>
                <input type="text" id="gameTeams" class="form-input" placeholder="Time Casa vs Time Visitante">
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Data do Jogo</label>
                    <input type="date" id="gameDate" class="form-input">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Hora do Jogo</label>
                    <input type="time" id="gameTime" class="form-input">
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Campeonato</label>
                <input type="text" id="gameLeague" class="form-input" placeholder="Ex: Brasileirão Série A">
            </div>
            
            <div class="form-group">
                <label class="form-label">Odds (Ex: 1.80/3.40/4.20)</label>
                <input type="text" id="gameOdds" class="form-input" placeholder="1.80/3.40/4.20">
            </div>
            
            <button onclick="betManager.addManualGame()">Adicionar Jogo</button>
        </div>
    </div>

    <script>
        class ProfessionalBetManager {
            constructor() {
                this.games = new Map();
                this.currentView = 'welcome';
                this.currentTab = 'all';
                this.loadFromStorage();
                this.init();
            }

            init() {
                this.showWelcomeView();
                setTimeout(() => this.injectScannerBox(), 500);
            }

            /* ================================
               🔥 CAIXA COLAR + PROCESSAR
            =================================*/
            injectScannerBox() {
                // Já está no HTML, não precisa injetar dinamicamente
            }

            processScannerText() {
                const texto = document.getElementById('scannerInput').value;
                if (!texto) {
                    alert('Por favor, cole algum texto no scanner.');
                    return;
                }

                const blocos = texto.split(/\n\s*\n/);
                let processedCount = 0;

                blocos.forEach(bloco => {
                    const linhas = bloco.split('\n').map(l => l.trim());

                    const jogoLinha = linhas.find(l => l.toLowerCase().includes(' x '));
                    const oddsLinha = linhas.find(l => l.match(/\d+\.\d+\/\d+\.\d+\/\d+\.\d+/));

                    if (!jogoLinha || !oddsLinha) return;

                    const odds = oddsLinha.match(/\d+\.\d+\/\d+\.\d+\/\d+\.\d+/)[0];
                    const jogoNome = jogoLinha.toLowerCase();

                    for (let game of this.games.values()) {
                        const gameName = game.teams.toLowerCase().replace('vs', 'x');

                        if (gameName.includes(jogoNome.split(' x ')[0]) &&
                            gameName.includes(jogoNome.split(' x ')[1])) {

                            game.odds = odds;
                            processedCount++;
                        }
                    }
                });

                this.saveToStorage();
                this.renderCurrentView();
                
                if (processedCount > 0) {
                    alert(`Odds atualizadas para ${processedCount} jogo(s)!`);
                } else {
                    alert('Nenhum jogo correspondente encontrado para atualizar as odds.');
                }
            }

            /* ================================
               ADICIONAR JOGOS MANUALMENTE
            =================================*/
            showAddGameForm() {
                document.getElementById('addGameForm').classList.remove('hidden');
                document.getElementById('currentFolder').classList.add('hidden');
                document.getElementById('welcomeSection').classList.add('hidden');
                
                // Definir data padrão como hoje
                const today = new Date().toISOString().split('T')[0];
                document.getElementById('gameDate').value = today;
            }

            hideAddGameForm() {
                document.getElementById('addGameForm').classList.add('hidden');
                this.showTodayGames();
            }

            addManualGame() {
                const teams = document.getElementById('gameTeams').value.trim();
                const date = document.getElementById('gameDate').value;
                const time = document.getElementById('gameTime').value;
                const league = document.getElementById('gameLeague').value.trim();
                const odds = document.getElementById('gameOdds').value.trim() || "___/___/___";

                if (!teams || !date || !time) {
                    alert('Por favor, preencha pelo menos os times, data e hora do jogo.');
                    return;
                }

                if (!teams.toLowerCase().includes('vs')) {
                    alert('Por favor, use o formato "Time Casa vs Time Visitante" para os times.');
                    return;
                }

                const gameDate = new Date(`${date}T${time}`);
                const id = `manual_${Date.now()}`;

                this.games.set(id, {
                    id,
                    teams,
                    league: league || "Campeonato não especificado",
                    time: this.formatTime(gameDate),
                    date: date,
                    fullDate: gameDate,
                    odds,
                    apostei: "N",
                    acertei: "N",
                    timestamp: gameDate.getTime(),
                    status: "NS" // Not Started
                });

                this.saveToStorage();
                this.hideAddGameForm();
                this.showTodayGames();
                
                // Limpar o formulário
                document.getElementById('gameTeams').value = '';
                document.getElementById('gameTime').value = '';
                document.getElementById('gameLeague').value = '';
                document.getElementById('gameOdds').value = '';
            }

            /* ================================
               ABAS E FILTROS
            =================================*/
            switchTab(tab) {
                this.currentTab = tab;
                
                // Atualizar visual das abas
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                event.target.classList.add('active');
                
                this.renderCurrentView();
            }

            /* ================================
               VIEW
            =================================*/
            showWelcomeView() {
                document.getElementById('welcomeSection').classList.remove('hidden');
                document.getElementById('currentFolder').classList.add('hidden');
                document.getElementById('addGameForm').classList.add('hidden');
                this.currentView = 'welcome';
            }

            showTodayGames() {
                this.currentView = 'today';
                document.getElementById('welcomeSection').classList.add('hidden');
                document.getElementById('currentFolder').classList.remove('hidden');
                document.getElementById('addGameForm').classList.add('hidden');
                this.renderCurrentView();
            }

            renderCurrentView() {
                let jogos = Array.from(this.games.values());
                
                // Aplicar filtro da aba selecionada
                const today = new Date().toISOString().split('T')[0];
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const tomorrowStr = tomorrow.toISOString().split('T')[0];
                
                if (this.currentTab === 'today') {
                    jogos = jogos.filter(jogo => jogo.date === today);
                } else if (this.currentTab === 'upcoming') {
                    jogos = jogos.filter(jogo => jogo.date > today);
                }
                
                // Ordenar por data/hora
                jogos.sort((a, b) => a.timestamp - b.timestamp);

                const container = document.getElementById('folderContent');
                
                if (jogos.length === 0) {
                    container.innerHTML = `
                        <div class="empty-state">
                            <div class="empty-state-icon">⚽</div>
                            <h3>Nenhum jogo encontrado</h3>
                            <p>Adicione jogos manualmente ou use o scanner de odds.</p>
                        </div>
                    `;
                    return;
                }
                
                container.innerHTML = jogos.map(j => this.createGameCard(j)).join('');
            }

            createGameCard(game) {
                return `
                    <div class="game-card">
                        <div class="game-info">
                            <div class="game-teams">${game.teams}</div>
                            <div class="game-details">
                                <span>${game.league}</span>
                                <span>${game.date} • ${game.time}</span>
                            </div>
                        </div>
                        <div class="game-odds">
                            <input class="odds-input" value="${game.odds}" readonly />
                            <button onclick="betManager.editGame('${game.id}')">Editar</button>
                            <button onclick="betManager.deleteGame('${game.id}')">Excluir</button>
                        </div>
                    </div>
                `;
            }

            editGame(id) {
                const game = this.games.get(id);
                if (!game) return;
                
                const newOdds = prompt("Editar odds (formato: 1.80/3.40/4.20):", game.odds);
                if (newOdds !== null) {
                    game.odds = newOdds;
                    this.saveToStorage();
                    this.renderCurrentView();
                }
            }

            deleteGame(id) {
                if (confirm("Tem certeza que deseja excluir este jogo?")) {
                    this.games.delete(id);
                    this.saveToStorage();
                    this.renderCurrentView();
                }
            }

            formatTime(date) {
                return date.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }

            saveToStorage() {
                localStorage.setItem('betGames', JSON.stringify([...this.games]));
            }

            loadFromStorage() {
                const stored = localStorage.getItem('betGames');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    this.games = new Map(parsed);
                    
                    // Converter strings de data de volta para objetos Date
                    for (let [id, game] of this.games) {
                        if (game.fullDate && typeof game.fullDate === 'string') {
                            game.fullDate = new Date(game.fullDate);
                            game.timestamp = game.fullDate.getTime();
                        }
                    }
                }
            }
        }

        const betManager = new ProfessionalBetManager();
    </script>
</body>
</html>
