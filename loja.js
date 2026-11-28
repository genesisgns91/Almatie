// Almatiê Art — vitrine (arquivo único carregado pelo index.html como módulo)
// Seções: galeria · preço e descontos · tema/identidade · vitrine e filtros · checkout (pix-checkout.js) · painel admin
import { db, auth } from './firebase-config.js';
import { collection, addDoc, getDocs, doc, updateDoc, setDoc, getDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";


// Worker que entrega o painel de administração (só depois de conferir o login do admin)
const ADMIN_WORKER = "https://almatie-site.almatie-stock.workers.dev";



let usuarioAtual = null;
let produtosMemoria = [];
let filtroCategoriaAtiva = 'TODOS';
let filtroTipoAtivo = 'TODOS';
let filtroSubAtiva = 'TODOS';
let termoBusca = '';
let produtosCarregados = false;
let configLoja = null;
let painelAdminCarregado = false;


let galeriaImagens = [];
let galeriaIndexAtual = 0;

// GALERIA EXPANDIDA (LIGHTBOX)
function abrirGaleria(prod) {
  galeriaImagens = prod.imagens || [];
  galeriaIndexAtual = 0;

  document.getElementById('galeriaTitulo').innerText = prod.titulo || '';

  let metaHTML = htmlQtdArtes(prod);
  if (prod.tipo) metaHTML += `<span class="badge-tag badge-tipo">${esc(prod.tipo)}</span>`;
  metaHTML += `<span class="badge-tag badge-cat">${esc(prod.categoria || 'Geral')}</span>`;
  if (prod.classe) metaHTML += `<span class="badge-tag badge-sub">${esc(prod.classe)}</span>`;
  document.getElementById('galeriaMeta').innerHTML = metaHTML;

  // descrição completa; se o pack só tem o texto curto, ele aparece aqui também
  const descCompleta = prod._desc ?? sanitizarDescricao(prod.descricao);
  document.getElementById('galeriaDescricao').innerHTML = htmlParaTexto(descCompleta).trim() ? descCompleta : esc(String(prod.resumo || '').trim());

  const tagsBox = document.getElementById('galeriaTags');
  tagsBox.innerHTML = '';
  (prod.tags || []).forEach((t) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'galeria-tag';
    chip.textContent = '#' + t;
    chip.addEventListener('click', () => { fecharGaleria(); definirBusca(t); document.getElementById('barraFiltros').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    tagsBox.appendChild(chip);
  });
  tagsBox.classList.toggle('escondido', !(prod.tags || []).length);

  const info = infoPreco(prod);
  const rotulo = document.getElementById('galeriaPrecoLabel');
  rotulo.className = 'preco-label' + (info.ativa ? ' promo' : '');
  rotulo.innerHTML = htmlRotuloPreco(info);
  document.getElementById('galeriaPrecoValor').innerText = info.atual;
  const validade = document.getElementById('galeriaValidade');
  validade.classList.toggle('escondido', !info.ate);
  validade.textContent = info.ate ? `Promoção até ${formatarFimPromo(info.ate)}` : '';
  document.getElementById('galeriaPixWrap').innerHTML = htmlLinhaPix(prod);
  document.getElementById('galeriaBtnCompartilhar').onclick = (e) => compartilharArte(prod, e.currentTarget);
  document.getElementById('galeriaBtnComprar').onclick = () => window.iniciarCheckout(prod.id, encodeURIComponent(prod.titulo), info.atual);

  renderizarGaleriaImagens();

  galeriaAbertaPor = document.activeElement;
  document.getElementById('modalGaleria').classList.remove('escondido');
  document.querySelector('#modalGaleria .galeria-texto').scrollTop = 0;
  document.getElementById('btnFecharGaleria').focus({ preventScroll: true });

  // proporção inicial entre imagem e texto, conforme o tamanho do texto do anúncio
  const contGaleria = document.querySelector('#modalGaleria .modal-galeria-container');
  const tamanhoTexto = (document.getElementById('galeriaDescricao').textContent || '').trim().length;
  contGaleria.dataset.texto = tamanhoTexto > 700 ? 'longo' : tamanhoTexto > 300 ? 'medio' : 'curto';
  definirModoLeituraGaleria(false);
  document.body.style.overflow = 'hidden';
}

// Monta a grade de miniaturas (uma vez, ao abrir) e mostra a imagem atual em tamanho grande
function renderizarGaleriaImagens() {
  const grade = document.getElementById('galeriaGradeMini');
  grade.innerHTML = '';
  galeriaImagens.forEach((url, idx) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'galeria-mini';
    b.setAttribute('aria-label', `Ver imagem ${idx + 1} de ${galeriaImagens.length}`);
    const img = document.createElement('img');
    img.loading = 'lazy';
    img.decoding = 'async';
    img.alt = '';
    img.src = miniatura(url, 200);
    b.appendChild(img);
    b.addEventListener('click', () => irParaImagemGaleria(idx));
    grade.appendChild(b);
  });
  const temVarias = galeriaImagens.length > 1;
  document.getElementById('btnPrevGaleria').style.display = temVarias ? 'flex' : 'none';
  document.getElementById('btnNextGaleria').style.display = temVarias ? 'flex' : 'none';
  document.getElementById('galeriaMiniaturas').style.display = temVarias ? '' : 'none';
  document.getElementById('galeriaTotal').textContent = `${galeriaImagens.length} fotos`;
  atualizarImagemGaleria();
}

function atualizarImagemGaleria() {
  const total = galeriaImagens.length;
  const url = galeriaImagens[galeriaIndexAtual];
  const palco = document.getElementById('galeriaCarrosselImgs');
  palco.innerHTML = '';
  if (url) {
    const slide = document.createElement('div');
    slide.className = 'galeria-slide ativo';
    const img = document.createElement('img');
    img.alt = `${document.getElementById('galeriaTitulo').textContent} — imagem ${galeriaIndexAtual + 1} de ${total}`;
    img.src = miniatura(url, 1280);
    slide.appendChild(img);
    slide.insertAdjacentHTML('beforeend', htmlMarcaDagua());
    palco.appendChild(slide);
    // deixa as vizinhas prontas para a troca ser instantânea
    [1, -1].forEach((d) => { const v = galeriaImagens[(galeriaIndexAtual + d + total) % total]; if (v && total > 1) new Image().src = miniatura(v, 1280); });
  }
  document.getElementById('galeriaContador').textContent = total > 1 ? `${galeriaIndexAtual + 1} / ${total}` : '';
  document.querySelectorAll('#galeriaGradeMini .galeria-mini').forEach((m, i) => {
    const ativo = i === galeriaIndexAtual;
    m.classList.toggle('ativo', ativo);
    if (ativo) m.setAttribute('aria-current', 'true'); else m.removeAttribute('aria-current');
    if (ativo) m.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  });
}

// alterna entre "imagem grande" e "texto com mais espaço"
function definirModoLeituraGaleria(ligado) {
  document.querySelector('#modalGaleria .modal-galeria-container').classList.toggle('leitura', ligado);
  const b = document.getElementById('btnLeituraGaleria');
  b.textContent = ligado ? '⤡ Ver imagem maior' : '⤢ Ampliar texto';
  b.setAttribute('aria-pressed', ligado ? 'true' : 'false');
}

function irParaImagemGaleria(idx) {
  if (!galeriaImagens.length) return;
  galeriaIndexAtual = (idx + galeriaImagens.length) % galeriaImagens.length;
  atualizarImagemGaleria();
}

function mudarSlideGaleria(dir) {
  irParaImagemGaleria(galeriaIndexAtual + dir);
}

let galeriaAbertaPor = null;
function fecharGaleria() {
  document.getElementById('modalGaleria').classList.add('escondido');
  document.body.style.overflow = '';
  if (galeriaAbertaPor && galeriaAbertaPor.isConnected && galeriaAbertaPor !== document.body) { try { galeriaAbertaPor.focus({ preventScroll: true }); } catch (e) { /* ignora */ } }
  galeriaAbertaPor = null;
}

function mostrarToast(texto, tipo = 'padrao') {
  const anterior = document.querySelector('.toast');
  if (anterior) anterior.remove();
  const toast = document.createElement('div');
  toast.className = `toast ${tipo === 'erro' ? 'toast-erro' : tipo === 'sucesso' ? 'toast-sucesso' : ''}`;
  toast.innerText = texto;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2600);
}












// ----- Limpeza do texto formatado: só passa o que é seguro e simples -----
const TAGS_REMOVER = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'IMG', 'SVG', 'LINK', 'META', 'FORM', 'INPUT',
  'BUTTON', 'TEXTAREA', 'SELECT', 'VIDEO', 'AUDIO', 'CANVAS', 'MATH', 'NOSCRIPT', 'TEMPLATE', 'BASE', 'TITLE', 'HEAD']);
