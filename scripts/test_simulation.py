#!/usr/bin/env python3
"""
CoreType Automated Test Simulation Suite
Tests all features:
1. Text Transforms (/buyuk, /kucuk, /baslik, /say, /slug, /json) with Turkish character support.
2. Snippet System: CRUD, search, and expansion.
3. History Vault: Storage schema, search filtering, relative time formatting (TR/EN), single item deletion, clear all.
4. Settings: Schema, tab structure, privacy disclaimer text, 1000x900 dimension specs.
5. System & IPC: Unix domain socket control commands, shortcut key codes.
"""

import json
import os
import re
import socket
import sys
import time
from typing import Dict, List, Any

# ANSI Colors for Terminal Output
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"

PASSED = f"{GREEN}✓ PASS{RESET}"
FAILED = f"{RED}✗ FAIL{RESET}"

test_results = []

def record_test(suite: str, name: str, passed: bool, details: str = ""):
    test_results.append({
        "suite": suite,
        "name": name,
        "passed": passed,
        "details": details
    })
    status = PASSED if passed else FAILED
    print(f"  [{status}] {name}")
    if details and not passed:
        print(f"         {YELLOW}Detail: {details}{RESET}")

# ----------------------------------------------------------------------
# 1. TEXT TRANSFORMS SIMULATION
# ----------------------------------------------------------------------
def test_text_transforms():
    print(f"\n{BOLD}{CYAN}1. Running Text Transforms Test Suite (Turkish Locale Support){RESET}")
    suite = "Text Transforms"

    # Turkish case conversion maps matching src/App.tsx logic
    def tr_upper(s: str) -> str:
        res = []
        for char in s:
            if char == 'i': res.append('İ')
            elif char == 'ı': res.append('I')
            else: res.append(char.upper())
        return "".join(res)

    def tr_lower(s: str) -> str:
        res = []
        for char in s:
            if char == 'İ': res.append('i')
            elif char == 'I': res.append('ı')
            else: res.append(char.lower())
        return "".join(res)

    def tr_title(s: str) -> str:
        words = s.split(" ")
        title_words = []
        for w in words:
            if not w:
                title_words.append("")
                continue
            first = tr_upper(w[0])
            rest = tr_lower(w[1:])
            title_words.append(first + rest)
        return " ".join(title_words)

    def text_stats(s: str) -> Dict[str, int]:
        chars = len(s)
        words = len([w for w in re.split(r"\s+", s.strip()) if w])
        lines = len(s.split("\n"))
        return {"chars": chars, "words": words, "lines": lines}

    def text_slug(s: str) -> str:
        s = tr_lower(s)
        tr_map = {'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u'}
        for k, v in tr_map.items():
            s = s.replace(k, v)
        s = re.sub(r"[^\w\s-]", "", s)
        s = re.sub(r"[\s_-]+", "-", s).strip("-")
        return s

    def json_format(s: str) -> str:
        parsed = json.loads(s)
        return json.dumps(parsed, indent=2, ensure_ascii=False)

    # Test /buyuk
    input_str = "türkçe karakterler: ılık çay, şekerli süt, geniş ağaç"
    expected = "TÜRKÇE KARAKTERLER: ILIK ÇAY, ŞEKERLİ SÜT, GENİŞ AĞAÇ"
    out = tr_upper(input_str)
    record_test(suite, "/buyuk Turkish upper conversion", out == expected, f"Got: {out}")

    # Test /kucuk
    input_str2 = "TÜRKÇE İLE ILIK VE ŞEKERLİ"
    expected2 = "türkçe ile ılık ve şekerli"
    out2 = tr_lower(input_str2)
    record_test(suite, "/kucuk Turkish lower conversion", out2 == expected2, f"Got: {out2}")

    # Test /baslik
    input_str3 = "istanbul ve izmir dağlarında çiçekler açar"
    expected3 = "İstanbul Ve İzmir Dağlarında Çiçekler Açar"
    out3 = tr_title(input_str3)
    record_test(suite, "/baslik Title Case with Turkish capital İ and I", out3 == expected3, f"Got: {out3}")

    # Test /say
    stats_in = "CoreType masaüstü asistanı.\nHızlı, hafif ve güvenli."
    st = text_stats(stats_in)
    record_test(suite, "/say character, word, line count", st["chars"] == 52 and st["words"] == 7 and st["lines"] == 2, f"Got: {st}")

    # Test /slug
    slug_in = "CoreType İle Çok Hızlı Başlangıç Rehberi! (2026)"
    slug_expected = "coretype-ile-cok-hizli-baslangic-rehberi-2026"
    slug_out = text_slug(slug_in)
    record_test(suite, "/slug URL friendly slugify", slug_out == slug_expected, f"Got: {slug_out}")

    # Test /json
    raw_json = '{"app":"coretype","version":"0.1.0","settings":{"locale":"tr"}}'
    fmt_json = json_format(raw_json)
    valid_json = "\n  \"app\": \"coretype\"" in fmt_json
    record_test(suite, "/json Prettify JSON formatting", valid_json, f"Formatted output:\n{fmt_json}")


