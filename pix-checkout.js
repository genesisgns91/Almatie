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

// ---------- etapas ----------
function telaFormulario(container, produtoId, titulo) {
  container.innerHTML = `
    <h3>Pagar com Pix</h3>
    <div class="pix-produto"></div>
    <label for="pixEmail">Seu e-mail (para o comprovante)</label>
    <input type="email" id="pixEmail" placeholder="voce@email.com" autocomplete="email">
    <label for="pixNome">Seu nome (opcional)</label>
    <input type="text" id="pixNome" placeholder="Seu nome" autocomplete="name">
    <button class="pix-btn" id="pixGerar">Gerar QR Code Pix</button>
    <div class="pix-erro" id="pixErro"></div>
    <button class="pix-link-cartao pix-cartao-destaque" id="pixCartao">Prefiro pagar com cartão de crédito</button><br>
    <button class="pix-link-cartao" id="pixRecuperar">Já paguei e perdi meu link</button>
  `;
  container.querySelector(".pix-produto").textContent = titulo;
  container.querySelector("#pixEmail").value = lerStorage("almatie_email");
  container.querySelector("#pixNome").value = lerStorage("almatie_nome");

  const erro = container.querySelector("#pixErro");
  const btn = container.querySelector("#pixGerar");

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
    btn.textContent = "Gerando Pix...";
    try {
      const r = await fetch(`${WORKER}/criar-pix`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ produtoId, email, nome }),
      });
      const dados = await r.json();
      if (!r.ok || !dados.qr_code) throw new Error(dados.error || "Falha ao gerar o Pix.");
      telaQrCode(container, dados, titulo);
    } catch (e) {
      erro.textContent = e.message || "Falha de conexão. Tente novamente.";
      btn.disabled = false;
      btn.textContent = "Gerar QR Code Pix";
    }
  });

  container.querySelector("#pixRecuperar").addEventListener("click", () => telaRecuperar(container, produtoId, titulo));

  container.querySelector("#pixCartao").addEventListener("click", async (e) => {
    e.target.textContent = "Abrindo pagamento...";
    try {
      const r = await fetch(`${WORKER}/criar-pagamento`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ produtoId }),
      });
      const dados = await r.json();
      if (dados.init_point) window.location.href = dados.init_point;
      else throw new Error();
    } catch {
      e.target.textContent = "Prefiro pagar com cartão de crédito";
      erro.textContent = "Não foi possível abrir o pagamento com cartão.";
    }
  });
}

function telaRecuperar(container, produtoId, titulo) {
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
  container.querySelector("#recVoltar").addEventListener("click", () => telaFormulario(container, produtoId, titulo));

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
      if (!r.ok || !dados.link) throw new Error(dados.error || "Não foi possível recuperar a compra.");
      telaSucesso(container, dados.link, pedido);
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
        telaSucesso(container, s.link, dados.id);
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

function telaSucesso(container, link, pedidoId) {
  container.innerHTML = `
    <div class="pix-ok-icone">✅</div>
    <h3>Pagamento confirmado!</h3>
    <p class="pix-produto">Obrigada pela compra! Sua arte já está liberada.</p>
    <p class="pix-aguardando" id="pixPedido"></p>
    <div id="pixAreaLink"></div>
    <button class="pix-btn pix-btn-sec" id="pixFecharOk">Fechar</button>
  `;
  if (pedidoId) container.querySelector("#pixPedido").textContent = `Pedido nº ${pedidoId}`;
  if (link && /^https?:\/\//i.test(link)) {
    const a = document.createElement("a");
    a.href = link;
    a.target = "_blank";
    a.rel = "noopener";
    a.className = "pix-btn";
    a.style.textDecoration = "none";
    a.textContent = "Baixar minha arte";
    container.querySelector("#pixAreaLink").appendChild(a);
    const aviso = document.createElement("p");
    aviso.className = "pix-aguardando";
    aviso.textContent = "Salve o link de download antes de fechar esta janela. Se perder, use \"Já paguei e perdi meu link\" informando o e-mail e o nº do pedido.";
    container.querySelector("#pixAreaLink").appendChild(aviso);
  }
  container.querySelector("#pixFecharOk").addEventListener("click", fecharPeloUsuario);
}

// ---------- ponto de entrada ----------
window.iniciarCheckout = function (produtoId, tituloEncoded /*, precoStr (ignorado: o preço vem do servidor) */) {
  let titulo = "";
  try { titulo = decodeURIComponent(tituloEncoded); } catch { titulo = tituloEncoded; }
  const container = criarModal();
  telaFormulario(container, produtoId, titulo);
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
        telaSucesso(container, s.link, pagamento);
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
