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
