## 2023-10-13 - Command Injection Fix
**Vulnerability:** The `execute_system_action` function allowed executing raw desktop actions via `std::process::Command::new("sh").args(["-c", raw_cmd])`. This passes unparsed input to shell executing it, potentially allowing command injection.
**Learning:** Shell execution with `-c` requires input to be perfectly sanitized. Since the input may contain arbitrary characters, it's safer to avoid shell execution entirely.
**Prevention:** Always parse command strings into vectors of arguments using a dedicated library (like `shlex`) and run the executable directly using `std::process::Command::new(&args[0]).args(&args[1..])` instead of going through a shell.
