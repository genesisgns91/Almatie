# Almatiê Art — auditoria do front-end (GitHub Pages)

Repositório analisado: `genesisgns91/Almatie` (estado atual, já com a etapa C.2).
Esta pasta contém **todos os arquivos que devem ficar no repositório**. Dá para apagar o resto.

## 1. Como publicar (limpeza do repositório)
1. **Apague** do repositório estes arquivos (não pertencem ao site ou estão sem uso):
   `app.js`, `css/app.css` (a pasta `css`), `indexxxxxxxxx.html`, `teste.html`, `flaticon.png`, `logo-icon.png`, `mudancas.patch`, `LEIA-ME.md` antigo.
2. **Envie** os 15 arquivos desta pasta (na raiz do repositório), substituindo os existentes.
3. Abra o site, atualize a página duas vezes (o Service Worker novo assume na 2ª visita).

Observações sobre o que sai:
- `app.js` e `css/app.css` são de **outro projeto** (outro Firebase, "vellum-gns", Bootstrap) — nenhuma página do site os carrega.
- `teste.html` é uma página salva do Rapid Mockup (693 KB). `indexxxxxxxxx.html` é uma cópia antiga do index.
- `flaticon.png` e `logo-icon.png` (2,6 MB) não são usados; se forem arte-fonte da marca, guarde uma cópia fora do repositório.
- `mudancas.patch` (480 KB) e o `LEIA-ME.md` antigo eram só documentação de entregas anteriores.

## 2. O que foi encontrado e corrigido

### Segurança e privacidade
| Achado | Correção |
|---|---|
| **Service Worker guardava no cache qualquer GET**, inclusive `status-pagamento?id=…&senha=…` (a senha do pedido ficava no armazenamento do navegador) e respostas de APIs; offline podia mostrar status velho | `sw.js` v2: só guarda arquivos **do próprio site**; ignora Workers, Firebase, Mercado Pago, Cloudinary e links com `?ped=`/`?senha=`; offline cai para o `index.html` |
| Firebase Storage carregado sem ser usado (superfície extra + download) | removido de `firebase-config.js` |
| Sem nenhuma política de segurança no HTML | CSP de apoio (`object-src 'none'; base-uri 'self'; form-action 'self'`) + `referrer` restrito. Não bloqueia nada do funcionamento atual |
| Mensagem de login sempre "Credenciais inválidas" (inclusive sem internet ou bloqueio por excesso de tentativas) | mensagens claras por tipo de erro; botão desativa durante a tentativa; campos vazios nem chamam o Firebase |
| Senha continuava no campo após fechar o login | campo é limpo ao fechar |

Já estava correto (conferido): todo dado vindo do Firestore é escapado (`esc`) ou passa por `sanitizarDescricao` (lista branca de tags, links só `http/https/mailto`, `rel="noopener noreferrer nofollow"`); links dos botões da faixa só aceitam `http/https/mailto/tel`; o painel de gestão só é entregue pelo Worker ao admin autenticado; valores de preço são recalculados no Worker.

### UX, acessibilidade e interação
- **Login do admin:** agora é um formulário de verdade — Enter envia, o foco vai para o e-mail ao abrir, Esc fecha e o foco volta ao ⚙️, preenchimento automático do navegador/gerenciador de senhas funciona.
- **Janela de compra:** é um diálogo acessível (`role="dialog"`), **Esc fecha**, o foco entra na janela e volta ao botão de origem; botão fechar tem nome para leitor de tela.
- **Galeria:** o foco entra no botão fechar e volta ao card; com a compra aberta por cima, as setas/Esc **não mexem mais na galeria de baixo**; ao fechar a compra, a página **não volta a rolar** enquanto a galeria está aberta (antes rolava por trás).
- Textos alternativos melhores (logo, banner) e botão ⚙️ com nome acessível.
- Compartilhamento (WhatsApp/Instagram/Google): `description` e `og:title/description/image` adicionados.

### Desempenho e organização do código
| Antes | Depois |
|---|---|
| `index.html` de **111 KB** com 13 KB de CSS e ~80 KB de JS embutidos (baixados de novo a cada visita) | `index.html` de **12 KB**; CSS em `style.css` e JS em `loja.js`, ambos em cache |
| Duas fontes carregadas sem uso (Caveat, Courier Prime) | removidas (2 downloads a menos) |
| `splash-logo.png` 312 KB para um logo exibido com 165 px | 26 KB (500 px, visualmente idêntico) |
| ~2 KB de CSS morto (filtros antigos: `.btn-tag`, `.grupo-filtro`, `.menu-categorias`, `.campo-busca`…) | removido |
| Firebase Storage importado | removido |
| Repositório com **~4,9 MB** de arquivos sem uso | tudo fora |

Comparação visual antes/depois (home, filtros, galeria; desktop 1366 px e celular 390 px): **pixels idênticos**, exceto o anel de foco do botão ✕ da galeria (acessibilidade).

## 3. Testes
Todas as suítes anteriores (pagamentos, carrinho/cupons, loja, checkout, integração, painel — 14 suítes) passam com 0 falhas, mais a nova `test-auditoria` (27 verificações: estrutura, login, teclas/foco, pedidos de rede, lógica do Service Worker). Tudo em navegador real com Firebase/Mercado Pago simulados.

## 4. Pontos que dependem de você / próximas etapas
1. **Link do Instagram** na faixa de abertura ainda é `https://www.instagram.com/` (genérico). Troque pelo seu perfil no painel (Identidade → botões da faixa).
2. **Regras do Firestore** (fora do repositório do site): a chave em `firebase-config.js` é pública por natureza; a proteção real são as regras — `produtos` e `configuracoes` só leitura pública, escrita só para o admin; `pedidos`/`cupons` sem leitura pública. Na próxima etapa reviso `firestore.rules`.
3. **Workers** (pagamentos e painel): próxima etapa da auditoria, como combinado.
4. Sugestão futura: banner/miniaturas em WebP via Cloudinary (`f_auto` já é usado nas miniaturas).
