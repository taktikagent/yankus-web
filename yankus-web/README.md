# 🐦 Yankuş Web v1.6.0

Yerli Sosyal Medya Platformu - **Sesin Yankılansın!**

## 🚀 Hızlı Başlangıç

### Yerel Çalıştırma

```bash
# Klasöre git
cd yankus-web

# Başlat
node server.js

# Tarayıcıda aç
# http://localhost:3000
```

### Ücretsiz Hosting Seçenekleri

#### 1. Railway (Önerilen)
1. https://railway.app'e git
2. GitHub'dan repo'yu bağla
3. Deploy et - otomatik!

#### 2. Render
1. https://render.com'a git
2. "New Web Service" → GitHub repo
3. Build: `npm install`, Start: `npm start`

#### 3. Vercel
1. https://vercel.com'a git
2. `vercel.json` ekle:
```json
{
  "builds": [{"src": "server.js", "use": "@vercel/node"}],
  "routes": [{"src": "/(.*)", "dest": "server.js"}]
}
```

#### 4. Glitch
1. https://glitch.com'a git
2. "New Project" → "Import from GitHub"

## 📱 PWA Özellikleri

- ✅ Ana ekrana ekleme
- ✅ Offline temel destek
- ✅ Push bildirim altyapısı
- ✅ Standalone uygulama görünümü

## 📁 Dosya Yapısı

```
yankus-web/
├── server.js           # Ana sunucu
├── package.json
├── public/
│   ├── index.html      # Frontend
│   ├── manifest.webmanifest
│   ├── sw.js           # Service Worker
│   └── assets/
│       ├── icon-192.png
│       └── icon-512.png
└── src/
    ├── admin/
    ├── api/
    ├── bots/
    ├── db/
    └── modules/
```

## ⚙️ Ortam Değişkenleri

| Değişken | Varsayılan | Açıklama |
|----------|------------|----------|
| PORT | 3000 | Sunucu portu |

## 🔧 API Endpoints

Tüm Electron versiyonundaki endpoint'ler aynen çalışır.

## 📝 Notlar

- Veritabanı bellekte tutulur (sunucu yeniden başlatılınca sıfırlanır)
- Kalıcı veri için MongoDB/PostgreSQL eklenebilir
- Bot simülasyonu otomatik başlar

## 🎨 İkon Oluşturma

`public/assets/` klasörüne şu ikonları ekle:
- `icon-192.png` (192x192 px)
- `icon-512.png` (512x512 px)

---

Made with ❤️ by Yankuş Team
