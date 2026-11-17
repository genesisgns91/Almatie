// Almatiê Art — Checkout Pix transparente (sem login no Mercado Pago)
// Define window.iniciarCheckout(produtoId, tituloEncoded, precoStr) — mesma assinatura usada
// pelos botões "Comprar Arte" já existentes no site.

const WORKER = "https://almatie-pagamentos.almatie-stock.workers.dev";
const INTERVALO_STATUS_MS = 4000;
const TEMPO_MAXIMO_MS = 30 * 60 * 1000;

let timerStatus = null;
let inicioPolling = 0;
let overlay = null;

// ---------- estilos ----------
const css = document.createElement("style");
css.textContent = `
.pix-overlay{position:fixed;inset:0;background:rgba(27,18,48,.62);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;z-index:10000;padding:14px;animation:pixFade .18s ease}
.pix-box{background:#fff;border-radius:20px;max-width:430px;width:100%;max-height:94vh;overflow:auto;padding:22px 22px 18px;box-shadow:0 18px 50px rgba(0,0,0,.28);text-align:center;font-family:'Inter',sans-serif;color:#1B1230;position:relative;animation:pixSobe .24s cubic-bezier(.2,.9,.3,1.1)}
.pix-fechar{position:absolute;top:10px;right:12px;width:32px;height:32px;border:none;background:#f4f1f8;border-radius:50%;font-size:15px;cursor:pointer;color:#6b6478;transition:background .15s,transform .15s;z-index:2}
.pix-fechar:hover{background:#e9e4f1;transform:rotate(90deg)}
.pix-tela{animation:pixTela .22s ease}
@keyframes pixFade{from{opacity:0}to{opacity:1}}
@keyframes pixSobe{from{opacity:0;transform:translateY(14px) scale(.98)}to{opacity:1;transform:none}}
@keyframes pixTela{from{opacity:0;transform:translateX(10px)}to{opacity:1;transform:none}}
@keyframes pixPulso{0%{transform:scale(1)}40%{transform:scale(1.07)}100%{transform:scale(1)}}
@keyframes pixTrem{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-5px)}40%,80%{transform:translateX(5px)}}
@keyframes pixGira{to{transform:rotate(360deg)}}
.pix-box h3{margin:0 0 4px;font-size:1.2rem}
.pix-produto{font-size:.9rem;color:#666;margin-bottom:14px}
/* cabeçalho "Comprar arte" */
.pix-cab{display:flex;align-items:center;gap:12px;text-align:left;margin:0 34px 16px 0}
.pix-cab-img{width:52px;height:52px;border-radius:12px;object-fit:cover;background:#f4f1f8;border:1px solid #eee;flex:none}
.pix-cab-txt{min-width:0;display:flex;flex-direction:column;gap:1px}
.pix-cab-rot{font-size:.72rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--primary,#BE3A78)}
.pix-cab-nome{font-size:1rem;line-height:1.25;overflow-wrap:anywhere}
/* campos com rótulo flutuante */
.pix-campo{position:relative;margin-bottom:10px}
.pix-campo input{width:100%;padding:14px 14px;border:1.5px solid #ddd6e8;border-radius:12px;font-size:15px;box-sizing:border-box;background:#fff;color:#1B1230;transition:border-color .15s,box-shadow .15s}
.pix-campo input:focus{outline:none;border-color:var(--primary,#BE3A78);box-shadow:0 0 0 3px var(--primary-soft,#F9E8F0)}
.pix-campo input::placeholder{color:#8a8398;font-weight:500}
.pix-campo.invalido input{border-color:#c0392b;box-shadow:0 0 0 3px rgba(192,57,43,.12);animation:pixTrem .35s}
/* preço */
.pix-preco{margin:14px 0 6px;padding:14px 14px 10px;border-radius:14px;background:linear-gradient(180deg,#faf7fd,#f4f0fa);border:1px solid #ece6f4;text-align:left}
.pix-preco-topo{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:.78rem;color:#6b6478;font-weight:600}
.pix-eco{background:#e3f6e9;color:#1E6B3A;border-radius:999px;padding:2px 9px;font-size:.72rem;font-weight:700;animation:pixPulso .4s}
.pix-preco-valor{display:flex;align-items:baseline;gap:8px;margin:2px 0}
.pix-preco-valor b{font-size:1.9rem;font-weight:800;color:var(--primary,#BE3A78);letter-spacing:-.5px}
.pix-preco-valor s{font-size:.95rem;color:#9a93a8}
.pix-preco-valor.pulsa b{animation:pixPulso .38s}
.pix-preco-cartao{font-size:.78rem;color:#6b6478;margin:0 0 2px}
.pix-det{margin-top:6px;font-size:.8rem}
.pix-det summary{cursor:pointer;color:#6b6478;font-weight:600;list-style:none;padding:4px 0;user-select:none}
.pix-det summary::-webkit-details-marker{display:none}
.pix-det summary::after{content:" ▾";font-size:.7rem}
.pix-det[open] summary::after{content:" ▴"}
.pix-det-linhas{margin-top:4px}
.pix-det-linhas div{display:flex;justify-content:space-between;gap:10px;padding:2px 0}
.pix-det-linhas .desc{color:#1E6B3A;font-weight:600}
.pix-det-linhas .tot{margin-top:4px;padding-top:6px;border-top:1px solid #e3deea;font-weight:800}
.pix-det-linhas .nome{min-width:0;overflow-wrap:anywhere}
/* carrinho */
.pix-carrinho{margin:8px 0 0;padding:10px 12px;border:1px solid #ece6f4;border-radius:12px;text-align:left;background:#fff}
.pix-carrinho-topo{display:flex;justify-content:space-between;align-items:center;font-size:.82rem;font-weight:700}
.pix-limpar{display:inline-flex;align-items:center;gap:5px;border:1.5px solid #f0c9c2;background:#fff5f3;color:#b3402f;font-size:.78rem;font-weight:700;cursor:pointer;padding:6px 11px;border-radius:999px;font-family:inherit;transition:background .15s,border-color .15s}
.pix-limpar:hover{background:#ffe8e4;border-color:#e5a79d}
.pix-cart-lista{display:flex;flex-direction:column;gap:6px;margin:8px 0 2px;max-height:150px;overflow:auto}
.pix-cart-item{display:flex;align-items:center;gap:8px;font-size:.82rem}
.pix-cart-img{width:34px;height:34px;border-radius:8px;object-fit:cover;flex:none;border:1px solid #eee;background:#fff}
.pix-cart-item .nome{flex:1;min-width:0;overflow-wrap:anywhere}
.pix-cart-rm{border:none;background:none;color:#a33;cursor:pointer;font-size:14px;padding:4px 6px;border-radius:6px}
.pix-cart-rm:hover{background:#fbeaea}
.pix-cart-dica{font-size:.76rem;color:#6b6478;margin:6px 0 0;line-height:1.35}
/* botões */
.pix-btn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:14px;border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;margin-top:10px;background:var(--primary,#BE3A78);color:#fff;font-family:inherit;transition:transform .12s,box-shadow .15s,filter .15s;box-shadow:0 4px 14px rgba(190,58,120,.28);text-decoration:none;box-sizing:border-box}
.pix-btn:hover{filter:brightness(1.06)}
.pix-btn:active{transform:scale(.98)}
.pix-btn:disabled{opacity:.7;cursor:wait}
.pix-btn.carregando::before{content:"";width:15px;height:15px;border:2px solid rgba(255,255,255,.5);border-top-color:#fff;border-radius:50%;animation:pixGira .7s linear infinite}
.pix-btn-neutro{background:#fff;color:#5b5370;border:1.5px solid #e4def0;box-shadow:none;font-weight:600}
.pix-btn-neutro:hover{background:#faf8fd;filter:none;border-color:#d4cbe6}
.pix-btn-neutro.carregando::before{border-color:rgba(91,83,112,.3);border-top-color:#5b5370}
.sf-barra{position:relative}
.pix-btn-sec{background:#fff;color:var(--primary-hover,#9C2C61);border:1.5px solid var(--primary,#BE3A78);box-shadow:none}
.pix-btn-sec.carregando::before{border-color:rgba(156,44,97,.3);border-top-color:var(--primary-hover,#9C2C61)}
.pix-btn[hidden]{display:none}
.pix-erro{color:#c0392b;font-size:.85rem;margin-top:8px;min-height:1em}
.pix-discreto{display:flex;flex-direction:column;align-items:center;gap:2px;margin-top:8px}
.pix-discreto button,.pix-link-cartao{border:none;background:none;font-size:.8rem;color:#7a7388;text-decoration:underline;cursor:pointer;padding:6px 8px;font-family:inherit;border-radius:6px;transition:color .15s,background .15s}
.pix-discreto #pixCartao,.pix-link-cartao{color:var(--primary-hover,#9C2C61);font-weight:700;font-size:.86rem}
.pix-discreto button:hover,.pix-link-cartao:hover{color:var(--primary-hover,#9C2C61);background:#faf7fd}
.pix-link-cartao{display:inline-block;margin-top:10px}
/* cupom */
.pix-cupom-cx{margin-top:8px;text-align:left;animation:pixTela .2s ease}
.pix-cupom-linha{display:flex;gap:8px;align-items:stretch}
.pix-cupom-linha input{flex:1;min-width:0;padding:11px 12px;border:1.5px solid #ddd6e8;border-radius:12px;font-size:15px;text-transform:uppercase;box-sizing:border-box}
.pix-cupom-linha input:focus{outline:none;border-color:var(--primary,#BE3A78)}
.pix-cupom-linha .pix-btn{width:auto;margin-top:0;padding:0 16px;font-size:14px}
.pix-cupom-msg{font-size:.78rem;color:#666;text-align:left;margin-top:6px;line-height:1.35}.pix-cupom-msg.ok{color:#1E6B3A;font-weight:600}.pix-cupom-msg.erro{color:#c0392b}
/* tela "leve também" */
.pix-lt-selo{display:inline-block;background:var(--primary-soft,#F9E8F0);color:var(--primary-hover,#9C2C61);border-radius:999px;padding:4px 12px;font-size:.75rem;font-weight:800;margin-bottom:8px}
.pix-lt-img{width:150px;height:150px;border-radius:16px;object-fit:cover;background:#f4f1f8;border:1px solid #eee;margin:8px auto 10px;display:block;box-shadow:0 6px 18px rgba(0,0,0,.12)}
.pix-lt-nome{display:block;font-size:1.02rem;line-height:1.3;overflow-wrap:anywhere}
.pix-lt-preco{margin:6px 0 2px;font-size:.95rem;color:#555}
.pix-lt-preco s{opacity:.65}
.pix-lt-preco b{color:var(--primary-hover,#9C2C61);font-size:1.25rem;margin:0 4px}
.pix-lt-preco em{font-style:normal;background:#e3f6e9;color:#1E6B3A;border-radius:999px;padding:2px 8px;font-size:.75rem;font-weight:800}
.pix-lt-total{font-size:.82rem;color:#6b6478;margin-bottom:4px}
/* QR, sucesso, recuperar (como antes) */
.pix-box label{display:block;text-align:left;font-size:.8rem;font-weight:600;margin:10px 0 4px}
.pix-box input[type=text],.pix-box input[type=email]{width:100%;padding:11px;border:1px solid #ccc;border-radius:8px;font-size:15px;box-sizing:border-box}
.pix-qr img{width:210px;height:210px;border:1px solid #eee;border-radius:10px;margin:8px auto}
.pix-valor{font-size:1.4rem;font-weight:800;color:var(--primary,#BE3A78);margin:6px 0}
.pix-copia{width:100%;font-size:11px;padding:8px;border:1px solid #ddd;border-radius:6px;background:#fafafa;text-align:center;box-sizing:border-box}
.pix-aguardando{font-size:.85rem;color:#666;margin-top:12px}
.pix-ok-icone{font-size:48px;animation:pixPulso .6s}
.pix-passos{font-size:.8rem;color:#666;text-align:left;margin:10px 0 0;padding-left:18px}
.pix-links-lista{display:flex;flex-direction:column;gap:8px}
.pix-cupom-novo{margin-top:12px;padding:12px;border:2px dashed #1E6B3A;background:#eefaf1;border-radius:10px;font-size:.85rem;color:#14401f;text-align:left}.pix-cupom-novo p{margin:6px 0}
.sf-carrinho{position:relative;flex:none;display:grid;place-items:center;width:48px;height:48px;border:1px solid #e6e0ee;border-radius:50%;background:#fff;color:var(--primary-hover,#9C2C61);cursor:pointer;box-shadow:0 1px 3px rgba(40,20,60,.08);transition:transform .15s,box-shadow .15s,border-color .15s,background .15s}
.sf-carrinho:hover{border-color:var(--primary,#BE3A78);box-shadow:0 3px 10px rgba(190,58,120,.18)}
.sf-carrinho:active{transform:scale(.94)}
.sf-carrinho.cheio{background:var(--primary,#BE3A78);border-color:var(--primary,#BE3A78);color:#fff}
.sf-carrinho[hidden]{display:none}
.sf-carrinho-n{position:absolute;top:-4px;right:-4px;min-width:20px;height:20px;padding:0 5px;border-radius:999px;background:#fff;color:var(--primary-hover,#9C2C61);border:2px solid var(--primary,#BE3A78);font:800 11px/16px 'Inter',system-ui,sans-serif;text-align:center;box-sizing:border-box}
.sf-carrinho-n[hidden]{display:none}
.sf-carrinho.pula{animation:pixPula .45s ease}
@keyframes pixPula{0%{transform:scale(1)}35%{transform:scale(1.22) rotate(-8deg)}70%{transform:scale(.96)}100%{transform:scale(1)}}
.pix-carrinho-aviso{position:absolute;right:0;top:calc(100% + 8px);z-index:50;width:min(280px,86vw);padding:12px 14px;border-radius:12px;background:#2b2140;color:#fff;font:500 .82rem/1.4 'Inter',system-ui,sans-serif;box-shadow:0 10px 28px rgba(30,15,50,.28);animation:pixSobe .2s ease}
.pix-guardar{margin-top:14px;padding:12px;border:2px dashed #e0a800;background:#fff8e1;border-radius:10px;font-size:.85rem;color:#4a3b00;text-align:left}.pix-guardar p{margin:6px 0}.pix-guardar-codigo{font-weight:700;font-size:1rem;letter-spacing:.5px;margin:6px 0;word-break:break-all}.pix-guardar-btn{display:block;width:100%;margin-top:6px;padding:8px;border:1px solid #c9a227;background:#fff;border-radius:8px;cursor:pointer;font-weight:600;color:#4a3b00}
@media (prefers-reduced-motion:reduce){.pix-overlay,.pix-box,.pix-tela,.pix-eco,.pix-barra,.pix-cupom-cx,.pix-ok-icone{animation:none!important}.pix-btn,.pix-campo input,.pix-campo label{transition:none}}
`;
document.head.appendChild(css);

