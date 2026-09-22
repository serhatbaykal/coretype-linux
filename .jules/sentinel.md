## 2024-05-18 - Fix Insecure Temporary File for KWin script
**Vulnerability:** Insecure temporary file creation in `/tmp/ct_act.js` which is predictable and world-writable.
**Learning:** Hardcoded `/tmp` paths are vulnerable to symlink attacks or TOCTOU issues.
**Prevention:** Use `XDG_RUNTIME_DIR` or generate unique filenames tied to the process ID and delete after use.
