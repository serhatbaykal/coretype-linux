## 2024-05-18 - TOCTOU Vulnerability in File Creation
**Vulnerability:** Time-of-Check to Time-of-Use (TOCTOU) race condition when saving secrets, as files were created with default permissions and subsequently changed to `0o600`. Also directories were created with default permissions instead of `0o700`.
**Learning:** Default permissions in functions like `std::fs::write` and `std::fs::create_dir_all` can lead to brief moments where sensitive files are readable by unintended users.
**Prevention:** Use `std::fs::OpenOptions` with `std::os::unix::fs::OpenOptionsExt` (`mode`) to set permissions atomically on file creation. For directories, use `std::fs::DirBuilder` with `std::os::unix::fs::DirBuilderExt` (`mode`) to atomically enforce permissions on creation.
