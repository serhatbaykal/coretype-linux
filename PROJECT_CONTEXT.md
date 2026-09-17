# 📌 PROJE ADI: CoreType for Linux
> **Son Güncelleme:** 2026-09-17 16:55  
> **Mevcut Durum:** Git Sürüm Kontrolü ve GitHub Private Repo Senkronizasyonu (main branch)  
> **GitHub Deposu:** https://github.com/serhatbaykal/coretype-linux (Private)  
> **Aktif Versiyon:** v0.1.0 (Baseline)

---

## 1. 🎯 Projenin Amacı ve Kapsamı
- **Ana Problem:** Masaüstü kullanıcılarının herhangi bir uygulamada (kod editörü, tarayıcı, terminal vb.) çalışırken pencere değiştirmeden, panoya kopyala-yapıştır yapmadan hızlıca AI destekli metin üretimi, çeviri, düzeltme ve dönüştürme yapabilmesi.
- **Hedef Kitle:** Linux (X11 & Wayland) masaüstü geliştiricileri, yazarlar ve güç kullanıcıları.
- **Temel Değer:** "Sıfır sürtünme" ve "sistem genelinde enjeksiyon" — `Ctrl + Space` kısayoluyla anında açılan, komutu alan ve doğrudan aktif uygulamadaki imleç konumuna sonucu enjekte eden süper hafif masaüstü asistanı.

---

