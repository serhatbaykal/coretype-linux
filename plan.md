1. **Add `shlex` dependency**
   - Update `src-tauri/Cargo.toml` to include `shlex = "1"` under `[dependencies]`.
2. **Fix Command Injection**
   - In `src-tauri/src/lib.rs`, modify `execute_system_action` to use `shlex::split` to safely parse commands instead of executing them inside a `sh -c` shell. This prevents command injection vulnerabilities.
3. **Pre-commit Steps**
   - Call `pre_commit_instructions` to ensure proper testing, verification, review, and reflection are done.
4. **Journal Update**
   - Add a critical learning entry to `.jules/sentinel.md` about the command injection pattern and its prevention via `shlex`.
