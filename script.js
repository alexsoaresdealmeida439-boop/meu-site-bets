// script.js - versão cliente (frontend) que implementa as funcionalidades requisitadas.
// Armazenamento: localStorage com chave "games" em formato aninhado { yyyy: { mm: { dd: [gameObjects...] } } }
// Game object: { id, name, teams: "A x B", datetime: ISO, odds: [numbers], meta: { raw } }

(function(){
  // utilidades
  const $ = sel => document.querySelector(sel);
  const qs = sel => Array.from(document.querySelectorAll(sel));

  // Configurações do sistema
  const CONFIG = {
    MAX_HOME_GAMES: 20,
    MINUTES_BEFORE_START: 15,
    GAME_DURATION_MINUTES: 90,
    AI_MIN_CONFIDENCE: 0.6
  };

  // Banco de dados de times para IA
  const TEAMS_DATABASE = [
    'flamengo', 'palmeiras', 'santos', 'são paulo', 'corinthians', 'grêmio', 'internacional',
    'atlético mineiro', 'cruzeiro', 'botafogo', 'vasco', 'fluminense', 'bahia', 'fortaleza',
    'athletico paranaense', 'bragantino', 'cuiabá', 'goiás', 'coritiba', 'america mineiro',
    'real madrid', 'barcelona', 'manchester united', 'manchester city', 'liverpool', 'chelsea',
    'arsenal', 'tottenham', 'bayern munich', 'borussia dortmund', 'psg', 'juventus', 'milan',
    'inter', 'napoli', 'atletico madrid', 'benfica', 'porto'
  ];

  function saveGamesStore(obj){
    localStorage.setItem('games', JSON.stringify(obj));
  }
  
  function loadGamesStore(){
    try{
      const s = localStorage.getItem('games');
      return s ? JSON.parse(s) : {};
    }catch(e){ return {}; }
  }

  // normaliza texto pra comparação (remove acentos, lower)
  function normalizeName(s){
    return s.normalize('NFD').replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9\sxvs:-]/g,'').trim();
  }

  function isoDateParts(dt){
    const d = new Date(dt);
    const yyyy = String(d.getFullYear());
    const mm = String(d.getMonth()+1).padStart(2,'0');
    const dd = String(d.getDate()).padStart(2,'0');
    return { yyyy, mm, dd };
  }

  function addGameToStore(game){
    const store = loadGamesStore();
    const { yyyy, mm, dd } = isoDateParts(game.datetime);
    store[yyyy] = store[yyyy] || {};
    store[yyyy][mm] = store[yyyy][mm] || {};
    store[yyyy][mm][dd] = store[yyyy][mm][dd] || [];
    
    // evitar duplicatas por id
    const existingIndex = store[yyyy][mm][dd].findIndex(g => g.id === game.id);
    if(existingIndex === -1){
      store[yyyy][mm][dd].push(game);
    } else {
      store[yyyy][mm][dd][existingIndex] = game;
    }
    
    // ordenar por hora
    store[yyyy][mm][dd].sort((a,b)=> new Date(a.datetime) - new Date(b.datetime));
    saveGamesStore(store);
    return true;
  }

  function deleteGameFromStore(gameId){
    const store = loadGamesStore();
    let deleted = false;
    
    for(const yyyy in store){
      for(const mm in store[yyyy]){
        for(const dd in store[yyyy][mm]){
          const initialLength = store[yyyy][mm][dd].length;
          store[yyyy][mm][dd] = store[yyyy][mm][dd].filter(g => g.id !== gameId);
          if(store[yyyy][mm][dd].length !== initialLength){
            deleted = true;
          }
        }
      }
    }
    
    if(deleted){
      saveGamesStore(store);
    }
    return deleted;
  }

  function generateId(game){
    return btoa((game.teams+"|"+game.datetime).toLowerCase()).replace(/=/g,'').substring(0, 16);
  }

  // 🧠 SISTEMA DE IA PARA RECONHECIMENTO
  class GameRecognitionAI {
    constructor() {
      this.teamCache = new Map();
      this.initTeamDatabase();
    }

    initTeamDatabase() {
      TEAMS_DATABASE.forEach(team => {
        this.teamCache.set(this.normalizeText(team), team);
      });
    }

    normalizeText(text) {
      return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    }

    stringSimilarity(str1, str2) {
      const s1 = this.normalizeText(str1);
      const s2 = this.normalizeText(str2);
      
      if (s1 === s2) return 1.0;
      if (s1.includes(s2) || s2.includes(s1)) return 0.9;

      const longer = s1.length > s2.length ? s1 : s2;
      const shorter = s1.length > s2.length ? s2 : s1;
      
      if (longer.length === 0) return 1.0;
      
      return (longer.length - this.editDistance(longer, shorter)) / parseFloat(longer.length);
    }

    editDistance(s1, s2) {
      s1 = s1.toLowerCase();
      s2 = s2.toLowerCase();
      const costs = [];
      
      for (let i = 0; i <= s1.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= s2.length; j++) {
          if (i === 0) {
            costs[j] = j;
          } else if (j > 0) {
            let newValue = costs[j - 1];
            if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
              newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
            }
            costs[j - 1] = lastValue;
            lastValue = newValue;
          }
        }
        if (i > 0) costs[s2.length] = lastValue;
      }
      return costs[s2.length];
    }

    findBestTeamMatch(text) {
      let bestMatch = { name: '', confidence: 0, original: text };
      const normalizedText = this.normalizeText(text);

      for (const [normalizedTeam, originalTeam] of this.teamCache) {
        const similarity = this.stringSimilarity(normalizedText, normalizedTeam);
        
        if (similarity > bestMatch.confidence && similarity > CONFIG.AI_MIN_CONFIDENCE) {
          bestMatch = {
            name: originalTeam,
            confidence: similarity,
            original: text
          };
        }
      }

      return bestMatch;
    }

    identifyTeams(text) {
      const vsPatterns = [
        /(.+?)\s+(?:x|vs|versus|against|-)\s+(.+)/i,
        /(.+?)\s+v\s+(.+)/i
      ];

      for (const pattern of vsPatterns) {
        const match = text.match(pattern);
        if (match) {
          const team1 = this.findBestTeamMatch(match[1].trim());
          const team2 = this.findBestTeamMatch(match[2].trim());
          
          if (team1.confidence > CONFIG.AI_MIN_CONFIDENCE && 
              team2.confidence > CONFIG.AI_MIN_CONFIDENCE) {
            return {
              team1: team1.name,
              team2: team2.name,
              confidence: (team1.confidence + team2.confidence) / 2,
              original: `${team1.original} x ${team2.original}`
            };
          }
        }
      }

      // Fallback: procura dois times no texto
      const words = text.split(/\s+/);
      for (let i = 0; i < words.length - 1; i++) {
        for (let j = i + 1; j < words.length; j++) {
          const candidate1 = words.slice(i, j).join(' ');
          const candidate2 = words.slice(j, j + 2).join(' ');
          
          const team1 = this.findBestTeamMatch(candidate1);
          const team2 = this.findBestTeamMatch(candidate2);
          
          if (team1.confidence > CONFIG.AI_MIN_CONFIDENCE && 
              team2.confidence > CONFIG.AI_MIN_CONFIDENCE) {
            return {
              team1: team1.name,
              team2: team2.name,
              confidence: (team1.confidence + team2.confidence) / 2,
              original: `${team1.original} x ${team2.original}`
            };
          }
        }
      }

      return null;
    }

    extractOdds(text) {
      const odds = [];
      const patterns = [
        /(\d+[,.]\d{2})/g,
        /odd[s]?[:]?\s*([\d.,\s]+)/gi,
        /(\d+\.\d{2})/g,
        /(\d+,\d{2})/g
      ];

      for (const pattern of patterns) {
        const matches = text.match(pattern);
        if (matches) {
          odds.push(...matches.map(odd => {
            const num = parseFloat(odd.replace(',', '.'));
            return !isNaN(num) && num > 1.0 && num < 50.0 ? num : null;
          }).filter(odd => odd !== null));
        }
      }

      return [...new Set(odds)].sort((a, b) => a - b).slice(0, 3);
    }

    extractDateTime(text) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      const datePatterns = [
        /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
        /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,
        /(\d{1,2})[\/\-](\d{1,2})/,
      ];

      const timePatterns = [
        /(\d{1,2})[:h](\d{2})/i,
        /(\d{1,2})\s*(?:h|horas?)/i
      ];

      let date = today;
      let time = '00:00';

      for (const pattern of datePatterns) {
        const match = text.match(pattern);
        if (match) {
          if (match[3]) {
            date = new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
          } else if (match[1] && match[1].length === 4) {
            date = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
          } else {
            date = new Date(now.getFullYear(), parseInt(match[2]) - 1, parseInt(match[1]));
          }
          break;
        }
      }

      for (const pattern of timePatterns) {
        const match = text.match(pattern);
        if (match) {
          const hours = parseInt(match[1]).toString().padStart(2, '0');
          const minutes = match[2] ? match[2].padStart(2, '0') : '00';
          time = `${hours}:${minutes}`;
          break;
        }
      }

      const datetime = new Date(date);
      const [hours, minutes] = time.split(':');
      datetime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      return datetime.toISOString();
    }

    async processText(text) {
      const lines = text.split('\n').filter(line => line.trim().length > 10);
      const results = [];

      for (const line of lines) {
        try {
          const teams = this.identifyTeams(line);
          if (!teams || teams.confidence < CONFIG.AI_MIN_CONFIDENCE) {
            continue;
          }

          const odds = this.extractOdds(line);
          const datetime = this.extractDateTime(line);

          const game = {
            id: generateId({ teams: `${teams.team1} x ${teams.team2}`, datetime }),
            name: `${teams.team1} x ${teams.team2}`,
            teams: `${teams.team1} x ${teams.team2}`,
            datetime: datetime,
            odds: odds,
            confidence: teams.confidence,
            meta: {
              raw: line,
              teamsOriginal: teams.original,
              processedAt: new Date().toISOString()
            }
          };

          results.push(game);
        } catch (error) {
          console.warn('Erro ao processar linha:', line, error);
        }
      }

      return results.sort((a, b) => b.confidence - a.confidence);
    }
  }

  const gameAI = new GameRecognitionAI();

  // 🎯 SISTEMA DE TIMING PARA JOGOS
  function isGameActive(game) {
    const now = new Date();
    const gameTime = new Date(game.datetime);
    const endTime = new Date(gameTime.getTime() + (CONFIG.GAME_DURATION_MINUTES * 60 * 1000));
    
    const minutesUntilStart = (gameTime - now) / (60 * 1000);
    const minutesSinceStart = (now - gameTime) / (60 * 1000);
    
    return minutesUntilStart <= CONFIG.MINUTES_BEFORE_START && minutesSinceStart <= CONFIG.GAME_DURATION_MINUTES;
  }

  function getActiveGames() {
    const store = loadGamesStore();
    const allGames = [];
    
    for(const yyyy in store){
      for(const mm in store[yyyy]){
        for(const dd in store[yyyy][mm]){
          allGames.push(...store[yyyy][mm][dd]);
        }
      }
    }
    
    return allGames.filter(isGameActive).sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
  }

  // 📱 RENDERIZAÇÃO DA TELA INICIAL
  function renderHome(){
    const main = $('#home-list');
    const activeGames = getActiveGames();
    const gamesToShow = activeGames.slice(0, CONFIG.MAX_HOME_GAMES);

    if(gamesToShow.length === 0){
      main.innerHTML = `<p class="hint">Nenhum jogo ativo. Use "Inserir jogos" para adicionar.</p>`;
      $('#folders-section').classList.add('hidden');
      return;
    }

    main.innerHTML = gamesToShow.map(game => `
      <div class="card-game" data-game-id="${game.id}">
        <div>
          <div><strong>${escapeHtml(game.teams)}</strong></div>
          <div class="meta">${(new Date(game.datetime)).toLocaleString('pt-BR')}</div>
        </div>
        <div>
          <div class="meta">${game.odds && game.odds.length ? 'ODDs: '+game.odds.map(o => o.toFixed(2)).join(' | ') : 'Sem ODDs'}</div>
        </div>
      </div>
    `).join('') + (activeGames.length > CONFIG.MAX_HOME_GAMES ? `
      <div style="text-align:center; margin-top:15px;">
        <button id="btn-more-games" class="primary">Ver todos os jogos (${activeGames.length})</button>
      </div>
    ` : '');

    // Mostrar seção de pastas
    $('#folders-section').classList.remove('hidden');
    renderFolders();

    // Adicionar eventos de clique nos jogos
    qs('.card-game').forEach(card => {
      card.addEventListener('click', (e) => {
        if (!e.target.closest('.context-menu')) {
          showContextMenu(e, card.dataset.gameId);
        }
      });
    });

    // Evento para ver mais jogos
    const moreBtn = $('#btn-more-games');
    if(moreBtn) {
      moreBtn.addEventListener('click', () => {
        openMoreGamesModal(activeGames);
      });
    }
  }

  // 🗂️ SISTEMA DE PASTAS
  function renderFolders() {
    const store = loadGamesStore();
    const foldersContent = $('#folders-content');
    
    let html = '<div class="folders-grid">';
    
    // Pastas por ano
    html += '<div class="folder-category">';
    html += '<h4>📅 Por Ano</h4>';
    Object.keys(store).sort().reverse().forEach(year => {
      const yearGames = getGamesCountByYear(store, year);
      html += `<div class="folder-item" data-folder="year-${year}">
        <span>📁 ${year}</span>
        <small>${yearGames} jogo${yearGames !== 1 ? 's' : ''}</small>
      </div>`;
    });
    html += '</div>';

    // Pastas por mês (ano atual)
    const currentYear = new Date().getFullYear();
    if (store[currentYear]) {
      html += '<div class="folder-category">';
      html += '<h4>📅 Por Mês</h4>';
      Object.keys(store[currentYear]).sort().reverse().forEach(month => {
        const monthGames = store[currentYear][month] ? 
          Object.values(store[currentYear][month]).flat().length : 0;
        const monthName = new Date(currentYear, parseInt(month)-1, 1).toLocaleString('pt-BR', { month: 'long' });
        html += `<div class="folder-item" data-folder="month-${currentYear}-${month}">
          <span>📁 ${monthName}</span>
          <small>${monthGames} jogo${monthGames !== 1 ? 's' : ''}</small>
        </div>`;
      });
      html += '</div>';
    }

    // Pastas por dia (mês atual)
    const currentMonth = new Date().getMonth() + 1;
    const currentMonthStr = String(currentMonth).padStart(2, '0');
    if (store[currentYear] && store[currentYear][currentMonthStr]) {
      html += '<div class="folder-category">';
      html += '<h4>📅 Por Dia</h4>';
      Object.keys(store[currentYear][currentMonthStr]).sort().reverse().forEach(day => {
        const dayGames = store[currentYear][currentMonthStr][day].length;
        html += `<div class="folder-item" data-folder="day-${currentYear}-${currentMonthStr}-${day}">
          <span>📁 ${day}/${currentMonthStr}</span>
          <small>${dayGames} jogo${dayGames !== 1 ? 's' : ''}</small>
        </div>`;
      });
      html += '</div>';
    }

    html += '</div>';
    foldersContent.innerHTML = html;

    // Eventos das pastas
    qs('.folder-item').forEach(item => {
      item.addEventListener('click', () => {
        const folder = item.dataset.folder;
        openFolderModal(folder);
      });
    });
  }

  function getGamesCountByYear(store, year) {
    let count = 0;
    if (store[year]) {
      Object.values(store[year]).forEach(month => {
        Object.values(month).forEach(dayGames => {
          count += dayGames.length;
        });
      });
    }
    return count;
  }

  function openFolderModal(folderPath) {
    const [type, ...parts] = folderPath.split('-');
    const store = loadGamesStore();
    let games = [];

    if (type === 'year') {
      const year = parts[0];
      if (store[year]) {
        Object.values(store[year]).forEach(month => {
          Object.values(month).forEach(dayGames => {
            games.push(...dayGames);
          });
        });
      }
    } else if (type === 'month') {
      const [year, month] = parts;
      if (store[year] && store[year][month]) {
        Object.values(store[year][month]).forEach(dayGames => {
          games.push(...dayGames);
        });
      }
    } else if (type === 'day') {
      const [year, month, day] = parts;
      if (store[year] && store[year][month] && store[year][month][day]) {
        games = store[year][month][day];
      }
    }

    openMoreGamesModal(games);
  }

  // ✏️ SISTEMA DE EDIÇÃO
  let currentEditingGame = null;

  function showContextMenu(event, gameId) {
    const contextMenu = $('#context-menu');
    const rect = event.currentTarget.getBoundingClientRect();
    
    contextMenu.style.left = `${rect.left}px`;
    contextMenu.style.top = `${rect.bottom + 5}px`;
    contextMenu.classList.remove('hidden');
    contextMenu.dataset.gameId = gameId;

    // Fechar menu ao clicar fora
    setTimeout(() => {
      document.addEventListener('click', closeContextMenu);
    }, 100);
  }

  function closeContextMenu() {
    $('#context-menu').classList.add('hidden');
    document.removeEventListener('click', closeContextMenu);
  }

  function editGame(gameId) {
    const store = loadGamesStore();
    let gameToEdit = null;

    for(const yyyy in store){
      for(const mm in store[yyyy]){
        for(const dd in store[yyyy][mm]){
          const game = store[yyyy][mm][dd].find(g => g.id === gameId);
          if(game) {
            gameToEdit = game;
            break;
          }
        }
        if(gameToEdit) break;
      }
      if(gameToEdit) break;
    }

    if(gameToEdit) {
      currentEditingGame = gameToEdit;
      $('#paste-area').value = gameToEdit.meta.raw;
      showModal('#modal-insert');
      $('#process-status').textContent = 'Modo edição - altere os dados e clique em Processar';
    }
  }

  function deleteGame(gameId) {
    if(confirm('Tem certeza que deseja apagar este jogo?')) {
      if(deleteGameFromStore(gameId)) {
        alert('Jogo apagado com sucesso!');
        renderHome();
      }
    }
  }

  // 🔍 PREVIEW ANTES DE SALVAR
  function showPreviewModal(games) {
    const previewList = $('#preview-list');
    
    previewList.innerHTML = games.map(game => `
      <div class="card-game preview-item" data-game-id="${game.id}">
        <div class="preview-header">
          <strong>${escapeHtml(game.teams)}</strong>
          <span class="confidence-badge ${game.confidence > 0.8 ? 'high' : game.confidence > 0.6 ? 'medium' : 'low'}">
            ${Math.round(game.confidence * 100)}% confiança
          </span>
        </div>
        <div class="meta">
          📅 ${(new Date(game.datetime)).toLocaleString('pt-BR')}
        </div>
        <div class="meta">
          🎯 ${game.odds && game.odds.length ? 'ODDs: ' + game.odds.map(o => o.toFixed(2)).join(' | ') : 'Sem ODDs'}
        </div>
        <div class="preview-actions">
          <button class="btn-edit-preview" data-game-id="${game.id}">✏️ Editar</button>
          <button class="btn-delete-preview" data-game-id="${game.id}">🗑️ Remover</button>
        </div>
      </div>
    `).join('');

    // Eventos dos botões do preview
    qs('.btn-edit-preview').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const gameId = btn.dataset.gameId;
        const game = games.find(g => g.id === gameId);
        if(game) {
          $('#paste-area').value = game.meta.raw;
          hideModal('#modal-preview');
          showModal('#modal-insert');
        }
      });
    });

    qs('.btn-delete-preview').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const gameId = btn.dataset.gameId;
        const gameIndex = games.findIndex(g => g.id === gameId);
        if(gameIndex !== -1) {
          games.splice(gameIndex, 1);
          showPreviewModal(games);
        }
      });
    });

    window.currentPreviewGames = games;
    showModal('#modal-preview');
  }

  // 📊 MODAL VER MAIS JOGOS
  function openMoreGamesModal(games){
    const container = $('#more-list');
    if(!games) games = [];
    
    container.innerHTML = games.map(game => `
      <div class="card-game" data-game-id="${game.id}">
        <div>
          <div><strong>${escapeHtml(game.teams)}</strong></div>
          <div class="meta">${(new Date(game.datetime)).toLocaleString('pt-BR')}</div>
        </div>
        <div class="meta">${game.odds && game.odds.length ? 'ODDs: '+game.odds.map(o => o.toFixed(2)).join(' | ') : 'Sem ODDs'}</div>
      </div>
    `).join('');

    // Adicionar eventos de clique
    qs('#more-list .card-game').forEach(card => {
      card.addEventListener('click', (e) => {
        if (!e.target.closest('.context-menu')) {
          showContextMenu(e, card.dataset.gameId);
        }
      });
    });

    showModal('#modal-more');
  }

  // 🔍 BUSCA
  function doSearch(q){
    const normq = normalizeName(q);
    const store = loadGamesStore();
    const flat = [];
    
    for(const yyyy in store){
      for(const mm in store[yyyy]){
        for(const dd in store[yyyy][mm]){
          flat.push(...store[yyyy][mm][dd]);
        }
      }
    }
    
    const matches = flat.filter(g => normalizeName(g.teams).includes(normq));
    const res = $('#search-result');
    
    if(matches.length === 0){
      res.innerHTML = `<p style="color:#ffdddd"><strong>Jogo não encontrado</strong></p>`;
    } else {
      res.innerHTML = matches.map(g => `
        <div class="card-game" data-game-id="${g.id}">
          <div><strong>${escapeHtml(g.teams)}</strong></div>
          <div class="meta">${(new Date(g.datetime)).toLocaleString('pt-BR')}</div>
          <div class="meta">${g.odds && g.odds.length ? 'ODDs: '+g.odds.map(o => o.toFixed(2)).join(' | ') : 'Sem ODDs'}</div>
        </div>
      `).join('');

      // Adicionar eventos de clique
      qs('#search-result .card-game').forEach(card => {
        card.addEventListener('click', (e) => {
          if (!e.target.closest('.context-menu')) {
            showContextMenu(e, card.dataset.gameId);
          }
        });
      });
    }
  }

  // helper escape HTML
  function escapeHtml(s){ 
    return s.replace(/[&<>"']/g, (m)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); 
  }

  // eventos UI
  function init(){
    // Eventos principais
    $('#btn-insert').addEventListener('click', () => {
      currentEditingGame = null;
      $('#paste-area').value = '';
      showModal('#modal-insert');
      $('#process-status').textContent = '';
      $('#process-result').innerHTML = '';
    });

    $('#close-insert').addEventListener('click', () => {
      hideModal('#modal-insert');
      currentEditingGame = null;
    });

    $('#btn-process').addEventListener('click', async () => {
      const txt = $('#paste-area').value.trim();
      if(!txt){ 
        $('#process-status').textContent = 'Cole algum texto primeiro.'; 
        return; 
      }
      
      $('#process-status').textContent = '🧠 IA analisando texto...';
      
      try {
        const results = await gameAI.processText(txt);
        if(results.length === 0) {
          $('#process-status').textContent = 'Nenhum jogo identificado com confiança suficiente.';
          return;
        }
        
        if(currentEditingGame) {
          // Modo edição - atualizar jogo existente
          const updatedGame = results[0];
          updatedGame.id = currentEditingGame.id; // Manter o mesmo ID
          if(addGameToStore(updatedGame)) {
            $('#process-status').textContent = 'Jogo atualizado com sucesso!';
            currentEditingGame = null;
            renderHome();
          }
        } else {
          // Modo novo - mostrar preview
          showPreviewModal(results);
          $('#process-status').textContent = `${results.length} jogos identificados. Revise antes de salvar.`;
        }
      } catch (error) {
        $('#process-status').textContent = 'Erro na análise: ' + error.message;
      }
    });

    $('#btn-confirm-save').addEventListener('click', () => {
      if(window.currentPreviewGames && window.currentPreviewGames.length > 0) {
        window.currentPreviewGames.forEach(game => {
          addGameToStore(game);
        });
        $('#process-status').textContent = `${window.currentPreviewGames.length} jogos salvos com sucesso!`;
        hideModal('#modal-preview');
        renderHome();
        window.currentPreviewGames = null;
      }
    });

    $('#btn-cancel-preview').addEventListener('click', () => {
      hideModal('#modal-preview');
      window.currentPreviewGames = null;
    });

    $('#btn-save').addEventListener('click', () => {
      // Mantido para compatibilidade
      $('#btn-process').click();
    });

    $('#btn-today').addEventListener('click', () => {
      const today = new Date();
      const yyyy = String(today.getFullYear());
      const mm = String(today.getMonth()+1).padStart(2,'0');
      const dd = String(today.getDate()).padStart(2,'0');
      const store = loadGamesStore();
      const list = (((store[yyyy]||{})[mm]||{})[dd]) || [];
      
      if(list.length === 0){
        alert('Sem jogos para hoje.');
        return;
      }
      
      openMoreGamesModal(list);
    });

    $('#btn-export').addEventListener('click', () => {
      const data = loadGamesStore();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `games_backup_${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });

    // Search modal
    $('#btn-search').addEventListener('click', () => {
      showModal('#modal-search');
      $('#search-input').value = '';
      $('#search-result').innerHTML = '';
      $('#search-input').focus();
    });
    
    $('#close-search').addEventListener('click', () => hideModal('#modal-search'));
    $('#search-input').addEventListener('input', (e) => {
      const q = e.target.value.trim();
      if(q.length > 1) doSearch(q);
      else $('#search-result').innerHTML = '';
    });

    // Outros modals
    $('#close-more').addEventListener('click', () => hideModal('#modal-more'));
    $('#close-preview').addEventListener('click', () => hideModal('#modal-preview'));
    $('#close-notfound').addEventListener('click', () => hideModal('#modal-notfound'));

    // Context menu actions
    $('#btn-edit-game').addEventListener('click', (e) => {
      e.stopPropagation();
      const gameId = $('#context-menu').dataset.gameId;
      editGame(gameId);
      closeContextMenu();
    });

    $('#btn-delete-game').addEventListener('click', (e) => {
      e.stopPropagation();
      const gameId = $('#context-menu').dataset.gameId;
      deleteGame(gameId);
      closeContextMenu();
    });

    // Import file button
    $('#file-import').addEventListener('change', ev => {
      const f = ev.target.files[0];
      if(!f) return;
      const r = new FileReader();
      r.onload = e => {
        try{
          const obj = JSON.parse(e.target.result);
          saveGamesStore(obj);
          alert('Importado com sucesso!');
          renderHome();
        }catch(err){
          alert('Arquivo JSON inválido.');
        }
      };
      r.readAsText(f);
    });

    // Inicializar
    renderHome();
    
    // Atualizar a cada minuto para verificar jogos ativos
    setInterval(renderHome, 60000);
  }

  function showNotFoundList(list){
    $('#notfound-list').innerHTML = list.map(p => `
      <li>
        <strong>${escapeHtml(p.teams)}</strong> — ${ (new Date(p.datetime)).toLocaleString('pt-BR') } — 
        <small>${escapeHtml(p.meta.raw)}</small>
      </li>
    `).join('');
    showModal('#modal-notfound');
  }

  // iniciar
  document.addEventListener('DOMContentLoaded', init);
})();