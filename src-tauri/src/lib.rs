use std::sync::Mutex;
use std::thread;
use std::time::Duration;

use tauri::{AppHandle, Emitter, Manager};
use tauri::menu::{MenuBuilder, MenuItemBuilder};
use tauri::tray::TrayIconBuilder;
use tauri_plugin_global_shortcut::{
    Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutEvent, ShortcutState,
};

#[derive(Default)]
struct TargetWindowState {
    selected_text: Mutex<String>,
    is_terminal: Mutex<bool>,
    active_class: Mutex<String>,
    active_title: Mutex<String>,
    clipboard: Mutex<Option<arboard::Clipboard>>,
}

fn is_terminal_str(s: &str) -> bool {
    const TERMINALS: &[&str] = &[
        "terminal", "konsole", "alacritty", "kitty", "wezterm", "foot",
        "xterm", "urxvt", "terminator", "tilix", "ptyxis", "tilda",
        "guake", "yakuake", "rxvt", "contour", "ghostty", "hyper",
        "gnome-terminal", "xfce4-terminal", "mate-terminal", "lxterminal",
    ];
    let lower = s.to_lowercase();
    TERMINALS.iter().any(|&term| lower.contains(term))
}

pub fn get_xwayland_scale() -> f64 {
    // 1. Try reading KWin Xwayland Scale config
    if let Ok(out) = std::process::Command::new("kreadconfig6")
        .args(["--file", "kwinrc", "--group", "Xwayland", "--key", "Scale"])
        .output()
    {
        let s = String::from_utf8_lossy(&out.stdout).trim().to_string();
        if let Ok(scale) = s.parse::<f64>() {
            if scale > 0.1 {
                return scale;
            }
        }
    }
    // 2. Try kscreen-doctor -o
    if let Ok(out) = std::process::Command::new("kscreen-doctor")
        .arg("-o")
        .output()
    {
        let s = String::from_utf8_lossy(&out.stdout);
        for line in s.lines() {
            if let Some(idx) = line.find("Scale:") {
                let val_str = line[idx + 6..].trim();
                if let Ok(scale) = val_str.parse::<f64>() {
                    if scale > 0.1 {
                        return scale;
                    }
                }
            }
        }
    }
    1.0
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct MonitorGeometry {
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
    pub scale_factor: f64,
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct WindowGeometry {
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
}

pub fn get_target_monitor(
    window: &tauri::WebviewWindow,
    active_screen_rect: Option<(i32, i32, u32, u32)>,
) -> MonitorGeometry {
    // Tier 1: Active window's monitor from desktop environment (e.g. KWin on KDE Plasma)
    if let Some((sx, sy, sw, sh)) = active_screen_rect {
        if sw > 0 && sh > 0 {
            return MonitorGeometry {
                x: sx,
                y: sy,
                width: sw,
                height: sh,
                scale_factor: 1.0,
            };
        }
    }

    let available = window.available_monitors().ok().unwrap_or_default();

    // Tier 2: Check mouse cursor position to find the monitor currently hosting the cursor (GNOME, XFCE, Sway, i3, etc.)
    if !available.is_empty() {
        if let Ok(cursor) = window.cursor_position() {
            for m in &available {
                let pos = m.position();
                let size = m.size();
                let mx = pos.x as f64;
                let my = pos.y as f64;
                let mw = size.width as f64;
                let mh = size.height as f64;

                if cursor.x >= mx && cursor.x < mx + mw && cursor.y >= my && cursor.y < my + mh {
                    return MonitorGeometry {
                        x: pos.x,
                        y: pos.y,
                        width: size.width,
                        height: size.height,
                        scale_factor: m.scale_factor(),
                    };
                }
            }
        }

        // Tier 3: Current window monitor
        if let Ok(Some(current)) = window.current_monitor() {
            return MonitorGeometry {
                x: current.position().x,
                y: current.position().y,
                width: current.size().width,
                height: current.size().height,
                scale_factor: current.scale_factor(),
            };
        }

        // Tier 4: Primary monitor
        if let Ok(Some(primary)) = window.primary_monitor() {
            return MonitorGeometry {
                x: primary.position().x,
                y: primary.position().y,
                width: primary.size().width,
                height: primary.size().height,
                scale_factor: primary.scale_factor(),
            };
        }

        // Tier 5: First available monitor
        if let Some(first) = available.first() {
            return MonitorGeometry {
                x: first.position().x,
                y: first.position().y,
                width: first.size().width,
                height: first.size().height,
                scale_factor: first.scale_factor(),
            };
        }
    }

    // Tier 6: Safe generic baseline (1080p fallback)
    MonitorGeometry {
        x: 0,
        y: 0,
        width: 1920,
        height: 1080,
        scale_factor: 1.0,
    }
}

pub fn calculate_window_geometry(
    monitor: &MonitorGeometry,
    requested_width: u32,
    requested_height: u32,
) -> WindowGeometry {
    // Dynamic boundary clamping: leave safe margins so windows never overflow small screens
    let margin_x = 40u32;
    let margin_y = 60u32;

    let max_allowed_w = monitor.width.saturating_sub(margin_x).max(320);
    let max_allowed_h = monitor.height.saturating_sub(margin_y).max(200);

    let actual_w = requested_width.min(max_allowed_w);
    let actual_h = requested_height.min(max_allowed_h);

    let center_x = monitor.x + ((monitor.width.saturating_sub(actual_w)) / 2) as i32;
    let center_y = monitor.y + ((monitor.height.saturating_sub(actual_h)) / 2) as i32;

    let safe_x = center_x.max(monitor.x);
    let safe_y = center_y.max(monitor.y);

    WindowGeometry {
        x: safe_x,
        y: safe_y,
        width: actual_w,
        height: actual_h,
    }
}

struct ActiveContext {
    is_terminal: bool,
    screen_rect: Option<(i32, i32, u32, u32)>,
    class_name: String,
    window_title: String,
}

fn get_active_context() -> ActiveContext {
    let script = r#"
var res = "NONE";
var sx = 0, sy = 0, sw = 0, sh = 0;
var w = workspace.activeWindow;
var o = null;
if (w) {
    res = (w.resourceClass || "none") + "|||" + (w.caption || "none");
    o = w.output;
}
if (!o) {
    o = workspace.activeScreen;
}
if (o) {
    var dpr = o.devicePixelRatio || 1.0;
    var g = o.geometry;
    if (g && g.width > 0 && g.height > 0) {
        sx = Math.round(g.x * dpr);
        sy = Math.round(g.y * dpr);
        sw = Math.round(g.width * dpr);
        sh = Math.round(g.height * dpr);
    }
}
console.warn("CT_ACT:" + res + "|||" + sx + "|||" + sy + "|||" + sw + "|||" + sh);
"#;
    let _ = std::fs::write("/tmp/ct_act.js", script);
    let _ = std::process::Command::new("dbus-send")
        .args([
            "--session",
            "--dest=org.kde.KWin",
            "--type=method_call",
            "/Scripting",
            "org.kde.kwin.Scripting.loadScript",
            "string:/tmp/ct_act.js",
        ])
        .output();
    let _ = std::process::Command::new("dbus-send")
        .args([
            "--session",
            "--dest=org.kde.KWin",
            "--type=method_call",
            "/Scripting",
            "org.kde.kwin.Scripting.start",
            "string:/tmp/ct_act.js",
        ])
        .output();
    thread::sleep(Duration::from_millis(30));

    let _ = std::process::Command::new("dbus-send")
        .args([
            "--session",
            "--dest=org.kde.KWin",
            "--type=method_call",
            "/Scripting",
            "org.kde.kwin.Scripting.unloadScript",
            "string:/tmp/ct_act.js",
        ])
        .output();

    let mut is_term = false;
    let mut screen_rect = None;
    let mut class_name = String::new();
    let mut window_title = String::new();

    if let Ok(j_out) = std::process::Command::new("journalctl")
        .args(["--user", "-u", "plasma-kwin_wayland.service", "-n", "8", "--no-pager"])
        .output()
    {
        let j_str = String::from_utf8_lossy(&j_out.stdout);
        for line in j_str.lines().rev() {
            if let Some(idx) = line.find("CT_ACT:") {
                let content = &line[idx + 7..];
                let parts: Vec<&str> = content.split("|||").collect();
                if parts.len() >= 6 {
                    let raw_class = parts[0];
                    let raw_caption = parts[1];
                    let sx: i32 = parts[2].parse().unwrap_or(0);
                    let sy: i32 = parts[3].parse().unwrap_or(0);
                    let sw: u32 = parts[4].parse().unwrap_or(0);
                    let sh: u32 = parts[5].parse().unwrap_or(0);

                    if sw > 0 && sh > 0 {
                        screen_rect = Some((sx, sy, sw, sh));
                    }
                    class_name = raw_class.to_string();
                    window_title = raw_caption.to_string();

                    if is_terminal_str(&class_name) || is_terminal_str(&window_title) {
                        eprintln!("[CoreType] Active window identified as terminal via KWin: {} ({})", class_name, window_title);
                        is_term = true;
                    } else {
                        eprintln!("[CoreType] Active window identified via KWin: {} on screen ({},{},{}x{})", class_name, sx, sy, sw, sh);
                    }
                    return ActiveContext {
                        is_terminal: is_term,
                        screen_rect,
                        class_name,
                        window_title,
                    };
                }
            }
        }
    }

    // Fallback: xprop _NET_ACTIVE_WINDOW
    if let Ok(output) = std::process::Command::new("xprop")
        .args(["-root", "_NET_ACTIVE_WINDOW"])
        .output()
    {
        let out_str = String::from_utf8_lossy(&output.stdout);
        if let Some(id_str) = out_str.split_whitespace().last() {
            if id_str != "0x0" && id_str != "0" && !id_str.is_empty() {
                if let Ok(class_out) = std::process::Command::new("xprop")
                    .args(["-id", id_str, "WM_CLASS"])
                    .output()
                {
                    let raw = String::from_utf8_lossy(&class_out.stdout);
                    class_name = raw.trim().to_string();
                    if is_terminal_str(&class_name) {
                        eprintln!("[CoreType] Active window identified as terminal via WM_CLASS: {}", class_name);
                        is_term = true;
                    }
                }
            }
        }
    }

    ActiveContext {
        is_terminal: is_term,
        screen_rect,
        class_name,
        window_title,
    }
}

fn send_shortcut(ctrl: bool, shift: bool, key_char: char) -> Result<(), String> {
    use enigo::{
        Direction::{Click, Press, Release},
        Enigo, Key, Keyboard, Settings,
    };

    let mut enigo = Enigo::new(&Settings::default())
        .map_err(|e| format!("Enigo başlatılamadı: {:?}", e))?;

    if ctrl {
        enigo.key(Key::Control, Press)
            .map_err(|e| format!("Ctrl press hatası: {:?}", e))?;
    }
    if shift {
        enigo.key(Key::Shift, Press)
            .map_err(|e| format!("Shift press hatası: {:?}", e))?;
    }

    thread::sleep(Duration::from_millis(20));

    enigo.key(Key::Unicode(key_char), Click)
        .map_err(|e| format!("Karakter click hatası: {:?}", e))?;

    thread::sleep(Duration::from_millis(20));

    if shift {
        let _ = enigo.key(Key::Shift, Release);
    }
    if ctrl {
        let _ = enigo.key(Key::Control, Release);
    }

    Ok(())
}

fn type_text_simulation(text: &str, speed_ms: u64) -> Result<(), String> {
    use enigo::{Enigo, Keyboard, Settings};

    let mut enigo = Enigo::new(&Settings::default())
        .map_err(|e| format!("Enigo başlatılamadı: {:?}", e))?;

    if speed_ms == 0 {
        enigo.text(text)
            .map_err(|e| format!("Enigo metin hatası: {:?}", e))?;
    } else {
        for c in text.chars() {
            let s = c.to_string();
            let _ = enigo.text(&s);
            thread::sleep(Duration::from_millis(speed_ms));
        }
    }
    Ok(())
}

fn with_clipboard<F, R>(app: &AppHandle, f: F) -> Result<R, String>
where
    F: FnOnce(&mut arboard::Clipboard) -> Result<R, String>,
{
    let state = app.state::<TargetWindowState>();
    let mut guard = state.clipboard.lock().map_err(|e| e.to_string())?;
    if guard.is_none() {
        let cb = arboard::Clipboard::new().map_err(|e| format!("Clipboard başlatılamadı: {}", e))?;
        *guard = Some(cb);
    }
    f(guard.as_mut().unwrap())
}

fn paste_via_clipboard(app: &AppHandle, text: &str, is_terminal: bool) -> Result<(), String> {
    with_clipboard(app, |cb| {
        // 1. Save original clipboard
        let original_text = cb.get_text().unwrap_or_default();

        // 2. Set new text to clipboard (kept alive persistently in TargetWindowState)
        cb.set_text(text.to_string())
            .map_err(|e| format!("Panoya yazma hatası: {}", e))?;

        thread::sleep(Duration::from_millis(60));

        // 3. Send paste shortcut: Ctrl+Shift+V for terminal, Ctrl+V for standard
        if is_terminal {
            eprintln!("[CoreType] Sending Ctrl+Shift+V (terminal paste)");
            send_shortcut(true, true, 'v')?;
        } else {
            eprintln!("[CoreType] Sending Ctrl+V (standard paste)");
            send_shortcut(true, false, 'v')?;
        }

        thread::sleep(Duration::from_millis(300));

        // 4. Restore original clipboard
        let _ = cb.set_text(original_text);
        thread::sleep(Duration::from_millis(30));

        Ok(())
    })
}

fn capture_selection(app: &AppHandle, is_terminal: bool) -> String {
    let res = with_clipboard(app, |cb| {
        let original_clipboard = cb.get_text().unwrap_or_default();

        // Clear clipboard so we only capture freshly selected text
        let _ = cb.set_text(String::new());
        thread::sleep(Duration::from_millis(50));

        // Send copy shortcut: Ctrl+Shift+C for terminal, Ctrl+C for standard
        if is_terminal {
            let _ = send_shortcut(true, true, 'c');
        } else {
            let _ = send_shortcut(true, false, 'c');
        }

        // Wait for target app to write to clipboard
        thread::sleep(Duration::from_millis(150));

        let text = cb.get_text().unwrap_or_default();
        eprintln!("[CoreType] Selection captured: {} chars", text.len());

        // Restore original clipboard if nothing was selected
        if text.is_empty() && !original_clipboard.is_empty() {
            let _ = cb.set_text(original_clipboard);
        }

        Ok(text)
    });

    res.unwrap_or_default()
}

pub fn toggle_main_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let is_visible = window.is_visible().unwrap_or(false);
        eprintln!("[CoreType] Toggle main window! Currently visible: {}", is_visible);
        if is_visible {
            let _ = window.hide();
        } else {
            let state = app.state::<TargetWindowState>();
            
            // Detect active context (terminal + active screen geometry)
            let act_ctx = get_active_context();
            let is_terminal = act_ctx.is_terminal;
            if let Ok(mut guard) = state.is_terminal.lock() {
                *guard = is_terminal;
            }
            if let Ok(mut guard) = state.active_class.lock() {
                *guard = act_ctx.class_name;
            }
            if let Ok(mut guard) = state.active_title.lock() {
                *guard = act_ctx.window_title;
            }

            // Capture selected text via copy shortcut before showing window
            let selected = capture_selection(app, is_terminal);
            let has_selected = !selected.is_empty();
            if let Ok(mut guard) = state.selected_text.lock() {
                *guard = selected;
            }

            // Target dimensions matching CoreType spotlight UI (roomy 840x260)
            let req_w = 840u32;
            let req_h = if has_selected { 320u32 } else { 260u32 };
            
            let monitor = get_target_monitor(&window, act_ctx.screen_rect);
            let geom = calculate_window_geometry(&monitor, req_w, req_h);

            eprintln!("[CoreType] Universal positioning on monitor ({},{},{}x{}): placing at ({}, {}) size {}x{}",
                monitor.x, monitor.y, monitor.width, monitor.height, geom.x, geom.y, geom.width, geom.height);

            let _ = window.set_size(tauri::Size::Physical(tauri::PhysicalSize { width: geom.width, height: geom.height }));
            let _ = window.set_position(tauri::Position::Physical(tauri::PhysicalPosition { x: geom.x, y: geom.y }));
            let _ = window.show();
            let _ = window.set_focus();

            #[cfg(debug_assertions)]
            {
                // In debug mode, if localhost:1420 is used, auto-recover from any previous WebKit error page
                let _ = window.eval(r#"
                    if (!window.__CORETYPE_LOADED__) {
                        if (document.title.includes('Error') || document.body.innerText.includes('refused') || document.body.innerText.includes('Could not connect')) {
                            location.reload();
                        }
                        if (!window.__RETRY_TIMER__) {
                            window.__RETRY_TIMER__ = setInterval(function() {
                                fetch('http://localhost:1420/').then(function() {
                                    location.reload();
                                }).catch(function() {});
                            }, 1000);
                        }
                    }
                "#);
            }
        }
    }
}

pub fn toggle_history_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let is_visible = window.is_visible().unwrap_or(false);
        eprintln!("[CoreType] Toggle history window! Currently visible: {}", is_visible);
        if !is_visible {
            let act_ctx = get_active_context();
            let req_w = 840u32;
            let req_h = 540u32;

            let monitor = get_target_monitor(&window, act_ctx.screen_rect);
            let geom = calculate_window_geometry(&monitor, req_w, req_h);

            eprintln!("[CoreType] Universal positioning history on monitor ({},{},{}x{}): placing at ({}, {}) size {}x{}",
                monitor.x, monitor.y, monitor.width, monitor.height, geom.x, geom.y, geom.width, geom.height);

            let _ = window.set_size(tauri::Size::Physical(tauri::PhysicalSize { width: geom.width, height: geom.height }));
            let _ = window.set_position(tauri::Position::Physical(tauri::PhysicalPosition { x: geom.x, y: geom.y }));
            let _ = window.show();
            let _ = window.set_focus();
            let _ = window.emit("open_history_vault", ());
        } else {
            let _ = window.emit("toggle_history_vault", ());
        }
    }
}