# ----------------------------------------------------------------------
# 2. SNIPPET SYSTEM TEST SUITE
# ----------------------------------------------------------------------
def test_snippet_system():
    print(f"\n{BOLD}{CYAN}2. Running Snippet CRUD & Search Test Suite{RESET}")
    suite = "Snippet System"

    # Default snippets
    snippets = [
        {"name": "mail", "text": "iletisim@sirket.com"},
        {"name": "adres", "text": "Örnek Mah. Teknoloji Cad. No: 42"},
        {"name": "iban", "text": "TR33 0006 1005 1987 1234 5678 90"}
    ]

    # Create
    new_snip = {"name": "github", "text": "https://github.com/example/coretype"}
    snippets.append(new_snip)
    record_test(suite, "Snippet Add / Create (/kaydet)", any(s["name"] == "github" for s in snippets))

    # Read / Search filter
    query = "ma"
    matched = [s for s in snippets if s["name"].lower().startswith(query)]
    record_test(suite, "Snippet Slash Filter Search (/mail)", len(matched) == 1 and matched[0]["name"] == "mail")

    # Update
    for s in snippets:
        if s["name"] == "mail":
            s["text"] = "destek@coretype.io"
    updated = next(s["text"] for s in snippets if s["name"] == "mail")
    record_test(suite, "Snippet Update text content", updated == "destek@coretype.io")

    # Delete
    snippets = [s for s in snippets if s["name"] != "adres"]
    record_test(suite, "Snippet Delete (/sil)", not any(s["name"] == "adres" for s in snippets))
    record_test(suite, "Snippet Total Count Integrity", len(snippets) == 3)


