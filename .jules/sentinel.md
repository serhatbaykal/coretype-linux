## 2025-02-15 - [TOCTOU in Secrets Storage]
**Vulnerability:** File and directory creation for secrets.json used `std::fs::write` and `std::fs::create_dir_all` before restricting permissions.
**Learning:** This creates a Time-of-Check to Time-of-Use race condition allowing local users to potentially read the secret data in the window before `set_permissions` is called.
**Prevention:** Use `std::fs::OpenOptions` and `std::fs::DirBuilder` with their respective Unix extensions (`mode`) to atomically create resources with the restricted permissions.
