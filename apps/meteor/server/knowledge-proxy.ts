import { WebApp } from 'meteor/webapp';
import httpProxy from 'http-proxy';

const rawTarget = process.env.KNOWLEDGE_PROXY_TARGET || 'http://host.docker.internal:3005';

// Ensure the final proxy target includes the `/knowledge` prefix exactly once.
// If rawTarget already includes `/knowledge`, keep it; otherwise append it.
const trimmed = rawTarget.replace(/\/+$/, ''); // remove trailing slash(es)
const TARGET = trimmed.endsWith('/knowledge') ? trimmed : `${trimmed}/knowledge`;

// Startup log so we know Meteor loaded the file
console.log('[knowledge-proxy] initializing proxy ->', TARGET);

const proxy = httpProxy.createProxyServer({
  target: TARGET,
  changeOrigin: true,
  secure: false,
  ws: true,
});

proxy.on('proxyReq', (proxyReq, req, res) => {
  console.log('[knowledge-proxy] proxyReq ->', req.method, req.url, '->', TARGET + req.url);
});

proxy.on('error', (err, req, res) => {
  console.error('[knowledge-proxy] error while proxying:', err && err.stack ? err.stack : err);
  try {
    const maybeRes = /** @type {any} */ (res);
    if (maybeRes && typeof maybeRes.writeHead === 'function') {
      maybeRes.writeHead(502, { 'Content-Type': 'text/plain' });
      maybeRes.end('Bad gateway.');
    } else if (maybeRes && typeof maybeRes.end === 'function') {
      maybeRes.end();
    }
  } catch (e) {
    // ignore
  }
});

// Proxy any path under /knowledge: req.url here is the part after /knowledge (e.g. /documents?...).
// Because TARGET includes /knowledge, the final proxied URL becomes TARGET + req.url => .../knowledge/documents...
WebApp.connectHandlers.use('/knowledge', (req, res, next) => {
  console.log('[knowledge-proxy] incoming ->', req.method, req.url);
  proxy.web(req, res, { target: TARGET });
});