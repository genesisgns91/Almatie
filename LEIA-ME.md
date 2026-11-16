# Almatiê Art — melhorias

> **Esta é a ETAPA C (4ª entrega).** Contém tudo das etapas A e B + descontos por pack e por forma de pagamento, cupons por forma de pagamento, nova tela de compra e painel redesenhado. **Substitui os arquivos das entregas anteriores: publique todos de novo, na ordem da seção "Ordem para publicar".**

Tudo foi testado em navegador real (Playwright) com Firebase e Mercado Pago **simulados** (12 suítes, 0 falhas). Não houve teste com o Mercado Pago/Google Drive de verdade: depois de publicar, faça uma compra-teste pequena.

## Novidades da etapa C

### 1. Cadastro do anúncio, na ordem que você pediu
Título → Tipo → Categoria → vitrine → valor → valor promocional → **forma de pagamento da promoção** (qualquer / só Pix / só cartão) → promoção válida até (com atalhos +1 dia, +7, +30, sem fim) → link de destino/checkout → testar link → tags → **leve também** → **cupom para a próxima compra**. Há também uma prévia "Como o cliente vê" (preço, Pix e cartão em tempo real), checklist (título, valor, link, imagem), campos inválidos marcados em vermelho e aviso de alterações não publicadas. O valor passou a ser obrigatório.

### 2. Desconto de pagamento por pack
Novo cartão **"Desconto por forma de pagamento só neste pack"** (ex.: 20% no Pix só nesta arte). Fica por último entre as ofertas do pack para manter a sua ordem exata; é fácil mover. **Regra:** o desconto próprio **substitui** o geral (Ofertas e Pix) apenas para aquele pack. Máximo 70%.

### 3. Cupons por forma de pagamento
- Cupom manual: "Qualquer forma / Somente Pix / Somente cartão". Se o cliente paga de outro jeito, o cupom **não é gasto** e ele vê o aviso.
- Cupom do pack (próxima compra) também escolhe a forma de pagamento.
- **Cupom por valor de compra** (aba Cupons): quem pagar a partir de R$ X ganha um cupom `VOLTA-…`. Vale o **valor realmente pago**. Se um pack do pedido já tem cupom próprio, **o do pack tem prioridade**.

### 4. Nova tela "Comprar arte"
E-mail e nome no topo; preço (com desconto) abaixo; botão **Pagar no Pix**; botão **Continuar comprando** (liga o carrinho, com **Limpar carrinho**); links discretos "prefiro pagar com cartão", "tenho um cupom", "já paguei e perdi meu link". Se for direto pagar, a tela seguinte mostra a oferta **"leve também"** (se o pack tiver) com foto: adicionar ou seguir sem complicação. **Carrinho e "leve também" agora convivem**: vale o **maior** desconto (nunca somados).

### 5. Painel
Cartões com chave liga/desliga, resumo das ofertas ativas, prévia com exemplos, botões segmentados, filtros e busca em Pedidos, estados vazios amigáveis.

## Importante: você ainda não tem domínio próprio
O envio de e-mail (Resend) só funciona com domínio próprio, então **nada do que fiz depende de e-mail**. O link de download e o **cupom da próxima compra aparecem na própria tela** de "Pagamento confirmado" (com botão de copiar) e também em "Já paguei e perdi meu link". Se um dia configurar o e-mail, o cupom também vai junto no e-mail, sem mudar mais nada.

## Novidades da etapa B (já entregue)

### 1. Carrinho (substitui o "leve também")
- Ao abrir a compra de um pack aparece **"🛒 Quer levar mais artes?"** com um botão **"＋ Comprar mais artes"**. Não vai direto para o pagamento: o botão fecha a janela, guarda o pack no carrinho e mostra uma **barra "🛒 N artes no carrinho · Finalizar compra"** na parte de baixo do site. A pessoa continua navegando; ao tocar em "Comprar Arte" em outro pack, ele entra no carrinho. Para pagar, toca na barra.
- Dentro do carrinho: lista dos packs com **✕ para remover**, dica de quanto falta para a próxima faixa ("Faltam 2 artes para 20% de desconto!") e o resumo com os totais de Pix e de cartão.
- O carrinho fica **salvo no aparelho** da pessoa (sem login) e é esvaziado quando o pagamento é confirmado. Máximo **30 packs** por pedido.
- *(Mudou na etapa C: carrinho e "leve também" convivem; vale o maior desconto.)*
- **Você configura** em *Ofertas e Pix → 🛒 Carrinho*: liga/desliga e até **4 faixas** "a partir de N artes: X%" (ex.: 3 artes 10%, 5 artes 20%, 10 artes 30%). O desconto vale para o **pedido inteiro**. Há uma prévia com exemplos. O desconto do Pix/cartão continua valendo por cima.
- Cada pack do carrinho recebe **o seu próprio link** de download (tela de sucesso, "perdi meu link" e e-mail).

