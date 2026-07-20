import { WebApp } from 'meteor/webapp';
import httpProxy from 'http-proxy';

const rawTarget = process.env.CHAT_PROXY_TARGET || 'http://localhost:3005';

// Ensure the final proxy target includes the `/chat` prefix exactly once.
const trimmed = rawTarget.replace(/\/+$/, '');
const TARGET = trimmed.endsWith('/chat') ? trimmed : `${trimmed}/chat`;

console.log('[chat-proxy] initializing proxy ->', TARGET);

const proxy = httpProxy.createProxyServer({
  target: TARGET,
  changeOrigin: true,
  secure: false,
  ws: true,
});

proxy.on('proxyReq', (proxyReq, req, res) => {
  console.log('[chat-proxy] proxyReq ->', req.method, req.url, '->', TARGET + req.url);
});

proxy.on('error', (err, req, res) => {
  console.error('[chat-proxy] error while proxying:', err && err.stack ? err.stack : err);
  try {
    const maybeRes = res as any;
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

// Proxy any path under /chat
WebApp.connectHandlers.use('/chat', (req, res, next) => {
  console.log('[chat-proxy] incoming ->', req.method, req.url);
  proxy.web(req, res, { target: TARGET });
});
