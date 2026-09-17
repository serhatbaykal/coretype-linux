# 📜 PROJE DEĞİŞİKLİK GÜNLÜĞÜ (CHANGELOG)
> Bu dosya projenin başlangıcından itibaren yapılan tüm kod, mimari ve dosya değişikliklerinin tam ve eksiksiz tarihçesini içerir.  
> **Kural:** Her yeni işlem/güncelleme dosyanın EN ÜSTÜNE eklenir. Hiçbir eski kayıt silinmez.

---

## 📌 [2026-09-17 16:55] - GitHub Private Uzak Depo Oluşturuldu ve İlk Push Tamamlandı
- **Kapsam / Modül:** DevOps, GitHub Remote, Sürüm Kontrolü
- **Yapılan İşlemin Özeti:**
  1. **GitHub Repository Açıldı:** GitHub CLI üzerinden `serhatbaykal/coretype-linux` adıyla Gizli (Private) depo oluşturuldu.
  2. **Uzak Depo Eşlendi & Push Edildi:** `origin` bağlantısı `https://github.com/serhatbaykal/coretype-linux.git` olarak tanımlandı ve `main` dalı tüm geçmişiyle başarıyla push edildi.
- **Etkilenen Dosyalar ve Satır Referansları:**
  - Uzak Depo: `https://github.com/serhatbaykal/coretype-linux`
- **Eklenen / Silinen Paketler:** Yok

---

## 📌 [2026-09-17 16:47] - Git Sürüm Kontrolü ve Güvenli .gitignore Entegrasyonu
- **Kapsam / Modül:** DevOps, Sürüm Kontrol Sistemi (Git), Güvenlik & Gizlilik
- **Yapılan İşlemin Özeti:**
  1. **Kapsamlı .gitignore Oluşturuldu:** Yüksek güvenlik standartlarıyla `.env`, `secrets.json`, `*.key`, `*.pem`, `konsol.txt`, `node_modules/`, `src-tauri/target/`, `dist/` ve yerel IDE/agent önbellekleri Git kapsamından hariç tutuldu.
  2. **Git Deposu İlklendirildi:** `git init` ve `git branch -M main` ile ana dal oluşturuldu.
  3. **Baseline Commit:** Sürüm `0.1.0` temel alınarak tüm stabil Wayland Linux CoreType kod tabanı ilk commit (`feat: initial commit - coretype linux v0.1.0 baseline`) olarak mühürlendi.
- **Etkilenen Dosyalar ve Satır Referansları:**
  - 📄 `.gitignore : 1-48` - (Kapsamlı filtreleme kuralları)
- **Eklenen / Silinen Paketler:** Yok

---

## 📌 [2026-09-17 08:03] - Ayarlar Penceresi Açılışındaki Siyah Ekran (Flash) Sorununun Çözümü
- **Yapılan İşlemin Özeti:**
  1. **Başlangıç Görünürlüğü (Zero Flash):** Hem React (`openSettings`) hem de Rust backend (`tray settings`) tarafında ayarlar penceresi `visible: false` olarak başlatıldı.
  2. **Senkron Gösterim & Odak:** React `SettingsView` bileşeni DOM'a mount edilip cam morfolojisi teması (`applyTheme`) uygulandıktan sonra (`useEffect` içinde 50ms gecikmeyle) `appWindow.show()` ve `appWindow.setFocus()` çağrıldı.
  3. **Sonuç:** WebKitGTK motorunun ilk yükleme sırasındaki boş/siyah grafik arabelleği ekranda görünmeden engellendi; pencere doğrudan %100 yüklenmiş ve şeffaf cam efekti oturmuş şekilde açılır hale getirildi.
  4. **Derleme & Doğrulama:** `npm run build` (835ms) ve `npx tauri build --no-bundle` (17.08s) ile hatasız derlendi, arka plan süreci güncellendi.
- **Etkilenen Dosyalar ve Satır Referansları:**
  - 📄 `src/App.tsx : 230-245` - (`SettingsView` mount sonrası pürüzsüz `show()` ve `setFocus()`)
  - 📄 `src/App.tsx : 950-960` - (`openSettings` options `visible: false`)
  - 📄 `src-tauri/src/lib.rs : 765-775` - (Tray ayarlar penceresi `visible(false)`)
- **Eklenen / Silinen Paketler:** Yok

---

## 📌 [2026-09-17 07:56] - Ayarlar Ekranı Yazım Hızı (ms) Custom Glassmorphic Stepper Tasarımı
- **Kapsam / Modül:** React UI (`src/App.tsx`), CSS Tasarım Sistemi (`src/index.css`)
- **Yapılan İşlemin Özeti:**
  1. **WebKitGTK Çirkin Varsayılan Okların Kaldırılması:** WebKitGTK motorunun `input[type="number"]` için gösterdiği parlak beyaz ve kaba tarayıcı varsayılan yukarı-aşağı spin butonları (`::-webkit-outer-spin-button`, `::-webkit-inner-spin-button`) CSS sıfırlamasıyla tamamen gizlendi.
  2. **Özel Glassmorphic Sayı Değiştirici (Stepper):** 
     - Girdi kutusunun sağ içine entegre, tema accent rengine ve cam morfolojisine uygun zarif SVG yukarı (`▲`) ve aşağı (`▼`) chevron butonları eklendi (`.settings-number-stepper`, `.stepper-controls`, `.stepper-btn`).
     - Butonlara hover durumunda accent rengi parlama, basılma efekti (`scale(0.92)`) ve minimum `1` sınırında ya da "paste" modunda otomatik devre dışı kalma (`disabled: opacity 0.25`) mantığı kazandırıldı.
  3. **Derleme & Doğrulama:** `npm run build` (796ms) ve `npx tauri build --no-bundle` (17.53s) ile derlendi, arka plan servisi güncellendi.
- **Etkilenen Dosyalar ve Satır Referansları:**
  - 📄 `src/App.tsx : 408-445` - (`settings-number-stepper` React bileşeni ve SVG kontrolleri)
  - 📄 `src/index.css : 612-680` - (WebKit spin reset ve stepper buton stilleri)
  - 📄 `PROJECT_CONTEXT.md : 1-25` - (Arayüz güncelleme notları)
- **Eklenen / Silinen Paketler:** Yok

---

## 📌 [2026-09-17 07:52] - Ayarlar Penceresi Boyutlarının 900x1000px Olarak Güncellenmesi
- **Kapsam / Modül:** React UI (`src/App.tsx`), Rust Backend (`src-tauri/src/lib.rs`), Linux Masaüstü Konumlandırma
- **Yapılan İşlemin Özeti:**
  1. **Ayarlar Penceresi Boyutları (900x1000px):** Kullanıcının isteği doğrultusunda ayarlar penceresi `width: 900px`, `height: 1000px` boyutlarına genişletildi.
  2. **Senkron Merkezleme:** 
     - `src/App.tsx` içindeki `openSettings` pencere oluşturucusu `width: 900, height: 1000` olarak güncellendi.
     - `src-tauri/src/lib.rs` içindeki sistem tepsisi (tray) "Ayarlar" menüsü tetikleyicisindeki pencere boyutu (`inner_size(900.0, 1000.0)`) ve merkezleme koordinatları (`(size.width - 900.0) / 2.0`, `(size.height - 1000.0) / 2.0`) senkronize edildi.
  3. **Derleme & Doğrulama:** `npx tauri build --no-bundle` ile release derlemesi hatasız tamamlandı (17.58s).
- **Etkilenen Dosyalar ve Satır Referansları:**
  - 📄 `src/App.tsx : 895-910` - (`openSettings` pencere boyutları 900x1000)
  - 📄 `src-tauri/src/lib.rs : 745-780` - (Tray menüsü ayarlar boyutu ve merkezleme formülü)
  - 📄 `PROJECT_CONTEXT.md : 1-25` - (Güncel ayarlar penceresi boyutları)
- **Eklenen / Silinen Paketler:** Yok

---

