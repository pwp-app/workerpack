const assets = __CF_SITE_DATA__;
const mime = __CF_MIME__;
const host = '__CF_HOST__';

const getRoute = (url) => url.replace(`https://${host}`, '');

addEventListener('fetch', event => {
  event.respondWith(h(event.request));
});

async function h(request) {
  let route = getRoute(request.url);
  if (!route || route === '/') route = '/index.html';
  const {c, t} = assets[route];
  return new Response(c, {headers: {'content-type': mime[t]}});
}