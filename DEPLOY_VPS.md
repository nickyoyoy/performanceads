# Panduan Deployment ScentPlus Ads Dashboard ke VPS

Dashboard ini sudah siap 100% untuk dideploy ke VPS Linux (Ubuntu, Debian, CentOS, dll.) agar dapat diakses secara online oleh tim manajemen, performance ads, dan PIC integrasi 24/7.

---

## 🏗️ Mengapa Dashboard Ini Siap untuk VPS?
1. **Zero External Dependency Server**: Telah disediakan `server.js` bawaan Node.js murni tanpa ketergantungan library luar yang berat.
2. **Built-in Google Sheets Proxy**: Endpoint `/api/sheets-csv` menangani penarikan data live Google Spreadsheet dengan *cache-busting* otomatis, sehingga browser tim tidak akan terkena kendala CORS atau caching lama.
3. **Single Page Application (SPA) Routing Support**: Navigasi dan parameter URL query ter-redirect dengan mulus ke `index.html`.

---

## 🚀 Pilihan 1: Deploy dengan Node.js & PM2 (Paling Direkomendasikan & Mudah)

### Langkah 1: Persiapan di VPS
Masuk ke terminal VPS via SSH:
```bash
ssh root@IP_VPS_ANDA
```

Pastikan Node.js (v18 atau v20) dan PM2 sudah terinstall:
```bash
# Update package list
sudo apt update && sudo apt upgrade -y

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git

# Install PM2 (Process Manager agar aplikasi auto-restart 24/7)
sudo npm install -g pm2
```

### Langkah 2: Transfer / Clone Project ke VPS
```bash
# Buat folder aplikasi
sudo mkdir -p /var/www/scentplus-ads
sudo chown -R $USER:$USER /var/www/scentplus-ads
cd /var/www/scentplus-ads

# Clone repository atau upload source code ke folder ini:
git clone <URL_REPOSITORY_ANDA> .
```

### Langkah 3: Install & Build Production
```bash
# Install dependensi
npm install

# Build static production bundle (dist/)
npm run build
```

### Langkah 4: Jalankan Server dengan PM2
```bash
# Jalankan aplikasi di background port 3000
pm2 start server.js --name "scentplus-ads"

# Konfigurasi agar aplikasi otomatis jalan saat VPS restart
pm2 save
pm2 startup
```

### Langkah 5: Buka Port Firewall VPS
Jika VPS menggunakan firewall UFW:
```bash
sudo ufw allow 3000/tcp
sudo ufw reload
```

**Selesai!** Tim Anda kini bisa membuka dashboard langsung di:
👉 `http://IP_VPS_ANDA:3000`

---

## 🐳 Pilihan 2: Deploy dengan Docker & Docker Compose (1 Command)

Jika VPS Anda sudah terinstall Docker:

```bash
# Masuk ke direktori project di VPS
cd /var/www/scentplus-ads

# Build dan jalankan container di background
docker compose up -d --build
```

Untuk memantau log:
```bash
docker compose logs -f
```

Untuk mematikan:
```bash
docker compose down
```

---

## 🌐 Menghubungkan ke Domain Sendiri & SSL HTTPS (Opsional / Sangat Bagus)

Jika Anda ingin tim mengakses dengan link profesional seperti `https://ads.scentplus.id`:

1. **Pointing Domain (DNS Management)**:
   - Buat DNS **A Record**:
     - Name/Host: `ads` (atau `@` untuk root domain)
     - Value/Target: `IP_VPS_ANDA`

2. **Install Nginx & Certbot**:
   ```bash
   sudo apt install -y nginx certbot python3-certbot-nginx
   ```

3. **Gunakan Konfigurasi Nginx yang Disediakan**:
   ```bash
   sudo cp nginx.conf.example /etc/nginx/sites-available/scentplus-ads
   sudo nano /etc/nginx/sites-available/scentplus-ads
   # Ganti 'ads.scentplus.id' dengan domain Anda
   ```

   Aktifkan konfigurasi:
   ```bash
   sudo ln -s /etc/nginx/sites-available/scentplus-ads /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

4. **Pasang Sertifikat SSL Gratis (HTTPS)**:
   ```bash
   sudo certbot --nginx -d ads.scentplus.id
   ```

Setelah selesai, tim cukup mengakses:
👉 **`https://ads.scentplus.id`**

---

## 🔄 Cara Update Data atau Kode di Kemudian Hari
Jika ada update fitur kode baru:
```bash
cd /var/www/scentplus-ads
git pull
npm run build
pm2 restart scentplus-ads
```
*(Catatan: Untuk data iklan di Google Sheet, Anda **tidak perlu deploy ulang**, dashboard otomatis menyinkronkan data terbaru setiap kali tombol Refresh diklik).*
