// script.js - versão cliente (frontend) que implementa as funcionalidades requisitadas.
// Armazenamento: localStorage com chave "games" em formato aninhado { yyyy: { mm: { dd: [gameObjects...] } } }
// Game object: { id, name, teams: "A x B", datetime: ISO, odds: [numbers], meta: { raw } }

(function(){
  // utilidades
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
    if(!store[yyyy][mm][dd].some(g => g.id === game.id)){
      store[yyyy][mm][dd].push(game);
      // ordenar por hora
      store[yyyy][mm][dd].sort((a,b)=> new Date(a.datetime) - new Date(b.datetime));
    }
    saveGamesStore(store);
  }

  function generateId(game){
    // id simples baseado em nome+datetime
    return btoa((game.teams+"|"+game.datetime).toLowerCase()).replace(/=/g,'');
  }

  // parsing heurístico de texto colado
  function parseTextForGames(txt){
    const lines = txt.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
    const results = [];
    const oddsRegex = /(?:\bodd(?:s)?[:\s]*|:)?((?:\d+(?:[,.]\d+)?\s*){1,10})/i;
    const dateRegexes = [
      /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,       // 25/11/2025 or 25-11-2025
      /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/,         // 2025-11-25
      /(\d{1,2}[\/\-]\d{1,2})/                     // 25/11 (assume ano atual)
    ];
    const timeRegex = /(\d{1,2}[:h]\d{2})/i; // 19:30 or 19h30

    lines.forEach(line => {
      // tentativa: extrair teams (X ou vs ou -)
      // split by known separators
      let teams = null;
      let teamsMatch = line.match(/(.+?)(?:\s+v?s\.?s?\.?|\s+x\s+|\s+vs\s+|\s+-\s+)(.+?)(?=\s|$)/i);
      if(teamsMatch){
        teams = (teamsMatch[1].trim() + ' x ' + teamsMatch[2].trim()).replace(/\s+/g,' ').trim();
      } else {
        // fallback: take two capitalized words
        const cap = line.match(/([A-ZÁÀÂÃÉÈÍÓÔÕÚÇ][\wÁÀÂÃÉÈÍÓÔÕÚÇ-]{1,}\s+[A-ZÁÀÂÃÉÈÍÓÔÕÚÇ][\wÁÀÂÃÉÈÍÓÔÕÚÇ-]{1,})/);
        if(cap) teams = cap[0];
      }

      // date
      let dateFound = null;
      for(const r of dateRegexes){
        const m = line.match(r);
        if(m){
          dateFound = m[1];
          break;
        }
      }

      // time
      const timeM = line.match(timeRegex);
      const timeFound = timeM ? timeM[1].replace('h',':') : null;

      // odds: any numbers with decimals > 1 or so
      const possibleNums = Array.from(line.matchAll(/(\d+[,.]\d{1,3})/g)).map(m=>m[1].replace(',','.'));
      const odds = possibleNums.map(v=>Number(v)).filter(n=>!isNaN(n) && n>1);

      // Compose datetime
      let dt = null;
      if(dateFound){
        // normalize dateFound to ISO
        let day, month, year;
        if(/\d{4}[\/\-]/.test(dateFound)){ // yyyy-mm-dd
          const parts = dateFound.split(/[-\/]/).map(p=>p.padStart(2,'0'));
          year = parts[0]; month = parts[1]; day = parts[2] || '01';
        } else {
          const parts = dateFound.split(/[-\/]/);
          day = parts[0].padStart(2,'0');
          month = (parts[1]||'01').padStart(2,'0');
          year = parts[2] ? (parts[2].length===2?('20'+parts[2]):parts[2]) : (new Date()).getFullYear();
        }
        const hhmm = timeFound ? (timeFound.includes(':') ? timeFound : timeFound+':00') : '00:00';
        dt = new Date(`${year}-${month}-${day}T${hhmm}:00`);
      } else if(timeFound){
        // assume today
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth()+1).padStart(2,'0');
        const dd = String(today.getDate()).padStart(2,'0');
        const hhmm = timeFound.includes(':') ? timeFound : timeFound+':00';
        dt = new Date(`${yyyy}-${mm}-${dd}T${hhmm}:00`);
      } else {
        // not enough info: maybe line contains teams only; skip? we'll still capture with datetime = today 00:00
        const today = new Date(); today.setHours(0,0,0,0);
        dt = today;
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

  // tenta encontrar correspondência com jogos existentes (por nome normalizado)
  function matchWithStore(parsedList){
    const store = loadGamesStore();
    // flatten existing games with normalized name
    const flat = [];
    for(const yyyy in store){
      for(const mm in store[yyyy]){
        for(const dd in store[yyyy][mm]){
          (store[yyyy][mm][dd]||[]).forEach(g=>{
            const norm = normalizeName(g.teams);
            flat.push({ game: g, norm });
          });
        }
      }
    }
    const found = [], notfound = [];
    parsedList.forEach(p=>{
      const normp = normalizeName(p.teams);
      // try find by substring or exact
      let matched = flat.find(f => f.norm.includes(normp) || normp.includes(f.norm));
      if(!matched){
        // try split teams and match any
        const parts = normp.split(' x ').map(s=>s.trim());
        matched = flat.find(f => {
          return parts.every(part => part && f.norm.includes(part));
        });
      }
      if(matched){
        // update matched game: append odds if any new
        const target = matched.game;
        const newOdds = (p.odds||[]).filter(o => !target.odds || !target.odds.includes(o));
        target.odds = Array.from(new Set([...(target.odds||[]), ...newOdds])).sort();
        // persist
        addGameToStore(target);
        found.push({ parsed:p, matched:target });
      } else {
        notfound.push(p);
      }
    });
    return { found, notfound };
  }

  // UI helpers
  function showModal(id){ $(id).classList.remove('hidden'); }
  function hideModal(id){ $(id).classList.add('hidden'); }

  // render home list (default)
  function renderHome(){
    const main = $('#home-list');
    const store = loadGamesStore();
    // flatten and get next upcoming or all
    const flat = [];
    for(const yyyy in store){
      for(const mm in store[yyyy]){
        for(const dd in store[yyyy][mm]){
          (store[yyyy][mm][dd]||[]).forEach(g=>{
            flat.push(g);
          });
        }
      }
    }
    flat.sort((a,b)=> new Date(a.datetime) - new Date(b.datetime));
    if(flat.length===0){
      main.innerHTML = `<p class="hint">Sem jogos salvos. Use "Inserir jogos".</p>`;
      return;
    }
    // show first 10
    const toShow = flat.slice(0,10);
    main.innerHTML = toShow.map(g=>`
      <div class="card-game">
        <div>
          <div><strong>${escapeHtml(g.teams)}</strong></div>
          <div class="meta">${(new Date(g.datetime)).toLocaleString()}</div>
        </div>
        <div>
          <div class="meta">${g.odds && g.odds.length? 'ODDs: '+g.odds.join(' | ') : 'Sem ODDs'}</div>
        </div>
      </div>
    `).join('') + (flat.length>10 ? `<div style="text-align:center; margin-top:10px"><button id="btn-more-games" class="primary">Ver mais jogos</button></div>` : '');
    // attach evento
    const moreBtn = $('#btn-more-games');
    if(moreBtn) moreBtn.addEventListener('click', ()=> {
      openMoreGamesModal(flat);
    });
  }

  function openMoreGamesModal(allgames){
    const container = $('#more-list');
    if(!allgames) allgames = [];
    container.innerHTML = allgames.map(g=>`
      <div class="card-game">
        <div>
          <div><strong>${escapeHtml(g.teams)}</strong></div>
          <div class="meta">${(new Date(g.datetime)).toLocaleString()}</div>
        </div>
        <div class="meta">${g.odds && g.odds.length ? 'ODDs: '+g.odds.join(' | ') : 'Sem ODDs'}</div>
      </div>
    `).join('');
    showModal('#modal-more');
  }

  // search UI
  function doSearch(q){
    const normq = normalizeName(q);
    const store = loadGamesStore();
    const flat = [];
    for(const yyyy in store){
      for(const mm in store[yyyy]){
        for(const dd in store[yyyy][mm]){
          (store[yyyy][mm][dd]||[]).forEach(g=>{
            flat.push(g);
          });
        }
      }
    }
    const matches = flat.filter(g => normalizeName(g.teams).includes(normq));
    const res = $('#search-result');
    if(matches.length===0){
      res.innerHTML = `<p style="color:#ffdddd"><strong>Jogo não encontrado</strong></p>`;
    } else {
      res.innerHTML = matches.map(g=>`<div class="card-game"><div><strong>${escapeHtml(g.teams)}</strong><div class="meta">${(new Date(g.datetime)).toLocaleString()}</div></div><div class="meta">${g.odds && g.odds.length ? 'ODDs: '+g.odds.join(' | ') : 'Sem ODDs'}</div></div>`).join('');
    }
  }

  // helper escape HTML
  function escapeHtml(s){ return s.replace(/[&<>"']/g, (m)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }

  // eventos UI
  function init(){
    // carregar último texto colado (se usar enviar.html)
    const lastPaste = localStorage.getItem('_last_paste');
    if(lastPaste) $('#paste-area').value = lastPaste;

    $('#btn-insert').addEventListener('click', ()=> {
      showModal('#modal-insert');
      $('#process-status').textContent = '';
      $('#process-result').innerHTML = '';
    });

    $('#close-insert').addEventListener('click', ()=> {
      hideModal('#modal-insert');
    });

    $('#btn-process').addEventListener('click', ()=>{
      const txt = $('#paste-area').value.trim();
      if(!txt){ $('#process-status').textContent = 'Cole algum texto primeiro.'; return; }
      $('#process-status').textContent = 'Processando...';
      // processar (simulado async)
      setTimeout(()=> {
        const parsed = parseTextForGames(txt);
        const { found, notfound } = matchWithStore(parsed);
        $('#process-status').textContent = `Processado: ${found.length} jogos encontrados e ${notfound.length} não encontrados.`;
        $('#process-result').innerHTML = (notfound.length>0 ? `<button id="btn-view-notfound" class="secondary">Ver jogos não encontrados</button>` : '');
        if(notfound.length>0){
          $('#btn-view-notfound').addEventListener('click', ()=> {
            showNotFoundList(notfound);
          });
        }
        renderHome();
      }, 500);
    });

    $('#btn-save').addEventListener('click', ()=> {
      // Salva os jogos já processados (na prática matchWithStore já salvou encontrados). Aqui vamos salvar os não encontrados como novos registros com datetime e sem odds.
      const txt = $('#paste-area').value.trim();
      if(!txt){ $('#process-status').textContent = 'Cole algum texto primeiro.'; return; }
      const parsed = parseTextForGames(txt);
      const { found, notfound } = matchWithStore(parsed);
      // salvar notfound como novos jogos (será colocado em data detectada)
      notfound.forEach(p => {
        addGameToStore(p);
      });
      $('#process-status').textContent = `Salvo: ${notfound.length} novos jogos adicionados.`;
      renderHome();
    });

    $('#btn-today').addEventListener('click', ()=> {
      // mostrar jogos do dia
      const today = new Date();
      const yyyy = String(today.getFullYear());
      const mm = String(today.getMonth()+1).padStart(2,'0');
      const dd = String(today.getDate()).padStart(2,'0');
      const store = loadGamesStore();
      const list = (((store[yyyy]||{})[mm]||{})[dd]) || [];
      if(list.length===0){
        alert('Sem jogos para hoje.');
        return;
      }
      // open modal with first 10 and ver mais dentro do modal
      openMoreGamesModal(list);
    });

    $('#btn-export').addEventListener('click', ()=> {
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

    // search modal
    $('#btn-search').addEventListener('click', ()=> {
      showModal('#modal-search');
      $('#search-input').value = '';
      $('#search-result').innerHTML = '';
      $('#search-input').focus();
    });
    $('#close-search').addEventListener('click', ()=> hideModal('#modal-search'));
    $('#search-input').addEventListener('input', (e)=> {
      const q = e.target.value.trim();
      if(q.length>1) doSearch(q);
      else $('#search-result').innerHTML = '';
    });

    $('#close-more').addEventListener('click', ()=> hideModal('#modal-more'));
    $('#close-notfound').addEventListener('click', ()=> hideModal('#modal-notfound'));

    // import file button (in header hidden input)
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

    renderHome();
  }

  function showNotFoundList(list){
    $('#notfound-list').innerHTML = list.map(p=>`<li><strong>${escapeHtml(p.teams)}</strong> — ${ (new Date(p.datetime)).toLocaleString() } — <small>${escapeHtml(p.meta.raw)}</small></li>`).join('');
    showModal('#modal-notfound');
  }

  // iniciar
  document.addEventListener('DOMContentLoaded', init);
})();