const TAGS_PERMITIDAS = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'BR', 'P', 'DIV', 'SPAN', 'UL', 'OL', 'LI', 'A', 'H3', 'H4']);
const COR_OK = /^(#[0-9a-f]{3,8}|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*[\d.]+\s*)?\))$/i;

function sanitizarDescricao(html) {
  if (!html) return '';
  const doc = new DOMParser().parseFromString('<body>' + html + '</body>', 'text/html');

  const limpar = (pai) => {
    Array.from(pai.childNodes).forEach((no) => {
      if (no.nodeType === 3) return;                        // texto puro
      if (no.nodeType !== 1) { no.remove(); return; }       // comentários etc.
      if (TAGS_REMOVER.has(no.tagName)) { no.remove(); return; }
      limpar(no);

      let tag = no.tagName;
      let cor = '';
      if (tag === 'FONT') {                                  // texto antigo: só aproveita a cor
        cor = no.getAttribute('color') || no.style.color || '';
        const span = doc.createElement('span');
        while (no.firstChild) span.appendChild(no.firstChild);
        no.replaceWith(span);
        no = span; tag = 'SPAN';
      } else if (tag === 'SPAN') {
        cor = no.style.color || '';
      }
      if (!TAGS_PERMITIDAS.has(tag)) {                       // tag desconhecida: fica só o texto dentro
        no.replaceWith(...Array.from(no.childNodes));
        return;
      }

      const alinhar = ['DIV', 'P', 'H3', 'H4'].includes(tag) ? no.style.textAlign : '';
      const href = tag === 'A' ? (no.getAttribute('href') || '').trim() : '';
      Array.from(no.attributes).forEach((a) => no.removeAttribute(a.name));

      if (tag === 'SPAN') {
        if (COR_OK.test(cor)) no.style.color = cor;
        else if (!no.attributes.length) { no.replaceWith(...Array.from(no.childNodes)); return; }
      }
      if (alinhar && ['left', 'center', 'right'].includes(alinhar)) no.style.textAlign = alinhar;
      if (tag === 'A') {
        if (/^(https?:\/\/|mailto:)/i.test(href)) {
          no.setAttribute('href', href);
          no.setAttribute('target', '_blank');
          no.setAttribute('rel', 'noopener noreferrer nofollow');
        } else {
          no.replaceWith(...Array.from(no.childNodes));      // link inseguro: vira texto comum
        }
      }
    });
  };
  limpar(doc.body);
  return doc.body.innerHTML.trim();
}

// ----- Preço, desconto e tags -----
const precoParaNumero = (s) => parseFloat(String(s || '0').replace(/\./g, '').replace(',', '.')) || 0;

function infoPreco(prod) {
  const original = precoParaNumero(prod.preco);
  const promo = precoParaNumero(prod.precoPromo);
  const ate = Number(prod.promoAte) || 0;
  const vigente = promo > 0 && promo < original && (!ate || Date.now() < ate);
  // promoção só para uma forma de pagamento (ex.: só no Pix): o preço de vitrine continua o cheio e a promoção aparece numa linha à parte
  const metodo = (prod.promoMetodo === 'pix' || prod.promoMetodo === 'cartao') ? prod.promoMetodo : 'todos';
  const ativa = vigente && metodo === 'todos';
  return {
    ativa,
    vigente,
    promoMetodo: metodo,
    promoTexto: vigente && metodo !== 'todos' ? prod.precoPromo : '',
    atual: ativa ? prod.precoPromo : (prod.preco || '0,00'),
    original: prod.preco || '0,00',
    desconto: vigente ? Math.round((1 - promo / original) * 100) : 0,
    ate: vigente && ate ? ate : 0
  };
}

const formatarFimPromo = (ms) => new Date(ms).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

function htmlRotuloPreco(i) {
  return i.ativa ? `<s>R$ ${esc(i.original)}</s><em class="pill-desc">-${i.desconto}%</em>` : 'Valor';
}

// ----- Ofertas: desconto no Pix / em qualquer pagamento e "leve também" (configurados no painel) -----
// IMPORTANTE: o Worker de pagamentos refaz estas mesmas contas no servidor (é ele que cobra).
// Tudo em centavos inteiros para não ter erro de arredondamento.
// >>> INÍCIO OFERTAS (o teste automático confere este trecho com o Worker de pagamentos: não renomeie) <<<
const LIMITE_DESCONTO_PCT = 70;   // teto de segurança: nenhum pedido recebe mais que isso de desconto, somando tudo
const MAX_ITENS_PEDIDO = 30;      // máximo de packs em um mesmo pedido (principal + extras)
const OFERTAS_PADRAO = {
  combo: { ativo: false, percentual: 20 },
  pix: { ativo: false, tipo: 'percentual', valor: 10, aplicarEm: 'pix' },
  cartao: { ativo: false, tipo: 'percentual', valor: 5 },
  carrinho: { ativo: false, faixas: [{ minItens: 5, percentual: 10 }, { minItens: 10, percentual: 20 }] },
  cupomValor: { ativo: false, minimo: 100, tipo: 'percentual', valor: 10, validadeDias: 30, metodo: 'todos' }
};

// forma de pagamento a que algo se aplica: 'todos' | 'pix' | 'cartao'
const normalizarMetodo = (m) => (m === 'pix' || m === 'cartao') ? m : 'todos';
const metodoVale = (regraMetodo, metodo) => regraMetodo === 'todos' || regraMetodo === metodo;

const emCentavos = (reais) => Math.round(reais * 100);

// regra de desconto de pagamento (Pix ou cartão): { ativo, tipo, valor }
function normalizarRegraPagamento(x, padrao) {
  const n = (x && typeof x === 'object') ? x : {};
  const num = (v, min, max, pad) => { const k = Number(v); return Number.isFinite(k) ? Math.min(max, Math.max(min, k)) : pad; };
  const tipo = n.tipo === 'valor' ? 'valor' : 'percentual';
  return {
    ativo: n.ativo === true,
    tipo,
    valor: tipo === 'valor' ? Math.round(num(n.valor, 0.01, 999, 1) * 100) / 100 : Math.round(num(n.valor, 1, LIMITE_DESCONTO_PCT, padrao) * 10) / 10
  };
}

// faixas do carrinho: [{ minItens, percentual }] — "a partir de N packs, X% de desconto no pedido todo"
function normalizarFaixasCarrinho(lista) {
  if (!Array.isArray(lista)) return OFERTAS_PADRAO.carrinho.faixas.map((f) => ({ ...f }));
  const vistos = new Set();
  const faixas = [];
  for (const f of lista.slice(0, 20)) {
    if (!f || typeof f !== 'object') continue;
    const m = Math.round(Number(f.minItens)), p = Math.round(Number(f.percentual));
    if (!Number.isFinite(m) || !Number.isFinite(p) || m < 2 || m > MAX_ITENS_PEDIDO || p < 1 || p > LIMITE_DESCONTO_PCT || vistos.has(m)) continue;
    vistos.add(m);
    faixas.push({ minItens: m, percentual: p });
  }
  faixas.sort((a, b) => a.minItens - b.minItens);
  return faixas.slice(0, 6);
}

// desconto de pagamento DESTE pack (cadastro do anúncio): { ativo, metodo, tipo, valor }. Quando vale, substitui o desconto geral só para este pack.
function normalizarDescontoPagamentoItem(d) {
  const s = (d && typeof d === 'object') ? d : {};
  const r = normalizarRegraPagamento({ ativo: s.ativo, tipo: s.tipo, valor: s.valor }, 10);
  return { ativo: r.ativo, metodo: normalizarMetodo(s.metodo), tipo: r.tipo, valor: r.valor };
}

// cupom automático por valor de compra: "compras a partir de R$ X ganham um cupom para a próxima compra"
function normalizarCupomValor(x) {
  const s = (x && typeof x === 'object') ? x : {};
  const n = (v, min, max, pad) => { const k = Number(v); return Number.isFinite(k) ? Math.min(max, Math.max(min, k)) : pad; };
  const tipo = s.tipo === 'valor' ? 'valor' : 'percentual';
  return {
    ativo: s.ativo === true,
    minimo: Math.round(n(s.minimo, 1, 99999, 100) * 100) / 100,
    tipo,
    valor: tipo === 'valor' ? Math.round(n(s.valor, 0.01, 999, 5) * 100) / 100 : Math.round(n(s.valor, 1, LIMITE_DESCONTO_PCT, 10) * 10) / 10,
    validadeDias: Math.round(n(s.validadeDias, 1, 365, 30)),
    metodo: normalizarMetodo(s.metodo)
  };
}

function normalizarOfertas(o) {
  const s = (o && typeof o === 'object') ? o : {};
  const c = (s.combo && typeof s.combo === 'object') ? s.combo : {};
  const x = (s.pix && typeof s.pix === 'object') ? s.pix : {};
  const k = (s.carrinho && typeof s.carrinho === 'object') ? s.carrinho : {};
  const num = (v, min, max, pad) => { const n = Number(v); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : pad; };
  return {
    combo: { ativo: c.ativo === true, percentual: Math.round(num(c.percentual, 1, LIMITE_DESCONTO_PCT, 20)) },
    pix: { ...normalizarRegraPagamento(x, 10), aplicarEm: x.aplicarEm === 'todos' ? 'todos' : 'pix' },
    cartao: normalizarRegraPagamento(s.cartao, 5),
    carrinho: { ativo: k.ativo === true, faixas: normalizarFaixasCarrinho(k.faixas) },
    cupomValor: normalizarCupomValor(s.cupomValor)
  };
}

// "leve também" de CADA pack (cadastro do anúncio): este pack libera desconto no 2º pack?
function normalizarLeveTambem(l) {
  const s = (l && typeof l === 'object') ? l : {};
  const n = Number(s.percentual);
  return {
    ativo: s.ativo === true,
    percentual: Math.round(Number.isFinite(n) ? Math.min(LIMITE_DESCONTO_PCT, Math.max(1, n)) : 20),
    metodo: normalizarMetodo(s.metodo)
  };
}

// cupom no cálculo: { tipo: 'percentual' | 'valor', valor } ou null
function normalizarCupomCalculo(c) {
  if (!c || typeof c !== 'object') return null;
  const n = Number(c.valor);
  if (!Number.isFinite(n) || n <= 0) return null;
  const tipo = c.tipo === 'valor' ? 'valor' : 'percentual';
  return { tipo, valor: tipo === 'valor' ? Math.round(Math.min(999, n) * 100) / 100 : Math.round(Math.min(LIMITE_DESCONTO_PCT, Math.max(1, n)) * 10) / 10, metodo: normalizarMetodo(c.metodo) };
}

// um pack na conta: { preco (centavos), promoPreco (centavos, 0 = sem promoção em vigor), promoMetodo, pag (desconto de pagamento do pack) }.
// Aceita também só o número em centavos. A promoção pode valer só para uma forma de pagamento.
function itemDoCalculo(x) {
  const it = (typeof x === 'number') ? { preco: x } : (x || {});
  const preco = Math.round(Number(it.preco)) || 0;
  const promo = Math.round(Number(it.promoPreco)) || 0;
  return { preco, promoPreco: (promo > 0 && promo < preco) ? promo : 0, promoMetodo: normalizarMetodo(it.promoMetodo), pag: normalizarDescontoPagamentoItem(it.pag), leve: it.leve === true };
}
const precoDoItem = (it, metodo) => (it.promoPreco > 0 && metodoVale(it.promoMetodo, metodo)) ? it.promoPreco : it.preco;

// regra de pagamento que vale para a forma escolhida (ou null). metodo: 'pix' | 'cartao'
function regraDoMetodo(o, metodo) {
  if (metodo === 'pix') return o.pix.ativo ? o.pix : null;
  if (o.cartao.ativo) return o.cartao;
  return (o.pix.ativo && o.pix.aplicarEm === 'todos') ? o.pix : null;
}

// maior faixa do carrinho alcançada com "qtd" packs (ou null)
function faixaDoCarrinho(carrinho, qtd) {
  let melhor = null;
  for (const f of carrinho.faixas) if (f.minItens <= qtd && (!melhor || f.minItens > melhor.minItens)) melhor = f;
  return melhor;
}

// desconto de pagamento sobre um subtotal (em centavos)
function descontoPagamentoCentavos(subtotal, regra) {
  if (!regra || !regra.ativo || subtotal <= 0) return 0;
  const bruto = regra.tipo === 'valor' ? emCentavos(regra.valor) : Math.round(subtotal * regra.valor / 100);
  return Math.max(0, Math.min(bruto, Math.floor(subtotal * LIMITE_DESCONTO_PCT / 100)));
}

// A CONTA DO PEDIDO (tudo em centavos). itens[0] = pack principal; os demais = packs extras.
// REGRA DE OURO: nenhum desconto soma com outro. Cada pack recebe UM só desconto: o MAIOR entre
//   - a promoção do pack (se vale para a forma de pagamento escolhida),
//   - o desconto de pagamento (Pix/cartão): o do próprio pack, quando ele tem, senão o geral,
//   - o desconto do carrinho (por quantidade de packs, só com 2 ou mais),
//   - o "leve também" (só no 2º pack, só se o cliente aceitou a oferta e o 1º pack a tem ligada),
//   - o cupom (só se for da forma de pagamento escolhida).
// Empate: vale o automático (o cupom não é gasto). Os descontos de um pack (menos a promoção que você mesma definiu) nunca passam de 70% do preço dele.
// O que é "valor fixo" (R$) é repartido entre os packs na proporção do preço antes de comparar.
function calcularPedidoCentavos(itensEntrada, leveTambem, metodo, ofertas, cupom) {
  const o = normalizarOfertas(ofertas);
  const lt = normalizarLeveTambem(leveTambem);
  const cp0 = normalizarCupomCalculo(cupom);
  const cupomFora = !!cp0 && !metodoVale(cp0.metodo, metodo);      // cupom de outra forma de pagamento: não vale neste pedido
  const cp = cupomFora ? null : cp0;
  const itens = itensEntrada.map(itemDoCalculo);
  const qtd = itens.length;
  const cheio = itens.reduce((t, it) => t + it.preco, 0);
  const teto = (preco) => Math.floor(preco * LIMITE_DESCONTO_PCT / 100);
  const precos = itens.map((it) => precoDoItem(it, metodo));      // preço do pack só com a promoção (referência de vitrine)
  const p1 = precos[0] || 0;
  const p2 = precos.slice(1).reduce((t, x) => t + x, 0);

  // reparte um valor fixo entre os packs indicados (na proporção do preço; sobra de centavos para o primeiro)
  const repartir = (total, indices) => {
    const soma = indices.reduce((t, i) => t + itens[i].preco, 0);
    const parte = itens.map(() => 0);
    if (soma <= 0 || total <= 0) return parte;
    const t = Math.min(total, teto(soma));
    indices.forEach((i) => { parte[i] = Math.floor(t * itens[i].preco / soma); });
    parte[indices[0]] += t - indices.reduce((s, i) => s + parte[i], 0);
    return parte;
  };

  // 1) promoção
  const dPromo = itens.map((it, i) => Math.max(0, it.preco - precos[i]));
  // 2) desconto de pagamento (Pix/cartão): próprio do pack ou geral
  const regraGeral = metodo === 'todos' ? null : regraDoMetodo(o, metodo);
  const proprio = itens.map((it) => metodo !== 'todos' && it.pag.ativo && metodoVale(it.pag.metodo, metodo));
  const dPag = itens.map(() => 0);
  let temProprio = false;
  itens.forEach((it, i) => {
    if (proprio[i]) {
      temProprio = true;
      dPag[i] = it.pag.tipo === 'valor' ? Math.min(emCentavos(it.pag.valor), teto(it.preco)) : Math.round(it.preco * it.pag.valor / 100);
    }
  });
  if (regraGeral && regraGeral.ativo) {
    const idx = itens.map((_, i) => i).filter((i) => !proprio[i]);
    if (regraGeral.tipo === 'valor') {
      const parte = repartir(emCentavos(regraGeral.valor), idx);
      idx.forEach((i) => { dPag[i] = parte[i]; });
    } else idx.forEach((i) => { dPag[i] = Math.round(itens[i].preco * regraGeral.valor / 100); });
  }
  // 3) carrinho
  const dCarrinho = itens.map(() => 0);
  if (qtd > 1 && o.carrinho.ativo) {
    const f = faixaDoCarrinho(o.carrinho, qtd);
    if (f) itens.forEach((it, i) => { dCarrinho[i] = Math.round(it.preco * f.percentual / 100); });
  }
  // 4) "leve também": só o 2º pack, só quando o cliente aceitou a oferta
  const dCombo = itens.map(() => 0);
  if (qtd === 2 && itens[1].leve && o.combo.ativo && lt.ativo && metodoVale(lt.metodo, metodo)) {
    dCombo[1] = Math.round(itens[1].preco * lt.percentual / 100);
  }
  // 5) cupom
  let dCupom = itens.map(() => 0);
  if (cp) {
    if (cp.tipo === 'valor') dCupom = repartir(emCentavos(cp.valor), itens.map((_, i) => i));
    else itens.forEach((it, i) => { dCupom[i] = Math.round(it.preco * cp.valor / 100); });
  }

  // cada pack fica com o maior; em empate vale o primeiro da lista (o cupom é o último)
  const ordem = [['promo', dPromo], ['pagamento', dPag], ['carrinho', dCarrinho], ['combo', dCombo], ['cupom', dCupom]];
  const soma = { promo: 0, pagamento: 0, carrinho: 0, combo: 0, cupom: 0 };
  const porItem = [];
  itens.forEach((it, i) => {
    let melhor = 0, tipo = '';
    for (const [nome, lista] of ordem) { const d = nome === 'promo' ? lista[i] : Math.min(lista[i], teto(it.preco)); if (d > melhor) { melhor = d; tipo = nome; } }
    soma[tipo || 'promo'] += melhor;
    porItem.push({ desconto: melhor, tipo, total: it.preco - melhor });
  });
  const descontoTotal = porItem.reduce((t, x) => t + x.desconto, 0);
  const total = cheio - descontoTotal;
  const itensDesc = soma.carrinho + soma.combo + soma.cupom;
  const origemDesc = soma.cupom > 0 ? 'cupom' : (soma.combo > 0 ? 'combo' : (soma.carrinho > 0 ? 'carrinho' : ''));
  return { qtd, p1, p2, base: p1 + p2, cheio, descontoTotal, porItem, soma, descCupom: soma.cupom, cupomVale: soma.cupom > 0, cupomFora,
    descCombo: soma.combo, descCarrinho: soma.carrinho, descPromo: soma.promo, descItens: itensDesc, origemDesc, descPix: soma.pagamento, temProprio, total };
}
// >>> FIM OFERTAS <<<

// selo "Novo": { novo: { ativo, dias } } — aparece nos packs publicados há poucos dias
function normalizarSelos(x) {
  const n = (x && x.novo && typeof x.novo === 'object') ? x.novo : {};
  const d = Number(n.dias);
  return { novo: { ativo: n.ativo !== false, dias: Number.isFinite(d) ? Math.min(90, Math.max(1, Math.round(d))) : 14 } };
}

const ofertasAtuais = () => normalizarOfertas(configLoja && configLoja.ofertas);
const centavosParaTexto = (c) => (c / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const precoAtualCentavos = (prod) => emCentavos(precoParaNumero(infoPreco(prod).atual));
// o pack como entra na conta do pedido (o Worker monta igual a partir do cadastro)
function itemDoProduto(prod) {
  const i = infoPreco(prod);
  return {
    preco: emCentavos(precoParaNumero(prod.preco)),
    promoPreco: i.vigente ? emCentavos(precoParaNumero(prod.precoPromo)) : 0,
    promoMetodo: i.promoMetodo,
    pag: prod.descontoPagamento
  };
}

// monta o pedido: pack principal + extras (lista, 1 pack ou nada) + cupom opcional ({tipo, valor}).
// O desconto do "leve também" vem do cadastro do pack principal.
function calcularPedidoLoja(prod, extras, metodo, ofertas, cupom, leveId) {
  const lista = Array.isArray(extras) ? extras : (extras ? [extras] : []);
  return calcularPedidoCentavos([prod, ...lista].map((p) => ({ ...itemDoProduto(p), leve: !!leveId && p !== prod && p.id === leveId })), prod && prod.leveTambem, metodo, ofertas || ofertasAtuais(), cupom);
}

function textoRegra(regra, rotuloMetodo) {
  const quanto = regra.tipo === 'valor' ? centavosParaTexto(emCentavos(regra.valor)) : `${String(regra.valor).replace('.', ',')}%`;
  return `${quanto} de desconto ${rotuloMetodo}`;
}
const textoRegraPix = (pixCfg) => textoRegra(pixCfg, pixCfg.aplicarEm === 'pix' ? 'no Pix' : 'no pagamento');

// Descontos por forma de pagamento deste pack, já com a conta real (calcularPedidoCentavos) para 1 pack:
// considera a promoção por forma de pagamento e o desconto próprio do pack.
// Devolve só o que realmente baixa o preço mostrado na vitrine: [{metodo, icone, rotulo, total, pct, sel}]
function descontosPorMetodo(prod) {
  const o = ofertasAtuais();
  const item = itemDoProduto(prod);
  if (item.preco <= 0) return [];
  const ref = precoDoItem(itemDoCalculo(item), 'todos');          // preço mostrado na vitrine (promoção geral, se houver); a promoção de uma forma só aparece na linha dela
  if (ref <= 0) return [];
  const todos = o.pix.ativo && o.pix.aplicarEm === 'todos' && !o.cartao.ativo && !itemDoCalculo(item).pag.ativo;
  const formas = todos ? [['pix', '🏷️', 'no pagamento']] : [['pix', '💠', 'no Pix'], ['cartao', '💳', 'no cartão']];
  return formas.map(([metodo, icone, rotulo]) => {
    const c = calcularPedidoCentavos([item], null, metodo, o, null);
    if (c.total >= ref) return null;
    const regra = regraDoMetodo(o, metodo);
    const pct = Math.round((1 - c.total / ref) * 100);
    const sel = (!c.temProprio && regra && regra.tipo === 'valor') ? `−${centavosParaTexto(ref - c.total)}` : `−${pct}%`;
    return { metodo, icone, rotulo, total: c.total, pct, sel };
  }).filter(Boolean);
}

// faixa(s) em destaque sob o preço: "💠 R$ 6,21 no Pix  −10%" (o Pix vem em verde forte; o cartão, mais discreto)
function htmlLinhaPix(prod) {
  const ds = descontosPorMetodo(prod);
  if (!ds.length) return '';
  return `<div class="precos-metodo">${ds.map((d) => `<span class="preco-pix ${d.metodo}" title="${esc(`${centavosParaTexto(d.total)} ${d.rotulo}`)}"><span class="preco-pix-txt">${d.icone} <b>${esc(centavosParaTexto(d.total))}</b> ${d.rotulo}</span><em>${esc(d.sel)}</em></span>`).join('')}</div>`;
}

// selo sobre a imagem: o desconto que mais chama atenção neste pack ("🔥 −25%" ou "💠 −10% no Pix")
function htmlSeloPromo(prod) {
  const i = infoPreco(prod);
  if (i.ativa) return `<span class="selo-promo" title="Promoção">🔥 −${i.desconto}% OFF</span>`;
  const melhor = descontosPorMetodo(prod).sort((a, b) => b.pct - a.pct)[0];
  if (!melhor) return '';
  return `<span class="selo-promo ${melhor.metodo}" title="${esc(`${centavosParaTexto(melhor.total)} ${melhor.rotulo}`)}">${melhor.icone} ${esc(melhor.sel)} ${melhor.rotulo === 'no pagamento' ? 'OFF' : melhor.rotulo}</span>`;
}

// ----- O que aparece no card x o que aparece ao abrir -----
// Card: título · quantidade de artes · texto curto (inteiro, sem corte) · preço/promoção · botão.
// Ao abrir: descrição completa, tipo/categoria/classe e tags.
function qtdArtesDe(p) { const n = parseInt(p && p.qtdArtes, 10); return n > 0 && n < 100000 ? n : 0; }
function htmlQtdArtes(p) {
  const n = qtdArtesDe(p);
  return n ? `<span class="chip-qtd">🎨 <b>${n}</b> ${n === 1 ? 'arte' : 'artes'}</span>` : '';
}
// texto curto cadastrado; em packs antigos (sem o campo) usa o começo da descrição, limpo e terminado em palavra inteira
function resumoDoCard(p) {
  const r = String((p && p.resumo) || '').replace(/\s+/g, ' ').trim();
  if (r) return r;
  const html = String((p && (p._desc ?? p.descricao)) || '').replace(/<\/(p|div|li|h\d)>|<br\s*\/?>/gi, ' ');
  const t = htmlParaTexto(html).replace(/\s+/g, ' ').trim();
  if (t.length <= 120) return t;
  const corte = t.slice(0, 120);
  return corte.slice(0, Math.max(corte.lastIndexOf(' '), 60)).replace(/[\s,.;:\-–]+$/, '') + '…';
}

function htmlPrecoBox(prod) {
  const i = infoPreco(prod);
  return `<div class="card-preco-box">
    <span class="preco-label ${i.ativa ? 'promo' : ''}">${htmlRotuloPreco(i)}</span>
    <div class="card-preco"><small>R$</small> ${esc(i.atual)}</div>
    ${i.ate ? `<span class="preco-validade">Promoção até ${esc(formatarFimPromo(i.ate))}</span>` : ''}
    ${htmlLinhaPix(prod)}
  </div>`;
}




























// FIRESTORE & PRODUTOS
// =========================================================
// IDENTIDADE E TEMA: nome, textos, cores e faixa do topo (editáveis no painel de gestão)
// =========================================================
const CONFIG_PADRAO = {
  nomeLoja: 'Almatiê Art',
  slogan: 'Artes digitais para sublimação',
  tema: { primaria: '#BE3A78', secundaria: '#7E3C9F', fundo: '#FBF8F4', texto: '#1B1230' },
  ofertas: JSON.parse(JSON.stringify(OFERTAS_PADRAO)),
  selos: { novo: { ativo: true, dias: 14 } },
  faixa: {
    visivel: true,
    titulo: 'Artes prontas para sublimar',
    texto: 'Estampas exclusivas para canecas, camisetas, DTF e muito mais. Pagou no Pix, a arte é liberada na hora.',
    corPropria: false,
    corInicio: '#BE3A78',
    corFim: '#7E3C9F',
    corTexto: '#FFFFFF',
    botoes: [
      { rotulo: 'mockup', url: 'https://genesisgns91.github.io/Mockup/', icone: { tipo: 'preset', valor: 'caneca' } },
      { rotulo: '', url: 'https://www.instagram.com/', icone: { tipo: 'preset', valor: 'instagram' } }
    ]
  }
};

// Ícones prontos para os botões da faixa (contorno simples, 24x24). Conteúdo fixo, escrito aqui: nada vem do banco.
const ICONES_PRESET = {
  caneca:    { nome: 'Caneca (mockup)', svg: '<path d="M4.5 7h11v7.5a4.5 4.5 0 0 1-4.5 4.5h-2a4.5 4.5 0 0 1-4.5-4.5V7z"/><path d="M15.5 9h1.5a2.5 2.5 0 0 1 0 5h-1.5"/><path d="M3 21h14"/>' },
  instagram: { nome: 'Instagram', svg: '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="0.6" fill="currentColor"/>' },
  whatsapp:  { nome: 'WhatsApp', svg: '<path d="M3.5 20.5l1.4-4.3A8.5 8.5 0 1 1 8 19.3l-4.5 1.2z"/><path d="M9.2 8.8c0 3.2 2.7 5.9 5.9 5.9l1.1-1.3-2-1-.8.8c-1-.4-1.8-1.2-2.2-2.2l.8-.8-1-2-1.8.6z"/>' },
  facebook:  { nome: 'Facebook', svg: '<path d="M14 8h2.5V5H14a3.5 3.5 0 0 0-3.5 3.5V11H8v3h2.5v6h3v-6H16l.5-3h-3V8.5A.5.5 0 0 1 14 8z"/>' },
  tiktok:    { nome: 'TikTok', svg: '<path d="M14 4v10.5a3.5 3.5 0 1 1-3.5-3.5"/><path d="M14 4c.4 2.3 1.9 3.8 4.5 4"/>' },
  youtube:   { nome: 'YouTube', svg: '<rect x="2.5" y="5.5" width="19" height="13" rx="4"/><path d="M10 9.5v5l4.5-2.5z"/>' },
  pinterest: { nome: 'Pinterest', svg: '<circle cx="12" cy="12" r="9"/><path d="M10.2 19.5l1.8-7.5"/><path d="M9.6 11.6c0-1.9 1.5-3 3-3 2 0 3 1.3 3 3 0 2-1.3 3.4-3 3.4-.9 0-1.5-.5-1.5-.5"/>' },
  telegram:  { nome: 'Telegram', svg: '<path d="M21 4L3 11l6 2 2 6 3-4 5 3L21 4z"/><path d="M9 13l12-9"/>' },
  email:     { nome: 'E-mail', svg: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 7l8.5 6 8.5-6"/>' },
  site:      { nome: 'Site / link', svg: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c3 3.2 3 14.8 0 18"/><path d="M12 3c-3 3.2-3 14.8 0 18"/>' },
  loja:      { nome: 'Loja', svg: '<path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>' },
  camiseta:  { nome: 'Camiseta', svg: '<path d="M8 4L3 7l2.5 4 2-1V20h9V10l2 1L21 7l-5-3a4 4 0 0 1-8 0z"/>' },
  paleta:    { nome: 'Arte / paleta', svg: '<path d="M12 3a9 9 0 1 0 0 18c1.4 0 2-1 2-2 0-1.6-1.5-1.6-1.5-3 0-1 1-1.5 2-1.5H17a4 4 0 0 0 4-4c0-4-4-7.5-9-7.5z"/><circle cx="7.5" cy="11" r="1" fill="currentColor"/><circle cx="10" cy="7.5" r="1" fill="currentColor"/><circle cx="14.5" cy="7.5" r="1" fill="currentColor"/>' },
  coracao:   { nome: 'Coração', svg: '<path d="M12 20s-7.5-4.6-7.5-10A4.2 4.2 0 0 1 12 7.6 4.2 4.2 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/>' },
  estrela:   { nome: 'Estrela', svg: '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9 6.8 19.7l1-5.9L3.5 9.7l5.9-.8L12 3.5z"/>' },
  telefone:  { nome: 'Telefone', svg: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>' },
  local:     { nome: 'Localização', svg: '<path d="M12 21s-6-5.2-6-10a6 6 0 0 1 12 0c0 4.8-6 10-6 10z"/><circle cx="12" cy="11" r="2.2"/>' }
};

// ----- cores -----
const HEX_OK = /^#[0-9a-f]{6}$/i;
const hexValido = (h, padrao) => (typeof h === 'string' && HEX_OK.test(h.trim())) ? h.trim().toUpperCase() : padrao;
const hexParaRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const rgbParaHex = (rgb) => '#' + rgb.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('').toUpperCase();
const misturarCores = (a, b, t) => { const x = hexParaRgb(a), y = hexParaRgb(b); return rgbParaHex(x.map((v, i) => v + (y[i] - v) * t)); };
const escurecerCor = (h, t) => misturarCores(h, '#000000', t);
const clarearCor = (h, t) => misturarCores(h, '#FFFFFF', t);
const luminancia = (h) => { const [r, g, b] = hexParaRgb(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contrasteCores = (a, b) => { const l1 = luminancia(a), l2 = luminancia(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };

// balão de chamada de um botão: { ativo, texto (até 90), voltarDias (0 = só na 1ª visita) }
const BALAO_DIAS_VALIDOS = [0, 7, 15, 30, 60];
function normalizarBalao(b) {
  const x = (b && typeof b === 'object') ? b : {};
  const dias = Number(x.voltarDias);
  return {
    ativo: x.ativo === true,
    texto: typeof x.texto === 'string' ? x.texto.replace(/\s+/g, ' ').trim().slice(0, 90) : '',
    voltarDias: BALAO_DIAS_VALIDOS.includes(dias) ? dias : 0
  };
}

// junta o que está salvo com os valores padrão (qualquer campo que falte volta ao padrão)
function mesclarConfig(salva) {
  const s = salva || {};
  const t = s.tema || {};
  const f = s.faixa || {};
  const P = CONFIG_PADRAO;
  return {
    ...s,
    ofertas: normalizarOfertas(s.ofertas),
    selos: normalizarSelos(s.selos),
    nomeLoja: (typeof s.nomeLoja === 'string' && s.nomeLoja.trim()) ? s.nomeLoja.trim().slice(0, 60) : P.nomeLoja,
    slogan: typeof s.slogan === 'string' ? s.slogan.trim().slice(0, 120) : P.slogan,
    tema: {
      primaria: hexValido(t.primaria, P.tema.primaria), secundaria: hexValido(t.secundaria, P.tema.secundaria),
      fundo: hexValido(t.fundo, P.tema.fundo), texto: hexValido(t.texto, P.tema.texto)
    },
    faixa: {
      visivel: f.visivel !== false,
      titulo: typeof f.titulo === 'string' ? f.titulo.slice(0, 120) : P.faixa.titulo,
      texto: typeof f.texto === 'string' ? f.texto.slice(0, 300) : P.faixa.texto,
      corPropria: f.corPropria === true,
      corInicio: hexValido(f.corInicio, P.faixa.corInicio), corFim: hexValido(f.corFim, P.faixa.corFim),
      corTexto: hexValido(f.corTexto, P.faixa.corTexto),
      botoes: Array.isArray(f.botoes)
        ? f.botoes.filter((b) => b && typeof b === 'object').slice(0, 8).map((b) => ({
            rotulo: typeof b.rotulo === 'string' ? b.rotulo.slice(0, 14) : '',
            url: typeof b.url === 'string' ? b.url.trim().slice(0, 500) : '',
            icone: (b.icone && typeof b.icone === 'object') ? { tipo: String(b.icone.tipo || 'preset'), valor: String(b.icone.valor || '') } : { tipo: 'preset', valor: 'site' },
            id: typeof b.id === 'string' ? b.id.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 24) : '',
            balao: normalizarBalao(b.balao)
          }))
        : P.faixa.botoes.map((b) => ({ ...b, icone: { ...b.icone } }))
    }
  };
}

function aplicarTema(tema) {
  const raiz = document.documentElement.style;
  const P = CONFIG_PADRAO.tema;
  const ehPadrao = ['primaria', 'secundaria', 'fundo', 'texto'].every((k) => tema[k].toLowerCase() === P[k].toLowerCase());
  const variaveis = ['--primary', '--primary-hover', '--primary-soft', '--primary-rgb', '--violet', '--gradient-ink', '--bg', '--bg-alt', '--border', '--text', '--text-muted'];
  const meta = document.querySelector('meta[name="theme-color"]');
  if (ehPadrao) {                                   // tema original: não mexe em nada, vale o CSS de sempre
    variaveis.forEach((v) => raiz.removeProperty(v));
    if (meta) meta.setAttribute('content', P.fundo);
    return;
  }
  const [r, g, b] = hexParaRgb(tema.primaria);
  raiz.setProperty('--primary', tema.primaria);
  raiz.setProperty('--primary-hover', escurecerCor(tema.primaria, 0.2));
  raiz.setProperty('--primary-soft', clarearCor(tema.primaria, 0.88));
  raiz.setProperty('--primary-rgb', `${r}, ${g}, ${b}`);
  raiz.setProperty('--violet', tema.secundaria);
  raiz.setProperty('--gradient-ink', `linear-gradient(135deg, ${tema.primaria} 0%, ${misturarCores(tema.primaria, tema.secundaria, 0.5)} 52%, ${tema.secundaria} 100%)`);
  raiz.setProperty('--bg', tema.fundo);
  raiz.setProperty('--bg-alt', escurecerCor(tema.fundo, 0.05));
  raiz.setProperty('--border', escurecerCor(tema.fundo, 0.09));
  raiz.setProperty('--text', tema.texto);
  raiz.setProperty('--text-muted', misturarCores(tema.texto, tema.fundo, 0.42));
  if (meta) meta.setAttribute('content', tema.fundo);
}

// só deixa passar endereços seguros nos botões da faixa
const urlSeguraBotao = (u) => /^(https?:\/\/|mailto:|tel:)\S+$/i.test(String(u || '').trim());

function criarIconeBotao(icone) {
  const i = icone || {};
  if (i.tipo === 'emoji' && i.valor) {
    const s = document.createElement('span');
    s.className = 'hero-emoji';
    s.textContent = String(i.valor).slice(0, 4);
    return s;
  }
  if (i.tipo === 'imagem' && /^https:\/\/\S+$/i.test(String(i.valor || ''))) {
    const img = document.createElement('img');
    img.src = i.valor;
    img.alt = '';
    img.loading = 'lazy';
    return img;
  }
  const preset = Object.prototype.hasOwnProperty.call(ICONES_PRESET, i.valor) ? ICONES_PRESET[i.valor] : ICONES_PRESET.site;
  const caixa = document.createElement('span');
  caixa.className = 'hero-icone';
  caixa.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${preset.svg}</svg>`;
  return caixa;
}

// preenche uma faixa (a da loja ou a prévia do painel) com o texto, as cores e os botões
function montarFaixa(secao, faixa, opcoes) {
  const candidatosBalao = [];
  secao.hidden = faixa.visivel === false;
  secao.querySelector('.hero-texto h2').textContent = faixa.titulo;
  const p = secao.querySelector('.hero-texto p');
  p.textContent = faixa.texto;
  p.hidden = !faixa.texto;
  secao.style.background = faixa.corPropria ? `linear-gradient(135deg, ${faixa.corInicio} 0%, ${faixa.corFim} 100%)` : '';
  secao.style.setProperty('--faixa-texto', faixa.corTexto);
  const nav = secao.querySelector('.hero-atalhos');
  nav.innerHTML = '';
  faixa.botoes.filter((b) => urlSeguraBotao(b.url)).forEach((b) => {
    const a = document.createElement('a');
    a.className = 'hero-atalho';
    a.href = b.url.trim();
    if (/^https?:/i.test(a.href)) { a.target = '_blank'; a.rel = 'noopener'; }
    const nome = b.rotulo || (b.icone && Object.prototype.hasOwnProperty.call(ICONES_PRESET, b.icone.valor) ? ICONES_PRESET[b.icone.valor].nome : 'Link');
    a.title = nome;
    a.setAttribute('aria-label', nome);
    a.appendChild(criarIconeBotao(b.icone));
    if (b.rotulo) { const r = document.createElement('span'); r.textContent = b.rotulo.slice(0, 14); a.appendChild(r); }
    nav.appendChild(a);
    const bal = normalizarBalao(b.balao);
    if (bal.ativo && bal.texto) {
      candidatosBalao.push({ anchor: a, texto: bal.texto, voltarDias: bal.voltarDias, chave: chaveDoBalao(b, candidatosBalao.length, bal.texto) });
    }
  });
  nav.hidden = !nav.children.length;
  nav.dataset.qtd = String(Math.min(nav.children.length, 5));      // o CSS do celular divide a largura por esta quantidade (no máximo 5 por linha)
  // só a loja de verdade mostra balões (a prévia do painel e o "ao vivo" do rascunho não)
  if (opcoes && opcoes.baloes && !secao.hidden) agendarBalao(candidatosBalao);
  else if (!opcoes || !opcoes.baloes) fecharBalao(false);
}

// =========================================================
// BALÃO DE CHAMADA: dica curta sobre um botão da faixa (aparece na 1ª visita e,
// se o admin quiser, de novo quando a pessoa fica N dias sem entrar). Sempre dá para fechar.
// =========================================================
const BALAO_STORAGE = 'almatie_balao_v1';
const lerEstadoBalao = () => { try { return JSON.parse(localStorage.getItem(BALAO_STORAGE)) || {}; } catch (e) { return {}; } };
const gravarEstadoBalao = (est) => { try { localStorage.setItem(BALAO_STORAGE, JSON.stringify(est)); } catch (e) { /* modo privado: segue sem guardar */ } };

// data da visita ANTERIOR. Calculada uma vez por aba (recarregar a página não conta como "voltar").
const VISITA_ANTERIOR = (() => {
  try { const guardada = sessionStorage.getItem('almatie_visita_ant'); if (guardada !== null) return Number(guardada) || 0; } catch (e) { /* ignora */ }
  const est = lerEstadoBalao();
  const anterior = Number(est.ultima) || 0;
  est.ultima = Date.now();
  gravarEstadoBalao(est);
  try { sessionStorage.setItem('almatie_visita_ant', String(anterior)); } catch (e) { /* ignora */ }
  return anterior;
})();

const hashTexto = (t) => { let h = 5381; for (const c of String(t)) h = ((h << 5) + h + c.codePointAt(0)) | 0; return (h >>> 0).toString(36); };
// trocar o texto no painel conta como balão novo (volta a aparecer para quem já viu o antigo)
const chaveDoBalao = (b, ordem, texto) => `${(b.id || ('b' + ordem + hashTexto(b.url || b.rotulo || '')))}:${hashTexto(texto)}`;

function balaoDeveAparecer(chave, voltarDias, est) {
  const visto = Number((est.vistos || {})[chave]) || 0;
  if (!visto) return true;                                      // nunca viu: 1ª visita
  if (!voltarDias || !VISITA_ANTERIOR) return false;
  return visto <= VISITA_ANTERIOR && (Date.now() - VISITA_ANTERIOR) >= voltarDias * 864e5;   // ficou tempo demais sem entrar
}

function marcarBalaoVisto(chave) {
  const est = lerEstadoBalao();
  est.vistos = est.vistos || {};
  est.vistos[chave] = Date.now();
  // limpeza: guarda no máximo 30 balões
  const chaves = Object.keys(est.vistos);
  if (chaves.length > 30) chaves.sort((x, y) => est.vistos[x] - est.vistos[y]).slice(0, chaves.length - 30).forEach((k) => delete est.vistos[k]);
  gravarEstadoBalao(est);
}

let balaoAtual = null;          // { el, anchor, chave, limpar }
let timerBalao = null;

function fecharBalao(marcar = true) {
  clearTimeout(timerBalao);
  timerBalao = null;
  if (!balaoAtual) return;
  const b = balaoAtual;
  balaoAtual = null;
  if (marcar && b.chave) marcarBalaoVisto(b.chave);
  b.limpar();
  b.el.remove();
}

function agendarBalao(candidatos) {
  fecharBalao(false);
  if (!candidatos.length) return;
  const est = lerEstadoBalao();
  const escolhido = candidatos.find((c) => balaoDeveAparecer(c.chave, c.voltarDias, est));   // um balão por visita
  if (!escolhido) return;
  // espera a tela carregar para o balão não aparecer "atrás" da animação de abertura
  timerBalao = setTimeout(() => abrirBalao(escolhido), 1500);
}

function criarElementoBalao(texto, estatico) {
  const el = document.createElement('div');
  el.className = 'balao-dica' + (estatico ? ' balao-estatico' : '');
  el.setAttribute('role', 'note');
  const t = document.createElement('span');
  t.className = 'balao-texto';
  t.textContent = texto;
  const x = document.createElement('button');
  x.type = 'button';
  x.className = 'balao-fechar';
  x.setAttribute('aria-label', 'Fechar dica');
  x.title = 'Fechar';
  x.textContent = '×';
  el.append(t, x);
  return el;
}

function abrirBalao(c) {
  if (!c.anchor.isConnected || balaoAtual) return;
  const el = criarElementoBalao(c.texto, false);
  el.id = 'balaoDica';
  c.anchor.setAttribute('aria-describedby', 'balaoDica');
  document.body.appendChild(el);

  let marcado = false, quadro = 0;
  const posicionar = () => {
    quadro = 0;
    if (!c.anchor.isConnected) { fecharBalao(false); return; }
    const r = c.anchor.getBoundingClientRect();
    const topoApp = (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--appbar-h')) || 76);
    const larguraUtil = document.documentElement.clientWidth || innerWidth;     // sem a barra de rolagem
    const visivel = r.bottom > topoApp && r.top < innerHeight && r.right > 0 && r.left < larguraUtil;
    el.style.visibility = visivel ? 'visible' : 'hidden';
    if (!visivel) return;
    const largura = el.offsetWidth, altura = el.offsetHeight, margem = 10;
    const esq = Math.min(Math.max(margem, r.left + r.width / 2 - largura / 2), Math.max(margem, larguraUtil - largura - margem));
    const cabeAbaixo = r.bottom + 12 + altura <= innerHeight - margem;
    el.dataset.lado = cabeAbaixo ? 'baixo' : 'cima';
    el.style.left = esq + 'px';
    el.style.top = (cabeAbaixo ? r.bottom + 12 : Math.max(margem, r.top - 12 - altura)) + 'px';
    el.style.setProperty('--seta-x', Math.min(Math.max(16, r.left + r.width / 2 - esq), largura - 16) + 'px');
    if (!marcado) { marcado = true; marcarBalaoVisto(c.chave); el.classList.add('aberto'); }   // conta como "visto" quando de fato aparece
  };
  const agendar = () => { if (!quadro) quadro = requestAnimationFrame(posicionar); };
  const tecla = (e) => { if (e.key === 'Escape') fecharBalao(); };
  const aoClicarBotao = () => fecharBalao();
  addEventListener('scroll', agendar, { passive: true });
  addEventListener('resize', agendar);
  document.addEventListener('keydown', tecla);
  c.anchor.addEventListener('click', aoClicarBotao);
  el.querySelector('.balao-fechar').addEventListener('click', () => fecharBalao());

  balaoAtual = {
    el, anchor: c.anchor, chave: c.chave,
    limpar: () => {
      cancelAnimationFrame(quadro);
      removeEventListener('scroll', agendar);
      removeEventListener('resize', agendar);
      document.removeEventListener('keydown', tecla);
      c.anchor.removeEventListener('click', aoClicarBotao);
      c.anchor.removeAttribute('aria-describedby');
    }
  };
  posicionar();
}

// usado pelo painel: apaga o histórico de balões deste aparelho (para o admin rever como fica)
function reiniciarBaloes() {
  const est = lerEstadoBalao();
  delete est.vistos;
  gravarEstadoBalao(est);
  try { sessionStorage.removeItem('almatie_visita_ant'); } catch (e) { /* ignora */ }
}

function aplicarConfiguracoesVisuais(salva, opcoes) {
  const c = mesclarConfig(salva);
  document.querySelector('.brand h1').textContent = c.nomeLoja;
  const sub = document.querySelector('.brand span');
  sub.textContent = c.slogan;
  sub.hidden = !c.slogan;
  document.title = c.nomeLoja;
  const tituloApp = document.querySelector('meta[name="apple-mobile-web-app-title"]');
  if (tituloApp) tituloApp.setAttribute('content', c.nomeLoja);
  aplicarTema(c.tema);
  montarFaixa(document.querySelector('.hero-loja:not(.cfg-previa)'), c.faixa, opcoes);
  return c;
}

async function carregarConfiguracoesLoja() {
  try {
    const docSnap = await getDoc(doc(db, "configuracoes", "geral"));
    if (docSnap.exists()) {
      const config = docSnap.data();
      configLoja = config;
      try { aplicarConfiguracoesVisuais(config, { baloes: true }); } catch (e) { console.error('Não foi possível aplicar a identidade visual:', e); }
      if (produtosCarregados) renderizarVitrine();      // os cards mostram o desconto do Pix: refaz com a config nova
      if (config.logoUrl) {
        document.getElementById('siteLogo').src = config.logoUrl;
        document.getElementById('siteLogo').classList.remove('escondido');
      }
      if (config.faviconUrl) {
        document.getElementById('dynamicFavicon').href = config.faviconUrl;
      }
    }
  } catch (e) { console.error(e); }
}











document.addEventListener("DOMContentLoaded", () => {
  ativarProtecaoImagens();
  document.getElementById('btnLogin').addEventListener('click', abrirModalLogin);

  document.getElementById('btnFecharModal').addEventListener('click', fecharModalLogin);
  document.getElementById('modalOverlay').addEventListener('click', fecharModalLogin);
  document.getElementById('formLogin').addEventListener('submit', (e) => { e.preventDefault(); fazerLogin(); });   // Enter também envia
  iniciarInterfaceVitrine();
  document.getElementById('destaquesPrev').addEventListener('click', () => rolarDestaques(-1));
  document.getElementById('destaquesNext').addEventListener('click', () => rolarDestaques(1));

  document.getElementById('btnFecharGaleria').addEventListener('click', fecharGaleria);
  document.getElementById('modalGaleria').addEventListener('click', (e) => {
    if (e.target.id === 'modalGaleria') fecharGaleria();
  });
  document.getElementById('btnLeituraGaleria').addEventListener('click', () => {
    definirModoLeituraGaleria(!document.querySelector('#modalGaleria .modal-galeria-container').classList.contains('leitura'));
  });
  document.getElementById('btnPrevGaleria').addEventListener('click', () => mudarSlideGaleria(-1));
  document.getElementById('btnNextGaleria').addEventListener('click', () => mudarSlideGaleria(1));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !document.getElementById('boxLogin').classList.contains('escondido')) { fecharModalLogin(); return; }
    if (document.getElementById('modalGaleria').classList.contains('escondido')) return;
    if (document.querySelector('.pix-overlay')) return;       // a janela de compra está por cima: as teclas são dela
    if (e.key === 'Escape') fecharGaleria();
    if (e.key === 'ArrowLeft') mudarSlideGaleria(-1);
    if (e.key === 'ArrowRight') mudarSlideGaleria(1);
    if (e.key === 'Home') irParaImagemGaleria(0);
    if (e.key === 'End') irParaImagemGaleria(galeriaImagens.length - 1);
  });

  carregarDadosIniciais();
});


function abrirModalLogin() {
  document.getElementById('msgErro').textContent = '';
  document.getElementById('boxLogin').classList.remove('escondido');
  document.getElementById('modalOverlay').classList.remove('escondido');
  setTimeout(() => document.getElementById('emailInput').focus(), 30);
}

function fecharModalLogin() {
  const aberto = !document.getElementById('boxLogin').classList.contains('escondido');
  document.getElementById('boxLogin').classList.add('escondido');
  document.getElementById('modalOverlay').classList.add('escondido');
  document.getElementById('senhaInput').value = '';
  if (aberto) document.getElementById('btnLogin').focus();   // devolve o foco a quem abriu
}

// Checkout (Pix transparente) agora vive em pix-checkout.js

const ERROS_LOGIN = {
  'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos e tente de novo.',
  'auth/network-request-failed': 'Sem conexão com a internet. Verifique e tente de novo.',
  'auth/invalid-email': 'Digite um e-mail válido.'
};
async function fazerLogin() {
  const email = document.getElementById('emailInput').value.trim();
  const senha = document.getElementById('senhaInput').value;
  const msg = document.getElementById('msgErro');
  const btn = document.getElementById('btnFazerLogin');
  if (!email || !senha) { msg.textContent = 'Preencha o e-mail e a senha.'; return; }
  btn.disabled = true; msg.textContent = '';
  try {
    await signInWithEmailAndPassword(auth, email, senha);
    fecharModalLogin();
  } catch (error) {
    msg.textContent = ERROS_LOGIN[error && error.code] || 'E-mail ou senha incorretos.';
  } finally { btn.disabled = false; }
}


// =========================================================
// VITRINE: BUSCA, FILTROS (PRODUTO > CATEGORIA > TEMA) E DESTAQUES
// =========================================================
function normalizarTexto(t) {
  return (t || '').toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}

function htmlParaTexto(html) {
  try { return new DOMParser().parseFromString(html || '', 'text/html').body.textContent || ''; }
  catch (e) { return ''; }
}

function dataDoProduto(p) {
  const c = p.criadoEm;
  if (c && typeof c.toMillis === 'function') return c.toMillis();
  if (c && c.seconds) return c.seconds * 1000;
  return 0;
}

// "Novo": data de publicação (campo publicadoEm, só gravado na criação); anúncios antigos usam criadoEm
function dataDeNovidade(p) {
  const pub = Number(p.publicadoEm);
  return Number.isFinite(pub) && pub > 0 ? pub : dataDoProduto(p);
}
function ehNovo(p) {
  const sel = normalizarSelos(configLoja && configLoja.selos).novo;
  if (!sel.ativo) return false;
  const t = dataDeNovidade(p);
  return t > 0 && (Date.now() - t) >= -3600000 && (Date.now() - t) <= sel.dias * 86400000;
}
const htmlSelos = (p) => {
  const s = (p.destaque ? '<span class="selo-destaque">⭐ Destaque</span>' : '') + (ehNovo(p) ? '<span class="selo-novo">🆕 Novo</span>' : '');
  return s ? `<div class="selos-card">${s}</div>` : '';
};

// ----- Compartilhar uma arte (link direto: ?arte=<id>) -----
const urlDaArte = (p) => `${location.origin}${location.pathname}?arte=${encodeURIComponent(p.id)}`;
async function compartilharArte(p, botao) {
  const url = urlDaArte(p);
  const texto = `Olha essa arte: ${p.titulo || ''}`;
  const aviso = (t) => { if (!botao) return; botao.dataset.tip = t; botao.classList.add('mostra-dica'); setTimeout(() => { botao.classList.remove('mostra-dica'); }, 2200); };
  if (navigator.share) {
    try { await navigator.share({ title: p.titulo || 'Arte', text: texto, url }); return; }
    catch (e) { if (e && e.name === 'AbortError') return; /* sem suporte real: tenta copiar */ }
  }
  try { await navigator.clipboard.writeText(url); aviso('✓ Link copiado!'); return; } catch (e) { /* plano B abaixo */ }
  window.open(`https://wa.me/?text=${encodeURIComponent(texto + ' ' + url)}`, '_blank', 'noopener');
}

const valorDe = (p, campo) => p[campo] || 'Geral';

async function carregarProdutos() {
  try {
    const querySnapshot = await getDocs(collection(db, "produtos"));
    produtosMemoria = [];
    querySnapshot.forEach((docSnap) => {
      const p = { id: docSnap.id, ...docSnap.data() };
      p._desc = sanitizarDescricao(p.descricao);
      p._busca = normalizarTexto([p.titulo, p.resumo, p.tipo, p.categoria, p.classe, (p.tags || []).join(' '), htmlParaTexto(p._desc)].join(' '));
      produtosMemoria.push(p);
    });
    produtosMemoria.sort((a, b) => dataDoProduto(b) - dataDoProduto(a)); // mais novos primeiro
    produtosCarregados = true;
    construirMenuFiltros();
    renderizarVitrine();
    abrirArteDoLink();
  } catch (e) { console.error(e); }
}

// link compartilhado (?arte=<id>): abre a galeria dessa arte uma única vez
let arteDoLinkAberta = false;
function abrirArteDoLink() {
  if (arteDoLinkAberta) return;
  arteDoLinkAberta = true;
  try {
    const id = new URLSearchParams(location.search).get('arte');
    const prod = id ? produtosMemoria.find((x) => x.id === id) : null;
    if (prod) abrirGaleria(prod);
  } catch (e) { /* link inválido: ignora */ }
}

// ----- Utilidades da vitrine -----
const ITENS_POR_PAGINA = 12;
let paginaAtual = 1;
let filtrouNoPainel = false;
let timerBusca = null;
let timerTroca = null;

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Imagens entregues já comprimidas e no tamanho de uso (Cloudinary: formato e qualidade automáticos). Original nunca é servida.
function miniatura(url, largura = 640) {
  if (!url || typeof url !== 'string') return url || '';
  if (url.includes('/upload/f_auto,q_auto,w_1200/')) return url.replace('w_1200', `w_${largura}`);
  if (/res\.cloudinary\.com\/[^/]+\/image\/upload\/v\d+\//.test(url)) return url.replace('/upload/', `/upload/f_auto,q_auto,w_${largura}/`);
  return url;
}

// ----- Marca d'água (só na tela do site): nome da loja no canto inferior direito, a 6 mm das bordas, translúcido e discreto -----
const MARCA_DAGUA = 'Almatiê Art';
function htmlMarcaDagua() {
  return `<div class="marca-dagua" aria-hidden="true"><span class="md-br">${MARCA_DAGUA}</span></div>`;
}

// ----- Proteção das imagens: sem menu "salvar imagem" (botão direito e toque longo), sem arrastar, sem Ctrl+S, sem print da tela via tecla -----
function ativarProtecaoImagens() {
  const noPainel = (el) => !!(el && el.closest && el.closest('#painelAdmin'));
  const ehImagemProtegida = (el) => !!(el && el.closest && (el.tagName === 'IMG' || el.closest('.carrossel-container, .destaque-imagem, .galeria-carrossel-wrap, .galeria-mini')));
  document.addEventListener('contextmenu', (e) => { if (!noPainel(e.target) && ehImagemProtegida(e.target)) e.preventDefault(); }, true);
  document.addEventListener('dragstart', (e) => { if (!noPainel(e.target) && e.target.tagName === 'IMG') e.preventDefault(); }, true);
  document.addEventListener('keydown', (e) => {
    const admin = document.getElementById('painelAdmin');
    if (admin && admin.offsetParent !== null) return;                       // o admin logado não é afetado
    if ((e.ctrlKey || e.metaKey) && String(e.key).toLowerCase() === 's') e.preventDefault();   // "Salvar página como"
  }, true);
  // PrintScreen: limpa a área de transferência e esconde as imagens por um instante (não impede capturas do sistema, só dificulta)
  document.addEventListener('keyup', (e) => {
    if (e.key !== 'PrintScreen') return;
    try { navigator.clipboard && navigator.clipboard.writeText(' ').catch(() => {}); } catch (_) { /* sem permissão: ignora */ }
    document.documentElement.classList.add('sem-captura');
    setTimeout(() => document.documentElement.classList.remove('sem-captura'), 1500);
  }, true);
}

// Só a 1ª foto de cada card carrega de cara; as demais entram quando o slide é usado
function carregarSlide(slide) {
  const img = slide && slide.querySelector('img[data-src]');
  if (img) { img.src = img.dataset.src; img.removeAttribute('data-src'); }
}

function contarPor(lista, campo) {
  const mapa = new Map();
  lista.forEach((p) => {
    const k = valorDe(p, campo);
    mapa.set(k, (mapa.get(k) || 0) + 1);
  });
  return mapa;
}

const combinaTipo = (p) => filtroTipoAtivo === 'TODOS' || valorDe(p, 'tipo') === filtroTipoAtivo;
const combinaCategoria = (p) => filtroCategoriaAtiva === 'TODOS' || valorDe(p, 'categoria') === filtroCategoriaAtiva;
const filtrosAtivosTotal = () => [filtroTipoAtivo, filtroCategoriaAtiva, filtroSubAtiva].filter((v) => v !== 'TODOS').length;
const painelAberto = () => document.getElementById('painelFiltros').classList.contains('aberto');

function selecionarFiltro(nivel, valor) {
  if (nivel === 'tipo') { filtroTipoAtivo = valor; filtroCategoriaAtiva = 'TODOS'; filtroSubAtiva = 'TODOS'; }
  else if (nivel === 'cat') { filtroCategoriaAtiva = valor; filtroSubAtiva = 'TODOS'; }
  else { filtroSubAtiva = valor; }
  filtrouNoPainel = true;
  paginaAtual = 1;
  construirMenuFiltros();
  renderizarVitrine();
  animarTroca();
}

function animarTroca() {
  const v = document.getElementById('vitrineProdutos');
  v.classList.add('sf-troca');
  clearTimeout(timerTroca);
  timerTroca = setTimeout(() => v.classList.remove('sf-troca'), 700);
}

// Monta o conteúdo do menu sanduíche (Produto > Categoria > Tema), os chips e os contadores
function construirMenuFiltros() {
  const container = document.getElementById('containerFiltros');
  const foco = document.activeElement;
  const chaveFoco = foco && foco.dataset && foco.dataset.nivel && container.contains(foco) ? [foco.dataset.nivel, foco.value] : null;

  // Valida a seleção atual contra o catálogo completo
  const tipos = contarPor(produtosMemoria, 'tipo');
  if (filtroTipoAtivo !== 'TODOS' && !tipos.has(filtroTipoAtivo)) filtroTipoAtivo = 'TODOS';
  const cats = contarPor(produtosMemoria.filter(combinaTipo), 'categoria');
  if (filtroCategoriaAtiva !== 'TODOS' && !cats.has(filtroCategoriaAtiva)) filtroCategoriaAtiva = 'TODOS';
  if (filtroCategoriaAtiva === 'TODOS' && cats.size > 1) filtroSubAtiva = 'TODOS';
  const subs = contarPor(produtosMemoria.filter((p) => combinaTipo(p) && combinaCategoria(p)), 'classe');
  if (filtroSubAtiva !== 'TODOS' && !subs.has(filtroSubAtiva)) filtroSubAtiva = 'TODOS';

  // Contagens respeitam a busca digitada, para os números baterem com o resultado
  const palavras = normalizarTexto(termoBusca).split(/\s+/).filter(Boolean);
  const base = produtosMemoria.filter((p) => palavras.every((w) => p._busca.includes(w)));
  const baseTipo = base.filter(combinaTipo);
  const baseCat = baseTipo.filter(combinaCategoria);

  const itens = (todas, lista, campo, rotuloTodos) => {
    const n = contarPor(lista, campo);
    const ordem = [...todas.keys()].sort((a, b) => (a === 'Geral') - (b === 'Geral') || a.localeCompare(b, 'pt-BR'));
    return [{ valor: 'TODOS', texto: rotuloTodos, total: lista.length }, ...ordem.map((k) => ({ valor: k, texto: k, total: n.get(k) || 0 }))];
  };
  const grupo = (nivel, titulo, lista, ativo) => `<fieldset class="sf-grupo"><legend>${titulo}</legend>${lista.map(({ valor, texto, total }) => {
    const vazio = total === 0 && ativo !== valor;
    return `<label class="sf-opcao${ativo === valor ? ' ativa' : ''}${vazio ? ' vazia' : ''}"><input type="radio" name="f-${nivel}" data-nivel="${nivel}" value="${esc(valor)}"${ativo === valor ? ' checked' : ''}${vazio ? ' disabled' : ''}><span class="sf-marca"></span><span class="sf-opcao-texto">${esc(texto)}</span><em>${total}</em></label>`;
  }).join('')}</fieldset>`;

  let html = '';
  if (tipos.size > 1) html += grupo('tipo', 'Produto', itens(tipos, base, 'tipo', 'Todos'), filtroTipoAtivo);
  if (cats.size > 1) html += grupo('cat', 'Categoria', itens(cats, baseTipo, 'categoria', 'Todas'), filtroCategoriaAtiva);
  const temaLiberado = filtroCategoriaAtiva !== 'TODOS' || cats.size <= 1;
  if (temaLiberado && subs.size > 1) html += grupo('sub', 'Tema', itens(subs, baseCat, 'classe', 'Todos'), filtroSubAtiva);
  else if (!temaLiberado) html += `<fieldset class="sf-grupo"><legend>Tema</legend><p class="sf-dica">Escolha uma categoria para ver os temas disponíveis.</p></fieldset>`;
  container.innerHTML = html || '<p class="sf-dica">Ainda não há filtros disponíveis.</p>';

  if (chaveFoco) {
    const alvo = [...container.querySelectorAll('input')].find((i) => i.dataset.nivel === chaveFoco[0] && i.value === chaveFoco[1]);
    if (alvo) alvo.focus({ preventScroll: true });
    else if (painelAberto()) document.getElementById('btnFecharFiltros').focus({ preventScroll: true });
  }

  // Chips dos filtros ativos
  const chips = [['tipo', filtroTipoAtivo], ['cat', filtroCategoriaAtiva], ['sub', filtroSubAtiva]].filter(([, v]) => v !== 'TODOS');
  document.getElementById('filtrosAtivos').innerHTML = chips.map(([nivel, v]) =>
    `<button type="button" class="sf-chip" data-nivel="${nivel}" aria-label="Remover filtro ${esc(v)}">${esc(v)}<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>`).join('');

  // Botão sanduíche, rodapé do painel
  const n = filtrosAtivosTotal();
  const badge = document.getElementById('filtrosBadge');
  const btn = document.getElementById('btnFiltros');
  const mudou = badge.textContent !== String(n);
  badge.textContent = n;
  badge.classList.toggle('escondido', n === 0);
  btn.classList.toggle('tem-filtros', n > 0);
  btn.setAttribute('aria-label', n ? `Filtros, ${n} ativo${n > 1 ? 's' : ''}` : 'Filtros');
  if (mudou && n) { badge.classList.remove('pop'); void badge.offsetWidth; badge.classList.add('pop'); }

  const total = filtrarProdutos().length;
  const aplicar = document.getElementById('btnAplicarFiltros');
  const texto = total ? `Ver ${total} ${total === 1 ? 'arte' : 'artes'}` : 'Nenhuma arte encontrada';
  if (aplicar.textContent !== texto) { aplicar.textContent = texto; aplicar.classList.remove('bump'); void aplicar.offsetWidth; aplicar.classList.add('bump'); }
  aplicar.disabled = total === 0;
  document.getElementById('btnLimparPainel').disabled = n === 0;
}

function nenhumFiltroAtivo() {
  return filtroTipoAtivo === 'TODOS' && filtroCategoriaAtiva === 'TODOS' && filtroSubAtiva === 'TODOS' && !normalizarTexto(termoBusca);
}

function atualizarCampoBusca() {
  document.getElementById('blocoBusca').classList.toggle('tem-texto', !!document.getElementById('campoBusca').value);
}

function definirBusca(valor) {
  const campo = document.getElementById('campoBusca');
  campo.value = valor;
  termoBusca = valor;
  atualizarCampoBusca();
  clearTimeout(timerBusca);
  paginaAtual = 1;
  construirMenuFiltros();
  renderizarVitrine();
}

function limparFiltros() {
  filtroTipoAtivo = 'TODOS'; filtroCategoriaAtiva = 'TODOS'; filtroSubAtiva = 'TODOS';
  paginaAtual = 1;
  definirBusca('');
  animarTroca();
}

// ----- Menu sanduíche: abrir, fechar, foco preso dentro do painel -----
function abrirPainelFiltros() {
  if (painelAberto()) return;
  filtrouNoPainel = false;
  document.getElementById('painelFiltros').classList.add('aberto');
  document.getElementById('filtrosOverlay').classList.add('aberto');
  document.getElementById('btnFiltros').setAttribute('aria-expanded', 'true');
  document.body.classList.add('sf-trava');
  requestAnimationFrame(() => document.getElementById('btnFecharFiltros').focus({ preventScroll: true }));
}

function fecharPainelFiltros() {
  if (!painelAberto()) return;
  document.getElementById('painelFiltros').classList.remove('aberto');
  document.getElementById('filtrosOverlay').classList.remove('aberto');
  document.getElementById('btnFiltros').setAttribute('aria-expanded', 'false');
  document.body.classList.remove('sf-trava');
  document.getElementById('btnFiltros').focus({ preventScroll: true });
  if (filtrouNoPainel) rolarParaBarra();
}

function rolarParaBarra() {
  const reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.getElementById('barraFiltros').scrollIntoView({ behavior: reduz ? 'auto' : 'smooth', block: 'start' });
}

function prenderFoco(e) {
  const itens = [...document.getElementById('painelFiltros').querySelectorAll('button:not([disabled]), input:not([disabled])')].filter((el) => el.offsetParent !== null);
  if (!itens.length) return;
  const primeiro = itens[0], ultimo = itens[itens.length - 1];
  if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
  else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
}

// ----- Paginação -----
function listaDePaginas(atual, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const s = new Set([1, total, atual - 1, atual, atual + 1]);
  if (atual <= 3) [2, 3, 4].forEach((n) => s.add(n));
  if (atual >= total - 2) [total - 1, total - 2, total - 3].forEach((n) => s.add(n));
  const arr = [...s].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const saida = [];
  arr.forEach((n, i) => {
    const ant = arr[i - 1];
    if (i && n - ant === 2) saida.push(ant + 1);
    else if (i && n - ant > 2) saida.push('…');
    saida.push(n);
  });
  return saida;
}

function renderizarPaginacao(total) {
  const nav = document.getElementById('paginacao');
  const paginas = Math.ceil(total / ITENS_POR_PAGINA);
  if (paginas <= 1) { nav.innerHTML = ''; nav.classList.add('escondido'); return; }
  nav.classList.remove('escondido');
  const ini = (paginaAtual - 1) * ITENS_POR_PAGINA + 1;
  const fim = Math.min(total, paginaAtual * ITENS_POR_PAGINA);
  const seta = (d, ro, ic) => `<button type="button" class="sf-pag-btn sf-pag-nav" data-pagina="${paginaAtual + d}" ${(d < 0 && paginaAtual === 1) || (d > 0 && paginaAtual === paginas) ? 'disabled' : ''} aria-label="${ro === 'Anterior' ? 'Página anterior' : 'Próxima página'}">${d < 0 ? ic : ''}<span>${ro}</span>${d > 0 ? ic : ''}</button>`;
  const chevron = (p) => `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${p}"/></svg>`;
  const numeros = listaDePaginas(paginaAtual, paginas).map((n) => n === '…'
    ? '<li class="sf-pag-reticencias" aria-hidden="true">…</li>'
    : `<li><button type="button" class="sf-pag-btn${n === paginaAtual ? ' atual' : ''}" data-pagina="${n}" aria-label="Página ${n}"${n === paginaAtual ? ' aria-current="page"' : ''}>${n}</button></li>`).join('');
  nav.innerHTML = `<div class="sf-pag-linha">${seta(-1, 'Anterior', chevron('m15 18-6-6 6-6'))}<ol class="sf-pag-lista">${numeros}</ol><span class="sf-pag-compacta" aria-hidden="true">Página ${paginaAtual} de ${paginas}</span>${seta(1, 'Próxima', chevron('m9 18 6-6-6-6'))}</div><p class="sf-pag-info">Mostrando ${ini}–${fim} de ${total} artes</p>`;
}

function irParaPagina(n) {
  paginaAtual = n;
  renderizarVitrine();
  animarTroca();
  rolarParaBarra();
  const titulo = document.getElementById('tituloVitrine');
  titulo.setAttribute('tabindex', '-1');
  titulo.focus({ preventScroll: true });
}

function iniciarInterfaceVitrine() {
  const campo = document.getElementById('campoBusca');
  campo.addEventListener('input', (e) => {
    termoBusca = e.target.value;
    atualizarCampoBusca();
    clearTimeout(timerBusca);
    timerBusca = setTimeout(() => { paginaAtual = 1; construirMenuFiltros(); renderizarVitrine(); }, 140);
  });
  campo.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') campo.blur();
    if (e.key === 'Escape' && campo.value) { e.preventDefault(); definirBusca(''); }
  });
  document.getElementById('btnLimparBusca').addEventListener('click', () => { definirBusca(''); campo.focus(); });
  document.getElementById('btnLimparFiltros').addEventListener('click', limparFiltros);

  document.getElementById('btnFiltros').addEventListener('click', () => (painelAberto() ? fecharPainelFiltros() : abrirPainelFiltros()));
  document.getElementById('btnFecharFiltros').addEventListener('click', fecharPainelFiltros);
  document.getElementById('filtrosOverlay').addEventListener('click', fecharPainelFiltros);
  document.getElementById('btnAplicarFiltros').addEventListener('click', fecharPainelFiltros);
  document.getElementById('btnLimparPainel').addEventListener('click', () => selecionarFiltro('tipo', 'TODOS'));
  document.getElementById('containerFiltros').addEventListener('change', (e) => {
    if (e.target.matches('input[data-nivel]')) selecionarFiltro(e.target.dataset.nivel, e.target.value);
  });
  document.getElementById('filtrosAtivos').addEventListener('click', (e) => {
    const chip = e.target.closest('.sf-chip');
    if (chip) { filtrouNoPainel = false; selecionarFiltro(chip.dataset.nivel, 'TODOS'); }
  });
  document.getElementById('paginacao').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-pagina]');
    if (b && !b.disabled) irParaPagina(Number(b.dataset.pagina));
  });
  document.addEventListener('keydown', (e) => {
    if (!painelAberto()) return;
    if (e.key === 'Escape') fecharPainelFiltros();
    if (e.key === 'Tab') prenderFoco(e);
  });
}

function filtrarProdutos() {
  const palavras = normalizarTexto(termoBusca).split(/\s+/).filter(Boolean);
  return produtosMemoria.filter((p) =>
    (filtroTipoAtivo === 'TODOS' || valorDe(p, 'tipo') === filtroTipoAtivo) &&
    (filtroCategoriaAtiva === 'TODOS' || valorDe(p, 'categoria') === filtroCategoriaAtiva) &&
    (filtroSubAtiva === 'TODOS' || valorDe(p, 'classe') === filtroSubAtiva) &&
    palavras.every((w) => p._busca.includes(w)));
}

function comprarProduto(prod) {
  window.iniciarCheckout(prod.id, encodeURIComponent(prod.titulo), infoPreco(prod).atual);
}


// ----- Faixa "Em destaque" -----
function criarCardDestaque(prod) {
  const el = document.createElement('article');
  el.className = 'card-destaque';
  el.innerHTML = `
    <div class="destaque-imagem">
      <img alt="" loading="lazy">
      ${htmlMarcaDagua()}
      ${htmlSelos(prod)}
      ${htmlSeloPromo(prod)}
    </div>
    <div class="destaque-info">
      <h3 class="destaque-titulo"></h3>
      ${htmlQtdArtes(prod)}
      <div class="destaque-rodape">
        ${htmlPrecoBox(prod)}
        <button type="button" class="btn-comprar">Comprar Arte</button>
      </div>
    </div>`;
  const img = el.querySelector('img');
  img.src = miniatura((prod.imagens || [])[0] || '', 560);
  img.alt = prod.titulo || '';
  el.querySelector('.destaque-titulo').textContent = prod.titulo || '';
  el.querySelector('.destaque-imagem').addEventListener('click', () => abrirGaleria(prod));
  el.querySelector('.destaque-titulo').addEventListener('click', () => abrirGaleria(prod));
  el.querySelector('.btn-comprar').addEventListener('click', () => comprarProduto(prod));
  return el;
}

function renderizarDestaques(visivel) {
  const secao = document.getElementById('secaoDestaques');
  const trilho = document.getElementById('destaquesTrilho');
  const lista = produtosMemoria.filter((p) => p.destaque);
  trilho.innerHTML = '';
  if (!visivel || !lista.length) { secao.classList.add('escondido'); return; }
  secao.classList.remove('escondido');
  lista.forEach((p) => trilho.appendChild(criarCardDestaque(p)));
}

function rolarDestaques(dir) {
  const trilho = document.getElementById('destaquesTrilho');
  trilho.scrollBy({ left: dir * Math.max(240, trilho.clientWidth * 0.8), behavior: 'smooth' });
}

// ----- Grade principal -----
function criarCard(prod) {
  let slidesHTML = '';
  let dotsHTML = '';
  (prod.imagens || []).forEach((imgUrl, idx) => {
    slidesHTML += `<div class="carrossel-slide ${idx === 0 ? 'ativo' : ''}"><img ${idx === 0 ? 'src' : 'data-src'}="${esc(miniatura(imgUrl))}" loading="lazy" decoding="async" alt=""></div>`;
    dotsHTML += `<div class="dot ${idx === 0 ? 'ativo' : ''}"></div>`;
  });

  const card = document.createElement('div');
  card.className = 'card-carrossel';
  const resumo = resumoDoCard(prod);
  card.innerHTML = `
    <div class="card-header">
      <h3 class="card-titulo">${esc(prod.titulo)}</h3>
    </div>
    <div class="carrossel-container">
      ${slidesHTML}
      ${htmlMarcaDagua()}
      ${htmlSelos(prod)}
      ${htmlSeloPromo(prod)}
      ${prod.imagens && prod.imagens.length > 1 ? `
        <button class="btn-nav btn-prev">❮</button>
        <button class="btn-nav btn-next">❯</button>
        <div class="dots-container">${dotsHTML}</div>
      ` : ''}
      <span class="icone-expandir" title="Ver galeria completa">⤢</span>
      <button type="button" class="btn-compartilhar btn-compartilhar-card" aria-label="Compartilhar esta arte" title="Compartilhar"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="19" r="2.6"/><path d="m8.3 10.8 7.4-4.4M8.3 13.2l7.4 4.4"/></svg></button>
    </div>
    <div class="card-body">
      <div class="card-info">
        ${htmlQtdArtes(prod)}
        ${resumo ? `<p class="card-resumo">${esc(resumo)}</p>` : ''}
      </div>
      <div class="card-compra">
        ${htmlPrecoBox(prod)}
        <button type="button" class="btn-comprar">Comprar Arte</button>
      </div>
    </div>
  `;

  if (prod.imagens && prod.imagens.length > 1) {
    card.querySelector('.btn-prev').addEventListener('click', (e) => { e.stopPropagation(); mudarSlide(card, -1); });
    card.querySelector('.btn-next').addEventListener('click', (e) => { e.stopPropagation(); mudarSlide(card, 1); });
  }

  card.querySelector('.carrossel-container').addEventListener('click', () => abrirGaleria(prod));
  card.querySelector('.btn-comprar').addEventListener('click', () => comprarProduto(prod));
  card.querySelector('.btn-compartilhar').addEventListener('click', (e) => { e.stopPropagation(); compartilharArte(prod, e.currentTarget); });

  if (usuarioAtual && ganchos.cardAdmin) ganchos.cardAdmin(prod, card.querySelector('.card-body'));
  return card;
}

function renderizarVitrine() {
  if (!produtosCarregados) return;
  const vitrine = document.getElementById('vitrineProdutos');
  const filtrados = filtrarProdutos();
  const semFiltro = nenhumFiltroAtivo();
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / ITENS_POR_PAGINA));
  paginaAtual = Math.min(Math.max(1, paginaAtual), totalPaginas);

  renderizarDestaques(semFiltro && paginaAtual === 1);

  document.getElementById('tituloVitrine').textContent = semFiltro ? 'Todas as artes' : 'Resultados';
  document.getElementById('contadorResultados').textContent = `${filtrados.length} ${filtrados.length === 1 ? 'arte' : 'artes'}`;
  document.getElementById('btnLimparFiltros').classList.toggle('escondido', semFiltro);

  vitrine.innerHTML = '';
  if (!filtrados.length) {
    const vazio = document.createElement('div');
    vazio.className = 'vazio-vitrine';
    vazio.innerHTML = '<strong>Nenhuma arte encontrada</strong><p>Tente outra palavra ou limpe os filtros.</p>';
    vitrine.appendChild(vazio);
    renderizarPaginacao(0);
    return;
  }

  // Só a página atual vai para o DOM: menos cards, menos imagens, página mais leve
  const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const frag = document.createDocumentFragment();
  filtrados.slice(inicio, inicio + ITENS_POR_PAGINA).forEach((prod) => frag.appendChild(criarCard(prod)));
  vitrine.appendChild(frag);
  renderizarPaginacao(filtrados.length);
}

function mudarSlide(card, dir) {
  const slides = card.getElementsByClassName('carrossel-slide');
  const dots = card.getElementsByClassName('dot');
  let ativoIdx = 0;
  for (let i = 0; i < slides.length; i++) {
    if (slides[i].classList.contains('ativo')) {
      ativoIdx = i;
      slides[i].classList.remove('ativo');
      if (dots[i]) dots[i].classList.remove('ativo');
      break;
    }
  }
  let novoIdx = (ativoIdx + dir + slides.length) % slides.length;
  slides[novoIdx].classList.add('ativo');
  carregarSlide(slides[novoIdx]); carregarSlide(slides[(novoIdx + 1) % slides.length]);
  if (dots[novoIdx]) dots[novoIdx].classList.add('ativo');
}


// PWA — LOADER DE CARREGAMENTO E SERVICE WORKER
let pageLoaderEscondido = false;

function esconderPageLoader() {
  if (pageLoaderEscondido) return;
  pageLoaderEscondido = true;
  const loader = document.getElementById('pageLoader');
  if (!loader) return;
  loader.classList.add('page-loader-esconder');
  setTimeout(() => loader.remove(), 500);
}

async function carregarDadosIniciais() {
  const inicio = Date.now();
  try {
    await Promise.all([
      carregarConfiguracoesLoja(),
      carregarProdutos()
    ]);
  } catch (erro) {
    console.error('Erro ao carregar dados iniciais da loja:', erro);
  } finally {
    const decorrido = Date.now() - inicio;
    setTimeout(esconderPageLoader, Math.max(0, 350 - decorrido));
  }
}

setTimeout(esconderPageLoader, 9000);

window.addEventListener('load', () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch((erro) => {
      console.error('Erro ao registrar o Service Worker:', erro);
    });
  }
});