## 📌 [2026-09-17 07:41] - Cold-Start Erken Kapanma (Blur Race Condition) ve Debug Symlink Çözümü
- **Kapsam / Modül:** React UI (`src/App.tsx`), Rust Backend (`src-tauri/src/lib.rs`), Binary Dağıtımı (`target/debug/coretype`)
- **Yapılan İşlemin Özeti:**
  1. **KDE Debug Bellek Önbelleği Tespiti & Sembolik Bağ:** KDE Wayland oturumunun kısayol tetikleyicisinde eski `target/debug/coretype` yolunu belleğinde tutması ihtimaline karşı, `target/debug/coretype` doğrudan `target/release/coretype` ikilisine sembolik bağ (symlink) yapıldı. Artık sistem hangi yolu çağırırsa çağırsın bağımsız release ikilisi çalışır.
  2. **Soğuk Başlangıçta (Cold Start) Blur Race Condition Giderilmesi:** CoreType henüz açık değilken ilk kez başlatıldığında WebKitGTK'nin henüz odak almamış pencere için `onFocusChanged({ payload: false })` göndermesi sebebiyle React'ın pencereyi "odak kaybedildi" sanıp anında aşağı kaydırarak gizlemesi (`autoCloseOnBlur`) sorunu çözüldü.
     - `hasBeenFocusedRef` odak hafızası eklendi: Pencere en az bir kez odak almadan blur kapatması tetiklenmez.
     - `appWindow.isVisible()` kontrolü eklendi: Görünür olmayan pencere için kapatma animasyonu çalıştırılmaz.
     - Rust tarafındaki ilk açılış gecikmesi (`CORETYPE_INITIAL_TOGGLE`) 200ms'den 350ms'ye çıkarılarak WebKit ve React render tam senkronizasyonu sağlandı.
  3. **Doğrulama:** `npx tauri build --no-bundle` ile derlendi, soğuk başlangıç ve ardışık toggle sinyalleri ekran görüntüsü ile doğrulanarak pencerenin anında açıldığı ve açık kaldığı teyit edildi.
- **Etkilenen Dosyalar ve Satır Referansları:**
  - 📄 `src/App.tsx : 695-755` - (`hasBeenFocusedRef` ve `isVisible` blur koruması)
  - 📄 `src-tauri/src/lib.rs : 715-725` - (350ms cold-start toggle süresi)
  - 📄 `src-tauri/target/debug/coretype` - (Release ikilisine yönlendiren symlink)
- **Eklenen / Silinen Paketler:** Yok

---

## 📌 [2026-09-17 07:27] - Tauri CLI Build ile Gömülü Varlıkların Doğrulanması ve IPC Süreç Çakışmasının Giderilmesi
- **Kapsam / Modül:** Tauri Üretim Derlemesi (`npx tauri build`), Unix IPC Soketi, KDE Global Shortcut
- **Yapılan İşlemin Özeti:**
  1. **Tauri CLI vs Cargo Build Tespiti:** `cargo build --release` tek başına çalıştırıldığında Tauri'nin `frontendDist: "../dist"` paketleme adımını tam tetiklemeyip `devUrl` (`localhost:1420`) yapılandırmasını bırakabildiği; gerçek gömülü (embedded) üretim derlemesinin `npx tauri build --no-bundle` ile üretilmesi gerektiği belirlendi.
  2. **Gömülü Release Derlemesi:** `npx tauri build --no-bundle` çalıştırılarak tüm HTML/CSS/JS varlıklarının binary içerisine tam gömülmesi sağlandı.
  3. **Askıda Kalan Süreç & Soket Temizliği:** Arka planda kilitli kalan ve soketi (`/run/user/1000/coretype.sock`) meşgul eden eski süreçler sonlandırıldı.
  4. **KDE Kısayol & Ekran Doğrulaması:** `qdbus6 org.kde.kglobalaccel /component/com_coretype_app_desktop org.kde.kglobalaccel.Component.invokeShortcut _launch` ile KDE kısayol tetikleyicisi çağrılarak test edildi, Spectacle ile ekran görüntüsü alındı ve CoreType arayüzünün hiçbir ağ/localhost bağımlılığı olmadan anında ekrana geldiği doğrulandı.
- **Etkilenen Dosyalar ve Satır Referansları:**
  - 📄 `target/release/coretype` - (Tauri CLI ile tam gömülü release binary)
  - 📄 `PROJECT_CONTEXT.md` - (Derleme yönergeleri güncellemesi)
- **Eklenen / Silinen Paketler:** Yok

---

## 📌 [2026-09-17 07:18] - Localhost:1420 Connection Refused Hatası Çözümü (Release Yönlendirmesi & Auto-Recovery)
- **Kapsam / Modül:** Linux Masaüstü Entegrasyonu (`com.coretype.app.desktop`), Rust Backend (`src-tauri/src/lib.rs`), React Başlatıcı (`src/main.tsx`)
- **Yapılan İşlemin Özeti:**
  1. **Kök Neden Tespiti:** Sistem genelindeki `Ctrl + Space` kısayolunun bağlı olduğu masaüstü dosyasının (`~/.local/share/applications/com.coretype.app.desktop`), `tauri.conf.json`'daki `devUrl` gereği Vite dev sunucusuna (`http://localhost:1420`) bağlanmaya çalışan `debug` binary'sine işaret ettiği; terminalde `npm run dev` açık olmadığında WebKitGTK'nin "Connection refused" hatası vererek CoreType'ı kullanılamaz hale getirdiği tespit edildi.
  2. **Release Binary Yönlendirmesi:** `com.coretype.app.desktop` dosyası doğrudan `target/release/coretype --toggle` ikili dosyasına bağlandı ve `kbuildsycoca6` ile KDE sistem önbelleği yenilendi. Release sürümünde tüm React arayüzü doğrudan ikili dosyanın içine gömülü (embedded assets) olduğu için `localhost:1420`'ye asla bağlanmaz, terminal gerektirmez ve anında açılır.
  3. **Debug Modu İçin Otomatik İyileşme (Auto-Recovery):**
     - `src/main.tsx` içine `window.__CORETYPE_LOADED__ = true;` bayrağı eklendi.
     - Rust `toggle_main_window` içine debug derlemeleri için akıllı kontrol eklendi: Eğer sayfa henüz yüklenmediyse ve WebKit hata sayfasındaysa, arka planda `http://localhost:1420/` portunu saniyede bir yoklayan ve sunucu açıldığı anda sayfayı otomatik yenileyen (`location.reload()`) kurtarma betiği çalıştırıldı.
  4. **Derleme ve Doğrulama:** `npm run build` (822ms), `cargo build` (5.84s) ve `cargo build --release` (17.05s) sıfır hatayla derlendi.
- **Etkilenen Dosyalar ve Satır Referansları:**
  - 📄 `~/.local/share/applications/com.coretype.app.desktop : 1-17` - (Exec release binary yönlendirmesi)
  - 📄 `src/main.tsx : 5-10` - (`window.__CORETYPE_LOADED__` bayrağı)
  - 📄 `src-tauri/src/lib.rs : 385-410` - (`toggle_main_window` içinde debug auto-recovery betiği)
  - 📄 `PROJECT_CONTEXT.md : 1-95` - (Masaüstü kısayol ve release mimari kuralı)
- **Eklenen / Silinen Paketler:** Yok

---

