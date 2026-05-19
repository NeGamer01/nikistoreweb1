# NikiStore

Next.js store untuk jual source code digital. Payment memakai Okepay/Orderkuota API eksternal, bukan bot WhatsApp.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Isi env:

```bash
OKEPAY_BASE_URL=https://apipay.nikistore.biz.id/api.php
OKEPAY_API_KEY=apikey_okepay
ORDER_SIGNING_SECRET=random_panjang
SITE_URL=https://domain-vercel-kamu.vercel.app
FONNTE_TOKEN=token_fonnte
OWNER_WHATSAPP_NUMBER=628xxxxxxxxxx
DOWNLOAD_STARTER_STORE_URL=https://link-download/source.zip
```

## Alur

1. Buyer checkout produk.
2. Server membuat token order signed.
3. Server request `qris_dinamis` ke Okepay.
4. Halaman payment polling `qris_mutasi`.
5. Jika nominal unik cocok, buyer melihat link download dan menerima WA via Fonnte.
6. Owner menerima notifikasi pembelian sukses via WA.

## Produk

Tambah produk:

```bash
npm run product:add
```

Data katalog ada di `data/products.json`. Link download asli disimpan di env sesuai `downloadEnvKey`.

## Deploy Vercel

Push repo ke GitHub, import ke Vercel, lalu set semua environment variable di Project Settings.
"# nikistoreweb" 