// ---------- utilidades ----------
function pararPolling() {
  if (timerStatus) clearInterval(timerStatus);
  timerStatus = null;
}

function fechar() {
  pararPolling();
  if (overlay) overlay.remove();
  overlay = null;
  document.body.style.overflow = "";
  atualizarBarra();
}

// Ao fechar pelo botão/fundo, limpa o código do pedido do endereço (volta ao site "limpo")
function limparRetorno() {
  try {
    if (new URLSearchParams(window.location.search).has("ped")) {
      history.replaceState(null, "", window.location.pathname);
    }
  } catch { /* ignora */ }
}
function fecharPeloUsuario() {
  fechar();
  limparRetorno();
}

function criarModal() {
  fechar();
  overlay = document.createElement("div");
  overlay.className = "pix-overlay";
  overlay.innerHTML = `<div class="pix-box"><button class="pix-fechar" title="Fechar">✕</button><div id="pixConteudo"></div></div>`;
  overlay.addEventListener("click", (e) => { if (e.target === overlay) fecharPeloUsuario(); });
  overlay.querySelector(".pix-fechar").addEventListener("click", fecharPeloUsuario);
  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";
  atualizarBarra();
  return overlay.querySelector("#pixConteudo");
}

function lerStorage(chave) {
  try { return localStorage.getItem(chave) || ""; } catch { return ""; }
}
function gravarStorage(chave, valor) {
  try { localStorage.setItem(chave, valor); } catch { /* ignora */ }
}

