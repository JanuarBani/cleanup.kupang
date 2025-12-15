# Frontend Cleanup

Proyek ini adalah antarmuka frontend sederhana untuk aplikasi manajemen (jadwal, laporan, pembayaran, dll) yang menggunakan Vite sebagai bundler. Struktur proyek disusun untuk memisahkan halaman, utilitas, dan gaya.

## Prasyarat

- Node.js (>=16) dan npm

## Instalasi

1. Pasang dependensi:

```bash
npm install
```

2. Jalankan server pengembangan:

```bash
npm run dev
```

3. Membangun untuk produksi:

```bash
npm run build
```

4. Menjalankan preview hasil build:

```bash
npm run preview
```

## Struktur Proyek (ringkasan)

- `index.html` — titik masuk aplikasi
- `src/` — kode sumber
  - `main.js` — inisialisasi aplikasi
  - `router.js` — definisi rute
  - `api.js` — konfigurasi endpoint API
  - `auth/` — halaman dan logika autentikasi (login, register)
  - `pages/` — halaman aplikasi (admin, anggota, tamu, tim)
  - `utils/` — utilitas bersama (permintaan API, guard, toast, modal, kalender, dll)
- `styles/` — file CSS untuk tiap peran/fitur
- `vite.config.js` — konfigurasi Vite
- `package.json` — skrip dan dependensi

## Catatan Pengembangan

- Gunakan `utils/apiRequest.js` untuk permintaan terpusat ke backend.
- `utils/authGuard.js` membantu melindungi rute yang membutuhkan autentikasi.
- Komponen dan halaman mengikuti struktur folder `src/pages` untuk memudahkan navigasi.

## Menambah Fitur

1. Buat file halaman baru di `src/pages/` atau folder per-rol di bawahnya.
2. Tambahkan rute di `src/router.js`.
3. Gunakan utilitas di `src/utils/` bila perlu.

## Kontak

Untuk pertanyaan atau kontribusi, buka issue atau hubungi pemilik repositori.

---

README dibuat otomatis oleh asisten; silakan beri tahu jika Anda ingin menambahkan detail lain atau terjemahan.
