## 2024-05-24 - Command Injection in execute_system_action
**Vulnerability:** The application was using `sh -c` to execute user commands in `src-tauri/src/lib.rs`, creating a potential command injection vulnerability.
**Learning:** Shell interpolation via `sh -c` can be bypassed even with basic sanitization. Using a dedicated parsing library like `shlex` is necessary for executing complex user commands safely.
**Prevention:** Instead of using a shell interpreter, parse commands into arguments using `shlex` and execute them directly via `std::process::Command::new(&args[0]).args(&args[1..])`.
