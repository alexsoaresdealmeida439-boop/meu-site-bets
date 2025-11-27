// script.js COMPLETO — revisado, ampliado e com novos recursos solicitados.

(function(){
  const $ = sel => document.querySelector(sel);
  const qs = sel => Array.from(document.querySelectorAll(sel));

  function saveGamesStore(obj){
    localStorage.setItem('games', JSON.stringify(obj));
  }
  function loadGamesStore(){
    try{
      const s = localStorage.getItem('games');
      return s ? JSON.parse(s) : {};
    }catch(e){ return {}; }
  }

  function normalizeName(s){
    return s.normalize('NFD')
            .replace(/[\u0300-\u036f]/g,"")
            .toLowerCase()
            .replace(/[^a-z0-9\sxvs:-]/g,'')
            .trim();
  }

  function isoDateParts(dt){
    const d = new Date(dt);
    return {
      yyyy: String(d.getFullYear()),
      mm: String(d.getMonth()+1).padStart(2,'0'),
      dd: String(d.getDate()).padStart(2,'0')
    };
  }

  function generateId(game){
    return btoa((game.teams+"|"+game.datetime).toLowerCase()).replace(/=/g,'');
  }

  function addGameToStore(game){
    const store = loadGamesStore();
    const { yyyy, mm, dd } = isoDateParts(game.datetime);

    store[yyyy] = store[yyyy] || {};
    store[yyyy][mm] = store[yyyy][mm] || {};
    store[yyyy][mm][dd] = store[yyyy][mm][dd] || [];

    if(!store[yyyy][mm][dd].some(g => g.id === game.id)){
      store[yyyy][mm][dd].push(game);
      store[yyyy][mm][dd].sort((a,b)=> new Date(a.datetime) - new Date(b.datetime));
    }
    saveGamesStore(store);
  }

  function deleteGame(id){
    const store = loadGamesStore();
    let changed = false;

    for(const y in store){
      for(const m in store[y]){
        for(const d in store[y][m]){
          const before = store[y][m][d].length;
          store[y][m][d] = store[y][m][d].filter(g => g.id !== id);
          if(store[y][m][d].length !== before) changed = true;
        }
      }
    }

    if(changed) saveGamesStore(store);
  }

  // PARSER 👇 — mantido igual ao original (não mexi)
  function parseTextForGames(txt){
    const lines = txt.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
    const results = [];
    const oddsRegex = /(\d+[,.]\d{1,3})/g;

    lines.forEach(line => {
      let teamsMatch = line.match(/(.+?)(?:\s+v?s\.?s?\.?|\s+x\s+|\s+vs\s+|\s+-\s+)(.+?)(?=\s|$)/i);
      let teams = teamsMatch ? (teamsMatch[1].trim()+" x "+teamsMatch[2].trim()) : null;

      let dateMatch = line.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
      let timeMatch = line.match(/(\d{1,2}[:h]\d{2})/i);

      const odds = [...line.matchAll(oddsRegex)]
          .map(m=>Number(m[1].replace(',','.')))
          .filter(n=>n>1);

      let dt = new Date();
      if(dateMatch){
        const p = dateMatch[1].split(/[-\/]/);
        let d = p[0].padStart(2,'0');
        let m = p[1].padStart(2,'0');
        let y = p[2] ? (p[2].length===2 ? "20"+p[2] : p[2]) : dt.getFullYear();
        let hhmm = timeMatch ? timeMatch[1].replace('h',':') : "00:00";
        dt = new Date(`${y}-${m}-${d}T${hhmm}:00`);
      }

      if(teams){
        const obj = {
          teams: teams,
          datetime: dt.toISOString(),
          odds: odds,
          meta: { raw: line }
        };
        obj.id = generateId(obj);
        results.push(obj);
      }
    });
    return results;
  }

  function matchWithStore(parsed){
    const store = loadGamesStore();
    const flat = [];

    for(const y in store){
      for(const m in store[y]){
        for(const d in store[y][m]){
          (store[y][m][d]||[]).forEach(g=>{
            flat.push({ game: g, norm: normalizeName(g.teams) });
          });
        }
      }
    }

    const found = [], notfound = [];

    parsed.forEach(p=>{
      const normp = normalizeName(p.teams);
      let match = flat.find(f => f.norm.includes(normp) || normp.includes(f.norm));

      if(match){
        const g = match.game;
        const newOdds = p.odds.filter(o => !g.odds.includes(o));
        g.odds = Array.from(new Set([...g.odds, ...newOdds]));

        addGameToStore(g);
        found.push({ parsed:p, matched:g });

      } else {
        notfound.push(p);
      }
    });

    return { found, notfound };
  }

  // === UI ===

  function escapeHtml(s){
    return s.replace(/[&<>"']/g, m => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[m]));
  }

  // abrir modal geral
  function showModal(id){
    const el = $(id);
    el.style.background = "#FFD700"; // amarelo ouro
    el.classList.remove('hidden');
  }
  function hideModal(id){
    $(id).classList.add('hidden');
  }

  // MOSTRAR 10 JOGOS QUE COMEÇAM EM 15 MINUTOS
  function renderNext15min(){
    const now = new Date();
    const limit = new Date(now.getTime() + 15*60000);

    const store = loadGamesStore();
    const flat = [];

    for(const y in store){
      for(const m in store[y]){
        for(const d in store[y][m]){
          store[y][m][d].forEach(g => flat.push(g));
        }
      }
    }

    const upcoming = flat
      .filter(g => {
        const t = new Date(g.datetime);
        return t >= now && t <= limit;
      })
      .sort((a,b)=> new Date(a.datetime) - new Date(b.datetime))
      .slice(0,10);

    return upcoming;
  }

  // JOGOS EM ANDAMENTO
  function getRunningGames(){
    const now = new Date();
    const store = loadGamesStore();
    const flat = [];

    for(const y in store){
      for(const m in store[y]){
        for(const d in store[y][m]){
          store[y][m][d].forEach(g => flat.push(g));
        }
      }
    }

    // critério simples: começou há menos de 2h
    return flat.filter(g => {
      const t = new Date(g.datetime);
      return t <= now && (now - t) <= 2*60*60*1000;
    });
  }

  // abrir modal 30% para jogo específico
  function openSingleGameModal(game){
    const el = $('#modal-single');
    $('#single-body').innerHTML = `
      <h2>${escapeHtml(game.teams)}</h2>
      <p>${new Date(game.datetime).toLocaleString()}</p>
      <p><strong>ODDs:</strong> ${game.odds.join(' | ') || 'Sem ODDs'}</p>
    `;
    el.style.width = "30%";
    el.style.background = "#FFD700";
    showModal('#modal-single');
  }

  function renderHome(){
    const main = $('#home-list');
    const store = loadGamesStore();
    const flat = [];

    for(const y in store){
      for(const m in store[y]){
        for(const d in store[y][m]){
          store[y][m][d].forEach(g => flat.push(g));
        }
      }
    }

    flat.sort((a,b)=> new Date(a.datetime) - new Date(b.datetime));

    let hot = renderNext15min();
    let htmlHot = "";

    if(hot.length){
      htmlHot = `
        <h3 style="color:red">Jogos iniciando em 15 minutos</h3>
        ${hot.map(g => gameCard(g)).join('')}
      `;
    }

    if(flat.length===0){
      main.innerHTML = htmlHot + `<p class="hint">Sem jogos salvos.</p>`;
      return;
    }

    const first10 = flat.slice(0,10);

    main.innerHTML = htmlHot + first10.map(g=>gameCard(g)).join('');
  }

  // CARTÃO DE JOGO
  function gameCard(g){
    return `
      <div class="card-game" data-id="${g.id}">
        <div onclick="window.openSingleGame && window.openSingleGame('${g.id}')">
          <div><strong>${escapeHtml(g.teams)}</strong></div>
          <div class="meta">${new Date(g.datetime).toLocaleString()}</div>
          <div class="meta">${g.odds.length ? 'ODDs: '+g.odds.join(' | ') : 'Sem ODDs'}</div>
        </div>
        <button class="btn-delete" onclick="window.deleteGameFront('${g.id}')">🗑</button>
      </div>
    `;
  }

  // Funções globais para botões
  window.deleteGameFront = function(id){
    deleteGame(id);
    renderHome();
  };

  window.openSingleGame = function(id){
    const store = loadGamesStore();
    for(const y in store){
      for(const m in store[y]){
        for(const d in store[y][m]){
          const g = store[y][m][d].find(x=>x.id===id);
          if(g){ openSingleGameModal(g); return; }
        }
      }
    }
  };

  // === INITIALIZE ===
  document.addEventListener('DOMContentLoaded', ()=>{
    renderHome();

    $('#btn-open-running').addEventListener('click', ()=>{
      const running = getRunningGames();
      const body = $('#running-body');
      body.innerHTML = running.length
        ? running.map(g => gameCard(g)).join('')
        : "<p>Nenhum jogo em andamento.</p>";

      const modal = $('#modal-running');
      modal.style.width = "80%";
      modal.style.background = "#FFD700";
      showModal('#modal-running');
    });

    qs('[data-close]').forEach(b => {
      b.addEventListener('click', ()=>{
        hideModal("#"+b.getAttribute('data-close'));
      });
    });
  });

})();