#[tauri::command]
fn open_settings_window(app_handle: AppHandle) -> Result<(), String> {
    let act_ctx = get_active_context();
    let req_w = 1000u32;
    let req_h = 900u32;

    let target_monitor = if let Some(main_win) = app_handle.get_webview_window("main") {
        get_target_monitor(&main_win, act_ctx.screen_rect)
    } else if let Some(settings_win) = app_handle.get_webview_window("settings") {
        get_target_monitor(&settings_win, act_ctx.screen_rect)
    } else {
        MonitorGeometry { x: 0, y: 0, width: 1920, height: 1080, scale_factor: 1.0 }
    };

    let geom = calculate_window_geometry(&target_monitor, req_w, req_h);

    eprintln!("[CoreType] Universal positioning settings on monitor ({},{},{}x{}): placing at ({}, {}) size {}x{}",
        target_monitor.x, target_monitor.y, target_monitor.width, target_monitor.height, geom.x, geom.y, geom.width, geom.height);

    if let Some(existing) = app_handle.get_webview_window("settings") {
        let _ = existing.set_size(tauri::Size::Physical(tauri::PhysicalSize { width: geom.width, height: geom.height }));
        let _ = existing.set_position(tauri::Position::Physical(tauri::PhysicalPosition { x: geom.x, y: geom.y }));
        let _ = existing.show();
        let _ = existing.set_focus();
    } else {
        let win = tauri::WebviewWindowBuilder::new(
            &app_handle,
            "settings",
            tauri::WebviewUrl::App("/?page=settings".into()),
        )
        .title("CoreType Settings")
        .inner_size(geom.width as f64, geom.height as f64)
        .resizable(true)
        .decorations(false)
        .transparent(true)
        .always_on_top(true)
        .visible(false)
        .build()
        .map_err(|e| e.to_string())?;

        let _ = win.set_size(tauri::Size::Physical(tauri::PhysicalSize { width: geom.width, height: geom.height }));
        let _ = win.set_position(tauri::Position::Physical(tauri::PhysicalPosition { x: geom.x, y: geom.y }));
        let _ = win.show();
        let _ = win.set_focus();
    }
    Ok(())
}

