# NamiRayDigitals — AI Creative Studio

Aplikasi web responsif berbahasa Indonesia untuk membantu menyusun prompt text-to-image, image-to-video, storyboard, dan konsistensi karakter. Dibuat berdasarkan workflow dan referensi kamera dari paket plugin yang diunggah, dengan branding NamiRayDigitals.

## Fitur yang berfungsi
- Dashboard responsif dan navigasi studio.
- Generator prompt lokal: dapat digunakan tanpa API key.
- Jenis produksi: text-to-image, image-to-video, storyboard, character consistency.
- Field gaya visual, durasi, rasio, referensi/kontinuitas, dialog, kamera, negative prompt, dan pembagian scene.
- Salin prompt dan simpan proyek di localStorage browser.
- Opsional integrasi OpenAI Responses API melalui backend Node.js, agar API key tidak diletakkan di frontend.
- Referensi plugin asli disimpan di `plugin-reference/` untuk rujukan.

## Menjalankan secara lokal

Persyaratan: Node.js 18 atau lebih baru.

```bash
npm start
```

Lalu buka `http://localhost:3000`.

## Mengaktifkan integrasi AI

Atur environment variable di terminal sebelum menjalankan aplikasi.

Linux/macOS:
```bash
export OPENAI_API_KEY="isi_api_key_milikmu"
export OPENAI_MODEL="gpt-4.1-mini"
npm start
```

Windows PowerShell:
```powershell
$env:OPENAI_API_KEY="isi_api_key_milikmu"
$env:OPENAI_MODEL="gpt-4.1-mini"
npm start
```

Jangan membagikan API key dan jangan menaruhnya di `public/` atau mengunggahnya ke GitHub. Penggunaan API dapat menimbulkan biaya sesuai akun/provider. Bila API belum disetel, generator prompt lokal tetap berjalan.

## Deploy
Deploy ke server yang mendukung Node.js 18+ dan environment variables. Set `OPENAI_API_KEY` di pengaturan rahasia platform hosting. Jangan hanya mengunggah folder `public` bila menginginkan integrasi AI, karena endpoint `/api/generate` disediakan oleh `server.js`.

## Batasan versi ini
- Aplikasi menyusun prompt; ia tidak menghasilkan gambar atau video secara langsung.
- Generator gambar/video memerlukan layanan/model khusus yang mendukung media generation. Endpoint AI saat ini dipakai untuk menghasilkan teks prompt.
- Proyek tersimpan pada browser/perangkat yang sedang dipakai, bukan sinkron cloud.
- Login pengguna, database cloud, billing, dan upload gambar referensi belum diimplementasikan.
- Untuk akses publik, tambahkan autentikasi, rate limiting, validasi biaya, HTTPS, dan kebijakan privasi sebelum dipakai oleh banyak pengguna.

## Struktur
- `server.js` — server statis + endpoint AI opsional.
- `public/index.html`, `public/style.css`, `public/app.js` — antarmuka web.
- `public/logo.svg` — logo vektor NamiRayDigitals.
- `.env.example` — contoh konfigurasi.
- `plugin-reference/` — konfigurasi, skill workflow, dan referensi kamera dari plugin sumber.

## Deploy publik dengan Render

1. Buat repository GitHub baru dan unggah seluruh isi folder `NamiRayDigitals-Web` (termasuk `render.yaml`). Jangan unggah file `.env` atau API key.
2. Masuk ke https://render.com dan pilih **New + → Blueprint**.
3. Hubungkan repository GitHub tadi. Render akan membaca `render.yaml` dan membuat web service.
4. Saat membuat Blueprint, Render akan meminta `OPENAI_API_KEY` karena ditandai `sync: false`. Tempel API key di kolom rahasia itu. Jika dilewati, buka service → **Environment** → tambahkan `OPENAI_API_KEY`, lalu simpan dan redeploy. Jangan pernah menaruh API key di file frontend atau repository publik.
5. Tunggu deployment selesai, lalu buka URL publik yang ditampilkan pada dashboard Render. Nama subdomain tidak dijamin sama pada setiap akun.

Catatan: nama subdomain bergantung pada ketersediaan. Paket hosting gratis dapat tidur saat tidak aktif dan bisa memiliki batas penggunaan. Integrasi API menimbulkan biaya sesuai penggunaan akun OpenAI. Sebelum membuka akses luas, tambahkan autentikasi, rate limiting, dan perlindungan biaya; versi ini belum memiliki login pengguna atau penyimpanan proyek cloud.

## NamiRayDigitals Universal AI Gateway 1.0

The Studio includes a new professional multi-provider AI workspace at `/ai-gateway.html`. It can route text-generation requests to OpenAI, Google Gemini, Anthropic Claude, DeepSeek, and xAI Grok. Provider keys are read only from server environment variables; never place real keys in browser code or commit them to GitHub.

### Deploy the gateway backend

1. Create a new Render Web Service from this repository and use the included `render.yaml` Blueprint (Node 18+).
2. In the Render service Environment settings, add the provider secret keys you actually own: `OPENAI_API_KEY`, `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, `DEEPSEEK_API_KEY`, and/or `XAI_API_KEY`. Leave unused providers unconfigured.
3. Keep `ALLOWED_ORIGIN=https://anezsky52-source.github.io` for the current GitHub Pages frontend.
4. Deploy. Check that `https://YOUR-RENDER-SERVICE.onrender.com/api/health` returns an OK response.
5. Open the Studio, choose **Universal AI Gateway**, paste the Render service base URL into **Alamat backend gateway**, save it, then select **Periksa koneksi**.

GitHub Pages is a static host and cannot run the Node API itself. The gateway page therefore needs a separately deployed Node backend. Render's free service may sleep when idle. API usage is billed or quota-limited by each provider; the gateway does not make paid API access free. This release handles text responses and prompt workflows, not direct image/video generation. Image/video endpoints must be added separately for providers that support those modalities.

The gateway branch is isolated as `nrd-universal-ai-gateway`; review and merge it into `main` to publish the updated GitHub Pages site. Existing Studio modules and local project storage remain in place.