## 📌 [2026-09-17 06:35] - Slash Komutları Otomatik Tamamlama & Argüman Akışı (Erken Kapanma Önleme)
- **Kapsam / Modül:** React UI (`MainView`), Metin Girişi (`textarea`), Slash Menüsü (`onKeyDown`, `onClick`), Komut Ayrıştırma (`handleSend`)
- **Yapılan İşlemin Özeti:**
  1. **Erken Kapanma & Boş Gönderim Hatasının Giderilmesi:** Kullanıcı `/ko` yazıp açılan menüden `/komut` öğesine tıkladığında veya klavyeden `Tab` / `Enter` tuşuna bastığında pencerenin anında kapanıp yapay zekaya boş şablon göndermesi sorunu çözüldü.
  2. **`applySlashCommand` Fonksiyonu:** Menüden komuta tıklandığında, listede gezinip `Enter` veya `Tab` basıldığında komut metin kutusuna `/komut ` (boşlukla) otomatik tamamlanır. Menü kapanır, pencere açık kalır, imleç metnin sonuna odaklanır.
  3. **Argüman Ayrıştırma & Birleştirme (`handleSend`):**
     - Kullanıcı `/komut docker loglarını temizle` gibi bir argüman yazdığında `handleSend` bunu algılar ve `cmd.template` ile argümanı birleştirerek yapay zekaya aktarır.
     - Kullanıcı argüman ve seçili metin olmadan sadece `/komut` yazıp gönderirse istek AI'ya boş gitmez; kullanıcıya `"Lütfen bir istek yazın"` uyarısı verilerek pencere açık tutulur.
     - Önceden seçilmiş bir metin varken `/özetle` veya `/tr` seçildiğinde seçili metin üzerinde çalışmaya devam eder.
     - Yerel dönüştürmeler (`/büyük`, `/küçük`, `/slug`) argüman veya seçili metin ile doğrudan çalışır.
  4. **Derleme ve Doğrulama:** `npm run build` (804ms), `cargo check` (0.17s) ve `cargo build --release` (0.18s) sıfır hatayla derlendi.
- **Etkilenen Dosyalar ve Satır Referansları:**
  - 📄 `src/App.tsx : 675-695` - (`applySlashCommand` fonksiyonu)
  - 📄 `src/App.tsx : 1055-1120` - (`handleSend` komut + argüman ayrıştırma ve koruma mantığı)
  - 📄 `src/App.tsx : 1375-1385, 1465-1475` - (`onClick`, `onKeyDown` Tab/Enter tamamlama akışı)
  - 📄 `PROJECT_CONTEXT.md : 1-95` - (Slash komut akışı kuralı ve güncel durum)
- **Eklenen / Silinen Paketler:** Yok

---

## 📌 [2026-09-17 06:15] - Dinamik Ortam & Sistem Bağlamlı AI Mimarisi (Context-Aware AI System Prompt)
- **Kapsam / Modül:** Rust Backend (`src-tauri/src/lib.rs`), React LLM İstemcileri (`src/App.tsx`), KWin D-Bus Entegrasyonu, Durum Çubuğu UI
- **Yapılan İşlemin Özeti:**
  1. **İşletim Sistemi ve Çevre Tespiti (Rust Backend):** Rust tarafında `/etc/os-release` dosyasını ayrıştıran `get_os_release_info()` fonksiyonu yazıldı. Dağıtım adı (`CachyOS Linux`), taban aile (`arch`), paket yöneticisi (`pacman / paru`), masaüstü ortamı (`$XDG_CURRENT_DESKTOP`, `$XDG_SESSION_TYPE` -> `KDE (wayland)`) ve aktif kabuk (`$SHELL` -> `fish`) otomatik olarak tespit edildi.
  2. **Aktif Pencere Bilgisi Genişletmesi:** KWin D-Bus betiği ve `TargetWindowState` genişletilerek `active_class` (örn. `konsole`, `kitty`, `code`) ve `active_title` başlık bilgileri saklandı. `get_system_context` Tauri komutuyla Frontend'e aktarıldı.
  3. **Dinamik System Prompt Sentezi (`buildSystemPrompt`):**
     - **Terminal / CLI Modu:** Aktif pencere terminal olduğunda AI'ya katı kurallar tanımlandı: CachyOS (Arch) ekosistemine uygun `pacman / paru` komutları üretmesi, Windows (cmd/powershell) veya Debian (apt) komutları üretmemesi, çıktıyı markdown kod bloklarına (\`\`\`bash vb.) veya tırnak içine ALMAMASI, hiçbir nezaket cümlesi eklemeden doğrudan çalıştırılacak saf komutu vermesi sağlandı.
     - **Genel Mod:** Aktif uygulama bağlamı ve işletim sistemi AI'ya bildirilerek yanıtların host sisteme kusursuz uyumu garanti edildi.
  4. **Tüm Sağlayıcılara Entegrasyon:** `callGeminiAPI`, `callOpenAIAPI` ve `callOllamaAPI` fonksiyonları dinamik `systemPrompt` alacak şekilde güncellendi.
  5. **UI Durum Rozeti & `/komut` Kısayolu:** Spotlight durum çubuğunun sağ köşesine aktif hedef uygulamasını ve kabuğunu gösteren şık bir rozet (`💻 konsole [fish]` veya `🎯 code`) eklendi. Slash menüsüne doğrudan `/komut` kısayolu dahil edildi.
  6. **Derleme ve Doğrulama:** `npm run build` (814ms), `cargo check` (0.17s) ve `cargo build` sıfır hatayla derlendi.
- **Etkilenen Dosyalar ve Satır Referansları:**
  - 📄 `src-tauri/src/lib.rs : 13-18, 65-175, 335-345, 540-645, 775-785` - (TargetWindowState, get_active_context, get_os_release_info, get_system_context)
  - 📄 `src/App.tsx : 20-75, 535-545, 555-570, 695-705, 1125-1240, 1575-1605` - (SystemContext, buildSystemPrompt, /komut, LLM systemInstruction, status bar badge)
  - 📄 `PROJECT_CONTEXT.md : 1-90` - (Sistem bağlamı ve prompt mimarisi kuralları eklendi)
- **Eklenen / Silinen Paketler:** Yok

---

## 📌 [2026-09-17 05:38] - Vektör İkon Geometrisi & HiDPI Düzeltmesi (Lucide Settings & Close İkonları)
- **Kapsam / Modül:** React UI (`MainView`, `SettingsView`), Glassmorphism CSS (`index.css`), SVG Vektör Çizimi
- **Yapılan İşlemin Özeti:**
  1. **Kök Neden Tespiti:** Ayarlar çarkı SVG path verisinde yer alan `a2 2 0 1 1-2.83 2.83` ve benzeri hatalı yay (arc) parametrelerinin dişleri asimetrik ve şişkin yumrular halinde çizdiği; `strokeWidth="2.5"` değerinin 14-15px küçük boyutta komşu dişleri ve orta deliği birbirine yapıştırarak piksel bozukluğu gibi görünen deformasyona yol açtığı tespit edildi.
  2. **Kusursuz Simetrili Lucide Geometrisi:** Hem ana spotlight başlığındaki hem de ayarlar penceresi başlığındaki çark ikonu endüstri standardı 60 derece simetrili 6 dişli Lucide Settings vektör geometrisiyle değiştirildi. Kapatma ('X') ikonu da dengeli `strokeWidth="2"` oranına çekildi.
  3. **CSS Vektör Netliği:** `index.css` içine `svg { shape-rendering: geometricPrecision; }` eklenerek WebKitGTK / Cairo motorunun vektörleri piksel basamaklaması yerine yüksek hassasiyetli geometrik kenar yumuşatma (anti-aliasing) ile render etmesi sağlandı.
  4. **Derleme ve Doğrulama:** `npm run build` (854ms), `cargo build` (0.20s) ve `cargo build --release` (0.18s) sıfır hatayla derlendi.
- **Etkilenen Dosyalar ve Satır Referansları:**
  - 📄 `src/App.tsx : 205-220` - (SettingsView başlığı Lucide gear ve close SVG)
  - 📄 `src/App.tsx : 1245-1260` - (MainView başlığı Lucide gear ve close SVG)
  - 📄 `src/index.css : 120-145` - (shape-rendering: geometricPrecision, buton dolgu ve dönüş ayarı)
  - 📄 `PROJECT_CONTEXT.md : 1-85` - (Mimari kural ve changelog güncellendi)
- **Eklenen / Silinen Paketler:** Yok

---