#[tauri::command]
fn get_display_scale() -> f64 {
    1.0
}

#[tauri::command]
fn resize_window(app_handle: AppHandle, logical_width: f64, logical_height: f64) -> Result<(), String> {
    if let Some(window) = app_handle.get_webview_window("main") {
        let current_size = window.inner_size().ok();
        let needs_resize = match current_size {
            Some(cur) => (cur.width as f64 - logical_width).abs() > 1.0 || (cur.height as f64 - logical_height).abs() > 1.0,
            None => true,
        };

        if needs_resize {
            let res = window.set_size(tauri::Size::Physical(tauri::PhysicalSize {
                width: logical_width as u32,
                height: logical_height as u32,
            }));
            eprintln!(
                "[CoreType] Window resized to {}x{} (result: {:?})",
                logical_width, logical_height, res
            );
        }
    } else {
        eprintln!("[CoreType] window 'main' not found!");
    }
    Ok(())
}

#[tauri::command]
fn inject_text(
    app_handle: AppHandle,
    text: String,
    method: String,
    speed_ms: u64,
) -> Result<(), String> {
    eprintln!("[CoreType] inject_text called. method='{}', text_len={}", method, text.len());
    let state = app_handle.state::<TargetWindowState>();
    let is_terminal = state.is_terminal.lock().map(|g| *g).unwrap_or(false);

    // Give the target window time to regain focus after CoreType hides
    thread::sleep(Duration::from_millis(300));

    let use_paste = match method.as_str() {
        "paste" => true,
        "typing" => false,
        "hybrid" | _ => text.len() > 100 || text.contains('\n') || is_terminal,
    };

    if use_paste {
        eprintln!("[CoreType] Using clipboard paste method (is_terminal={})", is_terminal);
        paste_via_clipboard(&app_handle, &text, is_terminal)?;
    } else {
        eprintln!("[CoreType] Using typing simulation method");
        type_text_simulation(&text, speed_ms)?;
    }

    eprintln!("[CoreType] inject_text completed successfully");
    Ok(())
}

