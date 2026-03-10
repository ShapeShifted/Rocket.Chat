import { WebApp } from 'meteor/webapp';
import httpProxy from 'http-proxy';

const rawTarget = process.env.VOICE_PROXY_TARGET || 'http://localhost:3005';

// Ensure the final proxy target includes the `/voice-to-chat` prefix exactly once.
const trimmed = rawTarget.replace(/\/+$/, '');
const TARGET = trimmed.endsWith('/voice-to-chat') ? trimmed : `${trimmed}/voice-to-chat`;

console.log('[voice-proxy] initializing proxy ->', TARGET);

const proxy = httpProxy.createProxyServer({
  target: TARGET,
  changeOrigin: true,
  secure: false,
  ws: true,
});

proxy.on('proxyReq', (proxyReq, req, res) => {
  console.log('[voice-proxy] proxyReq ->', req.method, req.url, '->', TARGET + req.url);
});

proxy.on('error', (err, req, res) => {
  console.error('[voice-proxy] error while proxying:', err && err.stack ? err.stack : err);
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

// Proxy any path under /voice-to-chat
WebApp.connectHandlers.use('/voice-to-chat', (req, res, next) => {
  console.log('[voice-proxy] incoming ->', req.method, req.url);
  proxy.web(req, res, { target: TARGET });
});