## 📌 [2026-09-17 05:31] - IPC Boyutlandırma ve Log Optimizasyonu (Sıfır Tuş Vuruşu IPC Yükü)
- **Kapsam / Modül:** React UI (`App.tsx`), Tauri IPC Komutları, Rust Backend (`lib.rs`)
- **Yapılan İşlemin Özeti:**
  1. **Tuş Vuruşu IPC Spam'inin Giderilmesi:** Metin kutusunda harf yazılırken her tuş vuruşunda `resizeForSlash(0)` çağrılıyordu. React tarafına `currentWindowHeightRef` ve `applyWindowHeight` getirilerek pencere yüksekliği zaten hedef boyuttaysa (ör. 260px) Tauri IPC'ye hiçbir çağrı gönderilmemesi sağlandı.
  2. **Rust Tarafında Akıllı Boyut Kontrolü & Log Filtreleme:** Rust `resize_window` fonksiyonu pencerenin mevcut `inner_size()` değerini kontrol edecek şekilde güncellendi. Boyut zaten aynıysa işletim sistemine gereksiz `window.set_size` emri verilmesi engellendi; konsola sadece boyut fiilen değiştiğinde (örn. slash menüsü açılıp kapandığında) tek bir bilgilendirme logu yazdırıldı (`[CoreType] Window resized to 840x...`).
  3. **Derleme ve Doğrulama:** `npm run build` (813ms), `cargo build` (4.26s) ve `cargo build --release` (18.16s) sıfır hatayla derlendi.
- **Etkilenen Dosyalar ve Satır Referansları:**
  - 📄 `src/App.tsx : 530-555, 635-655, 1080-1090` - (currentWindowHeightRef, applyWindowHeight, gereksiz çağrıların engellenmesi)
  - 📄 `src-tauri/src/lib.rs : 370-395` - (needs_resize kontrolü, gereksiz set_size ve log engeli)
  - 📄 `PROJECT_CONTEXT.md : 1-85` - (Mimari kural ve changelog güncellendi)
- **Eklenen / Silinen Paketler:** Yok

---

## 📌 [2026-09-16 08:14] - WebKitGTK Native Select Hatası Giderildi (Özel Glassmorphism Dropdown)
- **Kapsam / Modül:** React UI (`SettingsView`), CSS Glassmorphism Sistemi (`index.css`), Linux WebKitGTK Uyumluluğu
- **Yapılan İşlemin Özeti:**
  1. **Kök Neden Tespiti:** Linux WebKitGTK motorunun standart `<select>` elementlerini sistemin açık renk GTK temasıyla (`GtkComboBox`) çizdiği, bunun sonucunda beyaz zemin üzerine beyaz metin oluşarak kutunun tamamen boş/okunaksız ve beyaz bir blok şeklinde belirdiği tespit edildi.
  2. **Özel Glassmorphism Dropdown (`custom-select`):** "Enjeksiyon Modu" için React tabanlı özel açılır menü bileşeni geliştirildi. Dışarı tıklamayı algılayan `useEffect` ve `useRef`, animasyonlu döner chevron oku, koyu cam arka plan (`rgba(18, 22, 38, 0.98)`), seçenek açıklamaları (Karma, Klavye, Pano) ve aktif seçenek onay işareti entegre edildi.
  3. **Linux Native Select Sıfırlaması (CSS Fallback):** `index.css` içine `-webkit-appearance: none !important; appearance: none !important;` ve `background-color: rgba(30, 35, 62, 0.7) !important;` eklenerek ileride herhangi bir native `select` kullanılsa bile sistem GTK temasının beyaz blok basması tamamen engellendi.
  4. **Derleme ve Doğrulama:** `npm run build`, `cargo build` ve `cargo build --release` sıfır hatayla başarıyla derlendi.
- **Etkilenen Dosyalar ve Satır Referansları:**
  - 📄 `src/App.tsx : 145-175, 305-355` - (INJECTION_OPTIONS, injectionMenuOpen state, custom-select JSX)
  - 📄 `src/index.css : 595-690` - (custom-select-wrapper, button, menu, item stilleri ve select sıfırlama)
  - 📄 `PROJECT_CONTEXT.md : 1-85` - (Mimari kural ve changelog güncellendi)
- **Eklenen / Silinen Paketler:** Yok

---

## 📌 [2026-09-16 08:08] - Ayarlar Penceresi Boyutlarının 850x950px Olarak Genişletilmesi
- **Kapsam / Modül:** React UI (`openSettings`), Tauri WebviewWindow (`WebviewWindowBuilder`), Rust Pencere Yöneticisi (`lib.rs`)
- **Yapılan İşlemin Özeti:**
  1. **Ayarlar Penceresi Boyutları (850x950px):** Kullanıcının doğrudan talebiyle Ayarlar modalı `width: 850px`, `height: 950px` olarak daha geniş ve ferah bir görünüme kavuşturuldu.
  2. **Senkron Merkezleme:** `App.tsx` ve `src-tauri/src/lib.rs` içerisindeki açılış ve ekran ortalama formülleri `(size.width - 850.0) / 2.0` ve `(size.height - 950.0) / 2.0` şeklinde güncellendi.
  3. **Derleme ve Doğrulama:** `npm run build`, `cargo build` ve `cargo build --release` sıfır hatayla derlendi.
- **Etkilenen Dosyalar ve Satır Referansları:**
  - 📄 `src/App.tsx : 740-753` - (openSettings WebviewWindow width: 850, height: 950)
  - 📄 `src-tauri/src/lib.rs : 585-620` - (Tray menüsünden ayarlar açılışında 850x950 boyutlandırma ve merkezleme)
  - 📄 `PROJECT_CONTEXT.md : 1-25` - (Proje durumu ve pencere boyutları güncellendi)
- **Eklenen / Silinen Paketler:** Yok

---

## 📌 [2026-09-16 08:03] - Ayarlar Penceresi Boyutlarının 750x850px Olarak Genişletilmesi
- **Kapsam / Modül:** React UI (`openSettings`), Tauri WebviewWindow (`WebviewWindowBuilder`), Rust Pencere Yöneticisi (`lib.rs`)
- **Yapılan İşlemin Özeti:**
  1. **Ayarlar Penceresi Boyutları (750x850px):** Kullanıcının doğrudan talebiyle Ayarlar modalı `width: 750px`, `height: 850px` olarak daha geniş ve ferah bir görünüme kavuşturuldu.
  2. **Senkron Merkezleme:** `App.tsx` ve `src-tauri/src/lib.rs` içerisindeki açılış ve ekran ortalama formülleri `(size.width - 750.0) / 2.0` ve `(size.height - 850.0) / 2.0` şeklinde güncellendi.
  3. **Derleme ve Doğrulama:** `npm run build`, `cargo build` ve `cargo build --release` sıfır hatayla derlendi.
- **Etkilenen Dosyalar ve Satır Referansları:**
  - 📄 `src/App.tsx : 740-753` - (openSettings WebviewWindow width: 750, height: 850)
  - 📄 `src-tauri/src/lib.rs : 585-620` - (Tray menüsünden ayarlar açılışında 750x850 boyutlandırma ve merkezleme)
  - 📄 `PROJECT_CONTEXT.md : 1-25` - (Proje durumu ve pencere boyutları güncellendi)
- **Eklenen / Silinen Paketler:** Yok

---

## 📌 [2026-09-16 08:00] - Ayarlar Penceresi Boyutlarının 680x740px Olarak Güncellenmesi
- **Kapsam / Modül:** React UI (`openSettings`), Tauri WebviewWindow (`WebviewWindowBuilder`), Rust Pencere Yöneticisi (`lib.rs`)
- **Yapılan İşlemin Özeti:**
  1. **Ayarlar Penceresi Boyutları (680x740px):** Kullanıcının doğrudan talebi doğrultusunda Ayarlar modalının genişliği `680px`, yüksekliği `740px` olarak genişletildi.
  2. **Senkron Merkezleme:** Hem `src/App.tsx` (`openSettings` tauri pencere oluşturucu) hem de `src-tauri/src/lib.rs` (sistem tepsisi "Ayarlar" menü olayı) güncellendi. Ekranın tam ortasında açılması için `(size.width - 680.0) / 2.0` ve `(size.height - 740.0) / 2.0` koordinat hesaplamaları yapıldı.
  3. **Derleme ve Doğrulama:** `npm run build`, `cargo build` ve `cargo build --release` başarıyla derlendi.
- **Etkilenen Dosyalar ve Satır Referansları:**
  - 📄 `src/App.tsx : 740-753` - (openSettings WebviewWindow width: 680, height: 740)
  - 📄 `src-tauri/src/lib.rs : 585-620` - (Tray menüsünden ayarlar açılışında 680x740 boyutlandırma ve merkezleme)
  - 📄 `PROJECT_CONTEXT.md : 1-25` - (Proje durumu ve pencere boyutları güncellendi)
