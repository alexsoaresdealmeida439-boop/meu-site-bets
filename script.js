// script.js - versão final integrada com Firestore compat e fallback localStorage.
// Cole exatamente como está.

(function(){
  const $ = sel => document.querySelector(sel);
  const qs = sel => Array.from(document.querySelectorAll(sel));
  const COLL_ROOT = window._COLL_ROOT || "Jogos"; // "Jogos" conforme pedido

  // ------------------ Utilidades ------------------
  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, (m)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }
  function normalizeName(s){ return s ? s.normalize('NFD').replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9\sxvs:-]/g,'').trim() : ''; }
  function isoDateParts(dt){
    const d = new Date(dt);
    const yyyy = String(d.getFullYear());
    const mm = String(d.getMonth()+1).padStart(2,'0');
    const dd = String(d.getDate()).padStart(2,'0');
    return { yyyy, mm, dd };
  }
  function generateId(game){
    return btoa((game.teams+"|"+game.datetime).toLowerCase()).replace(/=/g,'');
  }

  function hasFirestore(){ return !!(window._FIREBASE && window._FIREBASE.firestore); }

  // ------------------ Firestore helpers ------------------
  async function addGameToStore(game){
    if(!game || !game.datetime) return;
    game.id = game.id || generateId(game);
    const { yyyy, mm, dd } = isoDateParts(game.datetime);

    if(hasFirestore()){
      const db = window._FIREBASE.firestore;
      const docRef = db.collection(COLL_ROOT).doc(yyyy)
                       .collection('months').doc(mm)
                       .collection('days').doc(dd)
                       .collection('games').doc(game.id);
      try{
        await docRef.set({
          id: game.id,
          teams: game.teams,
          datetime: game.datetime,
          odds: game.odds || [],
          meta: game.meta || {}
        }, { merge: true });
      }catch(err){
        console.error('Erro Firestore write, salvando local:', err);
        saveLocalFallback(game);
      }
    }else{
      saveLocalFallback(game);
    }
  }

  function saveLocalFallback(game){
    const store = loadLocal();
    const { yyyy, mm, dd } = isoDateParts(game.datetime);
    store[yyyy] = store[yyyy] || {};
    store[yyyy][mm] = store[yyyy][mm] || {};
    store[yyyy][mm][dd] = store[yyyy][mm][dd] || [];
    if(!store[yyyy][mm][dd].some(g=>g.id===game.id)){
      store[yyyy][mm][dd].push(game);
      store[yyyy][mm][dd].sort((a,b)=>new Date(a.datetime)-new Date(b.datetime));
    }
    localStorage.setItem('games', JSON.stringify(store));
  }

  async function loadGamesStore(){
    if(hasFirestore()){
      const db = window._FIREBASE.firestore;
      const data = {};
      try{
        const yearsSnap = await db.collection(COLL_ROOT).get();
        for(const yDoc of yearsSnap.docs){
          const yyyy = yDoc.id;
          data[yyyy] = {};
          const monthsSnap = await db.collection(COLL_ROOT).doc(yyyy).collection('months').get();
          for(const mDoc of monthsSnap.docs){
            const mm = mDoc.id;
            data[yyyy][mm] = {};
            const daysSnap = await db.collection(COLL_ROOT).doc(yyyy).collection('months').doc(mm).collection('days').get();
            for(const dDoc of daysSnap.docs){
              const dd = dDoc.id;
              data[yyyy][mm][dd] = [];
              const gamesSnap = await db.collection(COLL_ROOT).doc(yyyy).collection('months').doc(mm).collection('days').doc(dd).collection('games').get();
              for(const gDoc of gamesSnap.docs){
                data[yyyy][mm][dd].push(gDoc.data());
              }
              data[yyyy][mm][dd].sort((a,b)=>new Date(a.datetime)-new Date(b.datetime));
            }
          }
        }
        return data;
      }catch(err){
        console.error('Erro Firestore read:', err);
        return loadLocal();
      }
    }else{
      return loadLocal();
    }
  }

  function loadLocal(){
    try{ return JSON.parse(localStorage.getItem('games')||'{}'); }catch(e){ return {}; }
  }

  // ------------------ Parsing heurístico (focado dd/mm/yyyy) ------------------
  function parseTextForGames(txt){
    const lines = txt.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
    const results = [];
    const timeRegex = /(\d{1,2}[:h]\d{2})/i;
    const dateRegex = /(\b\d{1,2}[\/]\d{1,2}[\/]\d{2,4}\b)/; // dd/mm/yyyy

    lines.forEach(line => {
      // teams detection: "A x B" or "A vs B" or "A v B" or "A - B"
      let teams = null;
      const teamsMatch = line.match(/(.+?)(?:\s+v?s\.?s?\.?|\s+x\s+|\s+vs\s+|\s+-\s+)(.+?)(?=\s|$)/i);
      if(teamsMatch){
        teams = (teamsMatch[1].trim() + ' x ' + teamsMatch[2].trim()).replace(/\s+/g,' ').trim();
      } else {
        // fallback: two words with uppercase (may be weaker)
        const cap = line.match(/([A-ZÁÀÂÃÉÈÍÓÔÕÚÇ][\wÁÀÂÃÉÈÍÓÔÕÚÇ-]{1,}\s+[A-ZÁÀÂÃÉÈÍÓÔÕÚÇ][\wÁÀÂÃÉÈÍÓÔÕÚÇ-]{1,})/);
        if(cap) teams = cap[0];
      }

      // date
      const dateM = line.match(dateRegex);
      const dateFound = dateM ? dateM[1] : null;

      // time
      const timeM = line.match(timeRegex);
      const timeFound = timeM ? timeM[1].replace('h',':') : null;

      // odds numbers
      const possibleNums = Array.from(line.matchAll(/(\d+[,.]\d{1,3})/g)).map(m=>m[1].replace(',','.'));
      const odds = possibleNums.map(v=>Number(v)).filter(n=>!isNaN(n) && n>1);

      // compose datetime
      let dt;
      if(dateFound){
        // dd/mm/yyyy
        const parts = dateFound.split('/');
        const day = parts[0].padStart(2,'0');
        const month = parts[1].padStart(2,'0');
        const year = parts[2].length===2?('20'+parts[2]):parts[2];
        const hhmm = timeFound ? (timeFound.includes(':') ? timeFound : timeFound+':00') : '00:00';
        dt = new Date(`${year}-${month}-${day}T${hhmm}:00`);
      } else if(timeFound){
        const t = new Date();
        const yyyy = t.getFullYear();
        const mm = String(t.getMonth()+1).padStart(2,'0');
        const dd = String(t.getDate()).padStart(2,'0');
        dt = new Date(`${yyyy}-${mm}-${dd}T${(timeFound.includes(':')?timeFound:timeFound+':00')}:00`);
      } else {
        dt = new Date();
        dt.setHours(0,0,0,0);
      }

      if(teams){
        const obj = { teams: teams, datetime: dt.toISOString(), odds: odds, meta: { raw: line } };
        obj.id = generateId(obj);
        results.push(obj);
      }
    });

    return results;
  }

  // ------------------ Match parsed with existing games ------------------
  async function matchWithStore(parsedList){
    const store = await loadGamesStore();
    const flat = [];
    for(const y in store){
      for(const m in store[y]){
        for(const d in store[y][m]){
          (store[y][m][d]||[]).forEach(g=>{
            flat.push({ game:g, norm: normalizeName(g.teams) });
          });
        }
      }
    }

    const found = [], notfound = [];
    for(const p of parsedList){
      const normp = normalizeName(p.teams);
      let matched = flat.find(f => f.norm.includes(normp) || normp.includes(f.norm));
      if(!matched){
        const parts = normp.split(' x ').map(s=>s.trim()).filter(Boolean);
        matched = flat.find(f => parts.every(part => f.norm.includes(part)));
      }
      if(matched){
        // append odds
        const target = matched.game;
        const newOdds = (p.odds||[]).filter(o => !target.odds || !target.odds.includes(o));
        target.odds = Array.from(new Set([...(target.odds||[]), ...newOdds])).sort();
        await addGameToStore(target);
        found.push({ parsed:p, matched:target });
      } else {
        notfound.push(p);
      }
    }
    return { found, notfound };
  }

  // ------------------ UI rendering ------------------
  async function renderHome(){
    const main = $('#home-list');
    const store = await loadGamesStore();
    const flat = [];
    for(const y in store){
      for(const m in store[y]){
        for(const d in store[y][m]){
          (store[y][m][d]||[]).forEach(g=> flat.push(g));
        }
      }
    }
    flat.sort((a,b)=> new Date(a.datetime) - new Date(b.datetime));
    if(flat.length===0){
      main.innerHTML = `<p class="hint">Sem jogos salvos. Use "Inserir jogos" ou importe um backup.</p>`;
      return;
    }
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
    const moreBtn = $('#btn-more-games');
    if(moreBtn) moreBtn.addEventListener('click', ()=> openMoreGamesModal(flat, 'Todos os próximos jogos'));
  }

  function openMoreGamesModal(allgames, title){
    $('#more-title').textContent = title || 'Jogos';
    const container = $('#more-list');
    container.innerHTML = (allgames||[]).map(g=>`
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

  function showModal(id){ $(id).classList.remove('hidden'); }
  function hideModal(id){ $(id).classList.add('hidden'); }

  // ------------------ Search ------------------
  async function doSearch(q){
    const normq = normalizeName(q);
    const store = await loadGamesStore();
    const flat = [];
    for(const y in store){
      for(const m in store[y]){
        for(const d in store[y][m]){
          (store[y][m][d]||[]).forEach(g=> flat.push(g));
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

  // ------------------ Pasta mariosca (20%) functions ------------------
  async function showMarioscaForDate(dateStr){
    // expects dd/mm/yyyy
    const mRes = $('#mario-results');
    if(!/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)){
      mRes.innerHTML = `<p style="color:#ffdddd">Formato inválido. Use dd/mm/aaaa</p>`;
      return;
    }
    const parts = dateStr.split('/');
    const dd = parts[0].padStart(2,'0');
    const mm = parts[1].padStart(2,'0');
    const yyyy = parts[2];
    const store = await loadGamesStore();
    const list = (((store[yyyy]||{})[mm]||{})[dd]) || [];
    if(list.length===0){
      mRes.innerHTML = `<p class="hint">Nenhum jogo nesta data.</p>`;
      return;
    }
    // show first 10
    const first10 = list.slice(0,10);
    mRes.innerHTML = first10.map(g=>`<div class="card-game"><div><strong>${escapeHtml(g.teams)}</strong><div class="meta">${(new Date(g.datetime)).toLocaleString()}</div></div><div class="meta">${g.odds && g.odds.length ? 'ODDs: '+g.odds.join(' | ') : 'Sem ODDs'}</div></div>`).join('') +
      `<div style="text-align:center; margin-top:8px"><button id="mario-viewall" class="primary">Ver todos os jogos</button></div>`;
    $('#mario-viewall').addEventListener('click', ()=> {
      openMoreGamesModal(list, `Todos os jogos de ${dateStr}`);
      hideModal('#modal-mariosca');
    });
  }

  // ------------------ Events init ------------------
  function init(){
    // preload last paste
    const lastPaste = localStorage.getItem('_last_paste');
    if(lastPaste) $('#paste-area').value = lastPaste;

    $('#btn-insert').addEventListener('click', ()=> {
      showModal('#modal-insert');
      $('#process-status').textContent = '';
      $('#process-result').innerHTML = '';
    });
    $('#close-insert').addEventListener('click', ()=> hideModal('#modal-insert'));

    $('#btn-process').addEventListener('click', async ()=>{
      const txt = $('#paste-area').value.trim();
      if(!txt){ $('#process-status').textContent = 'Cole algum texto primeiro.'; return; }
      $('#process-status').textContent = 'Processando...';
      await new Promise(r=>setTimeout(r,250));
      const parsed = parseTextForGames(txt);
      const { found, notfound } = await matchWithStore(parsed);
      $('#process-status').textContent = `Processado: ${found.length} jogos encontrados e ${notfound.length} não encontrados.`;
      $('#process-result').innerHTML = (notfound.length>0 ? `<button id="btn-view-notfound" class="secondary">Ver jogos não encontrados</button>` : '');
      if(notfound.length>0){
        $('#btn-view-notfound').addEventListener('click', ()=> showNotFoundList(notfound));
      }
      renderHome();
    });

    $('#btn-save').addEventListener('click', async ()=>{
      const txt = $('#paste-area').value.trim();
      if(!txt){ $('#process-status').textContent = 'Cole algum texto primeiro.'; return; }
      const parsed = parseTextForGames(txt);
      const { found, notfound } = await matchWithStore(parsed);
      // save notfound as new games
      for(const p of notfound){
        await addGameToStore(p);
      }
      $('#process-status').textContent = `Salvo: ${notfound.length} novos jogos adicionados.`;
      renderHome();
    });

    $('#btn-today').addEventListener('click', async ()=>{
      const today = new Date();
      const yyyy = String(today.getFullYear());
      const mm = String(today.getMonth()+1).padStart(2,'0');
      const dd = String(today.getDate()).padStart(2,'0');
      const store = await loadGamesStore();
      const list = (((store[yyyy]||{})[mm]||{})[dd]) || [];
      if(list.length===0){ alert('Sem jogos para hoje.'); return; }
      openMoreGamesModal(list.slice(0,10), `Jogos de hoje (${dd}/${mm}/${yyyy})`);
      // botão Ver mais dentro do modal - adiciona abaixo
      const moreFooter = document.createElement('div');
      moreFooter.style.textAlign='center';
      moreFooter.style.marginTop='10px';
      const btn = document.createElement('button');
      btn.className='primary';
      btn.textContent='Ver mais jogos';
      btn.addEventListener('click', ()=> { openMoreGamesModal(list, `Todos os jogos de ${dd}/${mm}/${yyyy}`); });
      $('#more-list').appendChild(moreFooter);
      moreFooter.appendChild(btn);
    });

    $('#btn-export').addEventListener('click', async ()=>{
      const data = await loadGamesStore();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `games_backup_${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
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
      if(q.length>1) doSearch(q); else $('#search-result').innerHTML = '';
    });

    $('#close-more').addEventListener('click', ()=> hideModal('#modal-more'));
    $('#close-notfound').addEventListener('click', ()=> hideModal('#modal-notfound'));

    // file import
    $('#file-import').addEventListener('change', ev => {
      const f = ev.target.files[0];
      if(!f) return;
      const r = new FileReader();
      r.onload = e => {
        try{
          const obj = JSON.parse(e.target.result);
          localStorage.setItem('games', JSON.stringify(obj));
          alert('Importado com sucesso (local).');
        }catch(err){
          alert('JSON inválido.');
        }
      };
      r.readAsText(f);
    });

    // mariosca footer actions
    $('#mariosca').addEventListener('click', ()=> {
      $('#mario-date').value = '';
      $('#mario-results').innerHTML = '';
      showModal('#modal-mariosca');
    });
    $('#close-mariosca').addEventListener('click', ()=> hideModal('#modal-mariosca'));
    $('#mario-arrow').addEventListener('click', ()=> {
      // toggles placeholders for day/month/year - minimal UI: prefill today
      const t = new Date();
      const dd = String(t.getDate()).padStart(2,'0');
      const mm = String(t.getMonth()+1).padStart(2,'0');
      const yyyy = String(t.getFullYear());
      $('#mario-date').value = `${dd}/${mm}/${yyyy}`;
      showMarioscaForDate($('#mario-date').value);
    });
    $('#mario-date').addEventListener('change', (e)=> { showMarioscaForDate(e.target.value); });
    $('#mario-date').addEventListener('input', (e)=> {
      const v = e.target.value;
      if(v.length===10) showMarioscaForDate(v);
    });

    renderHome();
  }

  function showNotFoundList(list){
    $('#notfound-list').innerHTML = list.map(p=>`<li><strong>${escapeHtml(p.teams)}</strong> — ${ (new Date(p.datetime)).toLocaleString() } — <small>${escapeHtml(p.meta.raw)}</small></li>`).join('');
    showModal('#modal-notfound');
  }

  // ------------------ start ------------------
  document.addEventListener('DOMContentLoaded', init);
})();