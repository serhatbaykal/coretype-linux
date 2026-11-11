## 2024-05-18 - [CRITICAL] Prevent Command Injection by Avoiding sh -c
**Vulnerability:** The application was passing user-provided command strings directly to a shell via `sh -c` inside the `execute_system_action` function, leading to potential command injection risks.
**Learning:** Using a shell to evaluate raw user input allows for arbitrary command execution. Arguments and commands should not be concatenated as a single string and passed to a shell.
**Prevention:** Instead of using `sh -c <string>`, use a proper shell lexer like `shlex::split` to safely parse the input string into a list of arguments, and execute the binary directly using `std::process::Command::new(args[0]).args(&args[1..])`.