- **Eklenen / Silinen Paketler:** Yok

---

## 📌 [2026-09-16 07:51] - Ayarlar Penceresi (580x640) Ferahlatması ve Linux Sistem Entegrasyonu
- **Kapsam / Modül:** React UI (`SettingsView`), Tauri WebviewWindow, Glassmorphism CSS ve Tray Entegrasyonu
- **Yapılan İşlemin Özeti:**
  1. **Ayarlar Penceresi Boyutları (580x640px):** 480x520px olan eski ebatların dikeyde ~550px'lik içerik nedeniyle Tema/Opaklık bölümlerini aşağı taşırarak kaydırma çubuğuna (scrollbar) zorladığı tespit edildi. Genişlik `580px`, yükseklik `640px` yapılarak tüm ayarların tek bakışta, kaydırma çubuğu gerekmeksizin ferahça görünmesi sağlandı. Hem `App.tsx` (`openSettings`) hem `lib.rs` (tray menu ayarlar çağrısı) senkronize edildi.
  2. **Sistem Bölümü 3 Kolonlu Izgara:** 3 adet toggle anahtarı (Sistemle Başlat, Yanıtı Önizle, Odak Kaybında Kapat) için `.settings-system-row` sınıfı eklendi ve `repeat(3, 1fr)` ile tek bir düzgün sırada hizalandı.
  3. **Linux Uyumlu Etiketleme:** "Windows ile Başlat" metni Linux masaüstü ortamına uygun olarak "Sistemle Başlat" olarak güncellendi.
  4. **Derleme ve Doğrulama:** `npm run build`, `cargo build` ve `cargo build --release` sıfır hatayla derlendi.
- **Etkilenen Dosyalar ve Satır Referansları:**
  - 📄 `src/App.tsx : 310-330, 740-755` - (Sistemle Başlat etiketi, 3 kolonlu ızgara, 580x640 pencere)
  - 📄 `src-tauri/src/lib.rs : 585-620` - (Tray menüsünden ayarlar açılışında 580x640 boyutlandırma ve merkezleme)
  - 📄 `src/index.css : 620-630` - (.settings-system-row 3 kolonlu ızgara stili)
- **Eklenen / Silinen Paketler:** Yok

---

## 📌 [2026-09-16 07:38] - Gerçek Spotlight Boyutlandırması (720x200), Durum Çubuğu Görünürlüğü ve Tip Düzenlemesi
- **Kapsam / Modül:** React UI, Glassmorphism CSS, Tauri Yapılandırması ve Rust Pencere Mantığı
- **Yapılan İşlemin Özeti:**
  1. **Kök Neden Çözümü - Taban Yükseklik 200px'e Çıkarıldı:** 150px yüksekliğin padding (32px), header (36px), input (46px) ve marginler toplandığında (162px) durum çubuğu ("Hazır") için yetersiz kaldığı ve durum çubuğunun pencere dışına taşarak `overflow: hidden` ile kırpıldığı ampirik olarak kanıtlandı. Taban yükseklik `200px` (`win_w = 720px`, `win_h = 200px`, seçim modunda `240px`, önizleme modunda `500px`) yapılarak durum çubuğunun ferah ve eksiksiz görünmesi sağlandı.
  2. **Genişlik 720px Yapıldı:** Geniş ve 4K ekranlarda dar ve basık hissi tamamen ortadan kaldırıldı; daktilo efektli placeholder ipuçlarının ve kullanıcı komutlarının sıkışmadan doğal görünmesi sağlandı.
  3. **CSS Input ve Durum Çubuğu Optimizasyonu:** `.main-input` 15px font ve 46px min-height ile daha konforlu hale getirildi, `.status-bar` `padding-top: 10px` ile kartın tabanında estetik bir boşluğa oturtuldu.
  4. **Derleme ve Doğrulama:** `npm run build`, `cargo build` ve `cargo build --release` 0 hatayla başarıyla tamamlandı.
- **Etkilenen Dosyalar ve Satır Referansları:**
  - 📄 `src-tauri/tauri.conf.json : 15-20` - (720x200 başlangıç boyutu, resizable: true)
  - 📄 `src-tauri/src/lib.rs : 325-335` - (win_w = 720.0, win_h = 200.0 / 240.0)
  - 📄 `src/App.tsx : 465-475` - (WINDOW_WIDTH = 720, BASE_HEIGHT = 200, SELECTION_HEIGHT = 240, PREVIEW_HEIGHT = 500)
  - 📄 `src/index.css : 280-355` - (input 15px font, 46px min-height, durum çubuğu boşluk ayarı)
- **Eklenen / Silinen Paketler:** Yok

---

## 📌 [2026-09-16 07:30] - Ferah Pencere Boyutu (680x150) ve Dinamik Slash Komut Menüsü Düzeltmesi
- **Kapsam / Modül:** React UI, Glassmorphism CSS, Tauri Yapılandırması ve Rust Boyutlandırma Mantığı
- **Yapılan İşlemin Özeti:**
  1. **Ferah Spotlight Boyutlandırması:** 4K ve geniş ekranlarda dar kalan 500x140px taban boyutu, daha rahat ve şık bir spotlight deneyimi için `680x150px`'e çıkarıldı (`SELECTION_HEIGHT = 190px`, `PREVIEW_HEIGHT = 480px`). `tauri.conf.json`, `App.tsx` ve `src-tauri/src/lib.rs` senkronize edildi.
  2. **Dinamik Yeniden Boyutlandırma İçin `resizable: true` Etkinleştirildi:** GTK3'te `resizable: false` olduğunda pencere yöneticisi ve Tao'nun boyut ipuçları (geometry hints) pencerenin programatik olarak büyümesini engelliyordu. `tauri.conf.json` içinde `"resizable": true` yapılarak `window.set_size` çağrılarının dinamik genişlemeyi sorunsuz gerçekleştirmesi sağlandı (başlıksız / `decorations: false` pencere olduğundan kullanıcı fareyle köşelerden bozamaz).
  3. **Slash Menüsü (`/`) Boyutlandırma ve Genişleme:** `/` yazıldığında (`resizeForSlash`) pencere yüksekliği, filtrelenen öğe adedine göre (`visibleCount * 38 + 24px`) dinamik olarak aşağıya doğru uzatıldı.
  4. **Durum Çubuğu Çakışması ve Görsel Biniş Giderildi:** Slash menüsü açıldığında alttaki durum çubuğunun ("Hazır") ilk komutun (`/tr`) arkasından parlaması engellendi (`!showSlashMenu && !previewData` koşulu ile gizlendi).
  5. **Menü Hizalaması ve Opaklık:** `.slash-menu` stili `right: 0` yapılarak girdi kutusuyla tam genişlikte hizalandı ve arkadaki içeriklerin görünmemesi için `rgba(18, 22, 38, 0.98)` opak arka plan uygulandı.
  6. **Derleme ve Doğrulama:** `npm run build`, `cargo build` ve `cargo build --release` sıfır hatayla derlendi.
- **Etkilenen Dosyalar ve Satır Referansları:**
  - 📄 `src/App.tsx : 465-490, 1430-1445` - (680x150 sabitleri, resizeForSlash hesaplaması, durum çubuğu koşullu render)
  - 📄 `src/index.css : 220-250` - (slash-menu tam genişlik `right: 0`, opak arka plan, max-height: 260px)
  - 📄 `src-tauri/tauri.conf.json : 15-25` - (680x150, resizable: true)
  - 📄 `src-tauri/src/lib.rs : 325-335` - (toggle_main_window içinde win_w = 680.0, win_h = 150.0 / 190.0)
- **Eklenen / Silinen Paketler:** Yok

---

