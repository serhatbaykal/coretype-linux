## 2023-10-24 - Command Injection via `sh -c`
**Vulnerability:** The application was executing user-provided commands via `sh -c` inside `execute_system_action`.
**Learning:** Using `sh -c` to execute commands that include user input allows for command injection through shell metacharacters like `|`, `;`, `&`, etc.
**Prevention:** Avoid shell execution. Instead, parse the command string into a list of arguments (e.g., using `shlex::split`) and execute the command directly using `std::process::Command::new(args[0]).args(&args[1..])`.