async function copiar(texto, botao) {
  try {
    await navigator.clipboard.writeText(texto);
  } catch {
    const input = overlay.querySelector("#pixCopiaCola");
    input.select();
    document.execCommand("copy");
  }
  const original = botao.textContent;
  botao.textContent = "✓ Copiado!";
  setTimeout(() => (botao.textContent = original), 2000);
}

// ---------- ofertas: "leve também" e desconto no Pix ----------
// Os números mostrados aqui são só a PREVIA: quem cobra é o Worker de pagamentos, que refaz a conta no servidor.
// Por segurança, se o valor devolvido pelo servidor não bater com o combinado, o pagamento NÃO é mostrado.
const loja = () => window.AlmatieLoja || null;
const dinheiro = (c) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const normTag = (t) => String(t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/^#/, "").trim();
const semGeral = (v) => (v && v !== "Geral" ? v : "");

// "igual ou parecida": mesma tag, ou uma começa com a outra (flor/flores, kombi/kombis)
function tagsParecidas(a, b) {
  if (!a || !b) return false;
  if (a === b) return true;
  const [curta, longa] = a.length <= b.length ? [a, b] : [b, a];
  return curta.length >= 4 && longa.startsWith(curta);
}

function pontuarParecido(base, p) {
  const tb = (base.tags || []).map(normTag).filter(Boolean);
  const tp = (p.tags || []).map(normTag).filter(Boolean);
  let pontos = 0;
  tb.forEach((a) => { if (tp.some((b) => tagsParecidas(a, b))) pontos += 3; });
  if (semGeral(base.classe) && base.classe === p.classe) pontos += 2;
  if (semGeral(base.categoria) && base.categoria === p.categoria) pontos += 1;
  if (semGeral(base.tipo) && base.tipo === p.tipo) pontos += 1;
  return pontos;
}

// sorteia um pack que combine com o que a pessoa está comprando (quanto mais parecido, mais chance)
function sugerirPack(base, naoRepetir, metodo, cupom) {
  const L = loja();
  if (!L) return null;
  const todos = L.produtos().filter((p) => p.id !== base.id && (p.imagens || []).length && L.calcularPedido(p, null, "pix").p1 > 0);
  // só sugere pack em que o desconto do "leve também" realmente vale (maior que o Pix/cartão, promoção ou cupom que ele já teria)
  if (metodo) {
    const uteis = todos.filter((p) => L.calcularPedido(base, p, metodo, undefined, cupom, p.id).descCombo > 0);
    todos.length = 0; todos.push(...uteis);
  }
  if (!todos.length) return null;
  let pool = todos.filter((p) => !naoRepetir.includes(p.id));
  if (!pool.length) { naoRepetir.length = 0; pool = todos; }
  const comPontos = pool.map((p) => ({ p, pts: pontuarParecido(base, p) }));
  const parecidos = comPontos.filter((x) => x.pts > 0);
  const lista = parecidos.length ? parecidos : comPontos.map((x) => ({ p: x.p, pts: 1 }));
  let sorteio = Math.random() * lista.reduce((t, x) => t + x.pts, 0);
  for (const x of lista) { sorteio -= x.pts; if (sorteio <= 0) return x.p; }
  return lista[lista.length - 1].p;
}


// ---------- carrinho (só existe quando o carrinho está ligado no painel; fica salvo neste aparelho) ----------
const CHAVE_CARRINHO = "almatie_carrinho";
const MAX_CARRINHO = 30;
let carrinhoMem = null;
function lerCarrinho() {
  if (carrinhoMem) return carrinhoMem.slice();
  let ids = [];
  try { const a = JSON.parse(lerStorage(CHAVE_CARRINHO) || "[]"); if (Array.isArray(a)) ids = a.filter((x) => typeof x === "string" && x && x.length < 80); } catch { ids = []; }
  return [...new Set(ids)].slice(0, MAX_CARRINHO);
}
function salvarCarrinho(ids) {
  carrinhoMem = ids.slice();
  if (ids.length) gravarStorage(CHAVE_CARRINHO, JSON.stringify(ids));
  else { try { localStorage.removeItem(CHAVE_CARRINHO); } catch { /* ignora */ } }
  atualizarBarra();
}
const esvaziarCarrinho = () => salvarCarrinho([]);
const carrinhoLigado = () => { const L = loja(); return !!(L && L.ofertas().carrinho.ativo); };

// ícone do carrinho ao lado da busca (aparece quando o carrinho está ligado); o número mostra quantas artes estão nele
let barra = null;
const SVG_CARRINHO = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2.5 3.5h2.6l2.3 11.2a1.6 1.6 0 0 0 1.6 1.3h8.1a1.6 1.6 0 0 0 1.6-1.2L20.5 8H6.1"/></svg>';
function fecharAvisoCarrinho() { const a = document.getElementById("pixCarrinhoAviso"); if (a) a.remove(); }
function atualizarBarra() {
  const ligado = carrinhoLigado();
  const ids = ligado ? lerCarrinho() : [];
  if (!ligado) { if (barra) barra.hidden = true; return; }
  if (!barra || !barra.isConnected) {
    const busca = document.getElementById("blocoBusca");
    if (!busca || !busca.parentElement) return;
    barra = document.createElement("button");
    barra.type = "button";
    barra.className = "sf-carrinho";
    barra.setAttribute("aria-label", "Ver meu carrinho");
    barra.innerHTML = `${SVG_CARRINHO}<span class="sf-carrinho-n" hidden></span>`;
    barra.addEventListener("click", () => {
      if (lerCarrinho().length) { fecharAvisoCarrinho(); abrirCarrinho(); return; }
      if (document.getElementById("pixCarrinhoAviso")) { fecharAvisoCarrinho(); return; }
      const av = document.createElement("div"); av.id = "pixCarrinhoAviso"; av.className = "pix-carrinho-aviso"; av.setAttribute("role", "status");
      av.textContent = "Seu carrinho está vazio. Toque em “Comprar Arte” e depois em “Continuar comprando” para juntar várias artes.";
      barra.parentElement.appendChild(av);
      setTimeout(fecharAvisoCarrinho, 5000);
    });
    busca.parentElement.appendChild(barra);
  }
  barra.hidden = false;
  const n = barra.querySelector(".sf-carrinho-n");
  const antes = Number(n.textContent) || 0;
  n.textContent = String(ids.length); n.hidden = !ids.length;
  barra.setAttribute("aria-label", ids.length ? `Ver meu carrinho (${ids.length} ${ids.length === 1 ? "arte" : "artes"})` : "Ver meu carrinho (vazio)");
  barra.classList.toggle("cheio", ids.length > 0);
  if (ids.length > antes) { barra.classList.remove("pula"); void barra.offsetWidth; barra.classList.add("pula"); }
}
function abrirCarrinho() {
  const L = loja();
  if (!L || !L.produtos().length) return;
  const ids = lerCarrinho();
  const prod = ids.map((id) => L.produtos().find((p) => p && p.id === id)).find((p) => p && L.calcularPedido(p, null, "pix").p1 > 0);
  if (!prod) { esvaziarCarrinho(); return; }
  window.iniciarCheckout(prod.id, encodeURIComponent(prod.titulo), undefined, { daBarra: true });
}
{ let tentativas = 0; const t = setInterval(() => { atualizarBarra(); if (++tentativas >= 20) clearInterval(t); }, 800); }

// ---------- estado do checkout ----------
// itens: packs do pedido (o 1º é o principal); origem: o pack em que a pessoa tocou "Comprar arte"
function sincronizar(ctx) {
  ctx.prod = ctx.itens[0] || null;
  if (ctx.prod) { ctx.produtoId = ctx.prod.id; ctx.titulo = ctx.prod.titulo; }
  ctx.extras = ctx.itens.slice(1);
}
function novoContexto(produtoId, titulo, opcoes) {
  const L = loja();
  const prod = L ? (L.produtos().find((p) => p.id === produtoId) || null) : null;
  const ctx = { itens: prod ? [prod] : [], produtoId, titulo, prod, origem: prod, extras: [], sugestao: null, jaSugeridos: [], ofertaVista: false,
    cupom: null, cupomEmail: "", persistir: false, daBarra: !!(opcoes && opcoes.daBarra), email: lerStorage("almatie_email"), nome: lerStorage("almatie_nome") };
  if (!prod) return ctx;
  if (carrinhoLigado()) {
    const ids = lerCarrinho();
    if (ids.length) {                                  // já existe carrinho: o pack clicado entra nele
      if (!ids.includes(produtoId) && ids.length < MAX_CARRINHO) ids.push(produtoId);
      const itens = ids.map((id) => L.produtos().find((p) => p && p.id === id)).filter((p) => p && L.calcularPedido(p, null, "pix").p1 > 0);
      if (itens.length) { ctx.itens = itens; ctx.persistir = true; salvarCarrinho(itens.map((p) => p.id)); }
    }
  }
  sincronizar(ctx);
  return ctx;
}

// o desconto do "leve também" só existe quando a pessoa aceitou a oferta (e o pedido continua sendo esses 2 packs)
function leveAtual(ctx) {
  return (ctx.leveId && ctx.itens.length === 2 && ctx.itens[1].id === ctx.leveId) ? ctx.leveId : "";
}
function calculo(ctx, metodo) {
  const L = loja();
  return (L && ctx.prod) ? L.calcularPedido(ctx.prod, ctx.extras, metodo, undefined, ctx.cupom, leveAtual(ctx)) : null;
}

// só confere o valor quando existe oferta no meio (sem oferta o comportamento é o de sempre)
function precisaConferir(ctx, metodo) {
  const c = calculo(ctx, metodo);
  return !!c && (ctx.extras.length > 0 || c.total !== c.p1);
}

function conferirValor(ctx, metodo, valorServidor) {
  if (!precisaConferir(ctx, metodo)) return;
  const esperado = calculo(ctx, metodo).total;
  const recebido = Math.round(Number(valorServidor) * 100);
  if (!Number.isFinite(recebido)) throw new Error("Não foi possível calcular o valor do pedido. Tente novamente.");
  // o servidor é quem cobra. Se cobrar MENOS ou o mesmo, segue. Se for MAIS, avisa com o valor novo e só segue se a pessoa tocar de novo.
  if (recebido > esperado + 1) {
    ctx.aceito = ctx.aceito || {};
    if (ctx.aceito[metodo] !== recebido) {
      ctx.aceito[metodo] = recebido;
      throw new Error(`O valor do pedido foi atualizado para ${dinheiro(recebido)} (promoções do momento). Se estiver de acordo, toque em pagar de novo.`);
    }
  }
}

function corpoPedido(ctx, extras) {
  const corpo = { produtoId: ctx.produtoId, ...extras };
  if (ctx.extras.length) corpo.extras = ctx.extras.map((p) => p.id);
  if (leveAtual(ctx)) corpo.leve = leveAtual(ctx);
  if (ctx.cupom) { corpo.cupom = ctx.cupom.codigo; corpo.email = ctx.cupomEmail; }
  return corpo;
}

function tituloDoPedido(ctx) {
  if (!ctx.extras.length) return ctx.titulo;
  return ctx.extras.length === 1 ? `${ctx.titulo} + ${ctx.extras[0].titulo}` : `${ctx.titulo} + ${ctx.extras.length} packs`;
}

const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
const metodoTexto = (m) => (m === "pix" ? "no Pix" : (m === "cartao" ? "no cartão" : ""));

// botão com "carregando": devolve a função que desfaz
function ocupar(btn, texto) {
  const antes = btn.textContent;
  btn.disabled = true; btn.classList.add("carregando"); btn.textContent = texto;
  return () => { btn.disabled = false; btn.classList.remove("carregando"); btn.textContent = antes; };
}

// ---------- tela 1: "Comprar arte" (limpa: dados, preço, 2 botões e 3 links discretos) ----------
function textoProximaFaixa(L, qtd) {
  const prox = L.ofertas().carrinho.faixas.find((f) => f.minItens > qtd);
  if (!prox) return L.ofertas().carrinho.faixas.length ? "Você já ganhou o maior desconto do carrinho! 🎉" : "";
  const falta = prox.minItens - qtd;
  return `Leve mais ${falta} ${falta === 1 ? "arte" : "artes"} e ganhe ${prox.percentual}% de desconto.`;
}

function desenharPreco(container, ctx, animar) {
  const L = loja();
  const caixa = container.querySelector("#pixPreco");
  const cab = container.querySelector(".pix-cab-nome");
  const btnGerar = container.querySelector("#pixGerar");
  const btnCartao = container.querySelector("#pixCartao");
  const img = container.querySelector(".pix-cab-img");
  cab.textContent = ctx.itens.length > 1 ? `${ctx.itens.length} artes no pedido` : ctx.titulo;
  if (ctx.itens[0]) { img.src = L.miniatura((ctx.itens[0].imagens || [])[0] || "", 120); img.hidden = !(ctx.itens[0].imagens || []).length; }

  const pix = calculo(ctx, "pix"), cartao = calculo(ctx, "cartao");
  caixa.innerHTML = "";
  if (!pix) { caixa.hidden = true; return; }
  caixa.hidden = false;
  const vitrine = pix.cheio;                                                        // soma dos preços cheios dos packs
  const economia = Math.max(0, vitrine - pix.total);
  const o = L.ofertas();
  const lt = L.normalizarLeveTambem(ctx.prod && ctx.prod.leveTambem);

  const topo = document.createElement("div"); topo.className = "pix-preco-topo";
  const rot = document.createElement("span"); rot.textContent = "Total no Pix";
  topo.appendChild(rot);
  if (economia > 0) { const eco = document.createElement("span"); eco.className = "pix-eco"; eco.textContent = `Você economiza ${dinheiro(economia)}`; topo.appendChild(eco); }
  const valor = document.createElement("div"); valor.className = "pix-preco-valor" + (animar ? " pulsa" : "");
  if (economia > 0) { const s = document.createElement("s"); s.textContent = dinheiro(vitrine); valor.appendChild(s); }
  const b = document.createElement("b"); b.textContent = dinheiro(pix.total); valor.appendChild(b);
  caixa.append(topo, valor);

  if (cartao && cartao.total !== pix.total) {
    const p = document.createElement("div"); p.className = "pix-preco-cartao";
    p.textContent = `No cartão de crédito: ${dinheiro(cartao.total)}`;
    caixa.appendChild(p);
  }

  // detalhes (fechados): lista dos packs e de cada desconto
  const det = document.createElement("details"); det.className = "pix-det";
  const sum = document.createElement("summary"); sum.textContent = "Ver detalhes";
  const linhas = document.createElement("div"); linhas.className = "pix-det-linhas";
  const linha = (cls, nome, v) => { const d = document.createElement("div"); if (cls) d.className = cls; const a = document.createElement("span"); a.className = "nome"; a.textContent = nome; const c = document.createElement("span"); c.textContent = v; d.append(a, c); linhas.appendChild(d); };
  ctx.itens.forEach((p) => linha("", p.titulo, dinheiro(L.calcularPedido(p, null, "todos").cheio)));
  const sm = pix.soma;
  if (sm.promo > 0) linha("desc", "Promoção", `−${dinheiro(sm.promo)}`);
  if (sm.pagamento > 0) linha("desc", "Desconto no Pix", `−${dinheiro(sm.pagamento)}`);
  if (sm.carrinho > 0) { const f = L.faixaDoCarrinho(o.carrinho, pix.qtd); linha("desc", `Desconto do carrinho${f ? ` (−${f.percentual}%)` : ""}`, `−${dinheiro(sm.carrinho)}`); }
  if (sm.combo > 0) linha("desc", `Desconto "leve também" (−${lt.percentual}%)`, `−${dinheiro(sm.combo)}`);
  if (sm.cupom > 0) linha("desc", ctx.cupom ? `Cupom ${ctx.cupom.codigo}` : "Cupom", `−${dinheiro(sm.cupom)}`);
  linha("tot", "Total no Pix", dinheiro(pix.total));
  det.append(sum, linhas);
  caixa.appendChild(det);

  const nota = container.querySelector("#pixCupomNota");
  nota.textContent = "";
  if (ctx.cupom) {
    const rel = ctx.cupom.metodo === "cartao" ? cartao : pix;
    if (!rel.cupomVale) nota.textContent = "Os descontos não se acumulam: cada arte recebe só o maior desconto, e aqui o desconto que ela já tem é igual ou maior que o do cupom. Por isso o cupom não será usado (e continua valendo para outra compra).";
    else if (ctx.cupom.metodo !== "todos") nota.textContent = `Cupom válido só ${metodoTexto(ctx.cupom.metodo).replace("no ", "para pagamento no ").replace("para pagamento no cartão", "para pagamento no cartão de crédito")}.`;
  }

  btnGerar.textContent = `Pagar no Pix · ${dinheiro(pix.total)}`;
  btnCartao.textContent = cartao && (cartao.total !== pix.total || cartao.total < vitrine) ? `Pagar com cartão de crédito (${dinheiro(cartao.total)})` : "Pagar com cartão de crédito";

  desenharCarrinho(container, ctx);
}

// carrinho: botão "Continuar comprando" + lista com "Limpar carrinho" (com 2 ou mais artes, ou sempre que há algo no carrinho salvo)
function desenharCarrinho(container, ctx) {
  const L = loja();
  const area = container.querySelector("#pixCarrinho");
  const continuar = container.querySelector("#pixContinuar");
  area.innerHTML = "";
  const ligado = !!ctx.prod && carrinhoLigado();
  continuar.hidden = !ligado || ctx.itens.length >= MAX_CARRINHO;
  continuar.textContent = ctx.itens.length > 1 ? "＋ Selecionar mais itens" : "＋ Continuar comprando";
  if (!ligado) return;
  const dicaTxt = textoProximaFaixa(L, ctx.itens.length);
  if (ctx.itens.length > 1 || ctx.daBarra || lerCarrinho().length > 0) {
    const box = document.createElement("div"); box.className = "pix-carrinho";
    const topo = document.createElement("div"); topo.className = "pix-carrinho-topo";
    const t = document.createElement("span"); t.textContent = `🛒 Seu carrinho · ${ctx.itens.length} ${ctx.itens.length === 1 ? "arte" : "artes"}`;
    const limpar = document.createElement("button"); limpar.type = "button"; limpar.className = "pix-limpar"; limpar.textContent = "🗑 Limpar carrinho";
    limpar.addEventListener("click", () => limparCarrinho(container, ctx));
    topo.append(t, limpar);
    const lista = document.createElement("div"); lista.className = "pix-cart-lista";
    ctx.itens.forEach((p, i) => {
      const l = document.createElement("div"); l.className = "pix-cart-item";
      const img = document.createElement("img"); img.className = "pix-cart-img"; img.alt = ""; img.src = L.miniatura((p.imagens || [])[0] || "", 96);
      const nome = document.createElement("span"); nome.className = "nome"; nome.textContent = p.titulo;
      const preco = document.createElement("b"); preco.textContent = dinheiro(L.calcularPedido(p, null, "todos").p1);
      const rm = document.createElement("button"); rm.type = "button"; rm.className = "pix-cart-rm"; rm.title = "Remover do carrinho"; rm.textContent = "✕";
      rm.addEventListener("click", () => {
        ctx.itens.splice(i, 1);
        if (!ctx.itens.length) { esvaziarCarrinho(); fecharPeloUsuario(); return; }
        sincronizar(ctx);
        if (ctx.persistir) salvarCarrinho(ctx.itens.map((x) => x.id));
        desenharPreco(container, ctx, true);
      });
      l.append(img, nome, preco, rm); lista.appendChild(l);
    });
    box.append(topo, lista);
    if (dicaTxt) { const d = document.createElement("div"); d.className = "pix-cart-dica"; d.textContent = dicaTxt; box.appendChild(d); }
    area.appendChild(box);
  } else if (dicaTxt && L.ofertas().carrinho.faixas.length) {
    const d = document.createElement("div"); d.className = "pix-cart-dica"; d.textContent = dicaTxt; area.appendChild(d);
  }
}

// "Limpar carrinho": zera o carrinho salvo. Se a pessoa veio de "Comprar arte", fica só com a arte em que tocou; se veio da barra, fecha.
function limparCarrinho(container, ctx) {
  esvaziarCarrinho();
  ctx.persistir = false;
  if (ctx.daBarra || !ctx.origem) { fecharPeloUsuario(); return; }
  ctx.itens = [ctx.origem];
  sincronizar(ctx);
  desenharPreco(container, ctx, true);
}

// campo "Tenho um cupom" (confere no servidor; precisa do e-mail: 1 uso por e-mail)
function ligarCupom(container, ctx) {
  const abrir = container.querySelector("#pixCupomAbrir");
  const cx = container.querySelector("#pixCupomCx");
  const cod = container.querySelector("#pixCupomCod");
  const ok = container.querySelector("#pixCupomOk");
  const msg = container.querySelector("#pixCupomMsg");
  const email = container.querySelector("#pixEmail");
  const rotulo = () => {
    cod.disabled = !!ctx.cupom;
    ok.textContent = ctx.cupom ? "Remover" : "Aplicar";
    if (ctx.cupom) {
      const so = ctx.cupom.metodo === "pix" ? " (só no Pix)" : (ctx.cupom.metodo === "cartao" ? " (só no cartão)" : "");
      msg.className = "pix-cupom-msg ok"; msg.textContent = `✓ Cupom ${ctx.cupom.codigo} aplicado${so}`;
    }
  };
  abrir.addEventListener("click", () => { cx.hidden = !cx.hidden; if (!cx.hidden) cod.focus(); });
  email.addEventListener("input", () => {
    if (ctx.cupom && email.value.trim().toLowerCase() !== ctx.cupomEmail) {
      ctx.cupom = null; ctx.cupomEmail = "";
      msg.className = "pix-cupom-msg"; msg.textContent = "E-mail alterado: aplique o cupom de novo.";
      rotulo(); desenharPreco(container, ctx, true);
    }
  });
  const aplicar = async () => {
    if (ctx.cupom) {
      ctx.cupom = null; ctx.cupomEmail = ""; cod.value = ""; msg.textContent = "";
      rotulo(); desenharPreco(container, ctx, true);
      return;
    }
    const codigo = cod.value.trim();
    const mail = email.value.trim();
    msg.className = "pix-cupom-msg";
    if (!codigo) { msg.textContent = "Digite o código do cupom."; return; }
    if (!emailOk(mail)) { msg.textContent = "Preencha seu e-mail acima primeiro (o cupom vale uma vez por e-mail)."; marcarInvalido(email); return; }
    const desfazer = ocupar(ok, "Conferindo…"); msg.textContent = "";
    try {
      const r = await fetch(`${WORKER}/cupom/validar`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ codigo, email: mail }) });
      const dados = await r.json();
      const c = dados && dados.cupom;
      if (!r.ok || !c || typeof c.codigo !== "string" || !Number.isFinite(Number(c.valor))) throw new Error((dados && dados.error) || "Cupom inválido.");
      ctx.cupom = { codigo: c.codigo, tipo: c.tipo === "valor" ? "valor" : "percentual", valor: Number(c.valor), metodo: (c.metodo === "pix" || c.metodo === "cartao") ? c.metodo : "todos" };
      ctx.cupomEmail = mail.toLowerCase();
      desfazer(); rotulo(); desenharPreco(container, ctx, true);
    } catch (e) {
      ctx.cupom = null;
      desfazer();
      msg.className = "pix-cupom-msg erro"; msg.textContent = e.message || "Não foi possível conferir o cupom.";
    }
  };
  ok.addEventListener("click", aplicar);
  cod.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); aplicar(); } });
}