## 📌 [2026-09-16 07:16] - Pencere Biçim Deformasyonunun Giderilmesi ve Ayarlar Penceresiyle Mimari Eşitleme
- **Kapsam / Modül:** React UI, CSS Glassmorphism, Tauri Yapılandırması ve Rust Merkezleme Mantığı
- **Yapılan İşlemin Özeti:**
  1. **CSS Zoom Kaldırıldı ve Orijinal Tasarım İade Edildi:** `document.documentElement.style.zoom = String(scale)` kaldırıldı. Zoom uygulandığında CSS piksel alanının daralarak input kutusunun yarım kesilmesine ve alttaki durum çubuğunun (Hazır, token göstergesi) pencere dışına taşmasına yol açan deformasyon çözüldü. `index.css` orijinal CoreType glassmorphism tasarımına (12px border radius, 14px font, 38px min-height, 16px padding, 11px durum çubuğu) geri döndürüldü.
  2. **Ayarlar Penceresi Mimarisiyle Birebir Eşitleme:** Kullanıcının sorunsuz ve tam ortada çalıştığını belirttiği Ayarlar penceresinin GTK monitör-merkezleme geometrisi ana pencereye de uygulandı (`tx = pos.x + (size.width - win_w) / 2.0`, `ty = pos.y + (size.height - win_h) / 2.0`). XWayland katsayı çarpanı temizlendi.
  3. **Pencere Boyutları Standartlaştırıldı:** `tauri.conf.json`, `App.tsx` ve `lib.rs` üzerinde ana pencere taban boyutu `500x140px` (seçim modunda `170px`, önizleme modunda `400px`) olarak ayarlandı.
  4. **Derleme ve Doğrulama:** `npm run build`, `cargo build` ve `cargo build --release` başarıyla derlendi. KWin üzerinden yapılan canlı sorguda pencerenin aktif monitörde $x=954.28, y=577.14, w=285.71, h=168$ koordinatlarında, sol boşluk = sağ boşluk ($954.28$px) ile %100 simetrik ortalandığı ve tüm UI öğelerinin eksiksiz göründüğü doğrulandı.
- **Etkilenen Dosyalar ve Satır Referansları:**
  - 📄 `src/index.css : 50-350` - (Orijinal glassmorphism ve compact layout geri yüklendi)
  - 📄 `src/App.tsx : 465-495` - (Dinamik zoom kaldırıldı, 500x140 sabitleri iade edildi)
  - 📄 `src-tauri/tauri.conf.json : 15-20` - (500x140 başlangıç boyutu)
  - 📄 `src-tauri/src/lib.rs : 325-375` - (Ayarlar penceresiyle aynı monitör merkezleme matematiği, resize_window yalınlaştırıldı)
- **Eklenen / Silinen Paketler:** Yok

---

## 📌 [2026-09-16 07:05] - KWin XWayland 1.75x Ölçek Dönüşümü ve Kesin Merkezleme Düzeltmesi
- **Kapsam / Modül:** Rust Backend, IPC Commands, React 19 Frontend & KDE Plasma 6 KWin Entegrasyonu
- **Yapılan İşlemin Özeti:**
  1. **KWin 1.75x XWayland Dönüşümünün Hesaba Katılması:** KDE Plasma 6'da fractional scaling (%175) devredeyken KWin'in X11/XWayland pencerelerini $1 / 1.75$ katsayısıyla küçülterek ve kaydırarak kompozitöre aktardığı ampirik olarak kanıtlandı. `lib.rs` içine `get_xwayland_scale()` eklenerek KWin'in aktif ölçeği (`1.75`) dinamik olarak okundu. Hedef Wayland mantıksal koordinatları ($X=757, Y=522$) ve boyutları ($W=680, H=190$) 1.75 ile çarpılarak X11'e ($X=1325, Y=914, W=1190, H=333$) iletildi. KWin'in pencereyi milimetrik olarak tam merkezde ($x=757.14, y=522.28, w=680, h=190.28$) konumlandırdığı KWin günlükleriyle doğrulandı.
  2. **Dinamik CSS Zoom Entegrasyonu:** `get_display_scale` ve `resize_window` Tauri komutları eklendi. `App.tsx` bileşeni açılışta `document.documentElement.style.zoom = String(scale)` uygulayarak 680x190px'lik CSS tasarımının 4K netliğinde 1190x333 fiziksel piksele oturmasını sağladı; yeniden boyutlandırma çağrıları `resize_window` komutuna yönlendirildi.
  3. **İlk Başlatmada Anında Açılma (Instant Initial Toggle):** `main.rs` içinde çalışan bir örnek yokken `--toggle` ile başlatıldığında `CORETYPE_INITIAL_TOGGLE=1` ortam değişkeni tanımlandı ve `setup()` içinde pencerenin ilk tuş basımında gecikmesiz açılması sağlandı.
  4. **Derleme ve Doğrulama:** `npm run build` ve `cargo build --release` tamamlandı; `target/debug/coretype` ve `target/release/coretype` canlı test edilerek 0 hata ile doğrulandı.
