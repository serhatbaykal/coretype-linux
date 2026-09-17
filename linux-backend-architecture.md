# 📋 PLAN: Linux Rust Backend Mimarisinin Tasarlanması ve Kurulumu

> **Slug:** `linux-backend-architecture`  
> **Tarih:** 2026-09-16  
> **Modül:** Rust Backend / OS Altyapısı  
> **Durum:** Tamamlandı (Completed)

---

## 1. Genel Bakış (Overview)
`CoreType-lnx` projesinin Tauri v2 Rust backend altyapısının Linux ekosistemi (X11 & Wayland) için sıfırdan oluşturulması. Windows'a özgü `windows-rs` bağımlılığı tamamen çıkartılarak yerine Linux uyumlu pano (`arboard`), klavye simülasyonu (`enigo`) ve global kısayol (`tauri-plugin-global-shortcut`) entegrasyonu sağlanmıştır. Aktif pencere terminal olduğunda `Ctrl+Shift+V`, diğer durumlarda `Ctrl+V` otomatik seçilmektedir.

---

## 2. Proje Tipi (Project Type)
**BACKEND / RUST & TAURI OS ENTEGRASYONU**

---

## 3. Başarı Kriterleri (Success Criteria)
- [x] `src-tauri/Cargo.toml` dosyasının Linux bağımlılıklarıyla oluşturulması.
- [x] `src-tauri/src/main.rs` ve `src-tauri/src/lib.rs` dosyalarının hatasız kodlanması.
- [x] Frontend'in beklediği tüm IPC komutlarının (`inject_text`, `get_selected_text`, `hide_window`, `show_window`, `save_secret`, `get_secret`) eksiksiz tanımlanması.
- [x] Aktif pencereye göre otomatik kısayol yönlendirmesi (Terminal: `Ctrl+Shift+V`, Standart: `Ctrl+V`).
- [x] `cargo check`, `cargo build` ve `npx tauri build --no-bundle --debug` derleme kontrollerinin başarıyla tamamlanması.

---

## 4. Görev Dağılımı (Task Breakdown)

### Görev 1: Cargo.toml Bağımlılıklarının Tanımlanması
- **Ajan:** `backend-specialist` / `project-planner`
- **Girdi:** `tauri v2`, `arboard v3`, `enigo v0.6.1`, `serde`, `serde_json`, `tauri-plugin-global-shortcut`, `tauri-plugin-autostart`, `tauri-plugin-opener`
- **Çıktı:** `src-tauri/Cargo.toml`
- **Doğrulama:** `cargo check` ile doğrulandı. (Tamamlandı)

### Görev 2: Giriş Noktasının Oluşturulması (`src-tauri/src/main.rs`)
- **Ajan:** `backend-specialist`
- **Girdi:** Standart Tauri v2 main fonksiyonu
- **Çıktı:** `src-tauri/src/main.rs`
- **Doğrulama:** Dosya varlığı doğrulandı. (Tamamlandı)

### Görev 3: Linux Çekirdek Mantığının Kodlanması (`src-tauri/src/lib.rs`)
- **Ajan:** `backend-specialist` (Skills: `rust-pro`, `clean-code`)
- **Girdi:** IPC komut imzaları, terminal tespiti (`is_terminal_window`), pano yapıştırma akışı (`paste_via_clipboard`), enigo simülasyonu, tray ve kısayol kurulumu
- **Çıktı:** `src-tauri/src/lib.rs`
- **Doğrulama:** `cargo check` 0.78s'de hatasız tamamlandı. (Tamamlandı)

### Görev 4: Güvenlik ve İzin Yapılandırması
- **Ajan:** `security-auditor`
- **Girdi:** `secrets.json` izinlerinin `0600` olarak ayarlanması
- **Çıktı:** Güvenli yerel anahtar saklama mekanizması
- **Doğrulama:** Kod denetimi tamamlandı. (Tamamlandı)

---

## 5. Phase X: Doğrulama
- [x] `cargo check` hatasız (0 errors, 0 warnings)
- [x] `cargo build` derleme başarılı
- [x] `npx tauri build --no-bundle --debug` ile `target/debug/coretype` oluşturuldu
- [x] Tüm Tauri IPC komutları frontend ile birebir eşleşiyor

## ✅ PHASE X COMPLETE
- Rust Engine: ✅ Pass (`cargo check`)
- Application Build: ✅ Success (`target/debug/coretype`)
- Date: 2026-09-16
