## 2026-09-29 - [CRITICAL] Command Injection Bypass via Delimiters
**Vulnerability:** The `validate_and_sanitize_command` function intended to block privilege escalation (e.g., `sudo`, `su`) by checking the first word of a user-provided shell command. However, it only split the command string by whitespace, allowing attackers to bypass the check by chaining commands using shell delimiters without spaces (e.g., `ls;sudo sh`).
**Learning:** Security filters that attempt to parse shell syntax must account for all shell control operators (`;`, `&`, `|`, `\n`). Relying solely on whitespace tokenization is insufficient for shell command analysis.
**Prevention:** Always parse command strings into individual sub-commands using shell delimiters *before* tokenizing by whitespace for validation.