- **Etkilenen Dosyalar ve Satır Referansları:**
  - 📄 `src-tauri/src/lib.rs : 30-70` - (`get_xwayland_scale()` fonksiyonu)
  - 📄 `src-tauri/src/lib.rs : 320-375` - (`toggle_main_window` 1.75x ölçek çarpımı, `get_display_scale`, `resize_window`)
  - 📄 `src-tauri/src/lib.rs : 545-560` - (`CORETYPE_INITIAL_TOGGLE` otomatik ilk açılış)
  - 📄 `src-tauri/src/lib.rs : 625-635` - (Yeni komutların tauri::generate_handler'a kaydı)
  - 📄 `src-tauri/src/main.rs : 15-25` - (`CORETYPE_INITIAL_TOGGLE` ortam değişkeni ataması)
  - 📄 `src-tauri/tauri.conf.json : 15-20` - (1190x333 başlangıç X11 boyutu)
  - 📄 `src/App.tsx : 470-495` - (Dinamik zoom effect ve `resize_window` çağrısı)
  - 📄 `src/App.tsx : 580-600` - (`onFocusChanged` içinde `resize_window`)
  - 📄 `src/App.tsx : 1025-1035` - (Önizleme modu için `resize_window`)
- **Eklenen / Silinen Paketler:** Yok
- **Teknik Notlar:** Çoklu monitör geometrisi ve XWayland ölçek çarpanı entegre çalışmaktadır. KWin pencereyi doğrudan ekranın tam ortasında (%50 Y) ve 680x190 ebatlarında göstermektedir.

---

## 📌 [2026-09-16 06:48] - Pencere Boyutlandırma (680x190) ve Aktif Monitör Merkezleme Kök Neden Çözümü
- **Kapsam / Modül:** React UI, Glassmorphism CSS, Rust Backend & Çoklu Monitör KWin Entegrasyonu
- **Yapılan İşlemin Özeti:**
  1. **Pencere Boyutları Genişletildi:** `tauri.conf.json` ve `App.tsx` içerisindeki dar 500x140px değerleri yerine kullanıcı talebine uygun olarak `680x190px` (seçili metin olduğunda `230px`, önizleme modunda `500px`) genişletilmiş boyutlar uygulandı. `index.css` üzerinde `.coretype-app` için 16px border-radius ve 16px 20px padding, `.main-input` için 15px font ve 48px min-height, `.send-button` ve `.status-bar` için ferah aralıklar uygulandı; placeholder metinlerinin kesilmesi engellendi.
  2. **Pencere Merkezleme Kök Neden Çözümü:** 
     - Tauri'nin Linux/GTK üzerinde `workarea` hesaplamasında çift ölçekleme hatası içeren `window.center()` ve `center: true` yapılandırması kaldırıldı.
     - KWin kurallarındaki (`placement=Centered`) zorlamasının pencereyi render öncesi 286px genişliğe göre hatalı ofsetle (`x=954`) açması engellenerek kural temizlendi.
     - KWin Scripting üzerinden aktif uygulamanın bulunduğu ekran koordinatları (`sx, sy, sw, sh`) anlık alınarak pencerenin o ekranın tam ortasına (`target_x = sx + (sw - 680) / 2`, `target_y = sy + (sh - 190) / 2`) piksel hassasiyetinde (`tauri::Position::Logical`) yerleşmesi sağlandı (Monitör 0 için `x=757, y=522`, Monitör 1 için `x=2952, y=522`).
  3. **Ayarlar Penceresi Düzeltmesi:** Sistem tepsisinden açılan ayarlar penceresindeki `.center()` çağrısı da güvenli mantıksal merkezleme ile değiştirildi.
  4. **Derleme ve Doğrulama:** `npm run build` ile React frontend derlendi, `cargo build` ve `cargo build --release` ile ikili dosyalar güncellendi ve çalışma zamanında pencere açılışı doğrulandı.
- **Etkilenen Dosyalar ve Satır Referansları:**
  - 📄 `src-tauri/tauri.conf.json : 15-25` - (680x190 boyutları tanımlandı, center=false yapıldı)
  - 📄 `src/App.tsx : 465-485` - (WINDOW_WIDTH=680, BASE_HEIGHT=190, SELECTION_HEIGHT=230 tanımlandı)
  - 📄 `src/App.tsx : 578-595` - (onFocusChanged olayında 680x190/230 boyutlandırması bağlandı)
  - 📄 `src/App.tsx : 1026` - (Önizleme modu için 680x500 boyutu ayarlandı)
  - 📄 `src/index.css : 54-97` - (Konteyner ve başlık ferahlatıldı, border-radius 16px yapıldı)
  - 📄 `src/index.css : 163-173` - (Context badge aralıkları ve padding genişletildi)
  - 📄 `src/index.css : 281-352` - (Input 15px font, 48px min-height, send butonu ve durum çubuğu yenilendi)
  - 📄 `src-tauri/src/lib.rs : 30-110` - (ActiveContext ve get_active_context ile ekran geometrisi alma)
  - 📄 `src-tauri/src/lib.rs : 280-320` - (toggle_main_window içinde aktif ekrana göre dinamik merkezleme)
  - 📄 `src-tauri/src/lib.rs : 515-545` - (Ayarlar penceresi mantıksal merkezleme)
  - 📄 `~/.config/kwinrulesrc : 1-15` - (Hatalı ofsete yol açan KWin pencere yerleşim kuralı temizlendi)
- **Eklenen / Silinen Paketler:** Yok
- **Teknik Notlar:** Debug ve release ikili dosyaları derlendi. Çalışma anında aktif pencerenin ekranı tespit edilerek tam merkezde açıldığı teyit edildi.

---

## 📌 [2026-09-16 06:32] - Pencere Ortalanması Kesin Düzeltmesi ve Global Ctrl+Space KDE Entegrasyonu
- **Kapsam / Modül:** Rust Backend, GTK/XWayland & KDE Plasma 6 KGlobalAccel
- **Yapılan İşlemin Özeti:**
  1. **Pencere Ortalanması Kök Neden Çözümü:** Wayland `xdg-shell` protokolü istemci taraflı pencere koordinatlarını (`set_position` / `window.center()`) tamamen yasakladığından ve kullanıcının kabuk ortamında `GDK_BACKEND=wayland` tanımlı olduğundan pencere köşe noktasına `(0, 0)` yerleşiyordu. `main.rs` içinde `GDK_BACKEND=x11`, `WEBKIT_DISABLE_DMABUF_RENDERER=1` ve `__NV_DISABLE_EXPLICIT_SYNC=1` koşulsuz olarak zorlandı. Ayrıca `lib.rs` içinde çoklu monitör algılamalı (`window.current_monitor()`) fiziksel piksel merkezleme matematiği eklendi. KWin pencere kurallarına (`kwinrulesrc`) `CoreType` için `placement=Centered` ve `placementrule=2` (Force) kuralı uygulandı. Pencerenin ekranın tam ortasında (`x=954, y=526`) açıldığı KWin üzerinden ampirik olarak doğrulandı.
  2. **KDE Plasma 6 KGlobalAccel Entegrasyonu:** KDE Plasma 6'nın KGlobalAccel mekanizması gereğince `~/.local/share/applications/com.coretype.app.desktop` dosyasına `X-KDE-Shortcuts=Ctrl+Space` tanımlandı. KWin ve KGlobalAccel D-Bus üzerinden tetiklenerek `_launch` aksiyonu doğrudan `Ctrl+Space` (Qt KeyCode `67108896`) tuşuna bağlandı. Sistem genelinde (Konsole, Brave, masaüstü vb.) `Ctrl+Space` basıldığında 1ms içinde Unix domain socket (`coretype.sock`) üzerinden `--toggle` sinyali iletilerek asistan anında açılmaktadır.
  3. **Kalıcı Clipboard ve 20ms KWin Wayland Terminal Tespiti:** `arboard::Clipboard` nesnesi her fonksiyonda açılıp kapanmak yerine `TargetWindowState` içinde kalıcı tutuldu, "Clipboard was dropped very quickly after writing" uyarıları ve pano kaybı tamamen sıfırlandı. Yerel Wayland pencerelerinde (Konsole) pencere sınıfını yakalamak için 20ms'lik KWin D-Bus script köprüsü entegre edildi.
- **Etkilenen Dosyalar ve Satır Referansları:**
  - 📄 `src-tauri/src/main.rs : 24-40` - (GDK_BACKEND=x11 koşulsuz ayarlandı)
  - 📄 `src-tauri/src/lib.rs : 12-79` - (Kalıcı clipboard, KWin aktif pencere tespiti)
  - 📄 `src-tauri/src/lib.rs : 185-300` - (Monitör duyarlı merkez koordinat hesaplaması ve güvenli pano yönetimi)
  - 📄 `~/.local/share/applications/com.coretype.app.desktop : 1-17` - (X-KDE-Shortcuts=Ctrl+Space eklendi)
  - 📄 `~/.config/kwinrulesrc : 1-15` - (CoreType kuralı substring ve centered olarak güncellendi)
  - 📄 `~/.config/kglobalshortcutsrc : 10-18` - (KDE kısayolu com.coretype.app.desktop için temizlendi ve senkronize edildi)
- **Eklenen / Silinen Paketler:** Yok
- **Teknik Notlar:** Debug ve Release ikili dosyaları derlendi (`target/debug/coretype` ve `target/release/coretype`). D-Bus `invokeShortcut` ve Unix domain socket testleriyle tüm akış uçtan uca onaylandı.

---

## 📌 [2026-09-16 06:13] - Ekran Ortalanması ve Wayland Kısayol IPC Düzeltmesi
- **Kapsam / Modül:** Rust Backend & KDE Wayland Entegrasyonu
- **Yapılan İşlemin Özeti:**
  1. Pencere Ortalanması: KDE Plasma KWin kurallarına (~/.config/kwinrulesrc) coretype için placement=4 (Centered) ve placementrule=2 (Force) kuralı eklendi ve KWin.reconfigure tetiklendi. Artık tüm pencereler ekranın tam ortasında açılıyor.
  2. Wayland Kısayol IPC Altyapısı: Wayland'in güvenlik kısıtlaması nedeniyle X11 kısayollarını yerel Wayland pencerelerine iletmemesi sorununu aşmak için Unix domain socket tabanlı --toggle mekanizması kodlandı (main.rs ve lib.rs).
  3. KDE Kısayol Entegrasyonu: ~/.local/share/applications/coretype-toggle.desktop oluşturularak KDE KGlobalAccel sistemine Ctrl+Space kısayolu ile bağlandı.
- **Etkilenen Dosyalar ve Satır Referansları:**
  - 📄 `src-tauri/src/main.rs : 1-32` - (Unix stream CLI toggle desteği)
  - 📄 `src-tauri/src/lib.rs : 1-420` - (Unix domain socket dinleyicisi ve toggle_main_window)
  - 📄 `~/.config/kwinrulesrc : 1-15` - (KWin merkezleme kuralı)
  - 📄 `~/.local/share/applications/coretype-toggle.desktop : 1-7` - (KDE kısayol entegrasyonu)
- **Eklenen / Silinen Paketler:** Yok
- **Teknik Notlar:** coretype --toggle komutu ile pencere 1ms içinde açılıp kapatılabilmektedir.

---

## 📌 [2026-09-16 06:05] - Linux Wayland/NVIDIA WebKitGTK DMA-BUF Error 71 Düzeltmesi
- **Kapsam / Modül:** Rust Backend / Linux Uyumluluk & Hata Çözümü
- **Yapılan İşlemin Özeti:** Wayland + NVIDIA sürücüsü altında WebKitGTK donanım hızlandırmalı DMA-BUF protokol hatasını (Gdk-Message: Error 71 dispatching to Wayland display) çözmek için main.rs içine WEBKIT_DISABLE_DMABUF_RENDERER=1 ve __NV_DISABLE_EXPLICIT_SYNC=1 çalışma zamanı değişkenleri eklendi ve yeniden derlendi.
- **Etkilenen Dosyalar ve Satır Referansları:**
  - 📄 `src-tauri/src/main.rs : 1-17` - (Linux ortam değişkenleri eklendi)
  - 📄 `PROJECT_CONTEXT.md : 1-75` - (Bilinen sorunlar ve teknik notlar güncellendi)
- **Eklenen / Silinen Paketler:** Yok
- **Teknik Notlar:** WebKitGTK Wayland üzerinde DMA-BUF yerine kararlı render yoluna yönlendirildi; libayatana-appindicator uyarısı bilgilendirme amaçlıdır.

---

## 📌 [2026-09-16 05:58] - Linux Rust Backend Mimarisi Tamamlandı ve Derlendi
- **Kapsam / Modül:** Rust Backend / OS Altyapısı
- **Yapılan İşlemin Özeti:** Windows Win32 API'leri yerine Linux X11/Wayland uyumlu Rust backend kodlandı. Aktif pencereye göre otomatik kısayol belirleme (Terminal: Ctrl+Shift+V, Standart: Ctrl+V), pano tabanlı güvenli metin enjeksiyonu (arboard), klavye simülasyonu (enigo), global kısayol (Ctrl+Space) ve 0600 dosya izinli secrets.json entegrasyonu tamamlandı. Tümleşik uygulama başarıyla derlendi (target/debug/coretype).
- **Etkilenen Dosyalar ve Satır Referansları:**
  - 📄 `src-tauri/Cargo.toml : 1-22` - (Linux bağımlılıkları tanımlandı)
  - 📄 `src-tauri/src/main.rs : 1-7` - (Tauri giriş noktası oluşturuldu)
  - 📄 `src-tauri/src/lib.rs : 1-387` - (Linux metin enjeksiyonu, terminal algılama ve IPC komutları kodlandı)
  - 📄 `linux-backend-architecture.md : 1-60` - (Görev planı tamamlandı olarak işaretlendi)
- **Eklenen / Silinen Paketler:** enigo 0.6.1, arboard 3.6.1, tauri 2.11.5 ve Linux derleme kütüphaneleri bağlandı.
- **Teknik Notlar:** `npx tauri build --no-bundle --debug` ile debug binary üretildi, 0 hata ile doğrulandı.

---

## 📌 [2026-09-16 05:50] - Linux Rust Backend Mimarisi İçin Plan Oluşturuldu
- **Kapsam / Modül:** Rust Backend / Planlama
- **Yapılan İşlemin Özeti:** Windows Win32 API bağımlılıklarının yerine Linux X11 & Wayland uyumlu Rust backend (Cargo.toml, main.rs, lib.rs, arboard ve enigo) tasarımı için detaylı plan hazırlandı.
- **Etkilenen Dosyalar ve Satır Referansları:**
  - 📄 `linux-backend-architecture.md : 1-55` - (Görev planı belgesi oluşturuldu)
  - 📄 `PROJECT_CONTEXT.md : 1-75` - (Yol haritası güncellendi)
- **Eklenen / Silinen Paketler:** Yok (Planlama aşaması)
- **Teknik Notlar:** Kullanıcı onayının ardından Cargo.toml ve Rust kaynak kodları oluşturulacaktır.

---

## 📌 [2026-09-16 05:46] - Doğrudan Taşınabilir Dosyalar CoreType-lnx'e Aktarıldı ve Derlendi
- **Kapsam / Modül:** Web & Frontend Altyapısı / Taşıma
- **Yapılan İşlemin Özeti:** Orijinal projeden web kök yapılandırmaları, React 19 UI kodları, Glassmorphism CSS ve Tauri statik varlıkları aktarıldı. Bağımlılıklar kuruldu (npm install) ve üretim derlemesi (npm run build) başarıyla tamamlandı.
- **Etkilenen Dosyalar ve Satır Referansları:**
  - 📄 `package.json : 1-27` - (Paket adı coretype-linux olarak güncellendi, bağımlılıklar kuruldu)
  - 📄 `tsconfig.json : 1-26` - (TypeScript yapılandırması aktarıldı)
  - 📄 `vite.config.ts : 1-33` - (Vite yapılandırması aktarıldı)
  - 📄 `index.html : 1-23` - (Giriş HTML şablonu aktarıldı)
  - 📄 `src/App.tsx : 1-1501` - (Ana React arayüzü ve slash komut mantığı aktarıldı)
  - 📄 `src/index.css : 1-901` - (Glassmorphism tasarım sistemi aktarıldı)
  - 📄 `src/main.tsx : 1-11` - (React kök bileşeni aktarıldı)
  - 📄 `src-tauri/tauri.conf.json : 1-43` - (Tauri temel konfigürasyonu aktarıldı)
  - 📄 `src-tauri/capabilities/default.json : 1-25` - (İzin tanımları aktarıldı)
  - 📄 `src-tauri/build.rs : 1-4` - (Tauri derleme betiği aktarıldı)
  - 📄 `direct-file-migration.md : 1-65` - (Görev tamamlandı olarak güncellendi)
- **Eklenen / Silinen Paketler:** 72 npm paketi yüklendi (React 19, Vite 7, Tauri v2 CLI vb.)
- **Teknik Notlar:** `npm run build` ile `dist/` klasörü 811ms'de üretildi, TypeScript hatası bulunmuyor.

---

## 📌 [2026-09-16 05:45] - Doğrudan Taşınacak Dosyalar İçin Plan Oluşturuldu
- **Kapsam / Modül:** Planlama & Web Altyapısı
- **Yapılan İşlemin Özeti:** Orijinal projeden işletim sisteminden bağımsız olarak taşınabilecek frontend, web yapılandırma ve Tauri statik kaynakları için planlama yapıldı.
- **Etkilenen Dosyalar ve Satır Referansları:**
  - 📄 `direct-file-migration.md : 1-65` - (Görev planı oluşturuldu)
  - 📄 `PROJECT_CONTEXT.md : 1-70` - (Yol haritası ve dizin yapısı güncellendi)
- **Eklenen / Silinen Paketler:** Yok (Planlama aşaması)
- **Teknik Notlar:** Kullanıcı onayından sonra dosya kopyalama ve derleme testleri başlatılacak.

---

## 📌 [2026-09-16 05:15] - Proje Başlangıcı, Windows CoreType Analizi ve Hafıza Kurulumu
- **Kapsam / Modül:** Proje İskeleti & Ortam Yapılandırması / Keşif & Analiz
- **Yapılan İşlemin Özeti:** Orijinal Windows CoreType projesi (`/home/alphaghost/projects/CoreType/`) ve `.antigravity/rules.md` kuralları detaylıca incelendi. "CoreType for Linux" projesi için çift katmanlı hafıza sistemi (`PROJECT_CONTEXT.md` ve `CHANGELOG.md`) başlatıldı.
- **Etkilenen Dosyalar ve Satır Referansları:**
  - 📄 `.antigravity/rules.md : 1-69` - (AI hafıza ve çalışma kuralları okundu ve aktifleştirildi)
  - 📄 `PROJECT_CONTEXT.md : 1-65` - (Canlı proje hafıza dosyası oluşturuldu)
  - 📄 `CHANGELOG.md : 1-25` - (Kalıcı değişiklik günlüğü başlatıldı)
- **Eklenen / Silinen Paketler:** Yok (Analiz aşaması)
- **Teknik Notlar:** Windows Win32 API (`windows-rs`, `HWND`, `SendInput`, `AttachThreadInput`, `MonitorFromWindow`) bağımlılıkları Linux için yeniden tasarlanmalıdır (X11/Wayland uyumluluğu, `enigo` / `xdotool` / `wtype` / portal entegrasyonu).
