// Service Worker da Almatiê Art
// - torna o site instalável como app e deixa a "casca" (HTML, CSS, JS, ícones) disponível offline;
// - só guarda arquivos do PRÓPRIO site. Nada de outros endereços (Firebase, Mercado Pago, Workers,
//   Cloudinary): assim dados de pedido, status de pagamento e links com senha nunca ficam em cache.
// - rede primeiro: o visitante sempre vê a versão mais nova; o cache só entra quando está offline.

const CACHE_NAME = 'almatie-art-v2';
const ARQUIVOS_ESSENCIAIS = [
  './',
  './index.html',
  './style.css',
  './loja.js',
  './pix-checkout.js',
  './firebase-config.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ARQUIVOS_ESSENCIAIS))
      .catch((erro) => console.error('Falha ao pré-carregar cache do SW:', erro))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((chaves) =>
      Promise.all(chaves.filter((chave) => chave !== CACHE_NAME).map((chave) => caches.delete(chave)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;            // deixa o navegador cuidar de tudo que é externo
  if (url.searchParams.has('ped') || url.searchParams.has('senha')) return;   // retorno de pagamento: nunca em cache

  event.respondWith(
    fetch(req)
      .then((resposta) => {
        if (resposta && resposta.ok && resposta.type === 'basic') {
          const copia = resposta.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copia)).catch(() => {});
        }
        return resposta;
      })
      .catch(() => caches.match(req).then((guardado) => guardado || (req.mode === 'navigate' ? caches.match('./index.html') : undefined)))
  );
});
