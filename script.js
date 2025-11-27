// script.js - VERSÃO CORRIGIDA - SEM TRAVAMENTOS
(function(){
  // utilidades
  const $ = sel => document.querySelector(sel);
  const qs = sel => Array.from(document.querySelectorAll(sel));

  // Configurações do sistema
  const CONFIG = {
    MAX_HOME_GAMES: 20,
    MINUTES_BEFORE_START: 15,
    GAME_DURATION_MINUTES: 90
  };

  function saveGamesStore(obj){
    localStorage.setItem('games', JSON.stringify(obj));
  }
  
  function loadGamesStore(){
    try{
      const s = localStorage.getItem('games');
      return s ? JSON.parse(s) : {};
    }catch(e){ 
      console.log('Erro ao carregar store:', e);
      return {}; 
    }
  }

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
    try {
      const store = loadGamesStore();
      const { yyyy, mm, dd } = isoDateParts(game.datetime);
      
      if(!store[yyyy]) store[yyyy] = {};
      if(!store[yyyy][mm]) store[yyyy][mm] = {};
      if(!store[yyyy][mm][dd]) store[yyyy][mm][dd] = [];
      
      const existingIndex = store[yyyy][mm][dd].findIndex(g => g.id === game.id);
      if(existingIndex === -1){
        store[yyyy][mm][dd].push(game);
      } else {
        store[yyyy][mm][dd][existingIndex] = game;
      }
      
      store[yyyy][mm][dd].sort((a,b) => new Date(a.datetime) - new Date(b.datetime));
      saveGamesStore(store);
      return true;
    } catch(e) {
      console.error('Erro ao adicionar jogo:', e);
      return false;
    }
  }

  function deleteGameFromStore(gameId){
    try {
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
    } catch(e) {
      console.error('Erro ao deletar jogo:', e);
      return false;
    }
  }

  function generateId(game){
    return btoa(unescape(encodeURIComponent(game.teams + "|" + game.datetime))).replace(/=/g,'').substring(0, 16);
  }

  // 🎯 SISTEMA DE TIMING PARA JOGOS
  function isGameActive(game) {
    try {
      const now = new Date();
      const gameTime = new Date(game.datetime);
      const endTime = new Date(gameTime.getTime() + (CONFIG.GAME_DURATION_MINUTES * 60 * 1000));
      
      const minutesUntilStart = (gameTime - now) / (60 * 1000);
      const minutesSinceStart = (now - gameTime) / (60 * 1000);
      
      return minutesUntilStart <= CONFIG.MINUTES_BEFORE_START && minutesSinceStart <= CONFIG.GAME_DURATION_MINUTES;
    } catch(e) {
      console.error('Erro ao verificar jogo ativo:', e);
      return false;
    }
  }

  function getActiveGames() {
    try {
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
    } catch(e) {
      console.error('Erro ao obter jogos ativos:', e);
      return [];
    }
  }

  // 📱 RENDERIZAÇÃO DA TELA INICIAL
  function renderHome(){
    try {
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
            <div class="meta">${formatDateTime(game.datetime)}</div>
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
      setTimeout(() => {
        qs('.card-game').forEach(card => {
          card.addEventListener('click', (e) => {
            if (!e.target.closest('.context-menu')) {
              showContextMenu(e, card.dataset.gameId);
            }
          });
        });

        const moreBtn = $('#btn-more-games');
        if(moreBtn) {
          moreBtn.addEventListener('click', () => {
            openMoreGamesModal(activeGames);
          });
        }
      }, 100);

    } catch(e) {
      console.error('Erro no renderHome:', e);
    }
  }

  // 🗂️ SISTEMA DE PASTAS - SIMPLIFICADO
  function renderFolders() {
    try {
      const store = loadGamesStore();
      const foldersContent = $('#folders-content');
      
      let html = '<div class="folders-grid">';
      
      // Pastas por ano
      html += '<div class="folder-category">';
      html += '<h4>📅 Por Ano</h4>';
      const years = Object.keys(store).sort().reverse();
      years.forEach(year => {
        const yearGames = getGamesCountByYear(store, year);
        html += `<div class="folder-item" data-folder="year-${year}">
          <span>📁 ${year}</span>
          <small>${yearGames} jogo${yearGames !== 1 ? 's' : ''}</small>
        </div>`;
      });
      if(years.length === 0) {
        html += '<div class="folder-item"><span>📁 Nenhum ano</span></div>';
      }
      html += '</div>';

      html += '</div>';
      foldersContent.innerHTML = html;

      // Eventos das pastas
      setTimeout(() => {
        qs('.folder-item').forEach(item => {
          item.addEventListener('click', () => {
            const folder = item.dataset.folder;
            openFolderModal(folder);
          });
        });
      }, 100);

    } catch(e) {
      console.error('Erro no renderFolders:', e);
    }
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
    try {
      const [type, year] = folderPath.split('-');
      const store = loadGamesStore();
      let games = [];

      if (type === 'year' && store[year]) {
        Object.values(store[year]).forEach(month => {
          Object.values(month).forEach(dayGames => {
            games.push(...dayGames);
          });
        });
      }

      openMoreGamesModal(games);
    } catch(e) {
      console.error('Erro ao abrir pasta:', e);
    }
  }

  // ✏️ SISTEMA DE EDIÇÃO
  let currentEditingGame = null;

  function showContextMenu(event, gameId) {
    try {
      const contextMenu = $('#context-menu');
      const rect = event.currentTarget.getBoundingClientRect();
      
      contextMenu.style.left = `${rect.left}px`;
      contextMenu.style.top = `${rect.bottom + 5}px`;
      contextMenu.classList.remove('hidden');
      contextMenu.dataset.gameId = gameId;

      setTimeout(() => {
        document.addEventListener('click', closeContextMenu);
      }, 100);
    } catch(e) {
      console.error('Erro no context menu:', e);
    }
  }

  function closeContextMenu() {
    $('#context-menu').classList.add('hidden');
    document.removeEventListener('click', closeContextMenu);
  }

  function editGame(gameId) {
    try {
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
    } catch(e) {
      console.error('Erro ao editar jogo:', e);
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

  // 📊 MODAL VER MAIS JOGOS
  function openMoreGamesModal(games){
    try {
      const container = $('#more-list');
      if(!games || !Array.isArray(games)) games = [];
      
      container.innerHTML = games.map(game => `
        <div class="card-game" data-game-id="${game.id}">
          <div>
            <div><strong>${escapeHtml(game.teams)}</strong></div>
            <div class="meta">${formatDateTime(game.datetime)}</div>
          </div>
          <div class="meta">${game.odds && game.odds.length ? 'ODDs: '+game.odds.map(o => o.toFixed(2)).join(' | ') : 'Sem ODDs'}</div>
        </div>
      `).join('');

      // Adicionar eventos de clique
      setTimeout(() => {
        qs('#more-list .card-game').forEach(card => {
          card.addEventListener('click', (e) => {
            if (!e.target.closest('.context-menu')) {
              showContextMenu(e, card.dataset.gameId);
            }
          });
        });
      }, 100);

      showModal('#modal-more');
    } catch(e) {
      console.error('Erro ao abrir modal:', e);
    }
  }

  // 🔍 BUSCA SIMPLES
  function doSearch(q){
    try {
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
            <div class="meta">${formatDateTime(g.datetime)}</div>
            <div class="meta">${g.odds && g.odds.length ? 'ODDs: '+g.odds.map(o => o.toFixed(2)).join(' | ') : 'Sem ODDs'}</div>
          </div>
        `).join('');

        setTimeout(() => {
          qs('#search-result .card-game').forEach(card => {
            card.addEventListener('click', (e) => {
              if (!e.target.closest('.context-menu')) {
                showContextMenu(e, card.dataset.gameId);
              }
            });
          });
        }, 100);
      }
    } catch(e) {
      console.error('Erro na busca:', e);
    }
  }

  // FUNÇÕES AUXILIARES
  function escapeHtml(s){ 
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function formatDateTime(isoString) {
    try {
      return new Date(isoString).toLocaleString('pt-BR');
    } catch(e) {
      return isoString;
    }
  }

  function showModal(id){ 
    const modal = $(id);
    if(modal) modal.classList.remove('hidden'); 
  }
  
  function hideModal(id){ 
    const modal = $(id);
    if(modal) modal.classList.add('hidden'); 
  }

  // PARSING SIMPLES DE TEXTO (backup)
  function parseTextForGames(txt){
    try {
      const lines = txt.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
      const results = [];
      
      lines.forEach(line => {
        // Extrair times (padrão simples)
        let teams = null;
        let teamsMatch = line.match(/(.+?)\s+(?:x|vs|versus)\s+(.+)/i);
        if(teamsMatch){
          teams = `${teamsMatch[1].trim()} x ${teamsMatch[2].trim()}`;
        }

        // Extrair odds (números decimais)
        const odds = [];
        const oddMatches = line.match(/\d+[.,]\d+/g);
        if(oddMatches) {
          oddMatches.forEach(odd => {
            const num = parseFloat(odd.replace(',', '.'));
            if(!isNaN(num) && num > 1.0) {
              odds.push(num);
            }
          });
        }

        if(teams) {
          const obj = {
            teams: teams,
            datetime: new Date().toISOString(), // Data atual como fallback
            odds: odds.slice(0, 3), // Máximo 3 odds
            meta: { raw: line }
          };
          obj.id = generateId(obj);
          results.push(obj);
        }
      });

      return results;
    } catch(e) {
      console.error('Erro no parsing:', e);
      return [];
    }
  }

  // EVENTOS PRINCIPAIS
  function init(){
    console.log('Iniciando aplicação...');
    
    // Eventos básicos dos modals
    $('#btn-insert')?.addEventListener('click', () => {
      currentEditingGame = null;
      $('#paste-area').value = '';
      showModal('#modal-insert');
      $('#process-status').textContent = '';
    });

    $('#close-insert')?.addEventListener('click', () => {
      hideModal('#modal-insert');
      currentEditingGame = null;
    });

    $('#btn-process')?.addEventListener('click', () => {
      const txt = $('#paste-area').value.trim();
      if(!txt){ 
        $('#process-status').textContent = 'Cole algum texto primeiro.'; 
        return; 
      }
      
      $('#process-status').textContent = 'Processando...';
      
      setTimeout(() => {
        try {
          const results = parseTextForGames(txt);
          if(results.length === 0) {
            $('#process-status').textContent = 'Nenhum jogo identificado.';
            return;
          }
          
          if(currentEditingGame) {
            // Modo edição
            const updatedGame = results[0];
            updatedGame.id = currentEditingGame.id;
            if(addGameToStore(updatedGame)) {
              $('#process-status').textContent = 'Jogo atualizado com sucesso!';
              currentEditingGame = null;
              renderHome();
            }
          } else {
            // Modo novo - salvar diretamente
            results.forEach(game => {
              addGameToStore(game);
            });
            $('#process-status').textContent = `${results.length} jogos salvos com sucesso!`;
            renderHome();
          }
        } catch (error) {
          $('#process-status').textContent = 'Erro no processamento.';
          console.error(error);
        }
      }, 500);
    });

    $('#btn-today')?.addEventListener('click', () => {
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

    $('#btn-export')?.addEventListener('click', () => {
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
    $('#btn-search')?.addEventListener('click', () => {
      showModal('#modal-search');
      $('#search-input').value = '';
      $('#search-result').innerHTML = '';
    });
    
    $('#close-search')?.addEventListener('click', () => hideModal('#modal-search'));
    $('#search-input')?.addEventListener('input', (e) => {
      const q = e.target.value.trim();
      if(q.length > 1) doSearch(q);
      else $('#search-result').innerHTML = '';
    });

    // Outros modals
    $('#close-more')?.addEventListener('click', () => hideModal('#modal-more'));
    $('#close-preview')?.addEventListener('click', () => hideModal('#modal-preview'));
    $('#close-notfound')?.addEventListener('click', () => hideModal('#modal-notfound'));

    // Context menu actions
    $('#btn-edit-game')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const gameId = $('#context-menu').dataset.gameId;
      editGame(gameId);
      closeContextMenu();
    });

    $('#btn-delete-game')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const gameId = $('#context-menu').dataset.gameId;
      deleteGame(gameId);
      closeContextMenu();
    });

    // Import file button
    $('#file-import')?.addEventListener('change', ev => {
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
    
    // Atualizar a cada minuto
    setInterval(renderHome, 60000);
    
    console.log('Aplicação iniciada com sucesso!');
  }

  // iniciar quando DOM estiver pronto
  if(document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();