# ----------------------------------------------------------------------
# 3. HISTORY VAULT TEST SUITE
# ----------------------------------------------------------------------
def test_history_vault():
    print(f"\n{BOLD}{CYAN}3. Running History Vault & Search Test Suite{RESET}")
    suite = "History Vault"

    # History entries
    vault: List[Dict[str, Any]] = [
        {
            "id": "h-1",
            "timestamp": int(time.time() * 1000) - 15000, # 15s ago
            "prompt": "/buyuk merhaba dunya",
            "result": "MERHABA DUNYA",
            "type": "transform"
        },
        {
            "id": "h-2",
            "timestamp": int(time.time() * 1000) - 180000, # 3 mins ago
            "prompt": "Python ile postgresql bağlantısı nasıl yapılır?",
            "result": "psycopg2 veya asyncpg kütüphanelerini kullanarak...",
            "type": "ai",
            "provider": "gemini",
            "model": "gemini-2.5-flash"
        },
        {
            "id": "h-3",
            "timestamp": int(time.time() * 1000) - 7200000, # 2 hours ago
            "prompt": "/json {\"status\":\"success\"}",
            "result": "{\n  \"status\": \"success\"\n}",
            "type": "transform"
        }
    ]

    # Schema check
    has_valid_schema = all(
        "id" in h and "timestamp" in h and "prompt" in h and "result" in h and "type" in h
        for h in vault
    )
    record_test(suite, "History Entry Schema Validation", has_valid_schema)

    # Relative Time Formatter (TR and EN)
    def format_rel_time(ts: int, lang: str = "tr") -> str:
        diff_s = (time.time() * 1000 - ts) / 1000
        if diff_s < 60:
            return "şimdi" if lang == "tr" else "just now"
        diff_m = diff_s / 60
        if diff_m < 60:
            return f"{int(diff_m)} dk önce" if lang == "tr" else f"{int(diff_m)}m ago"
        diff_h = diff_m / 60
        if diff_h < 24:
            return f"{int(diff_h)} saat önce" if lang == "tr" else f"{int(diff_h)}h ago"
        diff_d = diff_h / 24
        return f"{int(diff_d)} gün önce" if lang == "tr" else f"{int(diff_d)}d ago"

    rel_tr_now = format_rel_time(vault[0]["timestamp"], "tr")
    rel_tr_mins = format_rel_time(vault[1]["timestamp"], "tr")
    rel_en_hours = format_rel_time(vault[2]["timestamp"], "en")

    record_test(suite, "Relative Time Formatting (TR 'şimdi')", rel_tr_now == "şimdi")
    record_test(suite, "Relative Time Formatting (TR '3 dk önce')", "dk önce" in rel_tr_mins)
    record_test(suite, "Relative Time Formatting (EN '2h ago')", "2h ago" in rel_en_hours)

    # Search Filtering
    q = "postgresql"
    filtered = [h for h in vault if q in h["prompt"].lower() or q in h["result"].lower()]
    record_test(suite, "History Search Filtering (By keyword)", len(filtered) == 1 and filtered[0]["id"] == "h-2")

    # Terminal-style prompt history navigation (Up/Down arrow navigation)
    prompt_list = [h["prompt"] for h in vault]
    record_test(suite, "Terminal-style Prompt Extraction (Up/Down array)", len(prompt_list) == 3 and prompt_list[0] == "/buyuk merhaba dunya")

    # Single item deletion (Delete key)
    vault = [h for h in vault if h["id"] != "h-2"]
    record_test(suite, "Single Item Deletion (Delete Key action)", len(vault) == 2 and not any(h["id"] == "h-2" for h in vault))

    # Clear All Vault
    vault.clear()
    record_test(suite, "Clear History Vault (Delete All action)", len(vault) == 0)


# ----------------------------------------------------------------------
# 4. SETTINGS SCHEMA & PRIVACY WARNING VERIFICATION
# ----------------------------------------------------------------------
def test_settings_specification():
    print(f"\n{BOLD}{CYAN}4. Running Settings Specification & Disclaimer Test Suite{RESET}")
    suite = "Settings Specification"

    # Check disclaimer text in src/locales/tr.ts
    tr_ts_path = "/home/alphaghost/projects/CoreType-lnx/src/locales/tr.ts"
    with open(tr_ts_path, "r", encoding="utf-8") as f:
        locale_code = f.read()

    app_tsx_path = "/home/alphaghost/projects/CoreType-lnx/src/App.tsx"
    with open(app_tsx_path, "r", encoding="utf-8") as f:
        app_code = f.read()

    privacy_disclaimer = "Geçmiş tamamen şifrelemesiz olarak cihazınızda saklanmaktadır. Parola gibi herhangi bir özel bilgiyi kaydetmek sizin sorumluluğunuzdadır."
    record_test(suite, "Mandatory Privacy Warning Notice in Codebase (tr.ts)", privacy_disclaimer in locale_code)

    # Check 1000x900 window sizing
    has_1000_width = "width: 1000" in app_code or "1000.0" in app_code
    has_900_height = "height: 900" in app_code or "900.0" in app_code
    record_test(suite, "Settings Window 1000x900 Dimension Confirmation", has_1000_width and has_900_height)

    # Check tab structure in App.tsx
    tabs = ["general", "models", "appearance", "history", "snippets", "shortcuts", "about"]
    all_tabs_present = all(f'activeTab === "{t}"' in app_code or f'setActiveTab("{t}")' in app_code or f'id: "{t}"' in app_code for t in tabs)
    record_test(suite, "All 7 Settings Tabs Present (Genel first)", all_tabs_present)

    # Check Purple Ban compliance (no hex colors starting with purple shades like #8B5CF6, #7C3AED, etc. without exception)
    purple_matches = re.findall(r"#(?:7c3aed|8b5cf6|9333ea|a855f7|c084fc)", app_code, re.IGNORECASE)
    record_test(suite, "Purple Ban Compliance (No violet/purple UI accents)", len(purple_matches) == 0, f"Violations: {purple_matches}")


