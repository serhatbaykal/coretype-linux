## 2024-05-24 - TOCTOU Vulnerability in Secret File Creation
**Vulnerability:** The `save_secret` function used `std::fs::write` to create a file with default permissions, and then used `std::fs::set_permissions` to restrict the permissions to `0o600`. This created a Time-of-Check to Time-of-Use (TOCTOU) vulnerability window where a malicious process could open the file before permissions were restricted and access secrets.
**Learning:** File creation and permission setting must be atomic to prevent TOCTOU vulnerabilities, especially when dealing with sensitive information.
**Prevention:** Always use `std::fs::OpenOptions` and `std::os::unix::fs::OpenOptionsExt` (`.mode(0o600)`) to create the file with restricted permissions directly, eliminating the vulnerability window.
