---
name: project-initializer
description: Initialize agent context by scanning the entire project structure, dependencies, and core logic.
allowed-tools: Read, Search
version: 1.0
priority: CRITICAL
---

# Project Initializer Protocol (@init)

> **TRIGGER:** User types `@init` in the chat.
> **GOAL:** Comprehensively scan and memorize the project architecture, dependencies, and all core features so the user doesn't have to repeatedly instruct the agent to "read the code".

---

## The `@init` Protocol Sequence

When the user invokes `@init`, you **MUST** immediately execute the following scanning sequence using your tools before answering "I am ready". 

### Phase 1: Structural Scan (Directory Tree)
1. Use `list_dir` on the project root to understand the high-level directories.
2. Identify core application directories (e.g., `phone-app`, `shared`, `watch-app`, `src`, `app`).
3. If necessary, use `find_by_name` (e.g., `*.kt`, `*.java`, `*.ts`) to locate the main source files and build a comprehensive file map in your memory.

### Phase 2: Configuration & Dependency Scan
- **Read** (using `view_file` or `view_file_outline`) all key configuration files to understand the tech stack and entry points:
  - `build.gradle`, `build.gradle.kts`, `settings.gradle.kts`
  - `package.json`, `pom.xml`, `AndroidManifest.xml`
  - `CODEBASE.md`, `ARCHITECTURE.md`, `README.md` (if they exist)

### Phase 3: Core Architecture & Logic Scan
- Use `view_file` and `view_file_outline` to read the interfaces and implementations of major components.
- Locate and scan:
  - Base Application classes (e.g., `Application.kt`)
  - Dependency Injection setup (e.g., Dagger/Hilt, Koin modules)
  - Core ViewModels, Services, and Transport Providers
  - Shared domain models and constants.
- **Goal:** You must understand "how data flows", "where business logic is centralized", and the "current state of the application features".

### Phase 4: Deep Context Immersion
- If any particular feature or logic seems opaque, use `grep_search` to trace its usages across the codebase.
- Do not stop scanning until you are confident that there are "zero unknown features" conceptually in the active project scope.

---

## 🔴 CRITICAL RULES FOR @init

| Rule | Enforcement |
|------|-------------|
| **NO FAKE SCANS** | You must actively use tool calls (`list_dir`, `view_file`, etc.) immediately when `@init` is called. **Do not** just confidently say "I have scanned" without actually using the tools. |
| **READ ONLY** | During `@init`, only use Read and Search tools. **Do not modify** any code or files. |
| **MEMORY RETENTION**| The explicit purpose is to cache the codebase context into your active session memory. |

---

## Phase 5: Initialization Report

Once the tool calls are fully complete and you have mapped the project in your memory, provide the user with a concise **Initialization Report**:

```markdown
🤖 **Initialization Complete (@project-initializer)**

Projeyi detaylı bir şekilde taradım ve hafızama aldım:
- **Yapı:** [Bulunan ana modülleri/klasörleri listele]
- **Teknoloji/Bağımlılıklar:** [Kullanılan temel diller, framework'ler]
- **Temel Mimari:** [Gözlemlenen mimari kalıplar, örn. MVVM, Repository Pattern]

Şu an tüm kod bloklarına hakimim. Bugün ne inşa ediyoruz veya neyi çözüyoruz?
```
