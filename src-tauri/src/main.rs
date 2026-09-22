// Prevents additional console window on release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::io::Write;
use std::os::unix::net::UnixStream;

fn main() {
    let args: Vec<String> = std::env::args().collect();
    let socket_path = tauri_app_lib::get_ipc_socket_path();

    // CLI IPC Commands: --toggle, --settings, --history
    if args.iter().any(|arg| arg == "--toggle" || arg == "-t" || arg == "toggle") {
        if let Ok(mut stream) = UnixStream::connect(&socket_path) {
            let _ = stream.write_all(b"toggle\n");
            eprintln!("[CoreType] Sent toggle signal to running instance.");
            return;
        } else {
            eprintln!("[CoreType] No running instance socket found, launching fresh instance with initial toggle...");
            std::env::set_var("CORETYPE_INITIAL_TOGGLE", "1");
        }
    } else if args.iter().any(|arg| arg == "--settings" || arg == "-s" || arg == "settings") {
        if let Ok(mut stream) = UnixStream::connect(&socket_path) {
            let _ = stream.write_all(b"settings\n");
            eprintln!("[CoreType] Sent settings signal to running instance.");
            return;
        } else {
            eprintln!("[CoreType] No running instance socket found, launching fresh instance with initial settings...");
            std::env::set_var("CORETYPE_INITIAL_SETTINGS", "1");
        }
    } else if args.iter().any(|arg| arg == "--history" || arg == "history") {
        if let Ok(mut stream) = UnixStream::connect(&socket_path) {
            let _ = stream.write_all(b"history\n");
            eprintln!("[CoreType] Sent history signal to running instance.");
            return;
        } else {
            eprintln!("[CoreType] No running instance socket found, launching fresh instance with initial history...");
            std::env::set_var("CORETYPE_INITIAL_HISTORY", "1");
        }
    }

    #[cfg(target_os = "linux")]
    {
        // 1. Intelligent GDK_BACKEND configuration:
        let force_x11 = std::env::var("CORETYPE_FORCE_X11").map(|v| v == "1").unwrap_or(false);
        let force_wayland = std::env::var("CORETYPE_FORCE_WAYLAND").map(|v| v == "1").unwrap_or(false);

        if force_wayland {
            std::env::set_var("GDK_BACKEND", "wayland");
        } else if force_x11 {
            std::env::set_var("GDK_BACKEND", "x11");
        } else {
            // If running on pure Wayland (no XWayland/DISPLAY available), allow Wayland backend
            // Otherwise default to X11 with Wayland fallback
            let is_pure_wayland = std::env::var("WAYLAND_DISPLAY").is_ok() && std::env::var("DISPLAY").is_err();
            if is_pure_wayland {
                std::env::set_var("GDK_BACKEND", "wayland");
            } else {
                std::env::set_var("GDK_BACKEND", "x11,wayland");
            }
        }

        // 2. NVIDIA GPU vendor detection before setting proprietary driver workarounds
        let is_nvidia = std::path::Path::new("/proc/driver/nvidia/version").exists()
            || std::env::var("__NV_PRIME_RENDER_OFFLOAD").is_ok()
            || std::fs::read_to_string("/proc/modules").map(|s| s.contains("nvidia")).unwrap_or(false);

        if is_nvidia {
            // NVIDIA-specific workarounds for WebKitGTK DMABUF error 71 and explicit sync freeze
            std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
            std::env::set_var("__NV_DISABLE_EXPLICIT_SYNC", "1");
        }
    }

    tauri_app_lib::run()
}
