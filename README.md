# Almatiê Art — front-end (GitHub Pages)

Site de venda de artes para sublimação. Hospedado no GitHub Pages; dados no Firebase (Firestore); pagamentos e painel de gestão nos Cloudflare Workers; imagens no Cloudinary.

## Arquivos

| Arquivo | Para que serve |
|---|---|
| `index.html` | Estrutura da página (sem CSS/JS embutidos) |
| `style.css` | Todo o visual da loja |
| `loja.js` | Vitrine, filtros, galeria, preços/descontos, identidade visual e abertura do painel admin |
| `pix-checkout.js` | Janela de compra (Pix/cartão), carrinho, cupons, recuperação de pedido |
| `firebase-config.js` | Conexão com o Firebase (chave pública; a proteção está nas regras do Firestore) |
| `sw.js` + `manifest.json` | App instalável e uso offline da "casca" do site |
| `icon-*.png`, `apple-touch-icon.png`, `splash-logo.png` | Ícones do app e logo da tela de carregamento |

## Atualizações
O `sw.js` busca sempre a versão mais nova na rede (o cache só entra quando o visitante está offline), então basta publicar os arquivos novos no GitHub.
