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
.pix-overlay{position:fixed;inset:0;background:rgba(27,18,48,.65);display:flex;align-items:center;justify-content:center;z-index:10000;padding:16px}
.pix-box{background:#fff;border-radius:16px;max-width:420px;width:100%;max-height:92vh;overflow:auto;padding:24px;box-shadow:0 10px 40px rgba(0,0,0,.25);text-align:center;font-family:'Inter',sans-serif;color:#1B1230;position:relative}
.pix-fechar{position:absolute;top:10px;right:12px;border:none;background:none;font-size:20px;cursor:pointer;color:#888}
.pix-box h3{margin:0 0 4px;font-size:1.2rem}
.pix-produto{font-size:.9rem;color:#666;margin-bottom:14px}
.pix-box label{display:block;text-align:left;font-size:.8rem;font-weight:600;margin:10px 0 4px}
.pix-box input[type=text],.pix-box input[type=email]{width:100%;padding:11px;border:1px solid #ccc;border-radius:8px;font-size:15px;box-sizing:border-box}
.pix-btn{display:block;width:100%;padding:13px;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;margin-top:14px;background:var(--primary,#BE3A78);color:#fff}
.pix-btn:disabled{opacity:.6;cursor:wait}
.pix-btn-sec{background:#f1eef6;color:#1B1230;font-weight:600}
.pix-link-cartao{display:inline-block;margin-top:14px;font-size:.8rem;color:#666;background:none;border:none;text-decoration:underline;cursor:pointer}
.pix-cartao-destaque{color:var(--primary-hover,#9C2C61)!important;font-weight:700;font-size:.92rem;text-decoration:underline}
.pix-erro{color:#c0392b;font-size:.85rem;margin-top:10px;min-height:1em}
.pix-qr img{width:210px;height:210px;border:1px solid #eee;border-radius:10px;margin:8px auto}
.pix-valor{font-size:1.4rem;font-weight:800;color:var(--primary,#BE3A78);margin:6px 0}
.pix-copia{width:100%;font-size:11px;padding:8px;border:1px solid #ddd;border-radius:6px;background:#fafafa;text-align:center;box-sizing:border-box}
.pix-aguardando{font-size:.85rem;color:#666;margin-top:12px}
.pix-ok-icone{font-size:48px}
.pix-passos{font-size:.8rem;color:#666;text-align:left;margin:10px 0 0;padding-left:18px}
.pix-oferta{margin:4px 0 12px;padding:12px;border:2px dashed var(--primary,#BE3A78);border-radius:12px;background:var(--primary-soft,#F9E8F0);text-align:left}
.pix-oferta-topo{font-size:.82rem;font-weight:700;line-height:1.35;margin-bottom:8px}
.pix-oferta-corpo{display:flex;gap:10px;align-items:center}
.pix-oferta-img{width:64px;height:64px;border-radius:8px;object-fit:cover;background:#fff;flex:none;border:1px solid #eee}
.pix-oferta-info{min-width:0;display:flex;flex-direction:column;gap:2px}
.pix-oferta-nome{font-size:.9rem;line-height:1.25;overflow-wrap:anywhere}
.pix-oferta-preco{font-size:.85rem;color:#555}
.pix-oferta-preco s{opacity:.7}
.pix-oferta-preco b{color:var(--primary-hover,#9C2C61);font-size:1.05rem}
.pix-oferta .pix-btn{margin-top:10px;padding:10px;font-size:14px}
.pix-oferta .pix-btn.marcado{background:#1E6B3A}
.pix-oferta .pix-link-cartao{margin-top:8px}
.pix-resumo{margin:6px 0 2px;padding:10px 12px;border-radius:10px;background:#f7f5fa;font-size:.82rem;text-align:left}
.pix-resumo div{display:flex;justify-content:space-between;gap:10px;padding:2px 0}
.pix-resumo .pix-res-desc{color:#1E6B3A;font-weight:600}
.pix-resumo .pix-res-total{margin-top:4px;padding-top:6px;border-top:1px solid #e3deea;font-weight:800;font-size:.95rem}
.pix-resumo .pix-res-nome{min-width:0;overflow-wrap:anywhere}
.pix-resumo .pix-res-nota{display:block;margin-top:4px;font-size:.75rem;color:#666}
.pix-links-lista{display:flex;flex-direction:column;gap:8px}
.pix-cart-lista{display:flex;flex-direction:column;gap:6px;margin:6px 0;max-height:170px;overflow:auto}
.pix-cart-item{display:flex;align-items:center;gap:8px;font-size:.82rem}
.pix-cart-img{width:34px;height:34px;border-radius:6px;object-fit:cover;flex:none;border:1px solid #eee;background:#fff}
.pix-cart-item .pix-res-nome{flex:1;min-width:0;overflow-wrap:anywhere}
.pix-cart-rm{border:none;background:none;color:#a33;cursor:pointer;font-size:15px;padding:4px 6px}
.pix-cart-dica{font-size:.78rem;color:#555;margin:6px 0;line-height:1.35}
.pix-oferta .pix-btn.pix-btn-sec{background:#fff;border:1px solid var(--primary,#BE3A78);color:var(--primary-hover,#9C2C61)}
.pix-cupom-linha{display:flex;gap:8px;align-items:stretch}.pix-cupom-linha .pix-btn{width:auto;margin-top:0;padding:0 14px;font-size:14px}
.pix-cupom-linha input{text-transform:uppercase}
.pix-cupom-msg{font-size:.78rem;color:#666;text-align:left;margin-top:6px;line-height:1.35}.pix-cupom-msg.ok{color:#1E6B3A;font-weight:600}.pix-cupom-msg.erro{color:#c0392b}
.pix-cupom-novo{margin-top:12px;padding:12px;border:2px dashed #1E6B3A;background:#eefaf1;border-radius:10px;font-size:.85rem;color:#14401f;text-align:left}.pix-cupom-novo p{margin:6px 0}
.pix-barra{position:fixed;left:0;right:0;margin:0 auto;width:max-content;bottom:84px;z-index:9000;border:none;border-radius:999px;padding:12px 20px;background:var(--primary,#BE3A78);color:#fff;font:700 14px 'Inter',sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.3);cursor:pointer;max-width:92vw}
.pix-barra[hidden]{display:none}
.pix-guardar{margin-top:14px;padding:12px;border:2px dashed #e0a800;background:#fff8e1;border-radius:10px;font-size:.85rem;color:#4a3b00;text-align:left}.pix-guardar p{margin:6px 0}.pix-guardar-codigo{font-weight:700;font-size:1rem;letter-spacing:.5px;margin:6px 0;word-break:break-all}.pix-guardar-btn{display:block;width:100%;margin-top:6px;padding:8px;border:1px solid #c9a227;background:#fff;border-radius:8px;cursor:pointer;font-weight:600;color:#4a3b00}
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
function sugerirPack(base, naoRepetir) {
  const L = loja();
  if (!L) return null;
  const todos = L.produtos().filter((p) => p.id !== base.id && (p.imagens || []).length && L.calcularPedido(p, null, "pix").p1 > 0);
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

// ---------- carrinho (só aparece quando a pessoa toca em "Comprar mais"; fica salvo neste aparelho) ----------
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

let barra = null;
function atualizarBarra() {
  const ids = carrinhoLigado() ? lerCarrinho() : [];
  if (!ids.length || overlay) { if (barra) barra.hidden = true; return; }
  if (!barra) {
    barra = document.createElement("button");
    barra.type = "button";
    barra.className = "pix-barra";
    barra.addEventListener("click", abrirCarrinho);
    document.body.appendChild(barra);
  }
  barra.textContent = `🛒 ${ids.length} ${ids.length === 1 ? "arte" : "artes"} no carrinho · Finalizar compra`;
  barra.hidden = false;
}
function abrirCarrinho() {
  const L = loja();
  if (!L || !L.produtos().length) return;
  const ids = lerCarrinho();
  const prod = ids.map((id) => L.produtos().find((p) => p.id === id)).find((p) => p && L.calcularPedido(p, null, "pix").p1 > 0);
  if (!prod) { esvaziarCarrinho(); return; }
  window.iniciarCheckout(prod.id, encodeURIComponent(prod.titulo));
}
{ let tentativas = 0; const t = setInterval(() => { atualizarBarra(); if (++tentativas >= 20) clearInterval(t); }, 800); }

// monta o estado do checkout para este produto
function sincronizar(ctx) {
  ctx.prod = ctx.itens[0] || null;
  if (ctx.prod) { ctx.produtoId = ctx.prod.id; ctx.titulo = ctx.prod.titulo; }
  ctx.extras = ctx.itens.slice(1);
}
function novoContexto(produtoId, titulo) {
  const L = loja();
  const prod = L ? (L.produtos().find((p) => p.id === produtoId) || null) : null;
  const ctx = { itens: prod ? [prod] : [], produtoId, titulo, prod, extras: [], sugestao: null, jaSugeridos: [], cupom: null, cupomEmail: "", persistir: false };
  if (!prod) return ctx;
  if (carrinhoLigado()) {
    const ids = lerCarrinho();
    if (ids.length) {                                  // já existe carrinho: o pack clicado entra nele
      if (!ids.includes(produtoId) && ids.length < MAX_CARRINHO) ids.push(produtoId);
      const itens = ids.map((id) => L.produtos().find((p) => p.id === id)).filter((p) => p && L.calcularPedido(p, null, "pix").p1 > 0);
      if (itens.length) { ctx.itens = itens; ctx.persistir = true; salvarCarrinho(itens.map((p) => p.id)); }
    }
  } else if (L.ofertas().combo.ativo) {
    ctx.sugestao = sugerirPack(prod, ctx.jaSugeridos);
  }
  sincronizar(ctx);
  return ctx;
}

function calculo(ctx, metodo) {
  const L = loja();
  return (L && ctx.prod) ? L.calcularPedido(ctx.prod, ctx.extras, metodo, undefined, ctx.cupom) : null;
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
  if (!Number.isFinite(recebido) || Math.abs(recebido - esperado) > 1) {
    throw new Error("O valor do pagamento não confere com a oferta mostrada. Atualize a página e tente de novo.");
  }
}

function corpoPedido(ctx, extras) {
  const corpo = { produtoId: ctx.produtoId, ...extras };
  if (ctx.extras.length) corpo.extras = ctx.extras.map((p) => p.id);
  if (ctx.cupom) { corpo.cupom = ctx.cupom.codigo; corpo.email = ctx.cupomEmail; }
  return corpo;
}

function tituloDoPedido(ctx) {
  if (!ctx.extras.length) return ctx.titulo;
  return ctx.extras.length === 1 ? `${ctx.titulo} + ${ctx.extras[0].titulo}` : `${ctx.titulo} + ${ctx.extras.length} packs`;
}

// ---------- etapas ----------
function textoFaixas(L, qtd) {
  const faixas = L.ofertas().carrinho.faixas;
  if (!faixas.length) return "";
  const prox = faixas.find((f) => f.minItens > qtd);
  const todas = faixas.map((f) => `${f.minItens} artes: ${f.percentual}% de desconto`).join(" · ");
  const falta = prox ? ` Faltam ${prox.minItens - qtd} ${prox.minItens - qtd === 1 ? "arte" : "artes"} para ${prox.percentual}% de desconto!` : " Você já ganhou o maior desconto! 🎉";
  return `${todas}.${falta}`;
}

function desenharCarrinho(container, ctx, caixa) {
  const L = loja();
  const box = document.createElement("div");
  box.className = "pix-oferta";
  const topo = document.createElement("div");
  topo.className = "pix-oferta-topo";
  topo.textContent = ctx.itens.length > 1 ? `🛒 Seu carrinho (${ctx.itens.length} artes)` : "🛒 Quer levar mais artes?";
  box.appendChild(topo);
  if (ctx.itens.length > 1) {
    const lista = document.createElement("div");
    lista.className = "pix-cart-lista";
    ctx.itens.forEach((p, i) => {
      const l = document.createElement("div");
      l.className = "pix-cart-item";
      const img = document.createElement("img");
      img.className = "pix-cart-img"; img.alt = "";
      img.src = L.miniatura((p.imagens || [])[0] || "", 96);
      const nome = document.createElement("span");
      nome.className = "pix-res-nome"; nome.textContent = p.titulo;
      const preco = document.createElement("b");
      preco.textContent = dinheiro(L.calcularPedido(p, null, "pix").p1);
      const rm = document.createElement("button");
      rm.type = "button"; rm.className = "pix-cart-rm"; rm.title = "Remover do carrinho"; rm.textContent = "✕";
      rm.addEventListener("click", () => {
        ctx.itens.splice(i, 1);
        if (!ctx.itens.length) { esvaziarCarrinho(); fecharPeloUsuario(); return; }
        sincronizar(ctx);
        if (ctx.persistir) salvarCarrinho(ctx.itens.map((x) => x.id));
        desenharOferta(container, ctx);
      });
      l.append(img, nome, preco, rm);
      lista.appendChild(l);
    });
    box.appendChild(lista);
  }
  const dica = textoFaixas(L, ctx.itens.length);
  if (dica) { const d = document.createElement("div"); d.className = "pix-cart-dica"; d.textContent = dica; box.appendChild(d); }
  if (ctx.itens.length < MAX_CARRINHO) {
    const mais = document.createElement("button");
    mais.type = "button"; mais.className = "pix-btn pix-btn-sec"; mais.id = "pixComprarMais";
    mais.textContent = "＋ Comprar mais artes";
    mais.addEventListener("click", () => {
      salvarCarrinho(ctx.itens.map((p) => p.id));
      ctx.persistir = true;
      fechar();
      atualizarBarra();
    });
    box.appendChild(mais);
  }
  caixa.appendChild(box);
}

function desenharOferta(container, ctx) {
  const caixa = container.querySelector("#pixOferta");
  const resumo = container.querySelector("#pixResumo");
  const btnGerar = container.querySelector("#pixGerar");
  const btnCartao = container.querySelector("#pixCartao");
  const L = loja();
  caixa.innerHTML = "";
  resumo.innerHTML = "";
  container.querySelector(".pix-produto").textContent = ctx.itens.length > 1 ? `${ctx.itens.length} artes no pedido` : ctx.titulo;

  // --- carrinho (substitui o "leve também") ---
  if (ctx.prod && carrinhoLigado()) desenharCarrinho(container, ctx, caixa);

  // --- caixa "leve também" ---
  if (ctx.prod && ctx.sugestao && !carrinhoLigado() && L.ofertas().combo.ativo) {
    // o desconto no 2º pack é definido no cadastro do pack que a pessoa está comprando
    const lt = L.normalizarLeveTambem(ctx.prod.leveTambem);
    const so = L.calcularPedido(ctx.prod, ctx.sugestao, lt.metodo === "cartao" ? "cartao" : "pix");
    const pct = lt.percentual;
    const cheio = so.p2, comDesc = so.p2 - so.descAuto;
    const temDesc = so.descAuto > 0;
    const so_no = lt.metodo === "pix" ? " pagando no Pix" : (lt.metodo === "cartao" ? " pagando no cartão" : "");
    const box = document.createElement("div");
    box.className = "pix-oferta";
    box.innerHTML = `
      <div class="pix-oferta-topo"></div>
      <div class="pix-oferta-corpo">
        <img class="pix-oferta-img" alt="">
        <div class="pix-oferta-info"><strong class="pix-oferta-nome"></strong><span class="pix-oferta-preco"></span></div>
      </div>
      <button type="button" class="pix-btn" id="pixAddExtra"></button>
      <button type="button" class="pix-link-cartao" id="pixOutroPack">Ver outro pack</button>`;
    box.querySelector(".pix-oferta-topo").textContent = temDesc
      ? `🎁 Leve também o pack "${ctx.sugestao.titulo}" por apenas +${dinheiro(comDesc)} e economize ${pct}% nessa compra${so_no}`
      : `🎁 Leve também o pack "${ctx.sugestao.titulo}" por +${dinheiro(comDesc)}`;
    const img = box.querySelector(".pix-oferta-img");
    img.src = L.miniatura((ctx.sugestao.imagens || [])[0] || "", 160);
    box.querySelector(".pix-oferta-nome").textContent = ctx.sugestao.titulo;
    const preco = box.querySelector(".pix-oferta-preco");
    if (temDesc) {
      const riscado = document.createElement("s");
      riscado.textContent = dinheiro(cheio);
      const novo = document.createElement("b");
      novo.textContent = ` +${dinheiro(comDesc)}`;
      preco.append(riscado, novo, document.createTextNode(` (−${pct}%${so_no ? " " + so_no.trim() : ""})`));
    } else {
      const novo = document.createElement("b");
      novo.textContent = `+${dinheiro(comDesc)}`;
      preco.append(novo);
    }
    const add = box.querySelector("#pixAddExtra");
    const marcado = ctx.extras.length > 0;
    add.classList.toggle("marcado", marcado);
    add.textContent = marcado ? "✓ Adicionado ao pedido (toque para remover)" : "＋ Adicionar ao meu pedido";
    add.addEventListener("click", () => { ctx.itens = ctx.extras.length ? [ctx.prod] : [ctx.prod, ctx.sugestao]; sincronizar(ctx); desenharOferta(container, ctx); });
    const outro = box.querySelector("#pixOutroPack");
    outro.hidden = marcado;
    outro.addEventListener("click", () => {
      ctx.jaSugeridos.push(ctx.sugestao.id);
      ctx.sugestao = sugerirPack(ctx.prod, ctx.jaSugeridos) || ctx.sugestao;
      desenharOferta(container, ctx);
    });
    caixa.appendChild(box);
  }

  // --- resumo com os descontos (Pix e cartão podem ter descontos diferentes) ---
  const pix = calculo(ctx, "pix");
  const cartao = calculo(ctx, "cartao");
  const msgCupom = container.querySelector("#pixCupomNota");
  if (msgCupom) msgCupom.textContent = "";
  if (pix && (ctx.extras.length || ctx.cupom || pix.descPix > 0 || cartao.descPix > 0)) {
    const o = L.ofertas();
    const linha = (cls, nome, valor) => {
      const d = document.createElement("div");
      if (cls) d.className = cls;
      const a = document.createElement("span"); a.className = "pix-res-nome"; a.textContent = nome;
      const b = document.createElement("span"); b.textContent = valor;
      d.append(a, b);
      resumo.appendChild(d);
    };
    const pct = (r) => (r.tipo === "valor" ? "" : ` (−${String(r.valor).replace(".", ",")}%)`);
    const lt = L.normalizarLeveTambem(ctx.prod && ctx.prod.leveTambem);
    const nomeDesc = (c) => {
      if (c.origemDesc === "carrinho") { const f = L.faixaDoCarrinho(o.carrinho, c.qtd); return `Desconto do carrinho${f ? ` (−${f.percentual}%)` : ""}`; }
      if (c.origemDesc === "combo") return `Desconto "leve também" (−${lt.percentual}%)`;
      return `Cupom ${ctx.cupom ? ctx.cupom.codigo : ""}`.trim();
    };
    const igualItens = pix.descItens === cartao.descItens && pix.origemDesc === cartao.origemDesc;
    const unico = pix.descPix === cartao.descPix && igualItens;   // mesmos descontos nas duas formas
    ctx.itens.forEach((p) => linha("", p.titulo, dinheiro(L.calcularPedido(p, null, "pix").p1)));
    if (igualItens) {
      if (pix.descItens > 0) linha("pix-res-desc", nomeDesc(pix), `−${dinheiro(pix.descItens)}`);
    } else {
      if (pix.descItens > 0) linha("pix-res-desc", `${nomeDesc(pix)} – no Pix`, `−${dinheiro(pix.descItens)}`);
      if (cartao.descItens > 0) linha("pix-res-desc", `${nomeDesc(cartao)} – no cartão`, `−${dinheiro(cartao.descItens)}`);
    }
    const regraPix = L.regraDoMetodo(o, "pix"), regraCartao = L.regraDoMetodo(o, "cartao");
    if (unico) {
      if (pix.descPix > 0) linha("pix-res-desc", `Desconto no pagamento${pct(regraPix)}`, `−${dinheiro(pix.descPix)}`);
      linha("pix-res-total", "Total", dinheiro(pix.total));
    } else {
      if (pix.descPix > 0) linha("pix-res-desc", `Desconto no Pix${pct(regraPix)}`, `−${dinheiro(pix.descPix)}`);
      if (cartao.descPix > 0) linha("pix-res-desc", `Desconto no cartão${pct(regraCartao)}`, `−${dinheiro(cartao.descPix)}`);
      linha("pix-res-total", "Total no Pix", dinheiro(pix.total));
      linha("pix-res-total", "Total no cartão de crédito", dinheiro(cartao.total));
    }
    if (ctx.cupom && !pix.cupomVale && !cartao.cupomVale && msgCupom) {
      msgCupom.textContent = "Os descontos não são cumulativos: o desconto do pedido já é igual ou maior que o do cupom, então o cupom não será usado (e continua valendo para outra compra).";
    }
    resumo.hidden = false;
    btnGerar.textContent = `Gerar QR Code Pix · ${dinheiro(pix.total)}`;
    btnCartao.textContent = `Prefiro pagar com cartão de crédito · ${dinheiro(cartao.total)}`;
  } else {
    resumo.hidden = true;
    btnGerar.textContent = "Gerar QR Code Pix";
    btnCartao.textContent = "Prefiro pagar com cartão de crédito";
  }
}

// campo "Tenho um cupom": confere no servidor (precisa do e-mail: 1 uso por e-mail)
const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
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
    if (ctx.cupom) { msg.className = "pix-cupom-msg ok"; msg.textContent = `✓ Cupom ${ctx.cupom.codigo} aplicado`; }
  };
  abrir.addEventListener("click", () => { cx.hidden = !cx.hidden; if (!cx.hidden) cod.focus(); });
  email.addEventListener("input", () => {
    if (ctx.cupom && email.value.trim().toLowerCase() !== ctx.cupomEmail) {
      ctx.cupom = null; ctx.cupomEmail = "";
      msg.className = "pix-cupom-msg"; msg.textContent = "E-mail alterado: aplique o cupom de novo.";
      rotulo(); desenharOferta(container, ctx);
    }
  });
  ok.addEventListener("click", async () => {
    if (ctx.cupom) {
      ctx.cupom = null; ctx.cupomEmail = ""; cod.value = ""; msg.textContent = "";
      rotulo(); desenharOferta(container, ctx);
      return;
    }
    const codigo = cod.value.trim();
    const mail = email.value.trim();
    msg.className = "pix-cupom-msg";
    if (!codigo) { msg.textContent = "Digite o código do cupom."; return; }
    if (!emailOk(mail)) { msg.textContent = "Digite seu e-mail acima primeiro (o cupom vale uma vez por e-mail)."; email.focus(); return; }
    ok.disabled = true; msg.textContent = "Conferindo…";
    try {
      const r = await fetch(`${WORKER}/cupom/validar`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ codigo, email: mail }) });
      const dados = await r.json();
      const c = dados && dados.cupom;
      if (!r.ok || !c || typeof c.codigo !== "string" || !Number.isFinite(Number(c.valor))) throw new Error((dados && dados.error) || "Cupom inválido.");
      ctx.cupom = { codigo: c.codigo, tipo: c.tipo === "valor" ? "valor" : "percentual", valor: Number(c.valor) };
      ctx.cupomEmail = mail.toLowerCase();
      rotulo(); desenharOferta(container, ctx);
    } catch (e) {
      ctx.cupom = null;
      msg.className = "pix-cupom-msg erro"; msg.textContent = e.message || "Não foi possível conferir o cupom.";
    } finally { ok.disabled = false; }
  });
}

function telaFormulario(container, ctx) {
  container.innerHTML = `
    <h3>Pagar com Pix</h3>
    <div class="pix-produto"></div>
    <div id="pixOferta"></div>
    <div class="pix-resumo" id="pixResumo" hidden></div>
    <label for="pixEmail">Seu e-mail (para o comprovante)</label>
    <input type="email" id="pixEmail" placeholder="voce@email.com" autocomplete="email">
    <label for="pixNome">Seu nome (opcional)</label>
    <input type="text" id="pixNome" placeholder="Seu nome" autocomplete="name">
    <button class="pix-link-cartao" id="pixCupomAbrir" type="button">🎟️ Tenho um cupom</button>
    <div id="pixCupomCx" hidden>
      <div class="pix-cupom-linha"><input type="text" id="pixCupomCod" placeholder="Código do cupom" maxlength="24" autocomplete="off" autocapitalize="characters"><button type="button" class="pix-btn pix-btn-sec" id="pixCupomOk">Aplicar</button></div>
      <div class="pix-cupom-msg" id="pixCupomMsg"></div>
    </div>
    <div class="pix-cupom-msg" id="pixCupomNota"></div>
    <button class="pix-btn" id="pixGerar">Gerar QR Code Pix</button>
    <div class="pix-erro" id="pixErro"></div>
    <button class="pix-link-cartao pix-cartao-destaque" id="pixCartao">Prefiro pagar com cartão de crédito</button><br>
    <button class="pix-link-cartao" id="pixRecuperar">Já paguei e perdi meu link</button>
  `;
  container.querySelector("#pixEmail").value = lerStorage("almatie_email");
  container.querySelector("#pixNome").value = lerStorage("almatie_nome");

  const erro = container.querySelector("#pixErro");
  const btn = container.querySelector("#pixGerar");
  ligarCupom(container, ctx);
  desenharOferta(container, ctx);

  btn.addEventListener("click", async () => {
    const email = container.querySelector("#pixEmail").value.trim();
    const nome = container.querySelector("#pixNome").value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      erro.textContent = "Digite um e-mail válido.";
      return;
    }
    gravarStorage("almatie_email", email);
    gravarStorage("almatie_nome", nome);
    erro.textContent = "";
    btn.disabled = true;
    const rotuloGerar = btn.textContent;
    btn.textContent = "Gerando Pix...";
    try {
      const r = await fetch(`${WORKER}/criar-pix`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpoPedido(ctx, { email, nome })),
      });
      const dados = await r.json();
      if (!r.ok || !dados.qr_code) throw new Error(dados.error || "Falha ao gerar o Pix.");
      conferirValor(ctx, "pix", dados.valor);      // se o valor cobrado não for o prometido, não mostra o QR
      telaQrCode(container, dados, tituloDoPedido(ctx));
    } catch (e) {
      erro.textContent = e.message || "Falha de conexão. Tente novamente.";
      btn.disabled = false;
      btn.textContent = rotuloGerar;
    }
  });

  container.querySelector("#pixRecuperar").addEventListener("click", () => telaRecuperar(container, ctx));

  container.querySelector("#pixCartao").addEventListener("click", async (e) => {
    const botao = e.currentTarget;
    const rotuloCartao = botao.textContent;
    botao.textContent = "Abrindo pagamento...";
    try {
      const r = await fetch(`${WORKER}/criar-pagamento`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpoPedido(ctx, {})),
      });
      const dados = await r.json();
      if (!dados.init_point) throw new Error();
      conferirValor(ctx, "cartao", dados.valor);   // idem: só segue se o valor bater com o combinado
      window.location.href = dados.init_point;
    } catch (err) {
      botao.textContent = rotuloCartao;
      erro.textContent = (err && err.message) ? err.message : "Não foi possível abrir o pagamento com cartão.";
    }
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
  p.textContent = `${quanto} de desconto${ate ? `, válido até ${ate}` : ""}, uso único. Use o mesmo e-mail desta compra no campo "Tenho um cupom". Guarde este código!`;
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
window.iniciarCheckout = function (produtoId, tituloEncoded /*, precoStr (ignorado: o preço vem do servidor) */) {
  let titulo = "";
  try { titulo = decodeURIComponent(tituloEncoded); } catch { titulo = tituloEncoded; }
  const container = criarModal();
  telaFormulario(container, novoContexto(produtoId, titulo));
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