### 2. Cupons de desconto
Regras (valem para todos): **um cupom por pedido · nenhum cupom é cumulativo · 1 uso por cliente (pelo e-mail) · o desconto total do pedido nunca passa de 70%**. "Não cumulativo" significa: se o pedido já tem desconto de carrinho/"leve também", vale **o maior** entre ele e o cupom (nunca os dois somados). O desconto do Pix/cartão é outra coisa e continua valendo por cima. Se o desconto automático for igual ou maior, o cliente vê o aviso e o cupom **não é gasto**.
- **Cliente:** link discreto **"🎟️ Tenho um cupom"** na tela de pagamento; precisa digitar o e-mail antes (o servidor confere o cupom e quantas vezes aquele e-mail já usou). Trocar o e-mail depois derruba o cupom. O código de cupom é conferido **no servidor**; o preço final também.
- **Nova aba 🎟️ Cupons** (só você): cria cupons de código que você define (ex.: `BEMVINDO10`), em **% ou R$**, com **data de validade**, **limite de usos** (0 = sem limite), opção **"só para a primeira compra"** (cliente cujo e-mail nunca comprou aqui) e **ativo/desativado**. Lista com quantos usos cada um teve; dá para editar e excluir.
- **Cupom gerado na compra (para a pessoa voltar):** no **cadastro de cada anúncio** há o bloco **"🎟️ Quem comprar este pack ganha um cupom para a próxima compra"** (opcional): tipo (%/R$), valor e **validade em dias**. Quando o pagamento é confirmado, o site gera um código `VOLTA-XXXXXX` de **uso único**, com a validade configurada, e mostra na tela de sucesso (e no "perdi meu link"). Se a compra tiver vários packs com a opção ligada, vale o primeiro. O mesmo pedido sempre devolve o mesmo código (não gera outro ao reabrir).
- Sem login de cliente: o cliente é reconhecido pelo **e-mail digitado** (guardado só como código embaralhado, nunca o e-mail em si). Isso não mexe com o seu login de administrador.

### 3. Painel de vendas (só você)
Em **📦 Pedidos e vendas** há o bloco **"📈 Resumo de vendas"**: faturamento de hoje / 7 dias / 30 dias / total, ticket médio, packs vendidos, pedidos com carrinho e com cupom, gráfico dos últimos 14 dias, **packs mais vendidos** e **cupons mais usados**. Só conta pedidos pagos e sem divergência; dias no fuso de Brasília.

## Ordem para publicar (importante)
1. **Worker de pagamentos** → cole `3-worker-pagamentos/worker-pagamentos.js` no Cloudflare e faça Deploy. (**Antes** de ligar qualquer oferta. Se usa esse Worker em outros sites, veja a seção sobre eles.)
2. **Worker do site (painel)** → cole `2-worker-site/worker-site.js` e faça Deploy. (O KV `LINKS` precisa ser o mesmo nos dois, como já é.)
3. **GitHub** → substitua `index.html`, `style.css` e `pix-checkout.js`. Depois Ctrl+F5 (e, no celular, feche e reabra o site/app para atualizar o cache).
4. Painel → aba **Ofertas e Pix** → ligue o carrinho e as faixas → Salvar. Aba **Cupons** → crie seus cupons. Nos anúncios que devem dar cupom de volta, marque o bloco e salve.
5. *(Recomendado)* `4-firestore/firestore.rules.sugerido` — veja "Segurança".

Enquanto nada estiver ligado, a loja funciona como antes.