function marcarInvalido(input) {
  const campo = input.closest(".pix-campo");
  if (campo) { campo.classList.remove("invalido"); void campo.offsetWidth; campo.classList.add("invalido"); }
  input.focus();
  input.addEventListener("input", () => campo && campo.classList.remove("invalido"), { once: true });
}

function telaFormulario(container, ctx) {
  container.innerHTML = `
    <div class="pix-tela">
      <div class="pix-cab"><img class="pix-cab-img" alt=""><div class="pix-cab-txt"><span class="pix-cab-rot">Comprar arte</span><strong class="pix-cab-nome"></strong></div></div>
      <div class="pix-campo"><input type="email" id="pixEmail" placeholder="Seu e-mail" aria-label="Seu e-mail" autocomplete="email" inputmode="email"></div>
      <div class="pix-campo"><input type="text" id="pixNome" placeholder="Seu nome" aria-label="Seu nome" autocomplete="name"></div>
      <div class="pix-preco" id="pixPreco" aria-live="polite"></div>
      <div id="pixCarrinho"></div>
      <button class="pix-btn pix-btn-sec" id="pixContinuar" type="button" hidden>＋ Continuar comprando</button>
      <button class="pix-btn" id="pixGerar" type="button">Pagar no Pix</button>
      <div class="pix-erro" id="pixErro" role="alert"></div>
      <div class="pix-discreto">
        <button type="button" id="pixCartao">Pagar com cartão de crédito</button>
        <button type="button" id="pixCupomAbrir">Tenho um cupom</button>
        <button type="button" id="pixRecuperar">Já paguei e perdi meu link</button>
      </div>
      <div class="pix-cupom-cx" id="pixCupomCx" hidden>
        <div class="pix-cupom-linha"><input type="text" id="pixCupomCod" placeholder="Código do cupom" maxlength="24" autocomplete="off" autocapitalize="characters"><button type="button" class="pix-btn pix-btn-sec" id="pixCupomOk">Aplicar</button></div>
        <div class="pix-cupom-msg" id="pixCupomMsg"></div>
      </div>
      <div class="pix-cupom-msg" id="pixCupomNota"></div>
    </div>`;
  const email = container.querySelector("#pixEmail"), nome = container.querySelector("#pixNome");
  email.value = ctx.email || ""; nome.value = ctx.nome || "";
  email.addEventListener("input", () => { ctx.email = email.value.trim(); });
  nome.addEventListener("input", () => { ctx.nome = nome.value.trim(); });
  const erro = container.querySelector("#pixErro");
  ligarCupom(container, ctx);
  desenharPreco(container, ctx, false);

  // valida os dados de topo; devolve true se pode seguir
  const dadosOk = () => {
    ctx.email = email.value.trim(); ctx.nome = nome.value.trim();
    if (!emailOk(ctx.email)) { erro.textContent = "Digite um e-mail válido para receber a arte."; marcarInvalido(email); return false; }
    gravarStorage("almatie_email", ctx.email);
    gravarStorage("almatie_nome", ctx.nome);
    erro.textContent = "";
    return true;
  };
  const seguir = async (botao, textoBusy, metodo) => {
    if (!dadosOk()) return;
    const desfazer = ocupar(botao, textoBusy);
    try { await seguirParaPagamento(container, ctx, metodo); }
    catch (e) { erro.textContent = (e && e.message) || "Falha de conexão. Tente novamente."; desfazer(); }
  };
  const gerar = container.querySelector("#pixGerar"), cartao = container.querySelector("#pixCartao");
  gerar.addEventListener("click", () => seguir(gerar, "Gerando Pix...", "pix"));
  cartao.addEventListener("click", () => seguir(cartao, "Abrindo pagamento...", "cartao"));
  email.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); nome.focus(); } });
  nome.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); gerar.click(); } });

  container.querySelector("#pixContinuar").addEventListener("click", () => {
    salvarCarrinho(ctx.itens.map((p) => p.id));      // a barra "🛒 N artes · Finalizar compra" volta quando a janela fecha
    ctx.persistir = true;
    fechar();
    atualizarBarra();
  });
  container.querySelector("#pixRecuperar").addEventListener("click", () => telaRecuperar(container, ctx));
}