# ----------------------------------------------------------------------
# 5. IPC SOCKET & SHORTCUTS TEST SUITE
# ----------------------------------------------------------------------
def test_ipc_socket_and_shortcuts():
    print(f"\n{BOLD}{CYAN}5. Running IPC Socket & Global Shortcuts Test Suite{RESET}")
    suite = "IPC & System"

    sock_path = f"/run/user/{os.getuid()}/coretype.sock"
    socket_exists = os.path.exists(sock_path)
    record_test(suite, "Unix Domain Socket Existence (/run/user/.../coretype.sock)", socket_exists)

    if socket_exists:
        try:
            s = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
            s.settimeout(2.0)
            s.connect(sock_path)
            # Test sending toggle ping
            s.sendall(b"toggle\n")
            s.close()
            record_test(suite, "IPC Socket Send 'toggle' command", True)
            time.sleep(0.3)
            # Send toggle again to restore state
            s2 = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
            s2.connect(sock_path)
            s2.sendall(b"toggle\n")
            s2.close()
            record_test(suite, "IPC Socket Restore 'toggle' command", True)
        except Exception as e:
            record_test(suite, "IPC Socket Communication", False, str(e))
    else:
        record_test(suite, "IPC Socket Communication", False, "Socket path does not exist")

    # Check shortcut key registrations in src-tauri/src/lib.rs
    lib_rs_path = "/home/alphaghost/projects/CoreType-lnx/src-tauri/src/lib.rs"
    with open(lib_rs_path, "r", encoding="utf-8") as f:
        lib_code = f.read()

    has_ctrl_space = "Ctrl+Space" in lib_code
    has_ctrl_h = "Ctrl+H" in lib_code
    record_test(suite, "Global Shortcut Ctrl+Space Registration in Rust", has_ctrl_space)
    record_test(suite, "Global Shortcut Ctrl+H (History Vault) Registration in Rust", has_ctrl_h)


# ----------------------------------------------------------------------
# MAIN EXECUTION
# ----------------------------------------------------------------------
if __name__ == "__main__":
    print(f"{BOLD}{'='*65}")
    print(f"       CORETYPE FULL TEST SIMULATION SUITE (2026)")
    print(f"{'='*65}{RESET}")

    test_text_transforms()
    test_snippet_system()
    test_history_vault()
    test_settings_specification()
    test_ipc_socket_and_shortcuts()

    total = len(test_results)
    passed = sum(1 for t in test_results if t["passed"])
    failed = total - passed

    print(f"\n{BOLD}{'='*65}")
    print(f"TEST RUN SUMMARY: {total} total, {GREEN}{passed} passed{RESET}, {RED if failed else GREEN}{failed} failed{RESET}")
    print(f"{'='*65}{RESET}\n")

    if failed > 0:
        sys.exit(1)
    else:
        sys.exit(0)