## Contas (exemplos com Pix −10% e faixas 3→10%, 5→20%)
- 3 packs de 6,90 + 8,00 + 5,00 = 19,90 → carrinho −10% = 17,91 → Pix −10% = **R$ 16,12** (cartão R$ 17,91).
- 5 packs (42,40) → −20% = 33,92 → Pix **R$ 30,53**.
- 1 pack de 6,90 com cupom 10% → 6,21 → Pix **R$ 5,59**. O mesmo cupom no pedido de 5 packs **não vale** (o carrinho já dá 20%).
- Cupom de R$ 500 num pedido de 19,90: limitado a 70% (R$ 13,93); o Pix não soma mais nada porque o teto de 70% já foi usado.

## Cuidados e limitações (leia)
- **Cota gratuita do Cloudflare KV (~1.000 gravações/dia):** cada pedido, cada tentativa de cupom e cada pagamento confirmado gravam no KV. Com muito movimento isso pode estourar; se acontecer, o Cloudflare recusa gravações até o dia seguinte. Para uma loja pequena deve ser suficiente.
- **Cupom "primeira compra" e "1 uso por e-mail":** valem por e-mail. Quem usar outro e-mail contorna a regra; sem login de cliente isso não tem como evitar. Limite de usos total (campo "limite") ajuda a controlar.
- O contador de usos do cupom pode contar **2 vezes** num caso raro (confirmação do Mercado Pago e a tela do cliente chegando exatamente juntas). O efeito é só o cupom esgotar um pouco antes.
- "Packs mais vendidos" considera até os **6 primeiros packs** de cada pedido (limite de tamanho do KV). Em carrinhos grandes, os últimos packs não entram nessa lista (a receita e a entrega não são afetadas).
- Excluir um cupom e criar outro com o **mesmo código** mantém a memória de quem já usou aquele código (use outro nome para recomeçar).
- Pedido de carrinho cujo registro for perdido (raro) vira **"divergente"** em vez de entregar às cegas: você vê no painel e resolve manualmente.
- Se a loja tiver **muitos packs no carrinho**, o Worker de pagamentos consulta o Firestore em uma só chamada em lote (para não passar do limite do plano gratuito do Cloudflare); testei até 30 packs.
- A prévia do WhatsApp de uma arte compartilhada é a do site em geral (limite do GitHub Pages).

## Novidades da etapa A (já entregue, continua valendo)

1. **Aviso para guardar o link e o código do pedido.** Na tela "Pagamento confirmado" aparece uma caixa amarela "📌 Guarde estas informações": explica que, se o cliente perder o link, deve usar *"Já paguei e perdi meu link"* com o **e-mail da compra** e o **código do pedido** (mostrado em destaque), com botões **Copiar código do pedido** e **Copiar link(s) de download**.
2. **"Leve também" configurado por anúncio.**
   - Todos os packs mostram o "leve também" (se estiver ligado na aba *Ofertas e Pix*).
   - **Quem dá o desconto é o pack que o cliente está comprando.** No cadastro do anúncio há o bloco **"🎁 Este pack libera desconto no 'leve também'"**: você marca, define a **% (1–70)** e a **forma de pagamento** (qualquer / só Pix / só cartão).
   - Pack sem essa opção marcada: o 2º pack é oferecido a **preço normal** (um pack de R$ 1 não dá 20% num de R$ 50).
   - Na aba Ofertas, o campo de % do "leve também" virou só o **valor sugerido** ao marcar a opção num anúncio.
   - **Atenção:** packs que você já cadastrou ficam *sem* desconto no 2º pack até você marcar a opção neles (antes, o % era global).
3. **Desconto diferente para Pix e cartão.** Aba *Ofertas e Pix*: dois quadros separados (💠 Pix e 💳 cartão), cada um em % ou R$ fixo. O cliente vê os dois valores no card e o **total de cada forma** antes de pagar. Quem tinha "qualquer forma de pagamento" é convertido sozinho em Pix + cartão iguais (nada muda para o cliente).
4. **Verificação dos links do Drive.**
   - Botão **"🔗 Verificar links desta página"** (acima da lista de artes, só quando você está logada): confere só os anúncios da página que você está vendo, em lotes de 10, e mostra em cada card ✅ acessível, 🔒 restrito, ⚠️ confira, ❌ não encontrado/sem link, ❔ não consegui verificar (passe o mouse para ver o motivo).
   - No cadastro do anúncio, botão **"🔍 Testar se o link abre para todos"**, que testa o link digitado antes de salvar.
   - Como funciona: o Worker do painel abre o link como um visitante anônimo; se o Google redireciona para login ou nega acesso, é 🔒. **É uma checagem por aproximação**: não pude testar contra o Google Drive real; se aparecer ⚠️ ou algo estranho, abra o link numa janela anônima. O Google pode mudar o comportamento no futuro.
   - Para o link do Drive funcionar para o cliente: Compartilhar → **Qualquer pessoa com o link** → Leitor.