// ---------- tela 2: "leve também" (só se o pack tem a opção ligada e a pessoa não escolheu continuar comprando) ----------
function sugestaoDaOferta(ctx, metodo) {
  const L = loja();
  if (!L || !ctx.prod || ctx.itens.length !== 1 || ctx.ofertaVista) return null;
  if (!L.ofertas().combo.ativo || !L.normalizarLeveTambem(ctx.prod.leveTambem).ativo) return null;
  if (ctx.sugestaoMetodo !== metodo) { ctx.sugestao = null; ctx.sugestaoMetodo = metodo; }
  if (!ctx.sugestao) ctx.sugestao = sugerirPack(ctx.prod, ctx.jaSugeridos, metodo, ctx.cupom);
  if (!ctx.sugestao) return null;
  const c = L.calcularPedido(ctx.prod, ctx.sugestao, metodo, undefined, ctx.cupom, ctx.sugestao.id);
  return c.descCombo > 0 ? ctx.sugestao : null;        // só oferece quando o desconto do "leve também" realmente vale neste pedido
}

async function seguirParaPagamento(container, ctx, metodo) {
  if (sugestaoDaOferta(ctx, metodo)) { telaOferta(container, ctx, metodo); return; }
  await enviarPedido(container, ctx, metodo);
}

