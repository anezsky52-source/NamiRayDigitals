import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, 'public');
const PORT = Number(process.env.PORT || 3000);
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'https://anezsky52-source.github.io';
const PROVIDERS = {
  openai: { key: 'OPENAI_API_KEY', models: ['gpt-4.1-mini', 'gpt-4o-mini'], endpoint: 'https://api.openai.com/v1/responses' },
  gemini: { key: 'GEMINI_API_KEY', models: ['gemini-2.5-flash', 'gemini-2.0-flash'], endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/' },
  anthropic: { key: 'ANTHROPIC_API_KEY', models: ['claude-3-7-sonnet-latest', 'claude-3-5-haiku-latest'], endpoint: 'https://api.anthropic.com/v1/messages' },
  deepseek: { key: 'DEEPSEEK_API_KEY', models: ['deepseek-chat', 'deepseek-reasoner'], endpoint: 'https://api.deepseek.com/chat/completions' },
  xai: { key: 'XAI_API_KEY', models: ['grok-3-mini', 'grok-3'], endpoint: 'https://api.x.ai/v1/chat/completions' }
};
const mime = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.webp':'image/webp', '.ico':'image/x-icon' };

function send(res, status, data, type='application/json; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': ALLOWED_ORIGIN, 'Vary': 'Origin' });
  res.end(type.startsWith('application/json') ? JSON.stringify(data) : data);
}
function readBody(req, maxBytes=1_000_000) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (Buffer.byteLength(raw) > maxBytes) { reject(new Error('Ukuran permintaan terlalu besar.')); req.destroy(); }
    });
    req.on('end', () => { try { resolve(JSON.parse(raw || '{}')); } catch { reject(new Error('Format JSON tidak valid.')); } });
    req.on('error', reject);
  });
}
function configuredProviders() {
  return Object.entries(PROVIDERS).map(([id, p]) => ({ id, configured: Boolean(process.env[p.key]), models: p.models }));
}
async function generate(provider, model, brief) {
  const config = PROVIDERS[provider];
  if (!config) throw Object.assign(new Error('Provider belum didukung.'), { status: 400 });
  const apiKey = process.env[config.key];
  if (!apiKey) throw Object.assign(new Error('API key provider ini belum dipasang di environment server.'), { status: 503 });
  if (!config.models.includes(model)) throw Object.assign(new Error('Model tidak diizinkan atau belum didukung.'), { status: 400 });
  const instructions = 'Kamu adalah NamiRayDigitals Universal AI Gateway, asisten produksi kreatif profesional berbahasa Indonesia. Hasilkan jawaban yang terstruktur, praktis, sinematik, dan siap digunakan. Untuk proyek visual, jaga kontinuitas wajah, kostum, proporsi, suara, lingkungan, pencahayaan, dan arah kamera sesuai instruksi pengguna. Jangan mengklaim telah membuat gambar atau video jika hanya menghasilkan teks.';
  let response, data;
  if (provider === 'openai') {
    response = await fetch(config.endpoint, { method:'POST', headers:{ Authorization:'Bearer '+apiKey, 'Content-Type':'application/json' }, body:JSON.stringify({ model, instructions, input:brief }) });
    data = await response.json();
    if (!response.ok) throw Object.assign(new Error(data?.error?.message || 'OpenAI request gagal.'), { status: response.status });
    const text = (data.output || []).flatMap(x => x.content || []).filter(x => x.type === 'output_text').map(x => x.text).join('\n').trim();
    return text;
  }
  if (provider === 'gemini') {
    const url = config.endpoint + encodeURIComponent(model) + ':generateContent?key=' + encodeURIComponent(apiKey);
    response = await fetch(url, { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ systemInstruction:{ parts:[{ text:instructions }] }, contents:[{ role:'user', parts:[{ text:brief }] }] }) });
    data = await response.json();
    if (!response.ok) throw Object.assign(new Error(data?.error?.message || 'Gemini request gagal.'), { status: response.status });
    return (data.candidates || []).flatMap(c => c.content?.parts || []).map(p => p.text || '').join('\n').trim();
  }
  if (provider === 'anthropic') {
    response = await fetch(config.endpoint, { method:'POST', headers:{ 'x-api-key':apiKey, 'anthropic-version':'2023-06-01', 'Content-Type':'application/json' }, body:JSON.stringify({ model, max_tokens:4096, system:instructions, messages:[{ role:'user', content:brief }] }) });
    data = await response.json();
    if (!response.ok) throw Object.assign(new Error(data?.error?.message || 'Anthropic request gagal.'), { status: response.status });
    return (data.content || []).filter(x => x.type === 'text').map(x => x.text).join('\n').trim();
  }
  response = await fetch(config.endpoint, { method:'POST', headers:{ Authorization:'Bearer '+apiKey, 'Content-Type':'application/json' }, body:JSON.stringify({ model, messages:[{ role:'system', content:instructions }, { role:'user', content:brief }] }) });
  data = await response.json();
  if (!response.ok) throw Object.assign(new Error(data?.error?.message || (provider + ' request gagal.')), { status: response.status });
  return data.choices?.[0]?.message?.content?.trim() || '';
}

const server = http.createServer(async (req, res) => {
  const pathname = (req.url || '/').split('?')[0];
  if (req.method === 'OPTIONS') { res.writeHead(204, { 'Access-Control-Allow-Origin': ALLOWED_ORIGIN, 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400', 'Vary': 'Origin' }); return res.end(); }
  if (req.method === 'GET' && pathname === '/api/health') return send(res, 200, { ok:true, service:'NamiRayDigitals Universal AI Gateway' });
  if (req.method === 'GET' && pathname === '/api/status') return send(res, 200, { aiConfigured:configuredProviders().some(x=>x.configured), providers:configuredProviders() });
  if (req.method === 'POST' && pathname === '/api/generate') {
    try {
      const body = await readBody(req);
      const provider = String(body.provider || 'openai').toLowerCase();
      const model = String(body.model || '');
      const brief = String(body.brief || '').trim().slice(0, 20000);
      if (!brief) return send(res, 400, { error:'Brief masih kosong.' });
      const output = await generate(provider, model, brief);
      return send(res, 200, { text:output || 'Model tidak mengembalikan teks. Silakan coba lagi.' });
    } catch (error) { return send(res, error.status || 500, { error:error.message || 'Permintaan AI gagal.' }); }
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { error:'Method tidak diizinkan.' });
  const relative = pathname === '/' ? 'index.html' : decodeURIComponent(pathname).replace(/^\/+/, '');
  const full = path.resolve(publicDir, relative);
  if (!full.startsWith(publicDir + path.sep) && full !== path.join(publicDir, 'index.html')) return send(res, 403, 'Forbidden', 'text/plain; charset=utf-8');
  fs.readFile(full, (err, data) => {
    if (err) return send(res, 404, 'Not found', 'text/plain; charset=utf-8');
    res.writeHead(200, { 'Content-Type':mime[path.extname(full)] || 'application/octet-stream', 'X-Content-Type-Options':'nosniff' });
    res.end(data);
  });
});
server.listen(PORT, () => console.log('NamiRayDigitals berjalan di http://localhost:' + PORT));
