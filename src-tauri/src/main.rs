// Prevents additional console window on release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::io::Write;
use std::os::unix::net::UnixStream;

fn main() {
    let args: Vec<String> = std::env::args().collect();
    let socket_path = std::env::var("XDG_RUNTIME_DIR")
        .map(|dir| format!("{}/coretype.sock", dir))
        .unwrap_or_else(|_| "/tmp/coretype.sock".to_string());

    // If --toggle is passed, signal the running instance via socket and exit immediately
    if args.iter().any(|arg| arg == "--toggle" || arg == "-t" || arg == "toggle") {
        if let Ok(mut stream) = UnixStream::connect(&socket_path) {
            let _ = stream.write_all(b"toggle\n");
            eprintln!("[CoreType] Sent toggle signal to running instance.");
            return;
        } else {
            eprintln!("[CoreType] No running instance socket found, launching fresh instance with initial toggle...");
            std::env::set_var("CORETYPE_INITIAL_TOGGLE", "1");
        }
    }

    #[cfg(target_os = "linux")]
    {
        // Use X11 / XWayland backend unconditionally on Linux:
        // 1. Wayland protocol strictly forbids client-side window positioning (center() is a no-op on Wayland).
        //    Under XWayland, window.center() calculates screen geometry and moves the window to the exact center.
        // 2. Allows global shortcut hooks to listen reliably.
        // 3. Prevents WebKitGTK Wayland DMA-BUF Error 71 crashes on NVIDIA.
        std::env::set_var("GDK_BACKEND", "x11");
        std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
        std::env::set_var("__NV_DISABLE_EXPLICIT_SYNC", "1");
    }

    tauri_app_lib::run()
}
