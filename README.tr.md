<div align="center">

# ⚡ CoreType Linux

**Linux İçin Evrensel Yapay Zeka Asistanı, Doğal Dil Masaüstü Otomasyonu ve Üretkenlik Spotlight Aracı**

[![Lisans: GPL-3.0](https://img.shields.io/badge/Lisans-GPL_v3-blue.svg?style=flat-square)](LICENSE)
[![Tauri v2](https://img.shields.io/badge/Tauri-v2.0-24C8D8.svg?style=flat-square&logo=tauri&logoColor=white)](https://tauri.app)
[![Rust](https://img.shields.io/badge/Rust-1.75+-DEA584.svg?style=flat-square&logo=rust&logoColor=white)](https://www.rust-lang.org)
[![React 19](https://img.shields.io/badge/React-19-61DAFB.svg?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6.svg?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Linux Platform](https://img.shields.io/badge/Platform-Linux_(Wayland_%26_X11)-FCC624.svg?style=flat-square&logo=linux&logoColor=black)](https://kernel.org)

*macOS Spotlight ve Raycast'in akıcı hızını hiçbir masaüstü kısıtlaması olmadan modern Linux masaüstlerine getirir.*

[🇬🇧 English](README.md) • [🇹🇷 Türkçe](README.tr.md)

</div>

---

## 🌟 Öne Çıkan Özellikler

- **🎯 Anında Global Spotlight (`Ctrl + Space`):** İstediğiniz her an çağırın. Çoklu monitör kurulumlarında ekran ölçekleme farkındalığıyla (HiDPI 1.25x, 1.5x, 1.75x, 2.0x) hedef ekranın tam merkezine pürüzsüzce oturur.
- **🧠 Akıllı Aktif Bağlam Algılama:** Linux çekirdek `/proc/[pid]` incelemesiyle üzerinde çalıştığınız aktif pencereyi ve terminal emülatörünü (`kitty`, `konsole`, `alacritty`, `wezterm`, `st` vb.) otomatik olarak tanır.
- **⚡ Doğal Dil Masaüstü Otomasyonu (`!` öneki):** Sistem komutlarını günlük konuşma diliyle Türkçe veya İngilizce olarak çalıştırın (örn: `!sesi %50 yap`, `!ekranı kilitle`, `!1420 portunu kim dinliyor`).
- **🛡️ Kum Havuzu ve Yetki Güvenliği:** `sudo`, `su` veya yıkıcı komutların çalıştırılmasını kullanıcı dostu güvenlik uyarılarıyla kesin olarak engelleyen sıkı güvenlik bariyerleri.
- **🔔 Glassmorphic Bildirim Kartları (Toast):** Masaüstü otomasyon işlemlerinin teyidi için geri sayımlı, modern ve şeffaf `460 × 74px` akrilik bildirimler.
- **✂️ Dile Duyarlı Metin Dönüşümleri (`/` komutları):** Türkçe `İ/I` büyük-küçük harf kurallarına %100 sadık anlık `/buyuk`, `/kucuk`, `/baslik`, kelime/karakter sayımı (`/say`), URL dostu link üretimi (`/slug`) ve JSON formatlama (`/json`).
- **📋 Snippet (Kalıp Metin) Deposu:** Sık kullandığınız metinleri `/kaydet <ad> <metin>` ile saklayın ve hızlı slash filtreleme ile anında yapıştırın.
- **🏛️ Geçmiş Deposu (`Ctrl + H`):** Geçmiş tüm yapay zeka istemlerinin ve yanıtlarının aranabilir arşivi, artı terminal stili `Yukarı / Aşağı` ok tuşlarıyla komut gezintisi.
- **⚙️ Kapsamlı Ayarlar Ekranı (`1000 × 900px`):** 7 modüler sekme, eksiksiz Türkçe/İngilizce dil desteği ve güvenli Linux Kimlik Bilgisi Yöneticisi (GNOME Keyring / KWallet / Secret Service) entegrasyonu.
- **🔌 Unix Socket IPC & Terminal Kontrolü:** Betiklerle kontrol edilebilen `$XDG_RUNTIME_DIR/coretype.sock` arabirimi sayesinde `coretype --toggle`, `coretype --settings` ve `coretype --history` çalıştırma desteği.

---

## 🖥️ Masaüstü ve Görüntü Sunucusu Uyumluluğu

CoreType Linux, alternatifli geri çekilme zincirlerine sahip **Çoklu Masaüstü Strateji Deseni (Multi-DE Strategy Pattern)** mimarisini benimser:

| Masaüstü Ortamı | Wayland | X11 | Aktif Pencere Algılama Stratejisi |
| :--- | :---: | :---: | :--- |
| **KDE Plasma 6 / 5** | ✅ | ✅ | KWin Scripting IPC + Procfs |
| **GNOME 45+** | ✅ | ✅ | Mutter / FreeDesktop Shell + Procfs |
| **Hyprland** | ✅ | N/A | `hyprctl activewindow -j` IPC |
| **Sway / i3** | ✅ | ✅ | `swaymsg -t get_tree` IPC |
| **XFCE / Diğer WM'ler** | N/A | ✅ | X11 Xlib / xprop + Procfs |

---

## 🚀 Başlarken

### Önkoşullar

#### Arch Linux / CachyOS / Manjaro:
```bash
sudo pacman -S --needed base-devel webkit2gtk-4.1 openssl curl wget libappindicator-gtk3
```

#### Ubuntu 22.04+ / Debian 12+:
```bash
sudo apt update
sudo apt install -y build-essential libwebkit2gtk-4.1-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
```

#### Fedora 39+:
```bash
sudo dnf install -y webkit2gtk4.1-devel openssl-devel libappindicator-gtk3-devel librsvg2-devel
```

---

### Kurulum ve Geliştirme

1. **Repoyu klonlayın:**
   ```bash
   git clone https://github.com/serhatbaykal/coretype-linux.git
   cd coretype-linux
   ```

2. **Bağımlılıkları yükleyin:**
   ```bash
   npm install
   ```

3. **Geliştirme modunda çalıştırın:**
   ```bash
   npm run tauri dev
   ```

4. **Kararlı (Release) paketleri derleyin:**
   ```bash
   npm run tauri build
   ```
   *Derlenen ikili dosya ve paketler (`.deb`, `.tar.gz`, `AppImage`) `src-tauri/target/release/bundle/` altında hazır olacaktır.*

---

## ⌨️ Varsayılan Kısayollar ve Komutlar

| Kısayol / Komut | Eylem |
| :--- | :--- |
| `Ctrl + Space` | Spotlight arama penceresini aç/kapat |
| `Ctrl + H` | Geçmiş Deposunu (History Vault) aç |
| `Esc` | Spotlight / Geçmiş / Ayarlar penceresini kapat |
| `Yukarı / Aşağı` | Giriş kutusunda önceki komut geçmişinde gezin |
| `! <talimat>` | Güvenli masaüstü eylemi çalıştır (örn: `!sesi %60 yap`, `!ekranı kilitle`) |
| `/buyuk <metin>` | Metni Türkçe `İ/I` kurallarına uygun olarak BÜYÜK HARFE dönüştür |
| `/kucuk <metin>` | Metni Türkçe `İ/I` kurallarına uygun olarak küçük harfe dönüştür |
| `/baslik <metin>` | Metindeki her kelimenin ilk harfini büyüt (Başlık Düzeni) |
| `/say <metin>` | Karakter, kelime ve satır sayısını göster |
| `/slug <metin>` | Temiz URL bağlantısı (slug) oluştur |
| `/json <json_metni>` | JSON verisini doğrula ve okunabilir formatla |
| `/kaydet <ad> <metin>` | Sık kullanılan yeni bir kalıp metin (snippet) kaydet |
| `/<ad>` | Kayıtlı kalıp metni anında ara ve yapıştır |

---

## 🛡️ Güvenlik ve Gizlilik

- **Sıfır Sabit Sistem Yolu:** Tüm çalışma zamanı dosyaları ve soketler, `$XDG_RUNTIME_DIR` veya izole `0700` (`srwx------`) izinleriyle korunan işlem kimlikleri üzerinden dinamik olarak oluşturulur.
- **Sudo / Root Reddi:** CoreType, root yetkisi gerektiren tehlikeli komutları (`sudo`, `su`, `pkexec`, `doas`, `rm -rf /`) güvenlik ilkesi gereği kesinlikle çalıştırmaz.
- **İşletim Sistemi Kimlik Bilgisi Yöneticisi:** API anahtarları (OpenAI, Gemini) düz metin dosyalarında değil; Linux OS Keyring / KWallet üzerinde şifrelenmiş olarak saklanır.
- **Shift-Left Gizli Bilgi Taraması:** Git commit geçmişine hiçbir özel anahtarın veya bilginin sızmaması için otomatik **Gitleaks** pre-commit kancaları ile korunmaktadır.

---

## 🤝 Katkıda Bulunma

Katkılarınızı, hata bildirimlerinizi ve özellik önerilerinizi memnuniyetle karşılıyoruz!

1. Projeyi çatallayın (Fork).
2. Özellik dalınızı oluşturun (`git checkout -b feature/HarikaOzellik`).
3. Değişikliklerinizi commit edin (`git commit -m 'feat: HarikaOzellik eklendi'`).
4. Dalınıza push yapın (`git push origin feature/HarikaOzellik`).
5. Bir Pull Request açın.

---

## 📜 Lisans

Bu proje **GNU General Public License v3.0 (GPL-3.0-or-later)** lisansı altında dağıtılmaktadır. Detaylar için [`LICENSE`](LICENSE) dosyasını inceleyebilirsiniz.

---

<div align="center">
  <sub>Linux Masaüstü için Serhat Baykal tarafından ❤️ ile geliştirildi</sub>
</div>