5. **Selo "🆕 Novo"** nos packs publicados há poucos dias (padrão 14, você muda na aba Ofertas ou desliga). Conta a partir da data de publicação; editar o anúncio **não** reinicia a contagem (anúncios antigos usam a data que já tinham).
6. **Compartilhar uma arte.** Botão "🔗 Compartilhar" no card e na galeria: no celular abre o menu de compartilhar (WhatsApp etc.); no computador copia o link `…/Almatie/?arte=<id>`, que ao ser aberto já mostra aquela arte. *Limitação:* a prévia (imagem/título) que o WhatsApp mostra será a do site em geral, não a da arte (o GitHub Pages não gera prévia por arte).

## Contas da etapa A (exemplos)
Ordem: preço de cada pack → desconto do "leve também" no 2º pack (conforme o 1º pack) → desconto do Pix **ou** do cartão sobre o total.
- 6,90 + 8,00 (−20% = 6,40) = 13,30 → Pix −10% = **R$ 11,97**; cartão −5% = **R$ 12,63**.
- Pack com "leve também só no Pix": no cartão o 2º pack sai a preço normal.
Descontos nunca passam de 70%; ao ligar a oferta, o painel pede confirmação de que o Worker de pagamentos foi atualizado.

## Worker de pagamentos — cuidado com os outros sites
- Mudança **opt-in**: só vale com `ofertas: true` e/ou `cupons: true` no `CONFIG` (já estão `true` neste). Em outro site deixe `false` ou apague as linhas: nada é lido a mais, "extras" e cupons são recusados e o comportamento é o de sempre.
- Testado lado a lado com o Worker **original** em vários cenários × 3 configurações (com ofertas e cupons **desligados** o Worker novo responde, grava no KV e envia e-mails de forma **idêntica, byte a byte**). 40 mil contas aleatórias site × Worker sem divergência.
- Quem decide o valor é só o Worker (o site manda `produtoId` e `extras: [id]`). O Worker lê o campo `leveTambem` do anúncio no Firestore (por isso o painel precisa gravar). Se o Firestore falhar: vale "sem desconto".
- O site confere o `valor` devolvido; se não bater com o prometido, **não mostra o QR** nem abre o cartão.
- Com desconto de cartão, o Mercado Pago recebe **um item** com o valor final (como já era no "leve também").

## Segurança — recomendo corrigir
As Rules atuais têm `allow write: if signed()` em `produtos`, `configuracoes` e `taxonomias`: **qualquer pessoa com conta no Firebase Auth** altera preços, descontos e agora também o "leve também". `4-firestore/firestore.rules.sugerido` troca por `isMaster()`. **Antes de publicar**: crie no Firestore a coleção `masters` com um documento cujo ID é o **UID do seu usuário admin** (Authentication → Usuários); sem isso você perde a permissão de salvar. Não apliquei nada.

## Teste final (10 minutos, com dinheiro de verdade)
1. Pix simples num pack barato: valor no app do banco, arte liberada e caixa "Guarde estas informações".
2. **Carrinho:** ligue o carrinho com uma faixa de 2 artes (para testar barato), toque em "Comprar mais", adicione outro pack, pague no Pix: confira o valor, **os 2 botões de download** e a barra do carrinho sumindo depois.
3. **Cupom de campanha:** crie `TESTE10` (10%), use com seu e-mail num pack barato; tente usar de novo com o mesmo e-mail (deve recusar).
4. **Cupom gerado:** ative "cupom para a próxima compra" num pack barato, compre, **anote o código `VOLTA-…`** que aparece e use-o numa 2ª compra.
5. Um pagamento no cartão. 6. "Perdi meu link" com e-mail + código do pedido (deve mostrar também o cupom). 7. "Verificar links desta página" no painel e o "Resumo de vendas".