// =========================================================
// PAINEL DE ADMINISTRAÇÃO: o código fica no Worker e só chega a quem for o admin
// =========================================================
const ganchos = { cardAdmin: null };

function injetarCss(css) {
  let tag = document.getElementById('painelAdminCss');
  if (!tag) {
    tag = document.createElement('style');
    tag.id = 'painelAdminCss';
    // entra antes do CSS público, para manter a mesma ordem de prioridade de antes da separação
    const publico = document.querySelector('link[rel="stylesheet"][href*="style.css"]');
    document.head.insertBefore(tag, publico || null);
  }
  tag.textContent = css;
}

async function carregarPainelAdmin(user) {
  if (painelAdminCarregado) return;
  try {
    const token = await user.getIdToken();
    const r = await fetch(`${ADMIN_WORKER}/admin/painel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: '{}'
    });
    if (!r.ok) return;                                  // logou, mas não é o admin: nada é entregue
    const painel = await r.json();
    injetarCss(painel.css);
    document.getElementById('painelAdminMontagem').innerHTML = painel.html;
    const url = URL.createObjectURL(new Blob([painel.js], { type: 'text/javascript' }));
    const modulo = await import(url);
    URL.revokeObjectURL(url);
    painelAdminCarregado = true;
    await modulo.iniciar(window.Almatie);
    renderizarVitrine();
  } catch (e) {
    console.error('Não foi possível abrir o painel:', e);
    mostrarToast('Não foi possível abrir o painel de gestão.', 'erro');
  }
}

window.Almatie = {
  db, auth,
  firestore: { collection, addDoc, getDocs, doc, updateDoc, setDoc, getDoc, deleteDoc },
  ADMIN_WORKER,
  ganchos,
  produtos: () => produtosMemoria,
  configLoja: () => configLoja,
  sair: () => signOut(auth),
  esc, mostrarToast, sanitizarDescricao, precoParaNumero, formatarFimPromo, htmlParaTexto, normalizarTexto,
  carregarProdutos, carregarConfiguracoesLoja, renderizarVitrine,
  normalizarOfertas, normalizarLeveTambem, normalizarSelos, normalizarBalao, reiniciarBaloes, criarElementoBalao,
  // identidade e tema (usados pelo editor de identidade do painel)
  configPadrao: () => JSON.parse(JSON.stringify(CONFIG_PADRAO)),
  mesclarConfig, aplicarConfiguracoesVisuais, montarFaixa, criarIconeBotao, icones: ICONES_PRESET,
  cores: { contraste: contrasteCores, hexValido }
};

// usado pelo checkout (pix-checkout.js): lista de packs, regras de desconto e conta do pedido
window.AlmatieLoja = {
  produtos: () => produtosMemoria,
  ofertas: ofertasAtuais,
  infoPreco, precoParaNumero, miniatura, resumoDoCard, htmlQtdArtes, htmlSeloPromo, htmlPrecoBox,
  calcularPedido: calcularPedidoLoja,
  textoRegraPix, textoRegra, itemDoProduto, normalizarLeveTambem, regraDoMetodo, faixaDoCarrinho, centavosParaTexto
};

onAuthStateChanged(auth, (user) => {
  usuarioAtual = user;
  if (!user) {
    if (painelAdminCarregado) { location.reload(); return; }   // saiu: limpa o painel da memória
    renderizarVitrine();
    return;
  }
  renderizarVitrine();
  carregarPainelAdmin(user);
});


// =========================================================
// COMPORTAMENTO DE APP: barra inferior e gestos de deslizar (só aciona botões que já existem)
// =========================================================
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var nav = $('appNav');
  if (!nav) return;

  nav.addEventListener('click', function (e) {
    var b = e.target.closest('[data-nav]');
    if (!b) return;
    var acao = b.dataset.nav;
    if (acao === 'inicio') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (acao === 'buscar') {
      $('barraFiltros').scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(function () { $('campoBusca').focus({ preventScroll: true }); }, 380);
    } else if (acao === 'filtros') {
      $('btnFiltros').click();
    }
  });

  // Número de filtros ativos também na barra inferior
  var origem = $('filtrosBadge'), destino = $('navFiltrosBadge');
  function sincronizar() {
    var n = parseInt(origem.textContent, 10) || 0;
    destino.textContent = n;
    destino.classList.toggle('escondido', n === 0);
  }
  new MutationObserver(sincronizar).observe(origem, { childList: true, characterData: true, subtree: true });
  sincronizar();

  // Deslizar o dedo troca a foto (cards e galeria)
  var LIMITE = 45;
  function horizontal(dx, dy) { return Math.abs(dx) > LIMITE && Math.abs(dx) > Math.abs(dy) * 1.5; }

  var vitrine = $('vitrineProdutos'), alvo = null, x0 = 0, y0 = 0;
  vitrine.addEventListener('touchstart', function (e) {
    alvo = e.target.closest('.carrossel-container');
    if (!alvo) return;
    x0 = e.touches[0].clientX; y0 = e.touches[0].clientY;
  }, { passive: true });
  vitrine.addEventListener('touchend', function (e) {
    if (!alvo) return;
    var t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0, c = alvo;
    alvo = null;
    if (horizontal(dx, dy)) {
      var b = c.querySelector(dx < 0 ? '.btn-next' : '.btn-prev');
      if (b) b.click();
    }
  }, { passive: true });

  var wrap = document.querySelector('.galeria-carrossel-wrap'), gx = 0, gy = 0;
  wrap.addEventListener('touchstart', function (e) { gx = e.touches[0].clientX; gy = e.touches[0].clientY; }, { passive: true });
  wrap.addEventListener('touchend', function (e) {
    var t = e.changedTouches[0], dx = t.clientX - gx, dy = t.clientY - gy;
    if (horizontal(dx, dy)) $(dx < 0 ? 'btnNextGaleria' : 'btnPrevGaleria').click();
  }, { passive: true });
})();
