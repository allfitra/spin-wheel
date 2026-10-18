# Spin Wheel Multi Pemenang (Production-Ready)

Aplikasi web modern untuk pengundian multi-pemenang (doorprize, arisan, giveaway) dalam sekali putaran roda secara adil, transparan, dan menggunakan keacakan kriptografis tingkat tinggi.

Terinspirasi dari kesederhanaan Wheel of Names dengan kemampuan multi-pemenang langsung dalam satu spin.

---

## 🚀 Cara Menjalankan Aplikasi

Pastikan **Node.js (v18+)** dan **npm** sudah terinstal di komputer Anda.

### 1. Instalasi Dependensi
```bash
npm install
```

### 2. Jalankan Mode Pengembangan (Dev Server)
```bash
npm run dev
```
Buka browser pada URL yang ditampilkan di terminal (biasanya `http://localhost:5173`).

### 3. Menjalankan Unit Test (Vitest)
```bash
npm test
```
Seluruh 35 pengujian unit untuk logika murni (algoritma pemenang, normalisasi nama, RFC 4180 CSV, keacakan kriptografis) akan dijalankan.

### 4. Build Produksi
```bash
npm run build
npm run preview
```

---

## 🎯 Cara Kerja Algoritma Pemilihan Pemenang

Untuk menjamin setiap peserta memiliki peluang menang yang **100% adil dan sama besar**, mekanisme pemilihan dirancang dengan prinsip:

1. **Target Segmen Terpilih & Sinkronisasi Presisi**:
   - Pemenang #1 ($startIndex$) dipilih secara kriptografis menggunakan `crypto.getRandomValues`.
   - Sudut akhir putaran dihitung tepat ke titik tengah juring segmen pemenang #1 (dengan variasi alami $\pm 20\%$ agar tidak kaku namun tidak pernah berhenti di garis batas).
   - Jarum panah merah berhenti tepat menunjuk ke nama pemenang #1 di kanvas roda.
2. **Metode Penentuan Multi-Pemenang (Opsi 2: Acak Tersebar - Default)**:
   - **Pemenang #1**: Adalah nama pada segmen yang ditunjuk langsung oleh jarum panah merah.
   - **Pemenang #2 sampai #N**: Diambil secara **acak tersebar** (*cryptographic sampling without replacement*) dari seluruh sisa peserta di roda menggunakan algoritma Fisher-Yates shuffle.
   - Pemenang-pemenang yang terpilih akan menyala terang di berbagai posisi di sekeliling roda, sementara yang bukan pemenang diredupkan.
   - *(Tersedia juga opsi mode "Berurutan Melingkar" di menu Opsi jika diinginkan)*.
3. **Sorotan Visual & Penghapusan Bertahap**:
   - Setelah roda berhenti, seluruh segmen pemenang disorot dengan garis emas terang dan segmen lain diredupkan.
   - Jika opsi "Hapus pemenang setelah spin" aktif, nama-nama pemenang dihapus dari daftar setelah popup ditutup, sehingga kanvas tidak mengalami lonjakan visual mendadak saat selebrasi berlangsung.

---

## 💾 Struktur Data localStorage

Semua data disimpan di browser menggunakan prefix versi `spinwheel:v1` agar aman dari konflik versi skema. Dilengkapi fallback `try/catch` jika storage diblokir/penuh serta listener `window.addEventListener('storage')` untuk sinkronisasi otomatis antar-tab browser:

### 1. `spinwheel:v1:participants`
Menyimpan array string daftar nama peserta yang aktif di roda:
```json
[
  "Ahmad Fauzi",
  "Siti Rahmah",
  "Budi Santoso",
  "Dewi Lestari"
]
```

### 2. `spinwheel:v1:settings`
Menyimpan konfigurasi putaran roda:
```json
{
  "winnerCount": 10,
  "prizeLabel": "Doorprize Utama",
  "removeWinnersAfterSpin": true,
  "spinDurationSeconds": 6,
  "soundEnabled": true,
  "allowDuplicates": false
}
```

### 3. `spinwheel:v1:history`
Menyimpan riwayat seluruh sesi undian (terbaru di atas):
```json
[
  {
    "id": "round-1773789400000-482",
    "round": 1,
    "prize": "Doorprize Utama",
    "winners": [
      "Ahmad Fauzi",
      "Siti Rahmah"
    ],
    "timestamp": 1773789400000,
    "totalParticipantsBefore": 30
  }
]
```

### 4. `spinwheel:v1:theme`
Menyimpan preferensi mode tampilan: `"light" | "dark" | "system"`.

---

## 🛠️ Fitur Unggulan

- **Canvas Retina Sharp**: Menggunakan `window.devicePixelRatio` untuk ketajaman sempurna di layar HD/Retina.
- **Efek Suara Sintetis Web Audio API**: Suara detak pasak roda saat melintasi panah dan lagu kejayaan tanpa memerlukan file audio eksternal.
- **Efek Confetti Mandiri**: Partikel selebrasi ringan langsung digambar pada HTML5 Canvas tanpa library berat eksternal.
- **Aksesibilitas Penuh**: Focus trap pada modal, penutupan dengan tombol `Escape`, atribut ARIA lengkap, dan dukungan `prefers-reduced-motion`.
- **Ekspor & Impor**: Impor file `.txt` atau `.csv`, ekspor riwayat ke CSV berstandar RFC 4180 dengan UTF-8 BOM (langsung terbaca rapi di Microsoft Excel & Google Sheets) serta ekspor JSON.
- **Fitur Undo**: Batalkan spin terakhir kapan saja untuk mengembalikan pemenang ke roda undian.
- **Konfirmasi 2 Langkah**: Proteksi reset total aplikasi agar data penting tidak sengaja terhapus.
