# 📋 PLAN: Doğrudan Alınacak Dosyalar ve Frontend Taşıma

> **Slug:** `direct-file-migration`  
> **Tarih:** 2026-09-16  
> **Modül:** Web & Arayüz Altyapısı  
> **Durum:** Tamamlandı (Completed)

---

## 1. Genel Bakış (Overview)
`/home/alphaghost/projects/CoreType/` projesinde bulunan; işletim sistemine bağımlı olmayan tüm frontend (React 19, TypeScript, CSS Glassmorphism), derleme yapılandırmaları (Vite, TSConfig) ve temel Tauri v2 konfigürasyon dosyalarının `CoreType-lnx` projesine kopyalanarak taşınması ve derlenebilir hale getirilmesi.

---

## 2. Proje Tipi (Project Type)
**WEB / TAURI FRONTEND** (Masaüstü İstemci Katmanı)

---

## 3. Başarı Kriterleri (Success Criteria)
- [x] Tüm web yapılandırma dosyalarının (`package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`) eksiksiz taşınması.
- [x] UI bileşenlerinin (`src/App.tsx`, `src/index.css`, `src/main.tsx` vb.) ve statik varlıkların taşınması.
- [x] Tauri statik varlıklarının (`icons/`, `build.rs`, `capabilities/default.json`, `tauri.conf.json`) yerleştirilmesi.
- [x] `npm install` ve `npm run build` komutlarının hatasız tamamlanması (`dist/` çıktısının doğrulanması).

---

## 4. Görev Dağılımı (Task Breakdown)

### Görev 1: Web & Derleme Yapılandırma Dosyalarının Taşınması
- **Ajan:** `orchestrator` / `frontend-specialist`
- **Girdi:** `CoreType/package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `index.html`
- **Çıktı:** `CoreType-lnx/` kök dizininde hazır yapılandırma dosyaları.
- **Doğrulama:** Dosya varlığı ve içerik kontrolü. (Tamamlandı)

### Görev 2: Frontend Kaynak Kodlarının (`src/`) ve Varlıkların Taşınması
- **Ajan:** `frontend-specialist`
- **Girdi:** `CoreType/src/`, `CoreType/public/`
- **Çıktı:** `CoreType-lnx/src/` ve `CoreType-lnx/public/`
- **Doğrulama:** `src/App.tsx` ve `src/index.css` dosya satır ve boyut kontrolü. (Tamamlandı)

### Görev 3: Tauri v2 Temel Konfigürasyon ve Varlıkların Taşınması
- **Ajan:** `devops-engineer` / `project-planner`
- **Girdi:** `CoreType/src-tauri/icons/`, `build.rs`, `capabilities/default.json`, `tauri.conf.json`
- **Çıktı:** `CoreType-lnx/src-tauri/` temel dosyaları
- **Doğrulama:** Dizin yapısı ve izin tanımları doğrulaması. (Tamamlandı)

### Görev 4: Bağımlılıkların Yüklenmesi ve Tip/Derleme Testi
- **Ajan:** `test-engineer`
- **Girdi:** `npm install`
- **Çıktı:** `node_modules/`, `package-lock.json`, `dist/`
- **Doğrulama:** `npx tsc --noEmit && npm run build` çıktısının 0 koduyla tamamlanması. (Tamamlandı)

---

## 5. Phase X: Doğrulama
- [x] `npm run build` başarılı (811ms)
- [x] `dist/index.html` ve bundle dosyaları mevcut
- [x] Kırık bağımlılık veya eksik import yok

## ✅ PHASE X COMPLETE
- Lint & Type Check: ✅ Pass (`tsc`)
- Build: ✅ Success (`vite build`)
- Date: 2026-09-16
