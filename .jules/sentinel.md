## 2025-10-24 - [CRITICAL] Command Injection Vulnerability Fix in CoreType System Execution
**Vulnerability:** CoreType DesktopAction `execute_system_action` used `sh -c` to execute user-provided commands via `DesktopActionPayload`. While a blocklist/sanitization was present, relying on `sh -c` fundamentally exposes the application to command injection if a bypass is found.
**Learning:** `sh -c` execution relies entirely on filtering blocklists, which are almost never exhaustive.
**Prevention:** Avoid `sh -c` entirely. Parse arguments and pass them directly to `std::process::Command::new(program).args(args)` instead.
