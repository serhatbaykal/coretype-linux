## 2024-10-02 - Secure secrets directory creation
**Vulnerability:** The app's config directory where secrets are saved (`secrets.json`) is created using `std::fs::create_dir_all(&config_dir)` which doesn't guarantee atomic secure permissions (0700). There's also TOCTOU on the file.
**Learning:** We need to set proper directory and file creation permissions atomically.
**Prevention:** Use `std::fs::DirBuilder` with `std::os::unix::fs::DirBuilderExt` for dir and `std::fs::OpenOptions` with `std::os::unix::fs::OpenOptionsExt` for files.
