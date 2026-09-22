import { tr } from "./tr";
import { en } from "./en";
import { SupportedLanguage, LanguageSetting, TranslationSchema } from "./types";

export const translations: Record<SupportedLanguage, TranslationSchema> = {
  tr,
  en,
};

export function detectSystemLanguage(): SupportedLanguage {
  if (typeof navigator !== "undefined" && navigator.language) {
    const lang = navigator.language.toLowerCase();
    if (lang.startsWith("tr")) {
      return "tr";
    }
  }
  return "en";
}

export function resolveLanguage(setting?: LanguageSetting): SupportedLanguage {
  if (!setting || setting === "system") {
    return detectSystemLanguage();
  }
  return setting === "tr" ? "tr" : "en";
}

export function getTranslation(lang: SupportedLanguage): TranslationSchema {
  return translations[lang] || translations.en;
}

export interface SystemContext {
  os_name: string;
  os_family: string;
  package_manager: string;
  desktop: string;
  shell: string;
  active_app: string;
  active_title: string;
  is_terminal: boolean;
}

export function buildLocalizedSystemPrompt(
  sysCtx: SystemContext | null,
  lang: SupportedLanguage
): string {
  if (lang === "en") {
    const baseInstructions =
      "You are a system-wide, high-efficiency AI typing assistant. Respond directly with the final requested text or code. Do NOT include conversational greetings ('Sure, here it is:', 'Certainly!'), markdown intros, closing remarks, or extra explanations. Output only the pure final content ready to be injected into the user's cursor position.";

    if (!sysCtx) {
      return baseInstructions;
    }

    const envDetails: string[] = [];
    if (sysCtx.os_name) {
      envDetails.push(`- Operating System: ${sysCtx.os_name} (${sysCtx.os_family} based, package manager: ${sysCtx.package_manager})`);
    }
    if (sysCtx.desktop) {
      envDetails.push(`- Desktop Environment: ${sysCtx.desktop}`);
    }
    if (sysCtx.shell) {
      envDetails.push(`- Default Shell: ${sysCtx.shell}`);
    }
    if (sysCtx.active_app && sysCtx.active_app !== "none") {
      envDetails.push(
        `- Target Active Window: ${sysCtx.active_app}${
          sysCtx.active_title ? ` ("${sysCtx.active_title}")` : ""
        }${sysCtx.is_terminal ? " [TERMINAL / CLI]" : ""}`
      );
    }

    const contextBlock = `[ENVIRONMENT & SYSTEM CONTEXT]\n${envDetails.join("\n")}`;

    let specificRules = "";
    if (sysCtx.is_terminal) {
      specificRules = `[TERMINAL / COMMAND LINE RULES]:
1. You are currently in a terminal window (${sysCtx.active_app}, shell: ${sysCtx.shell}).
2. When system or package management commands are requested, generate commands specifically for ${sysCtx.os_name} (${sysCtx.os_family}) and ${sysCtx.shell}.
3. If package installation is needed, always use ${sysCtx.package_manager} (never produce Windows/cmd/powershell or Debian/Ubuntu apt commands if different).
4. NEVER wrap the output in markdown code blocks (\`\`\` or \`\`\`bash) or quotes. The output will be injected directly into the terminal prompt. Produce a single-line or chained pure command.
5. Never add any comments or explanations.`;
    } else {
      specificRules = `[GENERAL RULES]:
1. If the user requests code and they are inside an IDE/editor, output pure code without conversational filler.
2. If text editing, translation, or correction is requested, output only the transformed text.
3. Preserve indentation and formatting appropriate for the active application.`;
    }

    return `${baseInstructions}\n\n${contextBlock}\n\n${specificRules}`;
  }

  // Turkish (Default)
  const baseInstructions =
    "Sen sistem genelinde çalışan yüksek verimlilik odaklı bir AI asistanısın. Kullanıcının isteklerine doğrudan istenen nihai metin veya kod ile yanıt ver. Giriş cümlesi ('İşte istediğiniz kod:', 'Tabii ki' vb.), kapanış cümlesi veya ekstra nezaket/açıklama ifadeleri ekleme. Sadece doğrudan hedefe yazılacak saf çıktıyı üret.";

  if (!sysCtx) {
    return baseInstructions;
  }

  const envDetails: string[] = [];
  if (sysCtx.os_name) {
    envDetails.push(`- İşletim Sistemi: ${sysCtx.os_name} (${sysCtx.os_family} tabanlı, paket yöneticisi: ${sysCtx.package_manager})`);
  }
  if (sysCtx.desktop) {
    envDetails.push(`- Masaüstü Ortamı: ${sysCtx.desktop}`);
  }
  if (sysCtx.shell) {
    envDetails.push(`- Varsayılan Kabuk (Shell): ${sysCtx.shell}`);
  }
  if (sysCtx.active_app && sysCtx.active_app !== "none") {
    envDetails.push(
      `- Hedef Aktif Pencere: ${sysCtx.active_app}${
        sysCtx.active_title ? ` ("${sysCtx.active_title}")` : ""
      }${sysCtx.is_terminal ? " [TERMINAL / CLI]" : ""}`
    );
  }

  const contextBlock = `[ORTAM VE SİSTEM BAĞLAMI]\n${envDetails.join("\n")}`;

  let specificRules = "";
  if (sysCtx.is_terminal) {
    specificRules = `[TERMINAL / KOMUT SATIRI KURALLARI]:
1. Şu an bir terminal penceresindesin (${sysCtx.active_app}, kabuk: ${sysCtx.shell}).
2. Sistem/paket yönetimi komutları istendiğinde kesinlikle ${sysCtx.os_name} (${sysCtx.os_family}) ve ${sysCtx.shell} için geçerli komutlar üret.
3. Paket kurulumu gerekiyorsa daima ${sysCtx.package_manager} kullan (kesinlikle Windows/cmd/powershell veya Debian/Ubuntu apt/apt-get komutları üretme!).
4. Çıktıyı ASLA markdown kod bloğu (\`\`\` veya \`\`\`bash) içine alma, tırnak içine alma. Çıktı doğrudan terminal promptuna enjekte edilecektir. Tek satırlık veya zincirleme çalıştırılacak saf komutu ver.
5. Asla hiçbir açıklama veya yorum ekleme.`;
  } else {
    specificRules = `[GENEL KURALLAR]:
1. Kullanıcı kod istiyorsa ve bir IDE/editördeyse, sadece saf kodu üret.
2. Metin düzeltme, çeviri veya tamamlama isteniyorsa doğrudan nihai metni ver.
3. Formatlama ve satır sonlarını aktif uygulamaya en uygun şekilde koru.`;
  }

  return `${baseInstructions}\n\n${contextBlock}\n\n${specificRules}`;
}

