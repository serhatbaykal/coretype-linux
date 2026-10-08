## 2024-10-08 - TOCTOU Vulnerability in Secret Storage
**Vulnerability:** A Time-of-Check to Time-of-Use (TOCTOU) race condition in how sensitive files (like `secrets.json`) and directories were created. The file permissions were set to 0600 *after* the file was created.
**Learning:** If permissions are set after file creation, there is a small window of time where another process could access the file with default (usually less restrictive) permissions.
**Prevention:** Always use `std::fs::OpenOptions` with `std::os::unix::fs::OpenOptionsExt` (`mode`) for files and `std::fs::DirBuilder` with `std::os::unix::fs::DirBuilderExt` (`mode`) for directories to atomically set permissions during creation.
