/* Camada de serviços — única parte que fala com o back-end.
   ⚠ Rotas e campos abaixo são PROPOSTAS: ajustar ao contrato definido com a equipe da API/MySQL. */
const CONFIG = {
  API_URL: window.API_URL || 'http://localhost:8000', // alterar aqui (ou definir window.API_URL antes de api.js)
  VIDEO_MIN_S: 10, VIDEO_MAX_S: 40,                    // duração aceita (configurável)
  FORMATOS: ['video/mp4', 'video/webm', 'video/quicktime'], TAM_MAX_MB: 200
};

async function req(caminho, opcoes) {
  let r;
  try { r = await fetch(CONFIG.API_URL + caminho, opcoes); }
  catch { throw new Error('Sem conexão com a API.'); }
  if (!r.ok) throw new Error('A API respondeu com erro ' + r.status + '.');
  try { return await r.json(); } catch { throw new Error('Resposta inválida da API.'); }
}
// Uma resposta com formato errado vira erro; nunca é convertida em "dados vazios".
const exigir = (d, lista) => {
  if (lista ? !Array.isArray(d) : !(d && typeof d === 'object' && !Array.isArray(d))) throw new Error('Resposta inválida da API.');
  return d;
};
const obj = (c, o) => req(c, o).then(d => exigir(d, false));
const arr = (c, o) => req(c, o).then(d => exigir(d, true));
// Content-Type só em JSON; no upload multipart o navegador define o boundary.
const post = corpo => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) });
const eid = encodeURIComponent;

const Api = {
  // → { totais:{videos,deteccoes,placas,semaforos,problemas}, serie:[{rotulo,valor}], distribuicao:[{classe,total}], recentes:[Analise] }
  dashboard: dias => obj('/dashboard?dias=' + eid(dias)),
  // Analise: { id, video, local, data, horario, duracao(s), deteccoes, status:'na_fila|processando|concluida|falhou', videoUrl }
  listarAnalises: () => arr('/analises'),
  obterAnalise: id => obj('/analises/' + eid(id)),
  statusProcessamento: id => obj('/analises/' + eid(id) + '/status'), // → { status, progresso? } (progresso só se a API informar)
  // Deteccao: { id, tempo(s), classe, confianca(0-1), revisao:'pendente|confirmada|rejeitada|corrigida', classeCorrigida, obs,
  //             caixa:{x,y,l,a} (0-1, relativo ao frame) }
  deteccoes: id => arr('/analises/' + eid(id) + '/deteccoes'),
  // Declarado, mas NÃO usado: depende de a equipe definir se a API entrega frames individuais.
  frames: id => arr('/analises/' + eid(id) + '/frames'),
  // acao: 'confirmar' | 'rejeitar' | 'corrigir' ; corpo: { classe?, obs? } → Deteccao atualizada
  revisar: (id, detId, acao, corpo) => obj('/analises/' + eid(id) + '/deteccoes/' + eid(detId) + '/' + acao, post(corpo)),
  // Ocorrencia: { id, tempo, tipo, descricao, prioridade:'alta|media|baixa', revisao }
  ocorrencias: id => arr('/analises/' + eid(id) + '/ocorrencias'),
  // → { analises, porClasse:[{classe,total}], revisao:{confirmadas,rejeitadas,corrigidas,pendentes}, prioridades:{alta,media,baixa} }
  relatorio: q => obj('/relatorios?' + new URLSearchParams(q)),
  saude: () => obj('/saude'),
  // Upload com progresso real de envio (XHR). Não há progresso de processamento fictício.
  enviarVideo(arquivo, meta, aoProgredir) {
    return new Promise((ok, falha) => {
      const x = new XMLHttpRequest(), fd = new FormData();
      fd.append('video', arquivo); Object.entries(meta).forEach(([k, v]) => v && fd.append(k, v));
      x.open('POST', CONFIG.API_URL + '/analises');
      x.upload.onprogress = e => e.lengthComputable && aoProgredir(e.loaded / e.total);
      x.onload = () => {
        if (x.status >= 300) return falha(new Error('A API respondeu com erro ' + x.status + '.'));
        try { const r = JSON.parse(x.responseText); (r && r.id != null && r.id !== '') ? ok(r) : falha(new Error('A API não retornou o identificador da análise.')); }
        catch { falha(new Error('Resposta inválida da API.')); }
      };
      x.onerror = () => falha(new Error('Sem conexão com a API.'));
      x.ontimeout = () => falha(new Error('Tempo de envio esgotado.'));
      x.send(fd);
    });
  }
};
