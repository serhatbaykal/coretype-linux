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