async function enviarPedido(container, ctx, metodo) {
  if (metodo === "pix") {
    const r = await fetch(`${WORKER}/criar-pix`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpoPedido(ctx, { email: ctx.email, nome: ctx.nome })) });
    const dados = await r.json();
    if (!r.ok || !dados.qr_code) throw new Error(dados.error || "Falha ao gerar o Pix.");
    conferirValor(ctx, "pix", dados.valor);      // se o valor cobrado não for o prometido, não mostra o QR
    telaQrCode(container, dados, tituloDoPedido(ctx));
    return;
  }
  const r = await fetch(`${WORKER}/criar-pagamento`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpoPedido(ctx, {})) });
  const dados = await r.json();
  if (!dados.init_point) throw new Error(dados.error || "Não foi possível abrir o pagamento com cartão.");
  conferirValor(ctx, "cartao", dados.valor);     // idem: só segue se o valor bater com o combinado
  window.location.href = dados.init_point;
}

function telaOferta(container, ctx, metodo) {
  const L = loja();
  const sug = ctx.sugestao;
  const so = L.calcularPedido(ctx.prod, sug, metodo, undefined, ctx.cupom, sug.id);          // com o 2º pack (aceitando a oferta)
  const sem = L.calcularPedido(ctx.prod, null, metodo, undefined, ctx.cupom);          // só o pack atual
  const cheio = L.calcularPedido(sug, null, metodo).total;                              // o 2º pack sozinho, nesta forma de pagamento
  const adicional = so.total - sem.total;
  const pct = cheio > 0 ? Math.max(1, Math.round((1 - (so.total - sem.total) / cheio) * 100)) : 0;
  container.innerHTML = `
    <div class="pix-tela">
      <span class="pix-lt-selo">🎁 Oferta para este pedido</span>
      <h3>Leve também e economize</h3>
      <img class="pix-lt-img" alt="">
      <strong class="pix-lt-nome"></strong>
      <div class="pix-lt-preco"></div>
      <div class="pix-lt-total"></div>
      <button class="pix-btn" id="pixLtAdd" type="button">＋ Adicionar e continuar</button>
      <button class="pix-btn pix-btn-neutro" id="pixLtPular" type="button">Continuar sem adicionar</button>
      <div class="pix-erro" id="pixLtErro" role="alert"></div>
      <div class="pix-discreto">
        <button type="button" id="pixLtOutro">Ver outro pack</button>
      </div>
    </div>`;
  container.querySelector(".pix-lt-img").src = L.miniatura((sug.imagens || [])[0] || "", 320);
  container.querySelector(".pix-lt-nome").textContent = sug.titulo;
  const preco = container.querySelector(".pix-lt-preco");
  const s = document.createElement("s"); s.textContent = dinheiro(cheio);
  const b = document.createElement("b"); b.textContent = `+${dinheiro(adicional)}`;
  const em = document.createElement("em"); em.textContent = `−${pct}%`;
  preco.append(s, b, em);
  container.querySelector(".pix-lt-total").textContent = `Seu total ${metodoTexto(metodo)} passa de ${dinheiro(sem.total)} para ${dinheiro(so.total)}.`;
  const erro = container.querySelector("#pixLtErro");
  const add = container.querySelector("#pixLtAdd"), pular = container.querySelector("#pixLtPular");
  const rotuloFinal = metodo === "pix" ? "Gerando Pix..." : "Abrindo pagamento...";
  const andar = async (botao, adicionar) => {
    ctx.ofertaVista = true;
    if (adicionar) { ctx.itens = [ctx.prod, sug]; ctx.leveId = sug.id; sincronizar(ctx); }
    const desfazer = ocupar(botao, rotuloFinal);
    pular.disabled = add.disabled = true;
    try { await enviarPedido(container, ctx, metodo); }
    catch (e) {
      erro.textContent = (e && e.message) || "Falha de conexão. Tente novamente.";
      desfazer(); pular.disabled = add.disabled = false;
      if (adicionar) { ctx.itens = [ctx.prod]; ctx.leveId = ""; sincronizar(ctx); ctx.ofertaVista = false; }
    }
  };
  add.addEventListener("click", () => andar(add, true));
  pular.addEventListener("click", () => andar(pular, false));
  container.querySelector("#pixLtOutro").addEventListener("click", () => {
    ctx.jaSugeridos.push(sug.id);
    ctx.sugestao = sugerirPack(ctx.prod, ctx.jaSugeridos, metodo, ctx.cupom) || sug;
    telaOferta(container, ctx, metodo);
  });
}


