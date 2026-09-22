<div align="center">

# ⚡ CoreType Linux

**Universal AI Assistant, Natural Language Desktop Automation & Productivity Spotlight for Linux**

[![License: GPL-3.0](https://img.shields.io/badge/License-GPL_v3-blue.svg?style=flat-square)](LICENSE)
[![Tauri v2](https://img.shields.io/badge/Tauri-v2.0-24C8D8.svg?style=flat-square&logo=tauri&logoColor=white)](https://tauri.app)
[![Rust](https://img.shields.io/badge/Rust-1.75+-DEA584.svg?style=flat-square&logo=rust&logoColor=white)](https://www.rust-lang.org)
[![React 19](https://img.shields.io/badge/React-19-61DAFB.svg?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6.svg?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Linux Platform](https://img.shields.io/badge/Platform-Linux_(Wayland_%26_X11)-FCC624.svg?style=flat-square&logo=linux&logoColor=black)](https://kernel.org)

*Bringing the fluid speed of macOS Spotlight and Raycast to modern Linux desktops with zero system lock-in.*

</div>

---

## 🌟 Highlights

- **🎯 Instant Global Spotlight (`Ctrl + Space`):** Summon anywhere. Centers seamlessly across multi-monitor setups with automatic display scale awareness (HiDPI 1.25x, 1.5x, 1.75x, 2.0x).
- **🧠 Intelligent Active Context:** Automatically discovers your active window and terminal emulator (`kitty`, `konsole`, `alacritty`, `wezterm`, `st`, etc.) using Linux `/proc/[pid]` inspection.
- **⚡ Natural Language Desktop Automation (`!` prefix):** Type commands in plain English or Turkish (e.g. `!sesi %50 yap`, `!ekranı kilitle`, `!1420 portunu kim dinliyor`).
- **🛡️ Sandbox & Privilege Security:** Strict guardrails preventing `sudo`, `su`, or destructive command execution with friendly safety notices.
- **🔔 Glassmorphic Toast Notifications:** Sleek `460 × 74px` acrylic notifications with progress countdowns for desktop automation confirmation.
- **✂️ Locale-Aware Text Transforms (`/` commands):** Instant `/buyuk`, `/kucuk`, `/baslik` (strict Turkish `İ/I` letter-case grammar), `/say` (counts), `/slug`, and `/json` formatting.
- **📋 Snippet Vault:** Save reusable snippets via `/kaydet <name> <content>` and paste them with quick slash filtering.
- **🏛️ History Vault (`Ctrl + H`):** Full searchable archive of past prompts and responses, plus terminal-style `Up / Down` command cycling.
- **⚙️ Comprehensive Settings (`1000 × 900px`):** 7 modular tabs, full English/Turkish i18n, and secure OS Credential Manager integration (GNOME Keyring / KWallet / Secret Service).
- **🔌 Unix Socket IPC & CLI Control:** Native `$XDG_RUNTIME_DIR/coretype.sock` interface allowing scriptable `coretype --toggle`, `coretype --settings`, and `coretype --history` execution.

---

## 🖥️ Desktop & Display Server Compatibility

CoreType Linux follows the **Multi-DE Strategy Pattern** with strict fallback chains:

| Desktop Environment | Wayland | X11 | Active Context Detection Strategy |
| :--- | :---: | :---: | :--- |
| **KDE Plasma 6 / 5** | ✅ | ✅ | KWin Scripting IPC + Procfs fallback |
| **GNOME 45+** | ✅ | ✅ | Mutter / FreeDesktop Shell + Procfs fallback |
| **Hyprland** | ✅ | N/A | `hyprctl activewindow -j` IPC |
| **Sway / i3** | ✅ | ✅ | `swaymsg -t get_tree` IPC |
| **XFCE / Other WMs** | N/A | ✅ | X11 Xlib / xprop + Procfs |

---

## 🚀 Getting Started

### Prerequisites

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

### Installation & Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/serhatbaykal/coretype-linux.git
   cd coretype-linux
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

3. **Run in development mode:**
   ```bash
   npm run tauri dev
   ```

4. **Build release package:**
   ```bash
   npm run tauri build
   ```
   *The compiled binary and packages (`.deb`, `.tar.gz`, `AppImage`) will be available under `src-tauri/target/release/bundle/`.*

---

## ⌨️ Default Keybindings & Commands

| Shortcut / Command | Action |
| :--- | :--- |
| `Ctrl + Space` | Toggle Spotlight window |
| `Ctrl + H` | Open History Vault |
| `Esc` | Close Spotlight / History / Settings |
| `Up / Down` | Cycle previous command history in prompt input |
| `! <instruction>` | Execute safe desktop action (e.g. `!sesi %60 yap`, `!ekranı kilitle`) |
| `/buyuk <text>` | Convert text to uppercase with Turkish `İ/I` rules |
| `/kucuk <text>` | Convert text to lowercase with Turkish `İ/I` rules |
| `/baslik <text>` | Convert text to title case |
| `/say <text>` | Display character, word, and line count |
| `/slug <text>` | Generate clean URL slug |
| `/json <json_string>` | Prettify and validate JSON |
| `/kaydet <ad> <metin>`| Save new reusable snippet |
| `/<ad>` | Instant snippet lookup and insertion |

---

## 🛡️ Security & Privacy

- **Zero Hardcoded Environment/System Paths:** All runtime files and sockets strictly derive from `$XDG_RUNTIME_DIR` or process IDs with isolated `0700` (`srwx------`) socket permissions.
- **Zero Sudo Execution:** CoreType strictly refuses root commands (`sudo`, `su`, `pkexec`, `doas`, `rm -rf /`).
- **OS Credential Manager:** API tokens (OpenAI, Gemini) are stored securely in Linux OS Keyring / KWallet, never in plain-text storage.
- **Shift-Left Secret Scanning:** Protected with automated **Gitleaks** pre-commit hooks to guarantee no private credentials enter git commit history.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the project.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'feat: add AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📜 License

Distributed under the **GNU General Public License v3.0 (GPL-3.0-or-later)**. See [`LICENSE`](LICENSE) for more information.

---

<div align="center">
  <sub>Built with ❤️ for the Linux Desktop by Serhat Baykal</sub>
</div>
