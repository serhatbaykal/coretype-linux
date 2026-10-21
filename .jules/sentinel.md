## 2024-10-21 - [CRITICAL] Prevent Command Injection via execute_system_action
**Vulnerability:** The `execute_system_action` function executed arbitrary commands using `sh -c`. This could allow command injection using shell features like `;`, `|`, and `&&`, bypassing standard validation.
**Learning:** Even with basic keyword blacklisting, relying on `sh -c` is inherently insecure for executing dynamically constructed strings in Rust/Tauri applications.
**Prevention:** Always use a shell parsing library (like `shlex`) to safely split strings into a binary and arguments, and pass them directly to `std::process::Command` without invoking a shell.
