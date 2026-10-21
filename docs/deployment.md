# Deployment

Panduan menjalankan Akur ERP di produksi. Dua jalur yang didukung: Docker Compose
(single host) dan build Next.js standalone + PM2 + Nginx.

## 1. Persyaratan

- Ubuntu 22.04+ / Debian 12+ (atau Windows/macOS untuk pengembangan)
- Node.js 20.11+ (disarankan 22/24)
- PostgreSQL 16
- Nginx + certbot (opsional, untuk TLS)
- 2 GB RAM / 20 GB SSD untuk skala kecil-menengah

## 2. Docker Compose

Repo sudah menyertakan `Dockerfile` dan `docker-compose.yml`.

```bash
git clone https://github.com/fxagro/akur.git
cd akur
cp .env.example .env
# edit .env: DATABASE_URL, AUTH_SECRET, NEXT_PUBLIC_APP_URL

docker compose up -d --build
docker compose exec app npx prisma migrate deploy
docker compose exec app npm run db:seed
```

Compose menyertakan service `db` (PostgreSQL 16) dengan port host `15432` agar tidak
bentrok dengan PostgreSQL sistem, dan service `app` yang membaca konfigurasi dari
file `.env` melalui `env_file`.

## 3. Build Standalone + PM2 + Nginx

### 3.1 Build

```bash
npm ci
npm run build:packages
npm run build
```

Next.js dikonfigurasi `output: "standalone"` sehingga `.next/standalone` berisi
server minimal beserta dependensinya.

### 3.2 Deploy berkas

Salin ke server:

```bash
# dari mesin lokal
rsync -av --delete \
  --exclude node_modules --exclude .git --exclude .next/cache \
  . user@server:/root/deploy/
```

Alternatif: `git pull` di server lalu `npm ci && npm run build` di sana.

> **Penting:** jangan menyalin `.next/server` secara manual ke `.next/standalone`.
> Struktur build standalone harus utuh, termasuk `app-paths-manifest.json`,
> `middleware-manifest.json`, dan folder chunk. Build ulang lebih aman daripada
> menambal hasil build.

### 3.3 Environment di server

```bash
cat > /root/deploy/.env <<'EOF'
DATABASE_URL="postgresql://akur:PASSWORD@127.0.0.1:15432/akur?schema=public"
AUTH_SECRET="minimal-32-karakter-acak"
NODE_ENV="production"
PORT=3002
EOF
```

Buat secret acak:

```bash
openssl rand -base64 32
```

### 3.4 Migrasi database

```bash
cd /root/deploy
npx prisma migrate deploy
npx prisma generate
```

> Prisma 7 membaca konfigurasi dari `prisma7.config.ts` di root repo.

### 3.5 PM2

```bash
pm2 start .next/standalone/server.js --name akur --cwd /root/deploy
pm2 save
pm2 startup
```

Server standalone membaca `PORT` dari environment.

## 4. Nginx

Contoh site (`/etc/nginx/sites-available/akur.mytriv.com`):

```nginx
server {
    listen 80;
    server_name akur.example.com;

    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Aktifkan dan reload:

```bash
ln -s /etc/nginx/sites-available/akur.example.com /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

> **Selalu** jalankan `nginx -t` sebelum reload. Jangan mengubah site lain di
> server yang sama tanpa perlu.

## 5. TLS (HTTPS)

### 5.1 Let's Encrypt + Cloudflare

Jika domain dilayani proxy Cloudflare, HTTP-01 challenge akan dialihkan ke HTTPS
dan challenge gagal. Gunakan DNS-01:

```bash
apt install certbot python3-certbot-dns-cloudflare
```

Buat token API di Cloudflare (Zone → DNS → Edit → API Tokens → Create Token dengan
permission `Zone:DNS:Edit`), lalu:

```bash
cat > /root/.cloudflare.ini <<'EOF'
dns_cloudflare_api_token = TOKEN_ANDA
EOF
chmod 600 /root/.cloudflare.ini

certbot certonly \
  --dns-cloudflare \
  --dns-cloudflare-credentials /root/.cloudflare.ini \
  --dns-cloudflare-propagation-seconds 60 \
  -d akur.example.com
```

Lalu tambahkan blok `listen 443 ssl` beserta certificate ke site Nginx, dan
`certbot renew` berjalan otomatis via timer systemd.

### 5.2 Self-signed (hanya untuk internal/testing)

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/akur.key \
  -out /etc/ssl/certs/akur.crt \
  -subj "/CN=akur.example.com"
```

## 6. Checklist Setelah Deploy

```bash
# 1. health check route publik
curl -s -o /dev/null -w '%{http_code}\n' https://akur.example.com/login     # 200

# 2. route terproteksi harus redirect (307) saat belum login
curl -s -o /dev/null -w '%{http_code}\n' https://akur.example.com/dashboard # 307

# 3. proses PM2
pm2 list
pm2 logs akur --lines 50
```

Bawaan repo menyediakan skrip bantu:

```bash
bash scripts/test_routes.sh
```

## 7. Operasional

| Aksi                     | Perintah                                            |
| ------------------------ | --------------------------------------------------- |
| Restart aplikasi         | `pm2 restart akur`                                  |
| Lihat log                | `pm2 logs akur --lines 100`                         |
| Status proses            | `pm2 list`                                          |
| Migrasi database         | `npx prisma migrate deploy`                         |
| Backup database          | `docker exec accurate-db pg_dump -U accurate accurate > backup.sql` |
| Tunnel DB dari lokal     | `npm run db:tunnel`                                 |

## 8. Pemecahan Masalah

| Gejala                                        | Penyebab & Solusi                                                                 |
| --------------------------------------------- | ---------------------------------------------------------------------------------- |
| `502 Bad Gateway`                             | PM2 mati / port salah. Cek `pm2 list` dan `pm2 logs`.                               |
| `Cannot GET /login`                           | Build standalone tidak utuh. Build ulang, jangan menambal `.next/server`.          |
| Route terproteksi bisa dibuka tanpa login     | `src/middleware.ts` tidak ter-deploy. Pastikan `middleware-manifest.json` ada.       |
| `PrismaClientKnownRequestError` saat query    | Migrasi belum dijalankan. Jalankan `npx prisma migrate deploy`.                    |
| Halaman 500 setelah deploy                    | `AUTH_SECRET` atau `DATABASE_URL` belum diset di `.env` server.                    |
| SSL error di browser                          | Sertifikat self-signed atau Cloudflare belum issuance. Lihat bagian TLS.            |