## 2. 🛠️ Teknoloji Yığını (Tech Stack)
- **Framework:** Tauri v2 (Linux masaüstü)
- **Frontend / UI:** React 19 + TypeScript 5.8 + Vite 7 + Custom Glassmorphism CSS (840x260 spotlight, 900x1000 ferah ayarlar penceresi, özel dropdown UI, Lucide ikon geometrisi)
- **Backend:** Rust (Edition 2021) + Tauri v2
- **Linux Entegrasyonu:** 
  - Global Shortcut: `tauri-plugin-global-shortcut` + KDE Plasma 6 KGlobalAccel (`com.coretype.app.desktop` / `Ctrl+Space`) + Unix Domain Socket (`--toggle` / `CORETYPE_INITIAL_TOGGLE`)
  - Üretim / Release Kısayolu: `com.coretype.app.desktop` doğrudan `target/release/coretype --toggle` çalıştırır; derleme `npx tauri build --no-bundle` ile yapılır, tüm web varlıkları (dist) doğrudan binary'ye gömülür, localhost bağımlılığı sıfırdır.
  - Pencere Ortalanması: `GDK_BACKEND=x11` zorlaması + Ayarlar penceresiyle özdeş GTK monitör geometrisi merkezlemesi (`pos.x + (size.width - win_w) / 2.0`, KWin'de $x=954, y=577, w=285$ kesin simetrik merkez)
  - Otomatik Kısayol: Terminal için `Ctrl+Shift+V`, Standart pencereler için `Ctrl+V` (KWin D-Bus aktif pencere sınıfı tespiti)
  - Metin Enjeksiyonu: `arboard v3` (Kalıcı TargetWindowState hafızası) + `enigo v0.6.1` (Klavye simülasyonu)
  - Gizli Anahtar Saklama: `~/.config/com.coretype.app/secrets.json` (`0600` izinli)
- **AI Sağlayıcıları:** Google Gemini (`gemini-2.5-flash`), OpenAI (`gpt-4o-mini`), Ollama (Local)

---

## 3. 📂 Dizin Yapısı ve Dosya Haritası
/home/alphaghost/projects/CoreType-lnx/
├── .agent/                  # Antigravity agent & skill tanımları
├── .antigravity/            # Protokol kuralları ve şablonlar
├── CHANGELOG.md             # Kalıcı değişiklik günlüğü
├── PROJECT_CONTEXT.md       # Canlı proje hafıza dosyası
├── direct-file-migration.md # Doğrudan taşınan dosyalar görev planı (Tamamlandı)
├── linux-backend-architecture.md # Linux Rust backend görev planı (Tamamlandı)
├── index.html               # Web giriş şablonu
├── package.json             # coretype-linux paket yapılandırması
├── tsconfig.json            # TypeScript bundler konfigürasyonu
├── vite.config.ts           # Vite port 1420 konfigürasyonu
├── dist/                    # Üretim derleme çıktısı (HTML + CSS + JS)
├── public/                  # Statik svg varlıkları
├── src/                     # React 19 UI kaynak kodları
│   ├── App.tsx              # 17 slash komutu, LLM istemcileri, Lucide SVG ikonları, CustomSelect
│   ├── index.css            # Glassmorphism CSS sistemi, shape-rendering: geometricPrecision
│   ├── main.tsx             # React kök başlatıcı (window.__CORETYPE_LOADED__ bayrağı)
│   └── vite-env.d.ts        # Vite tipleri
└── src-tauri/               # Tauri v2 Linux altyapısı
    ├── build.rs             # Tauri derleme betiği
    ├── capabilities/        # İzin tanımları (default.json)
    ├── icons/               # Masaüstü ve tray ikonları
    ├── Cargo.toml           # Linux Rust bağımlılıkları (tauri, arboard, enigo)
    ├── tauri.conf.json      # Tauri v2 genel yapılandırması (1190x333 X11 HiDPI, center=false)
    └── src/
        ├── main.rs          # Giriş noktası (GDK_BACKEND=x11 fix + CORETYPE_INITIAL_TOGGLE)
        └── lib.rs           # Linux çekirdek mantığı, debug auto-recovery, get_xwayland_scale, resize_window kontrolü, KWin IPC dinleyicisi

---

## 4. 🧠 Kritik Mimari Kararlar ve Kurallar
- **Masaüstü Kısayolu ve Bağımsız Çalışma:** `com.coretype.app.desktop` her zaman `target/release/coretype` ikili dosyasına işaret etmelidir. Release modunda tüm frontend varlıkları ikili dosyanın içine gömülüdür; `localhost:1420`'ye asla bağlanmaz, arka planda terminal veya dev sunucusu gerektirmez ve "Connection refused" hatası oluşmaz.
- **Debug Auto-Recovery (Otomatik Kurtarma):** Debug derlemesinde `devUrl` kullanılırken `toggle_main_window` tetiklendiğinde webview durumu kontrol edilir; `!window.__CORETYPE_LOADED__` ise `127.0.0.1:1420` portu dinlenir ve sunucu hazır olduğunda `location.reload()` ile WebKit hata sayfası kendiliğinden temizlenir.
- **Slash Komutları Otomatik Tamamlama & Argüman Akışı:** Menüden bir slash komutu tıklandığında veya listeden `Tab` / `Enter` tuşlarıyla seçildiğinde pencere asla hemen kapanmaz. `applySlashCommand` ile metin kutusuna komut ve boşluk (örn. `/komut `) tamamlanır, imleç sonuna odaklanır. Kullanıcı argümanını yazıp Enter'a bastığında `cmd.template` ile argüman birleştirilip AI'ya iletilir; argümansız ve seçili metinsiz boş gönderimler engellenir.
- **Dinamik Ortam & Sistem Bağlamlı AI Mimarisi (Context-Aware AI):** Rust backend `/etc/os-release`, `$SHELL`, `$XDG_CURRENT_DESKTOP` ve KWin D-Bus pencere durumunu (`active_class`, `active_title`, `is_terminal`) anlık olarak derler (`get_system_context`). Frontend `buildSystemPrompt` ile AI'ya (Gemini, OpenAI, Ollama) ana makinenin CachyOS Linux (Arch), paket yöneticisinin `pacman / paru` ve kabuğun `fish`/`bash` olduğunu bildirir. Terminal hedefinde AI'nın markdown blokları veya tırnak eklemesi yasaklanarak doğrudan çalıştırılabilir saf komut üretimi güvenceye alınır.
- **Vektör İkon Hassasiyeti (SVG Anti-Aliasing):** Küçük boyutlarda (14-16px) SVG çizimlerinde `strokeWidth="2"` korunmalı, `shape-rendering: geometricPrecision` kullanılmalı ve karmaşık 8-dişli bozuk yaylar yerine 60 derece simetrili 6-dişli Lucide geometri modeli tercih edilmelidir.
- **Sıfır Tuş Vuruşu IPC Yükü:** Kullanıcı normal metin yazarken her harfte `resize_window` IPC çağrısı yapılmaz; `currentWindowHeightRef` ile yalnızca pencere yüksekliği fiilen değiştiğinde (slash menü açılıp kapandığında) tek bir çağrı yapılır.
- **Rust Akıllı Boyut Kontrolü:** `resize_window` komutunda `inner_size()` okunarak hedef boyut mevcut boyutla aynıysa pencere yöneticisine `set_size` emri verilmez ve konsola gereksiz log yazılmaz; yalnızca gerçek değişimde log üretilir.
- **Linux WebKitGTK Native Select Hatası:** WebKitGTK varsayılan olarak `<select>` elementlerini sistem GTK temasındaki `GtkComboBox` olarak çizer ve açık renk temalarda beyaz zemin / beyaz metin oluşturur. Bu nedenle özel Glassmorphism `custom-select` bileşeni ve `-webkit-appearance: none !important` sıfırlaması zorunlu tutulmuştur.
- **Dinamik Pencere Boyutlandırması:** GTK3 üzerinde programatik `window.set_size` çağrılarının çalışabilmesi için `tauri.conf.json`'da `"resizable": true` tutulmalıdır.
- **KWin Wayland Ortalama Geometrisi:** Wayland'de pencere merkezleme `pos.x + (size.width - win_w) / 2.0` mantıksal koordinatlarıyla Rust tarafında yapılır.
- **GDK_BACKEND=x11 Zorlaması:** `main.rs` içinde en başta `env::set_var("GDK_BACKEND", "x11")` uygulanarak Wayland altında kompozitörün konumu sıfırlaması engellenir.
- **Otomatik Terminal Tespiti:** KWin D-Bus script ve `xprop` ile tespit edilerek terminalde `Ctrl+Shift+V`, standart pencerelerde `Ctrl+V` tetiklenir.
- **Gizlilik ve Güvenlik:** API anahtarları asla düz metin olarak `localStorage` içinde tutulmaz; yerel `secrets.json` dosyasında `0600` izinleriyle saklanır.
- **Antigravity Protokolü:** Her görev öncesi `PROJECT_CONTEXT.md` okunacak, görev sonrası `CHANGELOG.md` en üste eklenecek ve `PROJECT_CONTEXT.md` senkronize edilecektir.

---

## 5. ✅ Tamamlanan Özellikler (Changelog - Son 5 İşlem)
- [x] **[2026-09-17 07:18]** Localhost:1420 "Connection refused" hatası kalıcı olarak giderildi; sistem masaüstü kısayolu doğrudan gömülü varlıklara sahip Release sürümüne (`target/release/coretype`) bağlandı (terminal/sunucu bağımlılığı sıfırlandı); Debug modu için ise Vite açıldığı anda sayfayı otomatik yenileyen `auto-recovery` mekanizması eklendi.
  - 📄 `~/.local/share/applications/com.coretype.app.desktop : 1-17`
  - 📄 `src/main.tsx : 5-10`
  - 📄 `src-tauri/src/lib.rs : 385-410`
- [x] **[2026-09-17 06:35]** Slash komutları otomatik tamamlama ve argüman akışı (`applySlashCommand`) kuruldu; tıklama, `Tab` veya `Enter` ile komutun metin kutusuna tamamlanması, pencerenin açık kalarak kullanıcının isteğini yazması ve `handleSend` ile argüman birleştirmesi sağlandı; boş gönderimler engellendi.
  - 📄 `src/App.tsx : 675-695, 1055-1120, 1375-1385, 1465-1475`
- [x] **[2026-09-17 06:15]** Dinamik ortam ve sistem bağlamlı AI mimarisi (`get_system_context`, `buildSystemPrompt`) hayata geçirildi; host OS (CachyOS Linux), paket yöneticisi (`pacman / paru`), shell (`fish`), aktif pencere ve terminal modu dinamik olarak prompt'a enjekte edildi; terminal için saf komut üretimi sağlandı ve durum çubuğuna hedef rozeti eklendi.
  - 📄 `src-tauri/src/lib.rs : 13-18, 65-175, 335-345, 540-645, 775-785`
  - 📄 `src/App.tsx : 20-75, 535-545, 555-570, 695-705, 1125-1240, 1575-1605`
- [x] **[2026-09-17 05:38]** Ayarlar çarkı ve kapatma ikonlarındaki piksel bozuklukları giderildi; asimetrik hatalı SVG yayları yerine kusursuz simetrili 6 dişli Lucide Settings geometrisi getirildi, `strokeWidth: 2` ve `shape-rendering: geometricPrecision` ile kristal netlik sağlandı.
  - 📄 `src/App.tsx : 205-220, 1245-1260`
  - 📄 `src/index.css : 120-145`
- [x] **[2026-09-17 05:31]** Her tuş vuruşunda konsolu dolduran `resize_window` ve `window.set_size` çağrıları optimize edildi; React tarafında `currentWindowHeightRef` / `applyWindowHeight` getirilerek gereksiz IPC engellendi, Rust tarafında yalnızca gerçek boyut değişikliklerinde tek log yazacak akıllı kontrol eklendi.
  - 📄 `src/App.tsx : 530-555, 635-655, 1080-1090`
  - 📄 `src-tauri/src/lib.rs : 370-395`
  - 📄 `src/App.tsx : 145-175, 305-355`
  - 📄 `src/index.css : 595-690`
- [x] **[2026-09-16 08:08]** Ayarlar penceresi 850x950px boyutlarına genişletildi; tray ve açılış merkezleme koordinatları senkronize edildi.
- [x] **[2026-09-16 08:00]** Ayarlar penceresi 680x740px boyutlarına güncellendi.
- [x] **[2026-09-16 07:51]** Ayarlar penceresi 580x640px ferahlatması, sistem bölümü 3 kolonlu ızgara.
- [x] **[2026-09-16 07:38]** Gerçek spotlight boyutlandırması (720x200), durum çubuğu görünürlüğü.
- [x] **[2026-09-16 07:30]** Pencere boyutu ferah 680x150px'e genişletildi; GTK üzerinde dinamik pencere boyutlandırma için `resizable: true` yapıldı; slash menüsü (`/`) açıldığında pencerenin otomatik olarak aşağıya doğru genişlemesi (`resizeForSlash`), menünün tam genişlikte (`right: 0`) opak arka planla açılması ve durum çubuğuyla ("Hazır") çakışmasının engellenmesi sağlandı.
  - 📄 `src/App.tsx : 465-490, 1430-1445`
  - 📄 `src/index.css : 220-250`
  - 📄 `src-tauri/tauri.conf.json : 15-25`
  - 📄 `src-tauri/src/lib.rs : 325-335`
- [x] **[2026-09-16 07:05]** KWin XWayland 1.75x ölçek dönüşümü çözüldü, pencere KWin üzerinde x=757.14, y=522.28, w=680 olarak kesin merkezlendi; dinamik CSS zoom ve ilk açılış tetiklemesi eklendi.
- [x] **[2026-09-16 06:48]** Pencere boyutları 680x190px'e genişletildi (CSS ve App.tsx), Tauri'nin hatalı window.center() çağrısı kaldırılarak aktif ekran geometrisine göre piksel hassasiyetinde dinamik merkezleme sağlandı.
- [x] **[2026-09-16 06:32]** Pencere ortalanması kesin çözüldü (`GDK_BACKEND=x11` koşulsuz yapıldı), KDE KGlobalAccel `Ctrl+Space` entegre edildi, kalıcı pano hafızası getirildi.

---

## 6. ⏳ Sıradaki Görevler (Roadmap / Backlog)
- [ ] [Kullanıcı doğrulaması / Çalışma zamanı testi (Runtime test)]
- [ ] [İsteğe bağlı Linux paketleme (AppImage veya .deb paketi oluşturma)]

---

## 7. ⚠️ Bilinen Sorunlar ve Teknik Notlar
- KDE Plasma 6'da pencere pozisyonlama X11/XWayland köprüsüyle KWin Scripting üzerinden aktif monitörün geometrisine (`x`, `y`, `width`, `height`) ve KWin XWayland ölçek çarpanına (`Scale=1.75`) göre tam olarak hesaplanmakta ve pencere hem yatayda hem dikeyde milimetrik olarak ekranın tam ortasında (`x=757.14, y=522.28`) 680x190 ebatlarında açılmaktadır.
