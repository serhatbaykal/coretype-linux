## 2024-10-22 - Prevent TOCTOU in secret storage
**Vulnerability:** The application stored secrets by writing a file first (`std::fs::write`) and then changing its permissions (`std::fs::set_permissions`). This creates a Time-of-Check to Time-of-Use (TOCTOU) race condition where another process can read the file before the permissions are tightened.
**Learning:** Using `std::fs::write` or basic `File::create` defaults to world-readable permissions, leaving sensitive files momentarily exposed.
**Prevention:** Use `std::fs::OpenOptions` with `std::os::unix::fs::OpenOptionsExt` (`mode(0o600)`) to atomically create files with strict permissions. Similarly, use `std::fs::DirBuilder` with `std::os::unix::fs::DirBuilderExt` (`mode(0o700)`) for directories.