## Detalhes técnicos (etapa A)
- Firestore `configuracoes/geral`: `ofertas {combo{ativo,percentual}, pix{ativo,tipo,valor,aplicarEm}, cartao{ativo,tipo,valor}}`, `selos {novo{ativo,dias}}`; em `produtos`: `leveTambem {ativo,percentual,metodo}` e `publicadoEm` (só na criação); em `faixa.botoes[i]`: `id` e `balao`.
- Worker do painel: novas rotas `/admin/verificar-links` (até 10 produtos por chamada, por causa do limite de requisições do plano free) e `/admin/testar-link`.
- `worker-site.js` é gerado: o painel fica embutido como texto; `fonte-do-painel/` tem os arquivos legíveis; `mudancas.patch` é o `git diff` completo.

## Testes rodados nesta etapa (todos com 0 falhas)
`node --check` em todos os JS e no script do `index.html`; Worker de pagamentos: regressão contra o original (inclui "byte a byte" com ofertas/cupons desligados) e paridade site × servidor **45**, carrinho e cupons **71**; Worker do site (cupons + vendas, usando o mesmo KV do Worker de pagamentos) **47**; verificação de links **15**; loja **40**, carrinho/cupom no navegador **36**; painel **39 + 4**, painel (carrinho/cupons/vendas) **40**; integração loja+Worker **9** e carrinho+cupom+pagamento de ponta a ponta **12**.

## Detalhes técnicos (etapa B)
- Firestore `configuracoes/geral → ofertas.carrinho {ativo, faixas[{minItens, percentual}]}`; em `produtos`: `cupomPosCompra {ativo, tipo, valor, validadeDias}`.
- KV `LINKS` (o mesmo dos dois Workers): `cupom:<CODIGO>` (cupons; os de campanha e os `VOLTA-`), `cupomuso:<CODIGO>:<hash do e-mail>`, `cliente:<hash do e-mail>` (já comprou); pedidos com carrinho guardam a lista em `extraIds`.
- Referência do Mercado Pago: `…_<produto>+<extra>` (1 extra) ou `…_<produto>+carrinho` (2 ou mais; a lista fica no registro do pedido).
- Rotas novas: Worker de pagamentos `POST /cupom/validar` (limite de 15 tentativas/10 min por IP); Worker do site `/admin/cupons`, `/admin/cupom-salvar`, `/admin/cupom-excluir` e o resumo `vendas` dentro de `/admin/pedidos`.
- `fonte-do-painel/` tem os arquivos legíveis do painel; `mudancas.patch` é o `git diff` completo contra os arquivos originais.

---

# Da entrega anterior (continua valendo)

**Link obrigatório:** sem `https://...` o botão Publicar/Salvar é bloqueado, o campo fica vermelho e o painel avisa — também ao editar. Anúncio antigo **sem link guardado** só salva depois de você colar o link.

**Balão de chamada** (aba Identidade da loja → em cada botão): marque "💬 Balão de chamada", escreva o texto (até 90 caracteres) e escolha "Só na 1ª visita" ou "Repetir após 7/15/30/60 dias sem entrar". Aparece 1,5 s depois de abrir o site, **um por visita**, com **×** para fechar (também Esc ou clicar no botão). Mudar o texto conta como balão novo. **🔄 Rever os balões neste aparelho** apaga a memória do seu navegador para testar. Só aparece se o botão tiver link válido.

**Compra com 2 packs:** a tela de sucesso, o "perdi meu link" e o e-mail entregam **um link por pack**. Pedidos com 2 packs usam a referência `pix_<pedido>_<produto>+<extra>`; pedidos antigos continuam válidos; `/status-pagamento` e `/recuperar` ganharam `links` sem remover `link`.

Não alterei `sw.js`, `app.js` e demais arquivos do zip.

## Cuidados da etapa C
- **Worker de pagamentos compartilhado com outros sites:** as regras novas só atuam quando o `CONFIG` do site liga `ofertas`/`cupons`. Com isso desligado, o comportamento é idêntico ao anterior. Os campos novos dos packs só são lidos com `CONFIG.ofertas === true`.
- Publique o **Worker de pagamentos primeiro**, depois o do painel, depois o GitHub.
- Os cartões novos do painel dependem de o Worker do painel estar publicado (rota de cupom devolve a forma de pagamento).
- Cupom por valor depende do KV `LINKS` (mesma cota gratuita descrita acima).