function telaRecuperar(container, ctx) {
  container.innerHTML = `
    <h3>Recuperar minha compra</h3>
    <div class="pix-produto">Informe o e-mail usado na compra e o número do pedido (aparece no comprovante do Mercado Pago e na tela de pagamento confirmado).</div>
    <label for="recEmail">E-mail da compra</label>
    <input type="email" id="recEmail" placeholder="voce@email.com" autocomplete="email">
    <label for="recPedido">Número do pedido</label>
    <input type="text" id="recPedido" placeholder="Somente números" inputmode="numeric" autocomplete="off">
    <button class="pix-btn" id="recBuscar">Recuperar minha arte</button>
    <div class="pix-erro" id="recErro"></div>
    <button class="pix-link-cartao" id="recVoltar">Voltar</button>
  `;
  container.querySelector("#recEmail").value = lerStorage("almatie_email");
  const erro = container.querySelector("#recErro");
  const btn = container.querySelector("#recBuscar");
  container.querySelector("#recVoltar").addEventListener("click", () => telaFormulario(container, ctx));

  btn.addEventListener("click", async () => {
    const email = container.querySelector("#recEmail").value.trim();
    const pedido = container.querySelector("#recPedido").value.replace(/\D/g, "");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || pedido.length < 5) {
      erro.textContent = "Confira o e-mail e o número do pedido.";
      return;
    }
    erro.textContent = "";
    btn.disabled = true;
    btn.textContent = "Procurando...";
    try {
      const r = await fetch(`${WORKER}/recuperar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, pedido }),
      });
      const dados = await r.json();
      if (!r.ok || !(dados.link || (Array.isArray(dados.links) && dados.links.length))) throw new Error(dados.error || "Não foi possível recuperar a compra.");
      telaSucesso(container, dados.link, pedido, dados.links, dados.cupomNovo);
    } catch (e) {
      erro.textContent = e.message || "Falha de conexão. Tente novamente.";
      btn.disabled = false;
      btn.textContent = "Recuperar minha arte";
    }
  });
}

function telaQrCode(container, dados, titulo) {
  const valor = Number(dados.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  container.innerHTML = `
    <h3>Escaneie para pagar</h3>
    <div class="pix-produto"></div>
    <div class="pix-valor">${valor}</div>
    <div class="pix-qr"><img alt="QR Code Pix" src="data:image/png;base64,${dados.qr_code_base64}"></div>
    <input class="pix-copia" id="pixCopiaCola" readonly>
    <button class="pix-btn" id="pixCopiar">Copiar código Pix</button>
    <ol class="pix-passos">
      <li>Abra o app do seu banco e escolha Pix.</li>
      <li>Escaneie o QR Code ou use "Pix Copia e Cola".</li>
      <li>Ao pagar, esta tela confirma sozinha e libera sua arte.</li>
    </ol>
    <div class="pix-aguardando">⏳ Aguardando pagamento…</div>
  `;
  container.querySelector(".pix-produto").textContent = titulo;
  container.querySelector("#pixCopiaCola").value = dados.qr_code;
  container.querySelector("#pixCopiar").addEventListener("click", (e) => copiar(dados.qr_code, e.target));

  inicioPolling = Date.now();
  pararPolling();
  timerStatus = setInterval(async () => {
    if (Date.now() - inicioPolling > TEMPO_MAXIMO_MS) {
      pararPolling();
      container.querySelector(".pix-aguardando").textContent = "O tempo para pagar expirou. Feche e gere um novo Pix.";
      return;
    }
    try {
      const r = await fetch(`${WORKER}/status-pagamento?id=${encodeURIComponent(dados.id)}&senha=${encodeURIComponent(dados.senha)}`);
      const s = await r.json();
      if (s.status === "approved") {
        pararPolling();
        esvaziarCarrinho();
        telaSucesso(container, s.link, dados.id, s.links, s.cupomNovo);
      } else if (s.status === "divergente") {
        pararPolling();
        container.querySelector(".pix-aguardando").textContent = `Recebemos seu pagamento, mas precisamos conferir alguns dados. Guarde o pedido nº ${dados.id} e fale com a loja.`;
      } else if (["rejected", "cancelled", "expired"].includes(s.status)) {
        pararPolling();
        container.querySelector(".pix-aguardando").textContent = "Pagamento não concluído. Feche e tente novamente.";
      }
    } catch { /* tenta de novo no próximo ciclo */ }
  }, INTERVALO_STATUS_MS);
}

// Copia texto também em navegadores sem a API de área de transferência (tela de sucesso).
async function copiarTexto(texto, botao) {
  let ok = false;
  try { await navigator.clipboard.writeText(texto); ok = true; } catch { /* tenta o plano B */ }
  if (!ok) {
    try {
      const t = document.createElement("textarea");
      t.value = texto;
      t.style.position = "fixed";
      t.style.opacity = "0";
      document.body.appendChild(t);
      t.select();
      ok = document.execCommand("copy");
      t.remove();
    } catch { ok = false; }
  }
  const original = botao.dataset.rotulo || botao.textContent;
  botao.dataset.rotulo = original;
  botao.textContent = ok ? "✓ Copiado!" : "Copie manualmente";
  setTimeout(() => (botao.textContent = original), 2000);
}

// Caixa de destaque: o que o cliente precisa guardar para nunca perder a compra.
function caixaGuardar(lista, pedidoId) {
  const caixa = document.createElement("div");
  caixa.className = "pix-guardar";
  const titulo = document.createElement("strong");
  titulo.textContent = "📌 Guarde estas informações";
  caixa.appendChild(titulo);
  const p = document.createElement("p");
  p.textContent = lista.length > 1
    ? "Salve os links de download e o código do pedido. Se perder os links, use \"Já paguei e perdi meu link\" informando o e-mail da compra e o código do pedido abaixo."
    : "Salve o link de download e o código do pedido. Se perder o link, use \"Já paguei e perdi meu link\" informando o e-mail da compra e o código do pedido abaixo.";
  caixa.appendChild(p);
  if (pedidoId) {
    const cod = document.createElement("div");
    cod.className = "pix-guardar-codigo";
    cod.textContent = `Código do pedido: ${pedidoId}`;
    caixa.appendChild(cod);
    const b1 = document.createElement("button");
    b1.type = "button";
    b1.className = "pix-guardar-btn";
    b1.textContent = "Copiar código do pedido";
    b1.addEventListener("click", () => copiarTexto(String(pedidoId), b1));
    caixa.appendChild(b1);
  }
  const b2 = document.createElement("button");
  b2.type = "button";
  b2.className = "pix-guardar-btn";
  b2.textContent = lista.length > 1 ? "Copiar todos os links" : "Copiar link de download";
  b2.addEventListener("click", () => copiarTexto(
    lista.map((x) => (x.titulo && lista.length > 1 ? `${x.titulo}: ` : "") + x.link).join("\n"), b2));
  caixa.appendChild(b2);
  return caixa;
}

// cupom de presente para a próxima compra (gerado pelo servidor quando o pack tem essa opção)
function caixaCupomNovo(c) {
  if (!c || typeof c.codigo !== "string" || !/^[A-Z0-9-]{3,24}$/.test(c.codigo) || !Number.isFinite(Number(c.valor))) return null;
  const quanto = c.tipo === "valor" ? dinheiro(Math.round(Number(c.valor) * 100)) : `${String(Number(c.valor)).replace(".", ",")}%`;
  const ate = Number(c.validoAte) ? new Date(Number(c.validoAte)).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "";
  const caixa = document.createElement("div");
  caixa.className = "pix-cupom-novo";
  const t = document.createElement("strong"); t.textContent = "🎁 Cupom para sua próxima compra";
  const cod = document.createElement("div"); cod.className = "pix-guardar-codigo"; cod.textContent = c.codigo;
  const p = document.createElement("p");
  const so = c.metodo === "pix" ? " pagando no Pix" : (c.metodo === "cartao" ? " pagando no cartão de crédito" : "");
  p.textContent = `${quanto} de desconto${so}${ate ? `, válido até ${ate}` : ""}, uso único. Use o mesmo e-mail desta compra no campo "Tenho um cupom". Guarde este código!`;
  const b = document.createElement("button"); b.type = "button"; b.className = "pix-guardar-btn"; b.textContent = "Copiar código do cupom";
  b.addEventListener("click", () => copiarTexto(c.codigo, b));
  caixa.append(t, cod, p, b);
  return caixa;
}

function telaSucesso(container, link, pedidoId, links, cupomNovo) {
  container.innerHTML = `
    <div class="pix-ok-icone">✅</div>
    <h3>Pagamento confirmado!</h3>
    <p class="pix-produto">Obrigada pela compra! Sua arte já está liberada.</p>
    <p class="pix-aguardando" id="pixPedido"></p>
    <div id="pixAreaLink"></div>
    <button class="pix-btn pix-btn-sec" id="pixFecharOk">Fechar</button>
  `;
  if (pedidoId) container.querySelector("#pixPedido").textContent = `Pedido nº ${pedidoId}`;
  // pedido com "leve também": o servidor devolve uma lista de links (um por pack)
  const lista = Array.isArray(links)
    ? links.filter((x) => x && typeof x.link === "string" && /^https?:\/\//i.test(x.link))
    : [];
  if (!lista.length && link && /^https?:\/\//i.test(link)) lista.push({ titulo: "", link });
  if (lista.length) {
    const area = container.querySelector("#pixAreaLink");
    const grupo = document.createElement("div");
    grupo.className = "pix-links-lista";
    lista.forEach((x) => {
      const a = document.createElement("a");
      a.href = x.link;
      a.target = "_blank";
      a.rel = "noopener";
      a.className = "pix-btn";
      a.style.textDecoration = "none";
      a.style.marginTop = "0";
      a.textContent = lista.length > 1 && x.titulo ? `Baixar: ${String(x.titulo).slice(0, 60)}` : (lista.length > 1 ? "Baixar arte" : "Baixar minha arte");
      grupo.appendChild(a);
    });
    area.appendChild(grupo);
    area.appendChild(caixaGuardar(lista, pedidoId));
    const cx = caixaCupomNovo(cupomNovo);
    if (cx) area.appendChild(cx);
  }
  container.querySelector("#pixFecharOk").addEventListener("click", fecharPeloUsuario);
}

// ---------- ponto de entrada ----------
window.iniciarCheckout = function (produtoId, tituloEncoded, precoStr /* ignorado: o preço vem do servidor */, opcoes) {
  let titulo = "";
  try { titulo = decodeURIComponent(tituloEncoded); } catch { titulo = tituloEncoded; }
  const container = criarModal();
  telaFormulario(container, novoContexto(produtoId, titulo, opcoes));
};

// ---------- volta do pagamento com cartão (Mercado Pago devolve o cliente ao site) ----------
function verificarRetornoCartao() {
  const q = new URLSearchParams(window.location.search);
  const ped = q.get("ped");
  if (!ped || !/^[0-9a-f]{32}$/.test(ped)) return;

  const pagamento = q.get("payment_id") || q.get("collection_id") || "";
  const container = criarModal();
  container.innerHTML = `
    <h3>Confirmando seu pagamento…</h3>
    <div class="pix-aguardando" id="pixRetornoMsg">⏳ Só um instante.</div>
    <button class="pix-btn pix-btn-sec" id="pixRetornoFechar">Fechar</button>
  `;
  container.querySelector("#pixRetornoFechar").addEventListener("click", fecharPeloUsuario);
  const msg = container.querySelector("#pixRetornoMsg");

  if (!/^\d+$/.test(pagamento)) {
    msg.textContent = "O pagamento não foi concluído. Feche e tente novamente.";
    return;
  }

  inicioPolling = Date.now();
  const consultar = async () => {
    if (Date.now() - inicioPolling > TEMPO_MAXIMO_MS) {
      pararPolling();
      msg.textContent = "Ainda não recebemos a confirmação. Se você já pagou, guarde este endereço e volte em alguns minutos.";
      return;
    }
    try {
      const r = await fetch(`${WORKER}/status-pagamento?id=${encodeURIComponent(pagamento)}&ped=${encodeURIComponent(ped)}`);
      const s = await r.json();
      if (s.status === "approved") {
        pararPolling();
        esvaziarCarrinho();
        telaSucesso(container, s.link, pagamento, s.links, s.cupomNovo);
      } else if (s.status === "divergente") {
        pararPolling();
        msg.textContent = `Recebemos seu pagamento, mas precisamos conferir alguns dados. Guarde o pedido nº ${pagamento} e fale com a loja.`;
      } else if (["rejected", "cancelled", "refunded", "charged_back"].includes(s.status)) {
        pararPolling();
        msg.textContent = "O pagamento não foi aprovado. Feche e tente novamente.";
      } else if (s.status) {
        msg.textContent = "⏳ Pagamento em análise. Assim que for aprovado, sua arte aparece aqui. Guarde este endereço para voltar depois.";
      } else if (r.status === 403) {
        pararPolling();
        msg.textContent = "Não foi possível confirmar este pedido.";
      }
    } catch { /* tenta de novo no próximo ciclo */ }
  };
  pararPolling();
  consultar();
  timerStatus = setInterval(consultar, INTERVALO_STATUS_MS);
}

verificarRetornoCartao();
