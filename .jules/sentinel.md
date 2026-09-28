## 2024-05-18 - [CRITICAL] Time-of-Check to Time-of-Use (TOCTOU) in Secret Storage
**Vulnerability:** The application was writing sensitive API keys to `secrets.json` using `std::fs::write`, which created the file with default (usually overly permissive) permissions, and only tightened them to `0600` *afterwards*.
**Learning:** This brief window creates a TOCTOU race condition where a local attacker could read or replace the file before the permissions are secured.
**Prevention:** Always use `std::os::unix::fs::OpenOptionsExt` combined with `std::fs::OpenOptions` to atomically set secure permissions (like `0600`) *during* file creation when storing secrets.
