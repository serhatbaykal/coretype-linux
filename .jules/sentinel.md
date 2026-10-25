## 2024-05-24 - [CRITICAL] Prevent TOCTOU race condition in secrets storage
**Vulnerability:** A Time-of-Check to Time-of-Use (TOCTOU) race condition existed when creating the secrets directory and writing secrets. `std::fs::create_dir_all` and `std::fs::write` followed by `std::fs::set_permissions` allowed a window where a local attacker could read or traverse the directory/file before its permissions were locked down to owner-only (0o700 for directories, 0o600 for files).
**Learning:** Unix permissions must be established *atomically* during file and directory creation, instead of setting them after creation.
**Prevention:** Use `std::fs::DirBuilder` with `.mode()` for directory creation and `std::fs::OpenOptions` with `.mode()` alongside `.create(true).write(true)` for file creation.
