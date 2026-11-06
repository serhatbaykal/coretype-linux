## 2024-11-06 - [CRITICAL] Prevent Command Injection via shell in execute_system_action
**Vulnerability:** The `execute_system_action` function executed unvalidated and raw commands by invoking `sh -c`. This could lead to a severe command injection vulnerability if user-supplied input was maliciously crafted.
**Learning:** Relying on the underlying system's shell interpreter (`sh`) to parse user-provided commands poses high risks, as shell metacharacters can be injected to chain unintended commands.
**Prevention:** Use the `shlex` crate to safely parse raw command strings into an argument list instead of using `sh -c`. Execute the program directly via `std::process::Command::new(program).args(args)` without an intermediary shell.
