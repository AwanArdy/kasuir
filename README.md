# Kasir Backend System

Sistem backend kasir (Point of Sale) dengan arsitektur **Hybrid Decentralized**. Dirancang untuk menangani operasional outlet secara offline (menggunakan SQLite) dan sinkronisasi data ke server pusat (menggunakan PostgreSQL/SQLite).

## 🚀 Fitur Utama

- **Central Server**: Manajemen produk, inventaris pusat, dan laporan gabungan.
- **Local Server**: Operasional transaksi cepat di outlet, manajemen shift, dan pengurangan stok otomatis.
- **Sync Engine**: Sinkronisasi data otomatis antara Local dan Central (Pull Master Data & Push Transactions).
- **Multi-Outlet Support**: Dukungan untuk banyak cabang dengan isolasi data yang aman.

## 🛠️ Arsitektur

Sistem terdiri dari dua komponen utama:
1. **Backend Central**: Source of truth untuk produk dan user.
2. **Backend Local**: Berjalan di setiap outlet untuk menangani transaksi harian.

## 📋 Prasyarat

- [Node.js](https://nodejs.org/) (v20+)
- [npm](https://www.npmjs.com/)
- Database:
  - Central: PostgreSQL (Production) atau SQLite (Development)
  - Local: SQLite

## ⚙️ Instalasi

1. Clone repositori:
   ```bash
   git clone <repository-url>
   cd kasir
   ```

2. Install dependensi:
   ```bash
   npm install
   ```

3. **Setup Database PostgreSQL (untuk Central):**
   Berbeda dengan SQLite yang otomatis dibuat, PostgreSQL harus dibuat secara manual:
   - Masuk ke PostgreSQL terminal atau menggunakan alat seperti pgAdmin/DBeaver.
   - Jalankan perintah: `CREATE DATABASE kasir;`
   - Pastikan user PostgreSQL Anda memiliki izin akses ke database tersebut.

4. Konfigurasi Environment:
   Buat file `.env` di root folder:
   ```env
   # Format: postgres://USER:PASSWORD@HOST:PORT/DATABASE_NAME
   DATABASE_URL=postgres://postgres:password@localhost:5432/kasir
   JWT_SECRET=rahasia_super_aman_123
   ```

## 🚀 Menjalankan Aplikasi

### 1. Setup Database Central
Gunakan perintah berikut untuk menyiapkan schema dan data awal di server pusat:
```bash
# Generate schema
npm run central:generate

# Push schema ke database
npm run central:push

# Seed data awal (admin, produk contoh)
npm run central:seed
```

### 2. Menjalankan Central Server
```bash
npm run central:dev
```

### 3. Setup & Jalankan Local Server (Outlet)
Di terminal baru:
```bash
# Push schema ke database lokal
npm run local:push

# Jalankan server lokal
npm run local:dev
```

## 🧪 Pengujian & Debugging

- **Integrasi**: Jalankan tes skenario multi-outlet untuk memverifikasi sinkronisasi.
  ```bash
  npm run test:integration
  ```

## 📂 Struktur Folder

- `backend/central/`: Logika bisnis server pusat (Auth, Products, Inventory, Reports).
- `backend/local/`: Logika bisnis outlet (Transactions, Shifts, Sync Agent).
- `backend/shared/`: Tipe data dan utility yang digunakan bersama.
- `tests/`: File pengujian integrasi.

## 📄 Lisensi

[MIT](LICENSE)