#[tauri::command]
fn hide_window(app_handle: AppHandle) -> Result<(), String> {
    if let Some(window) = app_handle.get_webview_window("main") {
        window.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn show_window(app_handle: AppHandle) -> Result<(), String> {
    if let Some(window) = app_handle.get_webview_window("main") {
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn get_selected_text(app_handle: AppHandle) -> Result<String, String> {
    let state = app_handle.state::<TargetWindowState>();
    let text = state.selected_text.lock()
        .map(|guard| guard.clone())
        .unwrap_or_default();
    Ok(text)
}

// ── Secure Secret Storage (Linux App Config Dir with 0600 permissions) ──

fn secrets_path(app_handle: &AppHandle) -> Result<std::path::PathBuf, String> {
    let config_dir = app_handle.path().app_config_dir()
        .map_err(|e| format!("Config dir bulunamadı: {}", e))?;
    std::fs::create_dir_all(&config_dir)
        .map_err(|e| format!("Config dir oluşturulamadı: {}", e))?;
    Ok(config_dir.join("secrets.json"))
}

fn read_secrets(app_handle: &AppHandle) -> serde_json::Value {
    let path = match secrets_path(app_handle) {
        Ok(p) => p,
        Err(_) => return serde_json::json!({}),
    };
    if path.exists() {
        let content = std::fs::read_to_string(&path).unwrap_or_default();
        serde_json::from_str(&content).unwrap_or(serde_json::json!({}))
    } else {
        serde_json::json!({})
    }
}

#[tauri::command]
fn save_secret(app_handle: AppHandle, key: String, value: String) -> Result<(), String> {
    let path = secrets_path(&app_handle)?;
    let mut secrets = read_secrets(&app_handle);

    if value.is_empty() {
        secrets.as_object_mut().map(|m| m.remove(&key));
        eprintln!("[CoreType] Secret deleted: {}", key);
    } else {
        secrets[&key] = serde_json::Value::String(value);
        eprintln!("[CoreType] Secret saved: {}", key);
    }

    let json_str = serde_json::to_string_pretty(&secrets).unwrap_or_default();
    std::fs::write(&path, &json_str)
        .map_err(|e| format!("Secret kayıt hatası: {}", e))?;

    // Set 0600 (read/write by owner only) on Linux
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let _ = std::fs::set_permissions(&path, std::fs::Permissions::from_mode(0o600));
    }

    Ok(())
}

#[tauri::command]
fn get_secret(app_handle: AppHandle, key: String) -> Result<String, String> {
    let secrets = read_secrets(&app_handle);
    Ok(secrets.get(&key)
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string())
}

#[tauri::command]
fn update_tray_language(app_handle: AppHandle, language: String) -> Result<(), String> {
    let (show_text, settings_text, quit_text) = if language == "en" {
        ("Show / Hide", "Settings", "Quit")
    } else {
        ("Göster / Gizle", "Ayarlar", "Çıkış")
    };

    if let Some(tray) = app_handle.tray_by_id("main_tray") {
        let show_item = MenuItemBuilder::with_id("show", show_text)
            .build(&app_handle)
            .map_err(|e| e.to_string())?;
        let settings_item = MenuItemBuilder::with_id("settings", settings_text)
            .build(&app_handle)
            .map_err(|e| e.to_string())?;
        let quit_item = MenuItemBuilder::with_id("quit", quit_text)
            .build(&app_handle)
            .map_err(|e| e.to_string())?;

        let tray_menu = MenuBuilder::new(&app_handle)
            .item(&show_item)
            .item(&settings_item)
            .separator()
            .item(&quit_item)
            .build()
            .map_err(|e| e.to_string())?;

        let _ = tray.set_menu(Some(tray_menu));
    }
    Ok(())
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
pub struct SystemContext {
    pub os_name: String,
    pub os_family: String,
    pub package_manager: String,
    pub desktop: String,
    pub shell: String,
    pub active_app: String,
    pub active_title: String,
    pub is_terminal: bool,
}

fn get_os_release_info() -> (String, String, String) {
    let content = std::fs::read_to_string("/etc/os-release")
        .or_else(|_| std::fs::read_to_string("/usr/lib/os-release"))
        .unwrap_or_default();

    let mut name = String::new();
    let mut id = String::new();
    let mut id_like = String::new();

    for line in content.lines() {
        let trimmed = line.trim();
        if let Some(val) = trimmed.strip_prefix("PRETTY_NAME=") {
            name = val.trim_matches('"').trim().to_string();
        } else if name.is_empty() && trimmed.starts_with("NAME=") {
            if let Some(val) = trimmed.strip_prefix("NAME=") {
                name = val.trim_matches('"').trim().to_string();
            }
        } else if let Some(val) = trimmed.strip_prefix("ID=") {
            id = val.trim_matches('"').trim().to_lowercase();
        } else if let Some(val) = trimmed.strip_prefix("ID_LIKE=") {
            id_like = val.trim_matches('"').trim().to_lowercase();
        }
    }

    if name.is_empty() {
        name = "Linux".to_string();
    }

    let family = if !id_like.is_empty() {
        id_like
    } else if !id.is_empty() {
        id.clone()
    } else {
        "linux".to_string()
    };

    let pkg_mgr = if family.contains("arch") || id.contains("cachyos") || id.contains("arch") || id.contains("manjaro") || id.contains("endeavouros") {
        "pacman / paru".to_string()
    } else if family.contains("debian") || family.contains("ubuntu") {
        "apt".to_string()
    } else if family.contains("fedora") || family.contains("rhel") {
        "dnf".to_string()
    } else if family.contains("suse") {
        "zypper".to_string()
    } else if family.contains("alpine") {
        "apk".to_string()
    } else {
        "varsayılan paket yöneticisi".to_string()
    };

    (name, family, pkg_mgr)
}

#[tauri::command]
fn get_system_context(app_handle: AppHandle) -> Result<SystemContext, String> {
    let (os_name, os_family, package_manager) = get_os_release_info();

    let desktop_env = std::env::var("XDG_CURRENT_DESKTOP").unwrap_or_default();
    let session_type = std::env::var("XDG_SESSION_TYPE").unwrap_or_default();
    let desktop = match (desktop_env.is_empty(), session_type.is_empty()) {
        (false, false) => format!("{} ({})", desktop_env, session_type),
        (false, true) => desktop_env,
        (true, false) => session_type,
        (true, true) => "Linux Desktop".to_string(),
    };

    let shell_path = std::env::var("SHELL").unwrap_or_else(|_| "bash".to_string());
    let shell_name = std::path::Path::new(&shell_path)
        .file_name()
        .and_then(|s| s.to_str())
        .unwrap_or(&shell_path)
        .to_string();

    let state = app_handle.state::<TargetWindowState>();
    let is_terminal = state.is_terminal.lock().map(|g| *g).unwrap_or(false);
    let active_class = state.active_class.lock().map(|g| g.clone()).unwrap_or_default();
    let active_title = state.active_title.lock().map(|g| g.clone()).unwrap_or_default();

    Ok(SystemContext {
        os_name,
        os_family,
        package_manager,
        desktop,
        shell: shell_name,
        active_app: active_class,
        active_title,
        is_terminal,
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(TargetWindowState::default())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(
                    |app: &tauri::AppHandle, shortcut: &Shortcut, event: ShortcutEvent| {
                        eprintln!("[CoreType] Shortcut event: key={:?}, mods={:?}, state={:?}", shortcut.key, shortcut.mods, event.state);
                        if event.state == ShortcutState::Pressed {
                            if shortcut.key == Code::Space && shortcut.mods == Modifiers::CONTROL {
                                toggle_main_window(app);
                            } else if shortcut.key == Code::KeyH && shortcut.mods == Modifiers::CONTROL {
                                toggle_history_window(app);
                            }
                        }
                    },
                )
                .build(),
        )
        .setup(|app| {
            let shortcut_space = Shortcut::new(Some(Modifiers::CONTROL), Code::Space);
            match app.global_shortcut().register(shortcut_space) {
                Ok(_) => eprintln!("[CoreType] Global shortcut Ctrl+Space registered successfully!"),
                Err(e) => eprintln!("[CoreType] ERROR registering shortcut Ctrl+Space: {:?}", e),
            }

            let shortcut_history = Shortcut::new(Some(Modifiers::CONTROL), Code::KeyH);
            match app.global_shortcut().register(shortcut_history) {
                Ok(_) => eprintln!("[CoreType] Global shortcut Ctrl+H registered successfully!"),
                Err(e) => eprintln!("[CoreType] ERROR registering shortcut Ctrl+H: {:?}", e),
            }

            // Setup Unix domain socket listener for instant CLI --toggle IPC
            let socket_path = std::env::var("XDG_RUNTIME_DIR")
                .map(|dir| format!("{}/coretype.sock", dir))
                .unwrap_or_else(|_| "/tmp/coretype.sock".to_string());

            let _ = std::fs::remove_file(&socket_path);

            if let Ok(listener) = std::os::unix::net::UnixListener::bind(&socket_path) {
                let app_handle = app.handle().clone();
                thread::spawn(move || {
                    use std::io::{BufRead, BufReader};
                    for stream in listener.incoming().flatten() {
                        let mut reader = BufReader::new(stream);
                        let mut line = String::new();
                        if reader.read_line(&mut line).is_ok() {
                            let cmd = line.trim();
                            if cmd == "toggle" {
                                toggle_main_window(&app_handle);
                            } else if cmd == "history" {
                                toggle_history_window(&app_handle);
                            } else if cmd == "settings" {
                                let _ = open_settings_window(app_handle.clone());
                            }
                        }
                    }
                });
                eprintln!("[CoreType] Unix IPC socket initialized at {}", socket_path);
            }

            if std::env::var("CORETYPE_INITIAL_TOGGLE").is_ok() {
                let app_handle = app.handle().clone();
                thread::spawn(move || {
                    thread::sleep(Duration::from_millis(350));
                    toggle_main_window(&app_handle);
                });
            }

            // System Tray
            let show_item = MenuItemBuilder::with_id("show", "Göster / Gizle").build(app)?;
            let settings_item = MenuItemBuilder::with_id("settings", "Ayarlar").build(app)?;
            let quit_item = MenuItemBuilder::with_id("quit", "Çıkış").build(app)?;

            let tray_menu = MenuBuilder::new(app)
                .item(&show_item)
                .item(&settings_item)
                .separator()
                .item(&quit_item)
                .build()?;

            TrayIconBuilder::with_id("main_tray")
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&tray_menu)
                .tooltip("CoreType — Ctrl+Space / Ctrl+H")
                .on_menu_event(|app, event| {
                    match event.id().as_ref() {
                        "show" => {
                            toggle_main_window(app);
                        }
                        "settings" => {
                            let _ = open_settings_window(app.clone());
                        }
                        "quit" => {
                            std::process::exit(0);
                        }
                        _ => {}
                    }
                })
                .build(app)?;

            eprintln!("[CoreType] System tray initialized");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            inject_text,
            hide_window,
            show_window,
            get_selected_text,
            save_secret,
            get_secret,
            get_display_scale,
            resize_window,
            get_system_context,
            update_tray_language,
            open_settings_window
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|_app_handle, event| {
            if let tauri::RunEvent::ExitRequested { api, .. } = event {
                api.prevent_exit();
            }
        });
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_centering_1080p_spotlight() {
        let monitor = MonitorGeometry {
            x: 0,
            y: 0,
            width: 1920,
            height: 1080,
            scale_factor: 1.0,
        };
        let geom = calculate_window_geometry(&monitor, 840, 260);
        assert_eq!(geom.width, 840);
        assert_eq!(geom.height, 260);
        assert_eq!(geom.x, 540);
        assert_eq!(geom.y, 410);
    }

    #[test]
    fn test_centering_1440p_spotlight() {
        let monitor = MonitorGeometry {
            x: 0,
            y: 0,
            width: 2560,
            height: 1440,
            scale_factor: 1.0,
        };
        let geom = calculate_window_geometry(&monitor, 840, 260);
        assert_eq!(geom.width, 840);
        assert_eq!(geom.height, 260);
        assert_eq!(geom.x, 860);
        assert_eq!(geom.y, 590);
    }

    #[test]
    fn test_centering_4k_spotlight() {
        let monitor = MonitorGeometry {
            x: 0,
            y: 0,
            width: 3840,
            height: 2160,
            scale_factor: 1.75,
        };
        let geom = calculate_window_geometry(&monitor, 840, 260);
        assert_eq!(geom.width, 840);
        assert_eq!(geom.height, 260);
        assert_eq!(geom.x, 1500);
        assert_eq!(geom.y, 950);
    }

    #[test]
    fn test_centering_dual_monitor_offset() {
        // Second monitor positioned to the right of primary 1080p monitor
        let monitor = MonitorGeometry {
            x: 1920,
            y: 0,
            width: 1920,
            height: 1080,
            scale_factor: 1.0,
        };
        let geom = calculate_window_geometry(&monitor, 840, 260);
        assert_eq!(geom.width, 840);
        assert_eq!(geom.height, 260);
        assert_eq!(geom.x, 1920 + 540);
        assert_eq!(geom.y, 410);
    }

    #[test]
    fn test_centering_ultrawide() {
        let monitor = MonitorGeometry {
            x: 0,
            y: 0,
            width: 3440,
            height: 1440,
            scale_factor: 1.0,
        };
        let geom = calculate_window_geometry(&monitor, 840, 260);
        assert_eq!(geom.width, 840);
        assert_eq!(geom.height, 260);
        assert_eq!(geom.x, (3440 - 840) / 2);
        assert_eq!(geom.y, (1440 - 260) / 2);
    }

    #[test]
    fn test_small_laptop_screen_clamping() {
        // Laptop screen: 1366x768. Settings window requested at 1000x900
        let monitor = MonitorGeometry {
            x: 0,
            y: 0,
            width: 1366,
            height: 768,
            scale_factor: 1.0,
        };
        let geom = calculate_window_geometry(&monitor, 1000, 900);
        // Height clamped to 768 - 60 = 708
        assert_eq!(geom.width, 1000);
        assert_eq!(geom.height, 708);
        assert!(geom.x >= 0);
        assert!(geom.y >= 0);
        assert!(geom.x + geom.width as i32 <= 1366);
        assert!(geom.y + geom.height as i32 <= 768);
    }

    #[test]
    fn test_extreme_small_resolution_no_overflow() {
        // 800x600 display
        let monitor = MonitorGeometry {
            x: 0,
            y: 0,
            width: 800,
            height: 600,
            scale_factor: 1.0,
        };
        let geom = calculate_window_geometry(&monitor, 1000, 900);
        assert!(geom.width <= 800);
        assert!(geom.height <= 600);
        assert!(geom.x >= 0);
        assert!(geom.y >= 0);
    }
}