export function buildSystemActionPrompt(
  sysCtx: SystemContext | null,
  lang: SupportedLanguage
): string {
  const desktopEnv = sysCtx?.desktop || "Linux Desktop";
  const shell = sysCtx?.shell || "bash";
  const osName = sysCtx?.os_name || "Linux";

  if (lang === "en") {
    return `You are the CoreType Linux Desktop Automation & Control Engine.
The user wants to control their Linux desktop system, audio, media, or run an inspection command via a natural language command starting with '!'.

[SYSTEM CONTEXT]
- OS: ${osName}
- Desktop: ${desktopEnv}
- Default Shell: ${shell}

[MANDATORY SECURITY & PRIVILEGE POLICY]:
1. USER-SPACE ONLY: CoreType strictly operates in user-space with normal user permissions.
2. ABSOLUTELY NO SUDO / ROOT / PRIVILEGE ESCALATION:
   If the user requests ANY action that requires root/sudo/administrator privileges (e.g. installing/removing/updating system packages with pacman/apt/dnf, modifying /etc or /boot or /usr, partition formatting, running sudo/su/doas/pkexec, dangerous deletion like rm -rf /):
   YOU MUST NOT PRODUCE ANY EXECUTABLE COMMAND.
   Instead, you MUST return:
   {
     "action_type": "blocked_root",
     "command": null,
     "title": "Privilege Restricted",
     "message": "This operation requires administrative privileges. For your security, CoreType does not modify system files or execute root commands.",
     "icon": "shield"
   }
3. SAFE USER-SPACE ACTIONS:
   - Volume control: 'pactl set-sink-volume @DEFAULT_SINK@ +10%', 'pactl set-sink-volume @DEFAULT_SINK@ -10%', 'pactl set-sink-volume @DEFAULT_SINK@ 50%', 'pactl set-sink-mute @DEFAULT_SINK@ toggle'. (icon: "volume")
   - Media playback: 'playerctl play-pause', 'playerctl next', 'playerctl previous', 'playerctl stop', 'playerctl play', 'playerctl pause'. (icon: "media")
   - Screen locking: 'loginctl lock-session'. (icon: "lock")
   - User-space queries/inspections: 'lsof -i :<port>', 'ss -tulpn', 'ps aux | grep <name>', 'uptime', 'free -h', 'df -h'. (action_type: "query", icon: "terminal")
   - Launching user apps: 'xdg-open <url or file path>'. (icon: "terminal")

[RESPONSE FORMAT]:
You MUST respond with a single, valid, raw JSON object. Do NOT wrap in markdown code blocks (\`\`\`json ... \`\`\`). Do NOT include any conversational preamble or explanations.
Schema:
{
  "action_type": "execute" | "query" | "blocked_root" | "error",
  "command": string | null,
  "title": string,
  "message": string,
  "icon": "volume" | "media" | "lock" | "terminal" | "shield" | "info" | "error"
}`;
  }

  // Turkish (Default)
  return `Sen CoreType Linux Masaüstü Otomasyon ve Sistem Kontrol Motorusun.
Kullanıcı '!' ile başlayan doğal dil komutlarıyla masaüstünü yönetmek, ses/medya kontrolü yapmak veya sistem sorgulaması gerçekleştirmek istemektedir.

[SİSTEM BAĞLAMI]
- İşletim Sistemi: ${osName}
- Masaüstü Ortamı: ${desktopEnv}
- Kabuk: ${shell}

[ZORUNLU GÜVENLİK VE YETKİ POLİTİKASI]:
1. SADECE KULLANICI ALANI (USER-SPACE): CoreType yalnızca standart kullanıcı izinleriyle çalışır.
2. KESİNLİKLE SUDO / ROOT / YÖNETİCİ YETKİSİ YOKTUR:
   Kullanıcının isteği yönetici veya root yetkisi gerektiriyorsa (örn: paket yöneticisi ile paket kurma/kaldırma/güncelleme pacman/apt/dnf, /etc veya sistem dosyalarını değiştirme, disk biçimlendirme, sudo/su/pkexec/doas gerektiren işlemler, tehlikeli silme rm -rf / vb.):
   KESİNLİKLE HİÇBİR KOMUT ÜRETME!
   Bunun yerine TAM OLARAK şu JSON nesnesini döndür:
   {
     "action_type": "blocked_root",
     "command": null,
     "title": "Yetki Sınırı",
     "message": "Bu işlem yönetici yetkisi gerektirir. Güvenliğiniz için CoreType sistem dosyalarına ve root komutlarına dokunmaz.",
     "icon": "shield"
   }
3. GÜVENLİ KULLANICI ALANI EYLEMLERİ:
   - Ses kontrolü: 'pactl set-sink-volume @DEFAULT_SINK@ +10%', 'pactl set-sink-volume @DEFAULT_SINK@ -10%', 'pactl set-sink-volume @DEFAULT_SINK@ 50%', 'pactl set-sink-mute @DEFAULT_SINK@ toggle'. (icon: "volume")
   - Medya oynatma: 'playerctl play-pause', 'playerctl next', 'playerctl previous', 'playerctl stop'. (icon: "media")
   - Ekran kilitleme: 'loginctl lock-session'. (icon: "lock")
   - Sistem sorguları: 'lsof -i :<port>', 'ss -tulpn', 'ps aux | grep <process>', 'uptime', 'free -h', 'df -h'. (action_type: "query", icon: "terminal")
   - Uygulama açma: 'xdg-open <url veya dosya yolu>'. (icon: "terminal")

[YANIT FORMATI]:
SADECE ve YALNIZCA tek bir ham JSON nesnesi döndür. Markdown kod bloğu (\`\`\`json ... \`\`\`) KULLANMA. Giriş, selamlaşma veya açıklama metni EKLEME.
Şema:
{
  "action_type": "execute" | "query" | "blocked_root" | "error",
  "command": string | null,
  "title": string,
  "message": string,
  "icon": "volume" | "media" | "lock" | "terminal" | "shield" | "info" | "error"
}`;
}

export function parseDesktopActionJson(
  raw: string,
  lang: SupportedLanguage = "tr"
): import("./types").DesktopActionPayload {
  let cleaned = raw.trim();
  // Strip markdown code fences if present
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  const trans = getTranslation(lang);

  try {
    const parsed = JSON.parse(cleaned);

    // If model signaled blocked_root or command contains sudo/su
    if (
      parsed.action_type === "blocked_root" ||
      (parsed.command && /\b(sudo|su|pkexec|doas)\b/.test(parsed.command))
    ) {
      return {
        action_type: "blocked_root",
        command: undefined,
        title: trans.desktopAction.sudoBlockedTitle,
        message: trans.desktopAction.sudoBlockedMessage,
        icon: "shield",
      };
    }

    return {
      action_type: parsed.action_type || "execute",
      command: parsed.command || undefined,
      title: parsed.title || trans.desktopAction.badgeText,
      message: parsed.message || (parsed.command ? parsed.command : trans.desktopAction.commandSuccess),
      icon: parsed.icon || "terminal",
    };
  } catch {
    return {
      action_type: "error",
      title: trans.desktopAction.commandFailed,
      message: raw.slice(0, 140),
      icon: "error",
    };
  }
}
