import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, 'public');
const PORT = Number(process.env.PORT || 3000);
const API_KEY = process.env.OPENAI_API_KEY || '';
const MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
const mime = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.ico':'image/x-icon' };

function send(res, status, data, type='application/json; charset=utf-8') { res.writeHead(status, {'Content-Type': type, 'X-Content-Type-Options':'nosniff'}); res.end(type.startsWith('application/json') ? JSON.stringify(data) : data); }
const server = http.createServer(async (req, res) => {
  // Render HTTP health check endpoint configured in render.yaml
  if (req.method === 'GET' && req.url === '/api/health') return send(res, 200, { ok: true });
  if (req.method === 'GET' && req.url === '/api/status') return send(res, 200, { aiConfigured: Boolean(API_KEY), model: MODEL });
  if (req.method === 'POST' && req.url === '/api/generate') {
    if (!API_KEY) return send(res, 503, { error: 'Integrasi AI belum aktif. Atur OPENAI_API_KEY di environment server, atau gunakan generator prompt lokal.' });
    let raw = '';
    req.on('data', chunk => { raw += chunk; if (raw.length > 1_000_000) req.destroy(); });
    req.on('end', async () => {
      try {
        const body = JSON.parse(raw || '{}');
        const brief = String(body.brief || '').slice(0, 20000);
        if (!brief.trim()) return send(res, 400, { error: 'Brief prompt masih kosong.' });
        const response = await fetch('https://api.openai.com/v1/responses', {
          method: 'POST', headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: MODEL, instructions: 'Kamu adalah NamiRayDigitals Creative Studio, asisten produksi konten AI berbahasa Indonesia. Buat prompt produksi yang rinci, jelas, aman, dan siap disalin ke alat generasi gambar/video. Hormati referensi pengguna: jangan mengubah wajah, kostum, lokasi, atau suara jika diminta dikunci. Untuk image-to-video, jaga kontinuitas dan jelaskan framing, angle, satu gerakan kamera utama yang termotivasi, gerak subjek, cahaya, audio/dialog, dan negative prompt. Jangan mengklaim bahwa kamu menghasilkan gambar/video secara langsung jika hanya menghasilkan prompt. Susun dengan heading yang mudah dibaca.', input: brief })
        });
        const data = await response.json();
        if (!response.ok) return send(res, response.status, { error: data?.error?.message || 'Permintaan AI gagal. Periksa API key, model, dan billing akun API.' });
        const output = (data.output || []).flatMap(item => item.content || []).filter(c => c.type === 'output_text').map(c => c.text).join('\n').trim();
        return send(res, 200, { text: output || 'AI tidak mengembalikan teks. Coba lagi dengan brief yang lebih spesifik.' });
      } catch (e) { return send(res, 500, { error: 'Tidak dapat memproses permintaan AI: ' + e.message }); }
    });
    return;
  }
  const pathname = decodeURIComponent((req.url || '/').split('?')[0]);
  const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const full = path.resolve(publicDir, relative);
  if (!full.startsWith(publicDir + path.sep) && full !== path.join(publicDir, 'index.html')) return send(res, 403, 'Forbidden', 'text/plain; charset=utf-8');
  fs.readFile(full, (err, data) => { if (err) return send(res, 404, 'Not found', 'text/plain; charset=utf-8'); send(res, 200, data, mime[path.extname(full)] || 'application/octet-stream'); });
});
server.listen(PORT, () => console.log(`NamiRayDigitals berjalan di http://localhost:${PORT}`));
