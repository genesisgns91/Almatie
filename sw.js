// Service Worker da Almatiê Art
// Necessário para o navegador considerar o site "instalável" como app,
// além de permitir um cache básico dos arquivos de casca (shell) do site.

const CACHE_NAME = 'almatie-art-v1';
const ARQUIVOS_ESSENCIAIS = [
  './',
  './index.html',
  './style.css',
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
      Promise.all(
        chaves
          .filter((chave) => chave !== CACHE_NAME)
          .map((chave) => caches.delete(chave))
      )
    )
  );
  self.clients.claim();
});

// Estratégia: tenta a rede primeiro (site sempre atualizado, já que os
// produtos vêm do Firestore); se falhar (offline), usa o cache como apoio.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((resposta) => {
        const respostaClone = resposta.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, respostaClone).catch(() => {});
        });
        return resposta;
      })
      .catch(() => caches.match(event.request))
  );
});
