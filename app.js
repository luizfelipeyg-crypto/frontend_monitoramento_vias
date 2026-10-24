const $ = (s, e = document) => e.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const Cfg = {
  get() {
    let c = {}; try { c = JSON.parse(localStorage.getItem('cfg')) || {}; } catch { c = {}; }
    const cl = Array.isArray(c.classes) ? c.classes.filter(x => typeof x === 'string' && x.trim()).map(x => x.trim()) : [];
    return { porPagina: [5, 10, 25, 50].includes(+c.porPagina) ? +c.porPagina : 10, classes: cl.length ? cl : ['Placa', 'Semáforo'] };
  },
  set(v) { try { localStorage.setItem('cfg', JSON.stringify({ ...Cfg.get(), ...v })); return true; } catch { return false; } }
};
const STATUS = { na_fila: ['Na fila', 'gray'], processando: ['Processando', 'blue'], concluida: ['Concluída', 'green'], falhou: ['Falhou', 'red'] };
const REV = { pendente: ['Pendente', 'gray'], confirmada: ['Confirmada', 'green'], rejeitada: ['Rejeitada', 'red'], corrigida: ['Corrigida', 'blue'] };
const PRIO = { alta: ['Alta', 'red'], media: ['Média', 'yel'], baixa: ['Baixa', 'gray'] };
const pick = (m, k) => Object.hasOwn(m, k) ? m[k] : null;
const tag = (m, k) => { const [t, c] = pick(m, k) || [k || '—', 'gray']; return `<span class="tag ${c}">${esc(t)}</span>`; };
const mmss = s => { s = Math.round(+s || 0); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
const fdata = d => { const t = new Date(d); return d && !isNaN(t) ? t.toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '—'; };
const safe = async (p, fb) => { try { return { d: await p, e: null }; } catch (e) { return { d: fb, e: e.message }; } };
const aviso = (e, zerados) => e ? `<div class="aviso" role="alert"><b>Falha ao carregar:</b> ${esc(e)}${zerados ? ' Os valores abaixo não foram carregados e aparecem zerados.' : ''}</div>` : '';
const urlOk = u => { try { const p = new URL(u, location.href).protocol; return p === 'http:' || p === 'https:' ? String(u) : ''; } catch { return ''; } };
const caixaOk = c => c && ['x', 'y', 'l', 'a'].every(k => typeof c[k] === 'number' && isFinite(c[k])) && c.l > 0 && c.a > 0;
const JANELA_S = 0.5; // tolerância (s) para exibir a caixa em torno do instante da detecção
let rotaN = 0, sair = null; // rotaN: descarta respostas atrasadas; sair: limpeza ao trocar de página
const vazio = t => `<div class="vazio">${esc(t)}</div>`;
function toast(m, erro) { const d = document.createElement('div'); d.textContent = m; if (erro) d.className = 'err'; $('#toast').append(d); setTimeout(() => d.remove(), 4000); }

/* ---------- componentes ---------- */
const cab = (t, s, extra = '') => `<header class="top"><div><h1>${t}</h1><p class="sub">${s}</p></div><div class="acts">${extra}</div></header>`;
const novaBtn = '<a class="btn pri" href="#/videos">Nova análise</a>';
function tabela(lista, ocultar = []) {
  if (!lista.length) return vazio('Nenhuma análise encontrada.');
  return `<div class="tw"><table><thead><tr><th>ID</th><th>Vídeo</th><th>Local</th><th>Data</th><th class="n">Duração</th><th class="n">Detecções</th><th>Status</th><th class="n">Ações</th></tr></thead><tbody>${lista.map(a =>
    `<tr><td>#${esc(a.id)}</td><td>${esc(a.video)}</td><td><b>${esc(a.local)}</b></td><td>${fdata(a.data)} ${esc(a.horario || '')}</td><td class="n">${mmss(a.duracao)}</td><td class="n">${a.deteccoes ?? 0}</td><td>${tag(STATUS, a.status)}</td><td class="n">${a.id != null && a.id !== '' ? `<a href="#/analise/${encodeURIComponent(a.id)}" aria-label="Ver análise ${esc(a.id)}">Ver</a>` : '—'}</td></tr>`).join('')}</tbody></table></div>`;
}
function modal(html) { const m = $('#modal'); m.innerHTML = html; m.setAttribute('aria-labelledby', 'mt'); m.showModal(); return m; }

/* ---------- páginas ---------- */
async function pgGeral() {
  const v = $('#view'), my = rotaN, dias = [7, 30, 90].includes(+sessionStorage.dias) ? +sessionStorage.dias : 7;
  v.innerHTML = vazio('Carregando…');
  const zero = { totais: { videos: 0, deteccoes: 0, placas: 0, semaforos: 0, problemas: 0 }, serie: [], distribuicao: [], recentes: [] };
  const r0 = await safe(Api.dashboard(dias), zero); if (my !== rotaN) return;
  const ar = x => Array.isArray(x) ? x : [], e = r0.e;
  const d = { totais: { ...zero.totais, ...(r0.d.totais || {}) }, serie: ar(r0.d.serie), distribuicao: ar(r0.d.distribuicao), recentes: ar(r0.d.recentes) };
  const t = { ...zero.totais, ...d.totais };
  const k = [['Vídeos analisados', t.videos], ['Detecções', t.deteccoes], ['Placas detectadas', t.placas], ['Semáforos detectados', t.semaforos], ['Problemas identificados', t.problemas]];
  const max = Math.max(1, ...d.serie.map(s => s.valor));
  v.innerHTML = cab('Monitoramento de Vias Públicas', 'Acompanhamento das análises realizadas nas vias públicas.',
    `<select id="per" aria-label="Período">${[7, 30, 90].map(n => `<option value="${n}" ${n == dias ? 'selected' : ''}>Últimos ${n} dias</option>`).join('')}</select>${novaBtn}`) + aviso(e, true) +
    `<div class="grid g5">${k.map(([l, n]) => `<div class="card kpi"><small>${l}</small><b>${n}</b></div>`).join('')}</div>
    <div class="grid g2"><section class="card"><h2>Detecções ao longo do tempo</h2><div class="cb">${d.serie.length ? `<div class="bars" role="img" aria-label="Gráfico de detecções por período">${d.serie.map(s => `<div style="height:${s.valor / max * 100}%" title="${esc(s.rotulo)}: ${s.valor}"></div>`).join('')}</div><div class="lbl">${d.serie.map(s => `<span>${esc(s.rotulo)}</span>`).join('')}</div>` : vazio('Sem dados no período. Total: 0')}</div></section>
    <section class="card"><h2>Distribuição por classe</h2><div class="cb">${(d.distribuicao.length ? d.distribuicao : Cfg.get().classes.map(c => ({ classe: c, total: 0 }))).map(c => { const m = Math.max(1, ...d.distribuicao.map(x => x.total)); return `<div class="hb"><span>${esc(c.classe)}</span><i style="width:${c.total / m * 100}%"></i><b>${c.total}</b></div>`; }).join('')}</div></section></div>
    <section class="card"><div class="ch"><h2>Análises recentes</h2><a href="#/analises">Ver todas</a></div>${tabela(d.recentes.slice(0, 5))}</section>`;
  $('#per').onchange = ev => { sessionStorage.dias = ev.target.value; pgGeral(); };
}

async function pgAnalises() {
  const v = $('#view'); v.innerHTML = vazio('Carregando…');
  const my = rotaN, { d, e } = await safe(Api.listarAnalises(), []); if (my !== rotaN) return;
  const est = { q: '', st: '', loc: '', pag: 1 };
  const locais = [...new Set(d.map(a => a.local))];
  v.innerHTML = cab('Análises', 'Consulte as análises de vídeo realizadas.', novaBtn) + aviso(e) +
    `<section class="card"><div class="flt"><input id="q" type="search" placeholder="Pesquisar por ID, vídeo ou local" aria-label="Pesquisar" style="flex:1;min-width:200px">
    <select id="st" aria-label="Status"><option value="">Todos os status</option>${Object.entries(STATUS).map(([k, [t]]) => `<option value="${k}">${t}</option>`).join('')}</select>
    <select id="lo" aria-label="Local"><option value="">Todos os locais</option>${locais.map(l => `<option>${esc(l)}</option>`).join('')}</select></div><div id="tb"></div><div class="pg" id="pg"></div></section>`;
  const draw = () => {
    const q = est.q.toLowerCase(), pp = Cfg.get().porPagina;
    const f = d.filter(a => (!est.st || a.status == est.st) && (!est.loc || a.local == est.loc) && `${a.id} ${a.video} ${a.local}`.toLowerCase().includes(q));
    const pgs = Math.max(1, Math.ceil(f.length / pp)); est.pag = Math.min(est.pag, pgs);
    $('#tb').innerHTML = e ? vazio('Não foi possível carregar as análises.') : tabela(f.slice((est.pag - 1) * pp, est.pag * pp));
    $('#pg').innerHTML = `<span class="sub">${f.length} registro(s)</span><button class="btn" id="pv" ${est.pag < 2 ? 'disabled' : ''}>Anterior</button><span>${est.pag} / ${pgs}</span><button class="btn" id="px" ${est.pag >= pgs ? 'disabled' : ''}>Próxima</button>`;
    $('#pv').onclick = () => { est.pag--; draw(); }; $('#px').onclick = () => { est.pag++; draw(); };
  };
  $('#q').oninput = x => { est.q = x.target.value; est.pag = 1; draw(); };
  $('#st').onchange = x => { est.st = x.target.value; est.pag = 1; draw(); };
  $('#lo').onchange = x => { est.loc = x.target.value; est.pag = 1; draw(); };
  draw();
}

function pgVideos() {
  const v = $('#view'); let arq = null, dur = 0, url = null;
  const revogar = () => { if (url) { URL.revokeObjectURL(url); url = null; } };
  sair = revogar;
  v.innerHTML = cab('Nova análise', `Envie um vídeo de ${CONFIG.VIDEO_MIN_S} a ${CONFIG.VIDEO_MAX_S} segundos para detecção.`) +
    `<div class="grid g2"><section class="card"><h2>Vídeo</h2><div class="cb"><div class="drop" id="dz"><p>Arraste um vídeo aqui</p><button class="btn" type="button" id="pick">Selecionar arquivo</button><input id="fi" type="file" accept="video/*" hidden aria-label="Arquivo de vídeo"></div>
    <p class="er" id="er" role="alert"></p><div id="pv" hidden><video id="vp" controls style="width:100%;margin-top:12px;border-radius:6px"></video><p id="inf" class="sub"></p><button class="btn no" id="rm" type="button">Remover vídeo</button></div></div></section>
    <section class="card"><h2>Dados da gravação</h2><div class="cb"><div class="f"><label for="lc">Local *</label><input id="lc" required></div>
    <div class="f"><label for="dt">Data</label><input id="dt" type="date"></div><div class="f"><label for="hr">Horário</label><input id="hr" type="time"></div>
    <div class="f"><label for="ob">Observações</label><textarea id="ob" rows="3"></textarea></div>
    <p>Estado: <span id="es" class="tag gray">Aguardando</span></p><progress id="pr" max="1" value="0" hidden></progress><p id="msg" class="sub"></p>
    <button class="btn pri" id="go" type="button">Iniciar análise</button></div></section></div>`;
  const erro = t => $('#er').textContent = t || '';
  const est = (t, c) => { $('#es').textContent = t; $('#es').className = 'tag ' + c; };
  function escolher(f) {
    erro(); if (!f) return;
    if (!CONFIG.FORMATOS.includes(f.type)) return erro('Formato não aceito. Use MP4, WebM ou MOV.');
    if (f.size > CONFIG.TAM_MAX_MB * 1048576) return erro(`O arquivo excede ${CONFIG.TAM_MAX_MB} MB.`);
    revogar(); url = URL.createObjectURL(f); const p = $('#vp'); p.src = url;
    p.onloadedmetadata = () => {
      dur = p.duration;
      if (dur < CONFIG.VIDEO_MIN_S || dur > CONFIG.VIDEO_MAX_S) { erro(`A duração (${mmss(dur)}) deve estar entre ${CONFIG.VIDEO_MIN_S}s e ${CONFIG.VIDEO_MAX_S}s.`); return limpar(); }
      arq = f; $('#pv').hidden = false; $('#inf').textContent = `${f.name} · ${f.type.split('/')[1].toUpperCase()} · ${(f.size / 1048576).toFixed(1)} MB · ${mmss(dur)}`;
    };
    p.onerror = () => { erro('Não foi possível ler o vídeo.'); limpar(); };
  }
  function limpar() { arq = null; const p = $('#vp'); p.onerror = null; p.onloadedmetadata = null; p.removeAttribute('src'); p.load(); revogar(); $('#pv').hidden = true; $('#fi').value = ''; est('Aguardando', 'gray'); }
  $('#pick').onclick = () => $('#fi').click(); $('#fi').onchange = x => escolher(x.target.files[0]); $('#rm').onclick = () => { limpar(); erro(); };
  const dz = $('#dz');
  dz.ondragover = x => { x.preventDefault(); dz.classList.add('ov'); }; dz.ondragleave = () => dz.classList.remove('ov');
  dz.ondrop = x => { x.preventDefault(); dz.classList.remove('ov'); escolher(x.dataTransfer.files[0]); };
  const trava = b => ['go', 'rm', 'pick'].forEach(i => { $('#' + i).disabled = b; });
  $('#go').onclick = async () => {
    $('#lc').removeAttribute('aria-invalid');
    if (!arq) return erro('Selecione um vídeo antes de iniciar.');
    if (!$('#lc').value.trim()) { $('#lc').setAttribute('aria-invalid', 'true'); $('#lc').focus(); return erro('Informe o local da gravação.'); }
    erro(); trava(true); est('Enviando', 'blue'); $('#pr').value = 0; $('#pr').hidden = false; $('#msg').textContent = '';
    try {
      const r = await Api.enviarVideo(arq, { local: $('#lc').value.trim(), data: $('#dt').value, horario: $('#hr').value, observacoes: $('#ob').value }, p => $('#pr').value = p);
      $('#pr').hidden = true; const st = pick(STATUS, r.status); est(st ? st[0] : 'Recebido', st ? st[1] : 'green'); $('#pr').hidden = true;
      $('#msg').innerHTML = `Vídeo recebido pela API. A conclusão da análise ainda não foi confirmada. <a href="#/analise/${encodeURIComponent(r.id)}">Abrir detalhes</a> · <button class="btn" id="nv" type="button">Enviar outro vídeo</button>`;
      $('#nv').onclick = pgVideos;
    } catch (x) { $('#pr').hidden = true; est('Falhou', 'red'); erro(x.message); trava(false); }
  };
}

async function pgDetalhe(id) {
  const v = $('#view'); v.innerHTML = vazio('Carregando…');
  const my = rotaN; const [a, d, o] = await Promise.all([safe(Api.obterAnalise(id), null), safe(Api.deteccoes(id), []), safe(Api.ocorrencias(id), [])]); if (my !== rotaN) return;
  if (!a.d) return v.innerHTML = cab('Análise #' + esc(id), '<a href="#/analises">Voltar para análises</a>') + aviso(a.e) + vazio('Análise indisponível.');
  const A = a.d, vurl = urlOk(A.videoUrl); let dets = d.d, sel = null, fc = '', fr = '', busy = false;
  const cont = c => dets.filter(x => x.classe == c).length;
  v.innerHTML = `<p><a href="#/analises">← Voltar para análises</a></p>` + cab('Análise #' + esc(A.id), esc(A.video), tag(STATUS, A.status)) + aviso(a.e || d.e || o.e) +
    `<section class="card meta">${[['Local', A.local], ['Data', fdata(A.data)], ['Horário', A.horario], ['Duração', mmss(A.duracao)]].map(([l, x]) => `<div><small>${l}</small><b>${esc(x || '—')}</b></div>`).join('')}</section>
    <section class="card"><h2>Resumo da detecção</h2><div class="grid g4" style="margin:0;padding:16px">${[...new Set([...Cfg.get().classes, ...dets.map(x => x.classe)])].map(c => `<div><small class="sub">${esc(c)}</small><b style="font-size:24px;display:block">${cont(c)}</b></div>`).join('')}<div><small class="sub">Total</small><b style="font-size:24px;display:block">${dets.length}</b></div></div></section>
    <div class="split"><section class="card"><div class="vid" id="vd">${vurl ? `<video id="vp" src="${esc(vurl)}" preload="metadata"></video><div id="bx"></div>` : '<div class="ph">Vídeo não disponível. As caixas aparecem quando a API fornecer o vídeo ou os frames.</div>'}</div>
    <div class="ctl"><button class="btn pri" id="pl" ${vurl ? '' : 'disabled'} aria-label="Reproduzir ou pausar">▶</button><button class="btn" id="rs" ${vurl ? '' : 'disabled'} aria-label="Reiniciar">↺</button><input type="range" id="sk" min="0" max="1000" value="0" aria-label="Posição no vídeo" ${vurl ? '' : 'disabled'}><span id="tm">00:00 / ${mmss(A.duracao)}</span></div></section>
    <section class="card"><div class="ch"><h2>Detecções</h2><span class="sub" id="cn"></span></div><div class="flt"><select id="fc" aria-label="Classe"></select><select id="fr" aria-label="Revisão"><option value="">Toda revisão</option>${Object.entries(REV).map(([k, [t]]) => `<option value="${k}">${t}</option>`).join('')}</select></div><div class="dl" id="dl"></div></section></div>
    <section class="card"><h2>Ocorrências na infraestrutura</h2><div class="flt"><select id="ot" aria-label="Tipo"><option value="">Todos os tipos</option>${[...new Set(o.d.map(x => x.tipo))].map(t => `<option>${esc(t)}</option>`).join('')}</select><select id="op" aria-label="Prioridade"><option value="">Toda prioridade</option>${Object.entries(PRIO).map(([k, [t]]) => `<option value="${k}">${t}</option>`).join('')}</select></div><div id="oc"></div></section>`;
  const vp = $('#vp');
  const boxes = () => {
    if (!vp) return; const W = vp.clientWidth, H = vp.clientHeight, vw = vp.videoWidth, vh = vp.videoHeight, t = vp.currentTime;
    if (!vw || !vh) { $('#bx').innerHTML = ''; return; }
    const k = Math.min(W / vw, H / vh), w = vw * k, h = vh * k, ox = (W - w) / 2, oy = (H - h) / 2; // área real do vídeo (sem as barras)
    $('#bx').innerHTML = dets.filter(x => caixaOk(x.caixa) && Math.abs(+x.tempo - t) < JANELA_S).map(x => { const c = x.caixa;
      return `<div class="box ${x.id == sel ? 'sel' : ''}" style="left:${ox + c.x * w}px;top:${oy + c.y * h}px;width:${c.l * w}px;height:${c.a * h}px"><b>${esc(x.classeCorrigida || x.classe)} ${Math.round(x.confianca * 100)}%</b></div>`; }).join('');
  };
  if (vp) {
    $('#pl').onclick = () => vp.paused ? vp.play().catch(() => toast('Não foi possível reproduzir o vídeo.', true)) : vp.pause();
    vp.onplay = () => $('#pl').textContent = '❚❚'; vp.onpause = () => $('#pl').textContent = '▶';
    $('#rs').onclick = () => { vp.currentTime = 0; vp.play().catch(() => {}); };
    $('#sk').oninput = x => vp.currentTime = x.target.value / 1000 * (vp.duration || 0);
    vp.onloadedmetadata = boxes; vp.onseeked = boxes; vp.onerror = () => toast('Não foi possível carregar o vídeo.', true);
    if (window.ResizeObserver) { const ro = new ResizeObserver(boxes); ro.observe(vp); sair = () => ro.disconnect(); }
    vp.ontimeupdate = () => { $('#sk').value = vp.currentTime / (vp.duration || 1) * 1000; $('#tm').textContent = mmss(vp.currentTime) + ' / ' + mmss(vp.duration); boxes(); };
  }
  const listar = () => {
    const f = dets.filter(x => (!fc || x.classe == fc) && (!fr || x.revisao == fr));
    $('#cn').textContent = f.length + ' registro(s)';
    $('#dl').innerHTML = f.length ? f.map(x => `<div class="di ${x.id == sel ? 'on' : ''}" data-i="${esc(x.id)}" tabindex="0"><div class="r"><span>${mmss(x.tempo)} <b>${esc(x.classeCorrigida || x.classe)}</b></span><span>${Math.round(x.confianca * 100)}%</span></div>
      ${x.classeCorrigida ? `<small class="sub">IA previu: ${esc(x.classe)}</small><br>` : ''}${tag(REV, x.revisao || 'pendente')}${x.obs ? `<small class="sub"> ${esc(x.obs)}</small>` : ''}
      <div class="a"><button class="btn ok" data-a="confirmar">Confirmar</button><button class="btn no" data-a="rejeitar">Rejeitar</button><button class="btn" data-a="corrigir">Corrigir</button></div></div>`).join('') : vazio(d.e ? 'Não foi possível carregar as detecções.' : 'Nenhuma detecção encontrada.');
  };
  const classes = () => [...new Set([...Cfg.get().classes, ...dets.map(x => x.classe)])];
  $('#fc').innerHTML = '<option value="">Todas as classes</option>' + classes().map(c => `<option>${esc(c)}</option>`).join('');
  $('#fc').onchange = x => { fc = x.target.value; listar(); }; $('#fr').onchange = x => { fr = x.target.value; listar(); };
  async function revisar(x, acao, corpo) {
    if (busy) return false; busy = true;
    try { const n = await Api.revisar(A.id, x.id, acao, corpo); if (!pick(REV, n.revisao)) throw new Error('A API não confirmou o novo estado da revisão.');
      dets = dets.map(y => y.id == x.id ? { ...y, ...n } : y); listar(); boxes(); toast('Revisão registrada.'); return true; }
    catch (er) { toast('Não foi possível salvar: ' + er.message, true); return false; }
    finally { busy = false; }
  }
  $('#dl').onkeydown = ev => { if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.classList.contains('di')) { ev.preventDefault(); ev.target.click(); } };
  $('#dl').onclick = ev => {
    const it = ev.target.closest('.di'); if (!it) return; const x = dets.find(y => y.id == it.dataset.i), ac = ev.target.dataset.a;
    if (!ac) { sel = x.id; if (vp) vp.currentTime = x.tempo; listar(); return boxes(); }
    if (ac == 'corrigir') {
      const m = modal(`<h2 id="mt">Corrigir detecção</h2><p class="sub">Classe original da IA: <b>${esc(x.classe)}</b></p><div class="f"><label for="nc">Nova classe</label><select id="nc">${classes().map(c => `<option ${c == x.classe ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></div><div class="f"><label for="nj">Justificativa</label><textarea id="nj" rows="3"></textarea></div><p class="er" id="me" role="alert"></p><div class="acts"><button class="btn pri" id="sv">Salvar correção</button><button class="btn" id="cc">Cancelar</button></div>`);
      $('#cc').onclick = () => m.close();
      $('#sv').onclick = async () => {
        const nc = $('#nc').value; if (!nc || nc === (x.classeCorrigida || x.classe)) return $('#me').textContent = 'Escolha uma classe diferente da atual ou cancele.';
        $('#sv').disabled = true; if (await revisar(x, 'corrigir', { classe: nc, obs: $('#nj').value.trim() })) m.close(); else $('#sv').disabled = false;
      };
    } else revisar(x, ac, {});
  };
  const ocs = () => { const t = $('#ot').value, p = $('#op').value, f = o.d.filter(x => (!t || x.tipo == t) && (!p || x.prioridade == p));
    $('#oc').innerHTML = f.length ? `<div class="tw"><table><thead><tr><th>Horário</th><th>Tipo</th><th>Descrição</th><th>Prioridade</th><th>Revisão</th></tr></thead><tbody>${f.map(x => `<tr><td>${mmss(x.tempo)}</td><td><b>${esc(x.tipo)}</b></td><td>${esc(x.descricao)}</td><td>${tag(PRIO, x.prioridade)}</td><td>${tag(REV, x.revisao || 'pendente')}</td></tr>`).join('')}</tbody></table></div>` : vazio(o.e ? 'Não foi possível carregar as ocorrências.' : 'Nenhuma ocorrência registrada.'); };
  $('#ot').onchange = ocs; $('#op').onchange = ocs; listar(); ocs();
}

async function pgRelatorios() {
  const v = $('#view'), zero = { analises: 0, porClasse: [], revisao: { confirmadas: 0, rejeitadas: 0, corrigidas: 0, pendentes: 0 }, prioridades: { alta: 0, media: 0, baixa: 0 } };
  const q = { de: '', ate: '', local: '' };
  v.innerHTML = cab('Relatórios', 'Resumo dos resultados com base nos filtros.', '<button class="btn" id="csv">Exportar CSV</button>') +
    `<div class="flt card"><label>De <input type="date" id="de"></label><label>Até <input type="date" id="at"></label><input id="lo" placeholder="Local" aria-label="Local"><button class="btn pri" id="ap">Aplicar</button></div><div id="rel"></div>`;
  let R = zero, n = 0, ok = false;
  async function carregar() {
    const meu = ++n, my = rotaN, { d, e } = await safe(Api.relatorio(Object.fromEntries(Object.entries(q).filter(([, x]) => x))), zero);
    if (meu !== n || my !== rotaN) return; ok = !e;
    R = { ...zero, ...d }; const r = { ...zero.revisao, ...R.revisao }, p = { ...zero.prioridades, ...R.prioridades }, tot = r.confirmadas + r.rejeitadas + r.corrigidas + r.pendentes, pc = n => tot ? Math.round(n / tot * 100) + '%' : '0%';
    $('#rel').innerHTML = aviso(e, true) + `<div class="grid g4">${[['Análises', R.analises], ['Confirmadas', pc(r.confirmadas)], ['Rejeitadas', pc(r.rejeitadas)], ['Corrigidas', pc(r.corrigidas)]].map(([l, n]) => `<div class="card kpi"><small>${l}</small><b>${n}</b></div>`).join('')}</div>
    <div class="grid g2"><section class="card"><h2>Detecções por classe</h2>${R.porClasse.length ? `<table><tbody>${R.porClasse.map(c => `<tr><td>${esc(c.classe)}</td><td class="n">${c.total}</td></tr>`).join('')}</tbody></table>` : vazio('Sem dados. Total: 0')}</section>
    <section class="card"><h2>Ocorrências por prioridade</h2><table><tbody>${Object.entries(PRIO).map(([k, [t, c]]) => `<tr><td>${tag(PRIO, k)}</td><td class="n">${p[k]}</td></tr>`).join('')}</tbody></table></section></div>`;
  }
  $('#ap').onclick = () => { if ($('#de').value && $('#at').value && $('#de').value > $('#at').value) return toast('A data inicial não pode ser posterior à final.', true); q.de = $('#de').value; q.ate = $('#at').value; q.local = $('#lo').value.trim(); carregar(); };
  const cel = x => { if (typeof x === 'number') return x; let t = String(x ?? ''); if (/^[=+\-@\t\r]/.test(t)) t = "'" + t; return '"' + t.replace(/"/g, '""') + '"'; }; // evita fórmulas em planilhas
  $('#csv').onclick = () => {
    if (!ok) return toast('Os dados não foram carregados; não há o que exportar.', true);
    const r = { ...zero.revisao, ...R.revisao }, p = { ...zero.prioridades, ...R.prioridades };
    const L = [['secao', 'item', 'valor'], ['filtro', 'data_inicial', q.de], ['filtro', 'data_final', q.ate], ['filtro', 'local', q.local], ['resumo', 'analises', +R.analises || 0],
      ...Object.entries(r).map(([k, n]) => ['revisao', k, +n || 0]), ...R.porClasse.map(c => ['deteccoes_por_classe', c.classe, +c.total || 0]), ...Object.entries(p).map(([k, n]) => ['ocorrencias_por_prioridade', k, +n || 0])];
    const b = new Blob(['\ufeff' + L.map(l => l.map(cel).join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'relatorio.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  carregar();
}

async function pgConfig() {
  const c = Cfg.get(), v = $('#view'), my = rotaN;
  v.innerHTML = cab('Configurações', 'Preferências de exibição.') + `<section class="card"><div class="cb">
  <div class="f"><label for="pp">Registros por página</label><select id="pp">${[5, 10, 25, 50].map(n => `<option ${n == c.porPagina ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
  <div class="f"><label for="cl">Classes nos filtros (separadas por vírgula)</label><input id="cl" value="${esc(c.classes.join(', '))}"></div>
  <button class="btn pri" id="sv">Salvar preferências</button><hr><p>Versão: v0.1.0</p><p>API: <code>${esc(CONFIG.API_URL)}</code> — <span id="ap" class="tag gray">Verificando…</span></p></div></section>`;
  $('#sv').onclick = () => {
    const cl = [...new Set($('#cl').value.split(',').map(x => x.trim()).filter(Boolean))];
    if (!cl.length || cl.some(x => x.length > 40)) return toast('Informe ao menos uma classe (máx. 40 caracteres cada).', true);
    Cfg.set({ porPagina: +$('#pp').value, classes: cl }) ? toast('Preferências salvas.') : toast('Não foi possível salvar neste navegador.', true);
  };
  const r = await safe(Api.saude(), null); if (my !== rotaN) return; $('#ap').textContent = r.e ? 'Desconectada' : 'Conectada'; $('#ap').className = 'tag ' + (r.e ? 'red' : 'green');
}

/* ---------- roteador ---------- */
const naoEncontrada = () => { $('#view').innerHTML = cab('Página não encontrada', 'O endereço informado não existe.', '<a class="btn" href="#/">Ir para a Visão Geral</a>'); };
function rota() {
  if (sair) { sair(); sair = null; } rotaN++;
  const [, r = '', p] = (location.hash || '#/').slice(1).split('/');
  document.querySelectorAll('nav a').forEach(a => { const on = a.dataset.r == (r == 'analise' ? 'analises' : r); a.classList.toggle('on', on); on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'); });
  const m = { '': pgGeral, analises: pgAnalises, videos: pgVideos, relatorios: pgRelatorios, configuracoes: pgConfig };
  let id = ''; try { id = decodeURIComponent(p || '').trim(); } catch { id = ''; }
  if (r == 'analise') id ? pgDetalhe(id) : naoEncontrada(); else (Object.hasOwn(m, r) ? m[r] : naoEncontrada)();
  $('#view').focus(); window.scrollTo(0, 0);
}
$('#skip').addEventListener('click', e => { e.preventDefault(); $('#view').focus(); }); // não altera a rota
addEventListener('hashchange', rota); rota();