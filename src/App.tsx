import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow, PhysicalPosition } from "@tauri-apps/api/window";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import {
  resolveLanguage,
  getTranslation,
  buildLocalizedSystemPrompt,
  SystemContext,
} from "./locales/i18n";
import { SupportedLanguage, LanguageSetting, LocalizedSlashCommand, HistoryEntry } from "./locales/types";

export type { SystemContext };

interface AppSettings {
  language: LanguageSetting;
  provider: "gemini" | "openai" | "ollama";
  geminiKey: string;
  openaiKey: string;
  ollamaUrl: string;
  ollamaModel: string;

  injectionMethod: "hybrid" | "typing" | "paste";
  typingSpeed: number;
  accentColor: string;
  opacity: number;
  previewMode: boolean;
  autoCloseOnBlur: boolean;
}

export function buildSystemPrompt(sysCtx: SystemContext | null, lang: SupportedLanguage = "tr"): string {
  return buildLocalizedSystemPrompt(sysCtx, lang);
}

// Keys stored securely in OS Credential Manager (not localStorage)
const SECRET_KEYS = ["geminiKey", "openaiKey"] as const;

const DEFAULT_SETTINGS: AppSettings = {
  language: "system",
  provider: "gemini",
  geminiKey: "",
  openaiKey: "",
  ollamaUrl: "http://localhost:11434",
  ollamaModel: "llama3",

  injectionMethod: "hybrid",
  typingSpeed: 15,
  accentColor: "#6366f1",
  opacity: 0.82,
  previewMode: false,
  autoCloseOnBlur: false,
};

const COLOR_PRESETS = [
  { id: "indigo", color: "#6366f1", label: "Indigo" },
  { id: "teal", color: "#14b8a6", label: "Teal" },
  { id: "amber", color: "#f59e0b", label: "Amber" },
  { id: "rose", color: "#f43f5e", label: "Rose" },
  { id: "emerald", color: "#10b981", label: "Emerald" },
];

function applyTheme(settings: AppSettings) {
  const root = document.documentElement;
  const c = settings.accentColor;

  // Parse hex to RGB for alpha variants
  const r = parseInt(c.slice(1, 3), 16);
  const g = parseInt(c.slice(3, 5), 16);
  const b = parseInt(c.slice(5, 7), 16);

  root.style.setProperty("--accent-color", c);
  root.style.setProperty("--accent-hover", c);
  root.style.setProperty("--accent-glow", `rgba(${r}, ${g}, ${b}, 0.15)`);
  root.style.setProperty("--border-focus", `rgba(${r}, ${g}, ${b}, 0.4)`);
  root.style.setProperty("--border-color", `rgba(${r}, ${g}, ${b}, 0.12)`);
  root.style.setProperty("--bg-app", `rgba(10, 12, 22, ${settings.opacity})`);
  root.style.setProperty("--bg-input", `rgba(${r}, ${g}, ${b}, 0.06)`);
}

const MAX_HISTORY = 50;

// Snippet storage
interface Snippet { name: string; text: string; }

function loadSnippets(): Snippet[] {
  try {
    const s = localStorage.getItem("coretype_snippets");
    return s ? JSON.parse(s) : [];
  } catch { return []; }
}

function saveSnippet(name: string, text: string) {
  const snippets = loadSnippets().filter(s => s.name !== name);
  snippets.push({ name, text });
  localStorage.setItem("coretype_snippets", JSON.stringify(snippets));
}

function deleteSnippet(name: string) {
  const snippets = loadSnippets().filter(s => s.name !== name);
  localStorage.setItem("coretype_snippets", JSON.stringify(snippets));
}

// Check if this is the settings window
const isSettingsPage = window.location.search.includes("page=settings");

function loadSettings(): AppSettings {
  const saved = localStorage.getItem("coretype_settings");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Strip any leaked secrets from localStorage (migration)
      let migrated = false;
      for (const k of SECRET_KEYS) {
        if (parsed[k]) migrated = true;
        delete parsed[k];
      }
      if (migrated) {
        localStorage.setItem("coretype_settings", JSON.stringify(parsed));
      }
      return { ...DEFAULT_SETTINGS, ...parsed };
    } catch { }
  }
  return DEFAULT_SETTINGS;
}

// Load secrets from OS Credential Manager
async function loadSecrets(): Promise<Pick<AppSettings, typeof SECRET_KEYS[number]>> {
  const secrets: Record<string, string> = {};
  for (const key of SECRET_KEYS) {
    try {
      secrets[key] = await invoke<string>("get_secret", { key });
    } catch {
      secrets[key] = "";
    }
  }
  return secrets as Pick<AppSettings, typeof SECRET_KEYS[number]>;
}

// Save secrets to OS Credential Manager
async function saveSecrets(settings: AppSettings): Promise<void> {
  for (const key of SECRET_KEYS) {
    try {
      await invoke("save_secret", { key, value: settings[key] });
    } catch (e) {
      console.error(`Secret save failed for ${key}:`, e);
    }
  }
}

function loadHistoryVault(): HistoryEntry[] {
  try {
    const v = localStorage.getItem("coretype_history_vault");
    if (v) return JSON.parse(v);
    const oldH = localStorage.getItem("coretype_history");
    if (oldH) {
      const oldPrompts: string[] = JSON.parse(oldH);
      return oldPrompts.map((p, idx) => ({
        id: `legacy-${idx}-${Date.now()}`,
        timestamp: Date.now() - (oldPrompts.length - idx) * 60000,
        prompt: p,
        result: "",
        type: "ai" as const,
      }));
    }
    return [];
  } catch {
    return [];
  }
}

function saveHistoryVault(entries: HistoryEntry[]) {
  localStorage.setItem("coretype_history_vault", JSON.stringify(entries.slice(0, MAX_HISTORY)));
}

function clearHistoryVault() {
  localStorage.removeItem("coretype_history_vault");
  localStorage.removeItem("coretype_history");
}

function formatRelativeTime(timestamp: number, lang: "tr" | "en"): string {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return lang === "tr" ? "Şimdi" : "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} ${lang === "tr" ? "dk" : "m"}`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} ${lang === "tr" ? "sa" : "h"}`;
  const diffDays = Math.floor(diffHour / 24);
  if (diffDays < 7) return `${diffDays} ${lang === "tr" ? "g" : "d"}`;
  const d = new Date(timestamp);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

// ─── Settings Window Component ───

function SettingsView() {
  const [tempSettings, setTempSettings] = useState<AppSettings>(loadSettings);
  const [autoStart, setAutoStart] = useState(false);
  const [injectionMenuOpen, setInjectionMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const injectionRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  const currentLang = resolveLanguage(tempSettings.language);
  const t = getTranslation(currentLang);
  const [historyCount, setHistoryCount] = useState(() => loadHistoryVault().length);
  const [historyClearedToast, setHistoryClearedToast] = useState(false);

  const injectionOptions = [
    { value: "hybrid" as const, label: t.settings.general.methodHybrid, desc: t.settings.general.methodHybridDesc },
    { value: "typing" as const, label: t.settings.general.methodTyping, desc: t.settings.general.methodTypingDesc },
    { value: "paste" as const, label: t.settings.general.methodPaste, desc: t.settings.general.methodPasteDesc },
  ];

  const languageOptions = [
    { value: "system" as const, label: t.settings.general.langSystem },
    { value: "tr" as const, label: t.settings.general.langTr },
    { value: "en" as const, label: t.settings.general.langEn },
  ];

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (injectionRef.current && !injectionRef.current.contains(event.target as Node)) {
        setInjectionMenuOpen(false);
      }
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setLangMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load secrets from OS Credential Manager on mount
  useEffect(() => {
    loadSecrets().then((secrets) => {
      setTempSettings(prev => ({ ...prev, ...secrets }));
    });
    invoke<boolean>("plugin:autostart|is_enabled").then(setAutoStart).catch(() => { });
  }, []);

  // Show window smoothly once mounted and painted, eliminating any black flash
  useEffect(() => {
    applyTheme(tempSettings);
    const appWin = getCurrentWindow();
    const timer = setTimeout(async () => {
      try {
        await appWin.show();
        await appWin.setFocus();
      } catch (e) {
        console.error("Failed to show settings window:", e);
      }
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const handleSave = async () => {
    // Save secrets to OS Credential Manager
    await saveSecrets(tempSettings);
    // Save non-secret settings to localStorage (strip secrets)
    const safeSettings = { ...tempSettings };
    for (const k of SECRET_KEYS) (safeSettings as any)[k] = "";
    localStorage.setItem("coretype_settings", JSON.stringify(safeSettings));
    applyTheme(tempSettings);

    // Sync language with Rust backend tray menu
    const resolvedLang = resolveLanguage(tempSettings.language);
    await invoke("update_tray_language", { language: resolvedLang }).catch(() => {});

    getCurrentWindow().close();
  };

  const handleCancel = () => {
    getCurrentWindow().close();
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="coretype-app settings-window">
      <div className="settings-panel">
        <div className="settings-header">
          <div className="settings-title">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            {t.settings.windowTitle}
          </div>
          <button className="settings-close" onClick={handleCancel}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* AI Provider Section */}
        <div className="settings-section">
          <span className="section-label">{t.settings.models.providerLabel}</span>
          <div className="provider-pills">
            {([
              { id: "gemini", label: "Gemini" },
              { id: "openai", label: "OpenAI" },
              { id: "ollama", label: "Ollama" },
            ] as const).map((p) => (
              <button
                key={p.id}
                className={`provider-pill ${tempSettings.provider === p.id ? "active" : ""}`}
                onClick={() => setTempSettings({ ...tempSettings, provider: p.id })}
              >
                <span className="pill-dot" />
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Provider Config */}
        {tempSettings.provider === "gemini" && (
          <div className="provider-config">
            <div className="settings-group">
              <label className="settings-label">{t.settings.models.geminiKeyLabel}</label>
              <input
                type="password"
                className="settings-input"
                value={tempSettings.geminiKey}
                onChange={(e) => setTempSettings({ ...tempSettings, geminiKey: e.target.value })}
                placeholder="AIzaSy..."
              />
            </div>
          </div>
        )}

        {tempSettings.provider === "openai" && (
          <div className="provider-config">
            <div className="settings-group">
              <label className="settings-label">{t.settings.models.openaiKeyLabel}</label>
              <input
                type="password"
                className="settings-input"
                value={tempSettings.openaiKey}
                onChange={(e) => setTempSettings({ ...tempSettings, openaiKey: e.target.value })}
                placeholder="sk-..."
              />
            </div>
          </div>
        )}

        {tempSettings.provider === "ollama" && (
          <div className="provider-config">
            <div className="settings-row">
              <div className="settings-group">
                <label className="settings-label">{t.settings.models.ollamaUrlLabel}</label>
                <input
                  type="text"
                  className="settings-input"
                  value={tempSettings.ollamaUrl}
                  onChange={(e) => setTempSettings({ ...tempSettings, ollamaUrl: e.target.value })}
                  placeholder="http://localhost:11434"
                />
              </div>
              <div className="settings-group">
                <label className="settings-label">{t.settings.models.ollamaModelLabel}</label>
                <input
                  type="text"
                  className="settings-input"
                  value={tempSettings.ollamaModel}
                  onChange={(e) => setTempSettings({ ...tempSettings, ollamaModel: e.target.value })}
                  placeholder="llama3"
                />
              </div>
            </div>
          </div>
        )}

        {/* Language Section */}
        <div className="settings-section">
          <span className="section-label">{t.settings.general.languageLabel}</span>
          <div className="settings-row">
            <div className="settings-group">
              <label className="settings-label">{t.settings.general.languageDesc}</label>
              <div className="custom-select-wrapper" ref={langRef}>
                <button
                  type="button"
                  className={`custom-select-button ${langMenuOpen ? "open" : ""}`}
                  onClick={() => setLangMenuOpen(!langMenuOpen)}
                >
                  <span>
                    {languageOptions.find((m) => m.value === (tempSettings.language || "system"))?.label || t.settings.general.langSystem}
                  </span>
                  <svg
                    className={`custom-select-arrow ${langMenuOpen ? "rotated" : ""}`}
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {langMenuOpen && (
                  <div className="custom-select-menu">
                    {languageOptions.map((m) => (
                      <div
                        key={m.value}
                        className={`custom-select-item ${(tempSettings.language || "system") === m.value ? "selected" : ""}`}
                        onClick={() => {
                          const newLang = m.value as LanguageSetting;
                          setTempSettings({ ...tempSettings, language: newLang });
                          setLangMenuOpen(false);
                          const resolved = resolveLanguage(newLang);
                          invoke("update_tray_language", { language: resolved }).catch(() => {});
                        }}
                      >
                        <div className="custom-select-item-text">
                          <span className="custom-select-item-label">{m.label}</span>
                        </div>
                        {(tempSettings.language || "system") === m.value && (
                          <svg className="custom-select-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Writing Settings Section */}
        <div className="settings-section">
          <span className="section-label">{t.settings.general.injectionLabel}</span>
          <div className="settings-row">
            <div className="settings-group">
              <label className="settings-label">{t.settings.general.injectionDesc}</label>
              <div className="custom-select-wrapper" ref={injectionRef}>
                <button
                  type="button"
                  className={`custom-select-button ${injectionMenuOpen ? "open" : ""}`}
                  onClick={() => setInjectionMenuOpen(!injectionMenuOpen)}
                >
                  <span>
                    {injectionOptions.find((m) => m.value === tempSettings.injectionMethod)?.label || t.settings.general.methodHybrid}
                  </span>
                  <svg
                    className={`custom-select-arrow ${injectionMenuOpen ? "rotated" : ""}`}
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {injectionMenuOpen && (
                  <div className="custom-select-menu">
                    {injectionOptions.map((m) => (
                      <div
                        key={m.value}
                        className={`custom-select-item ${tempSettings.injectionMethod === m.value ? "selected" : ""}`}
                        onClick={() => {
                          setTempSettings({ ...tempSettings, injectionMethod: m.value });
                          setInjectionMenuOpen(false);
                        }}
                      >
                        <div className="custom-select-item-text">
                          <span className="custom-select-item-label">{m.label}</span>
                          <span className="custom-select-item-desc">{m.desc}</span>
                        </div>
                        {tempSettings.injectionMethod === m.value && (
                          <svg className="custom-select-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="settings-group">
              <label className="settings-label">{t.settings.general.typingSpeedLabel}</label>
              <div className="settings-number-stepper">
                <input
                  type="number"
                  className="settings-input settings-number-input"
                  value={tempSettings.typingSpeed}
                  onChange={(e) => setTempSettings({ ...tempSettings, typingSpeed: Math.max(1, Number(e.target.value)) })}
                  disabled={tempSettings.injectionMethod === "paste"}
                  min={1}
                />
                <div className="stepper-controls">
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() => setTempSettings(prev => ({ ...prev, typingSpeed: Number(prev.typingSpeed || 1) + 1 }))}
                    disabled={tempSettings.injectionMethod === "paste"}
                    tabIndex={-1}
                    title="Artır"
                  >
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="18 15 12 9 6 15" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() => setTempSettings(prev => ({ ...prev, typingSpeed: Math.max(1, Number(prev.typingSpeed || 1) - 1) }))}
                    disabled={tempSettings.injectionMethod === "paste" || Number(tempSettings.typingSpeed) <= 1}
                    tabIndex={-1}
                    title="Azalt"
                  >
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* System Section */}
        <div className="settings-section">
          <span className="section-label">{t.settings.tabs.general}</span>
          <div className="settings-row settings-system-row">
            <div className="settings-group">
              <label className="settings-label">{t.settings.general.autostartLabel}</label>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={autoStart}
                  onChange={async (e) => {
                    const enabled = e.target.checked;
                    try {
                      if (enabled) {
                        await invoke("plugin:autostart|enable");
                      } else {
                        await invoke("plugin:autostart|disable");
                      }
                      setAutoStart(enabled);
                    } catch (err) {
                      console.error("Autostart error:", err);
                    }
                  }}
                />
                <span className="toggle-slider" />
              </label>
            </div>
            <div className="settings-group">
              <label className="settings-label">{t.settings.general.previewModeLabel}</label>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={tempSettings.previewMode}
                  onChange={(e) => setTempSettings({ ...tempSettings, previewMode: e.target.checked })}
                />
                <span className="toggle-slider" />
              </label>
            </div>
            <div className="settings-group">
              <label className="settings-label">{t.settings.general.autoCloseLabel}</label>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={tempSettings.autoCloseOnBlur}
                  onChange={(e) => setTempSettings({ ...tempSettings, autoCloseOnBlur: e.target.checked })}
                />
                <span className="toggle-slider" />
              </label>
            </div>
          </div>
        </div>

        {/* Theme Section */}
        <div className="settings-section">
          <span className="section-label">{t.settings.general.accentColorLabel}</span>
          <div className="settings-group">
            <label className="settings-label">{t.settings.general.accentColorDesc}</label>
            <div className="color-presets">
              {COLOR_PRESETS.map((p) => (
                <div
                  key={p.id}
                  className={`color-dot${tempSettings.accentColor === p.color ? " active" : ""}`}
                  style={{ background: p.color }}
                  title={p.label}
                  onClick={(e) => {
                    setTempSettings({ ...tempSettings, accentColor: p.color });
                    // Ripple effect
                    const rect = (e.target as HTMLElement).getBoundingClientRect();
                    const ripple = document.createElement("div");
                    ripple.className = "theme-ripple";
                    ripple.style.left = rect.left + rect.width / 2 + "px";
                    ripple.style.top = rect.top + rect.height / 2 + "px";
                    ripple.style.background = p.color;
                    document.body.appendChild(ripple);
                    setTimeout(() => ripple.remove(), 500);
                  }}
                />
              ))}
            </div>
          </div>
          <div className="settings-group" style={{ marginTop: 8 }}>
            <label className="settings-label">{t.settings.general.opacityLabel} ({Math.round(tempSettings.opacity * 100)}%)</label>
            <input
              type="range"
              className="opacity-slider"
              min="0.3"
              max="0.95"
              step="0.05"
              value={tempSettings.opacity}
              onChange={(e) => setTempSettings({ ...tempSettings, opacity: Number(e.target.value) })}
            />
          </div>
        </div>

        {/* History Vault Section */}
        <div className="settings-section">
          <span className="section-label">{t.historyVault.title}</span>
          <div className="history-settings-card">
            <div className="history-settings-header">
              <div className="history-vault-title-box">
                <span className="settings-label" style={{ fontWeight: 600 }}>
                  {historyCount} {t.historyVault.entriesCount}
                </span>
              </div>
              <button
                type="button"
                className="history-clear-btn"
                onClick={() => {
                  clearHistoryVault();
                  setHistoryCount(0);
                  setHistoryClearedToast(true);
                  setTimeout(() => setHistoryClearedToast(false), 3000);
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                {historyClearedToast ? t.historyVault.allCleared : t.historyVault.clearHistoryBtn}
              </button>
            </div>
            <p className="history-disclaimer-text">
              {t.historyVault.privacyWarning}
            </p>
          </div>
        </div>

        {/* end of settings-panel scroll area */}
      </div>

      {/* Action Buttons — always visible at bottom */}
      <div className="actions-row sticky-actions">
        <button className="btn btn-secondary" onClick={handleCancel}>{t.settings.common.cancel}</button>
        <button className="btn btn-primary" onClick={handleSave}>{t.settings.common.save}</button>
      </div>
    </div>
  );
}

// Slash Commands Helpers
function findMatchedSlashCommand(commands: LocalizedSlashCommand[], text: string): { cmd?: LocalizedSlashCommand; arg: string } {
  const lower = text.toLowerCase();
  for (const c of commands) {
    const allTriggers = [c.trigger, ...c.aliases];
    for (const trig of allTriggers) {
      const tLower = trig.toLowerCase();
      if (lower === tLower) {
        return { cmd: c, arg: "" };
      }
      if (lower.startsWith(tLower + " ")) {
        return { cmd: c, arg: text.slice(trig.length).trim() };
      }
    }
  }
  return { cmd: undefined, arg: "" };
}

function filterSlashCommands(commands: LocalizedSlashCommand[], filterText: string): LocalizedSlashCommand[] {
  const filter = filterText.toLowerCase();
  return commands.filter(c =>
    c.trigger.slice(1).toLowerCase().startsWith(filter) ||
    c.label.toLowerCase().includes(filter) ||
    c.aliases.some(a => a.slice(1).toLowerCase().startsWith(filter))
  );
}

// ─── Main Input Component ───
function MainView() {
  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState<"idle" | "thinking" | "writing" | "error">("idle");
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const currentLang = resolveLanguage(settings.language);
  const t = getTranslation(currentLang);
  const slashCommands = t.slashCommands;
  const [statusText, setStatusText] = useState(() => t.spotlight.statusIdle);
  const [previewData, setPreviewData] = useState<{ original: string; result: string } | null>(null);
  const [secretsLoaded, setSecretsLoaded] = useState(false);
  const [sysContext, setSysContext] = useState<SystemContext | null>(null);

  // Keep idle status text in sync with language
  useEffect(() => {
    if (status === "idle") {
      setStatusText(t.spotlight.statusIdle);
    }
  }, [t, status]);

  // Load secrets and system context on mount
  useEffect(() => {
    loadSecrets().then((secrets) => {
      setSettings(prev => ({ ...prev, ...secrets }));
      setSecretsLoaded(true);
    }).catch(() => setSecretsLoaded(true));

    invoke<SystemContext>("get_system_context")
      .then(setSysContext)
      .catch(() => {});
  }, []);

  // History Vault
  const [historyVault, setHistoryVault] = useState<HistoryEntry[]>(loadHistoryVault);
  const [showHistoryVault, setShowHistoryVault] = useState(false);
  const [vaultFilter, setVaultFilter] = useState("");
  const [vaultActiveIdx, setVaultActiveIdx] = useState(0);
  const vaultInputRef = useRef<HTMLInputElement>(null);

  // Terminal-style prompt history derived from historyVault (most recent first)
  const promptList = useMemo(() => {
    const list: string[] = [];
    for (const item of historyVault) {
      if (item.prompt && !list.includes(item.prompt)) {
        list.push(item.prompt);
      }
    }
    return list;
  }, [historyVault]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const savedPromptRef = useRef("");

  // Filtered vault entries
  const filteredVault = useMemo(() => {
    if (!vaultFilter.trim()) return historyVault;
    const f = vaultFilter.toLowerCase();
    return historyVault.filter(item =>
      item.prompt.toLowerCase().includes(f) ||
      item.result.toLowerCase().includes(f) ||
      (item.model && item.model.toLowerCase().includes(f)) ||
      (item.provider && item.provider.toLowerCase().includes(f))
    );
  }, [historyVault, vaultFilter]);

  // Selected text context
  const [selectedText, setSelectedText] = useState("");

  // Slash command menu
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashActiveIdx, setSlashActiveIdx] = useState(0);

  const WINDOW_WIDTH = 840;
  const BASE_HEIGHT = 260;
  const SELECTION_HEIGHT = 320;
  const PREVIEW_HEIGHT = 540;
  const HISTORY_HEIGHT = 540;

  const SLASH_ITEM_HEIGHT = 40;
  const MAX_VISIBLE_ITEMS = 6;

  const currentWindowHeightRef = useRef<number>(BASE_HEIGHT);

  const getBaseHeight = useCallback(() => {
    return selectedText ? SELECTION_HEIGHT : BASE_HEIGHT;
  }, [selectedText]);

  const applyWindowHeight = useCallback((h: number) => {
    if (currentWindowHeightRef.current !== h) {
      currentWindowHeightRef.current = h;
      invoke("resize_window", { logicalWidth: WINDOW_WIDTH, logicalHeight: h }).catch(() => {});
    }
  }, []);

  const resizeForSlash = useCallback((itemCount: number) => {
    const base = getBaseHeight();
    const visibleCount = Math.min(itemCount, MAX_VISIBLE_ITEMS);
    const menuHeight = itemCount > 0 ? visibleCount * SLASH_ITEM_HEIGHT + 36 : 0;
    const h = base + menuHeight;
    applyWindowHeight(h);
  }, [getBaseHeight, applyWindowHeight]);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const glowTimerRef = useRef<number | null>(null);

  const openHistoryVault = useCallback(() => {
    setShowSlashMenu(false);
    resizeForSlash(0);
    setVaultFilter("");
    setVaultActiveIdx(0);
    setShowHistoryVault(true);
    applyWindowHeight(HISTORY_HEIGHT);
    setTimeout(() => vaultInputRef.current?.focus(), 50);
  }, [resizeForSlash, applyWindowHeight]);

  const closeHistoryVault = useCallback(() => {
    setShowHistoryVault(false);
    applyWindowHeight(getBaseHeight());
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [getBaseHeight, applyWindowHeight]);

  const toggleHistoryVault = useCallback(() => {
    if (showHistoryVault) {
      closeHistoryVault();
    } else {
      openHistoryVault();
    }
  }, [showHistoryVault, closeHistoryVault, openHistoryVault]);

  // Typewriter placeholder hints
  const placeholderHints = t.spotlight.placeholderHints;
  const [typedPlaceholder, setTypedPlaceholder] = useState(placeholderHints[0]);
  const [twTick, setTwTick] = useState(0);
  const hintIndexRef = useRef(0);
  const charIndexRef = useRef(placeholderHints[0].length);
  const phaseRef = useRef<"idle" | "deleting" | "typing">("idle");

  useEffect(() => {
    if (selectedText || prompt) return;

    const phase = phaseRef.current;
    const delay = phase === "idle" ? 2000 : 40;

    const timer = setTimeout(() => {
      if (phaseRef.current === "idle") {
        phaseRef.current = "deleting";
      } else if (phaseRef.current === "deleting") {
        if (charIndexRef.current > 0) {
          charIndexRef.current--;
          const hint = placeholderHints[hintIndexRef.current % placeholderHints.length];
          setTypedPlaceholder(hint.slice(0, charIndexRef.current));
        } else {
          hintIndexRef.current = (hintIndexRef.current + 1) % placeholderHints.length;
          phaseRef.current = "typing";
        }
      } else if (phaseRef.current === "typing") {
        const hint = placeholderHints[hintIndexRef.current % placeholderHints.length];
        if (charIndexRef.current < hint.length) {
          charIndexRef.current++;
          setTypedPlaceholder(hint.slice(0, charIndexRef.current));
        } else {
          phaseRef.current = "idle";
        }
      }
      setTwTick(t => t + 1);
    }, delay);

    return () => clearTimeout(timer);
  }, [twTick, selectedText, prompt, placeholderHints]);

  // Auto-resize textarea
  const autoResize = useCallback(() => {
    const el = inputRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 120) + "px";
    }
  }, []);

  // Autocomplete a slash command into the prompt without premature submission
  const applySlashCommand = useCallback((trigger: string) => {
    if (trigger === "/geçmiş" || trigger === "/gecmis" || trigger === "/history") {
      setPrompt("");
      openHistoryVault();
      return;
    }

    const completed = `${trigger} `;
    setPrompt(completed);
    setShowSlashMenu(false);
    resizeForSlash(0);

    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.selectionStart = completed.length;
        inputRef.current.selectionEnd = completed.length;
        autoResize();
      }
    }, 20);
  }, [resizeForSlash, autoResize, applyWindowHeight]);

  // Reload settings and capture selected text when window gets focus
  const isDroppingRef = useRef(false);
  const windowPosRef = useRef<{ x: number; y: number } | null>(null);
  const isOpeningSettingsRef = useRef(false);
  const hasBeenFocusedRef = useRef(false);

  useEffect(() => {
    const appWindow = getCurrentWindow();
    let unlisten: (() => void) | undefined;

    appWindow.onFocusChanged(async ({ payload: focused }) => {
      if (focused) {
        hasBeenFocusedRef.current = true;
        const newSettings = loadSettings();
        // Apply theme immediately (secrets don't affect theme)
        applyTheme(newSettings);
        // Load secrets from OS Credential Manager then set full settings
        loadSecrets().then((secrets) => {
          setSettings({ ...newSettings, ...secrets });
        });
        setPrompt("");
        setHistoryIndex(-1);
        setShowHistoryVault(false);
        setVaultFilter("");

        // Refresh system context from target window
        invoke<SystemContext>("get_system_context").then(setSysContext).catch(() => {});

        // Capture selected text from target window
        invoke<string>("get_selected_text").then((text) => {
          setSelectedText(text || "");
          // Don't resize if preview panel is open
          setPreviewData((prev) => {
            if (prev) return prev; // keep preview size
            const h = text ? SELECTION_HEIGHT : BASE_HEIGHT;
            applyWindowHeight(h);
            return null;
          });
        }).catch(() => {
          setSelectedText("");
          setPreviewData((prev) => {
            if (prev) return prev;
            applyWindowHeight(BASE_HEIGHT);
            return null;
          });
        });

        // Reset textarea height
        if (inputRef.current) inputRef.current.style.height = "auto";
        setTimeout(() => inputRef.current?.focus(), 50);
      } else {
        // Skip if window has not been focused yet, or if opening settings window
        if (!hasBeenFocusedRef.current) return;
        hasBeenFocusedRef.current = false;
        if (isOpeningSettingsRef.current) return;

        // Skip if window is not even visible
        try {
          const isVisible = await appWindow.isVisible();
          if (!isVisible) return;
        } catch {
          return;
        }

        // Auto-close on blur
        const currentSettings = loadSettings();
        if (currentSettings.autoCloseOnBlur && !isDroppingRef.current) {
          isDroppingRef.current = true;

          // Close settings window if open
          WebviewWindow.getByLabel("settings").then(async (settingsWin) => {
            if (settingsWin) {
              try { await settingsWin.close(); } catch {}
            }
          });

          // Animate window dropping off screen
          appWindow.outerPosition().then((pos) => {
            windowPosRef.current = { x: pos.x, y: pos.y };
            const startY = pos.y;
            const distance = 1200;
            const totalSteps = 25;
            const stepMs = 25;
            let step = 0;

            const timer = setInterval(() => {
              step++;
              const progress = step / totalSteps;
              const eased = progress * progress;
              const currentY = Math.round(startY + distance * eased);
              appWindow.setPosition(new PhysicalPosition(pos.x, currentY));

              if (step >= totalSteps) {
                clearInterval(timer);
                // Drop complete: hide then reset position
                (async () => {
                  await invoke("hide_window");
                  // Wait for window to fully disappear before resetting position
                  await new Promise(r => setTimeout(r, 400));
                  if (windowPosRef.current) {
                    await appWindow.setPosition(
                      new PhysicalPosition(windowPosRef.current.x, windowPosRef.current.y)
                    );
                  }
                  isDroppingRef.current = false;
                  setPrompt("");
                  setStatus("idle");
                  setStatusText("Hazır");
                  setShowSlashMenu(false);
                  setPreviewData(null);
                  resizeForSlash(0);
                  if (inputRef.current) inputRef.current.style.height = "auto";
                })();
              }
            }, stepMs);
          }).catch(async () => {
            isDroppingRef.current = false;
            await invoke("hide_window");
          });
        }
      }
    }).then((fn) => {
      unlisten = fn;
    });

    return () => { unlisten?.(); };
  }, []);

  // Also listen for localStorage changes from settings window
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "coretype_settings") {
        const newSettings = loadSettings();
        loadSecrets().then((secrets) => {
          setSettings({ ...newSettings, ...secrets });
        });
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Apply theme on mount
  useEffect(() => {
    applyTheme(settings);
  }, []);

  // Escape key handler
  const handleEscape = useCallback(async () => {
    if (showHistoryVault) {
      closeHistoryVault();
      return;
    }
    setPrompt("");
    setStatus("idle");
    setStatusText(t.spotlight.statusIdle);
    setShowSlashMenu(false);
    setPreviewData(null);
    resizeForSlash(0);
    if (inputRef.current) inputRef.current.style.height = "auto";
    await invoke("hide_window");
  }, [showHistoryVault, closeHistoryVault, resizeForSlash, t.spotlight.statusIdle]);

  const injectVaultItem = useCallback(async (item: HistoryEntry) => {
    const textToInject = item.result || item.prompt;
    if (!textToInject) return;
    closeHistoryVault();
    try {
      await invoke("hide_window");
      await invoke("inject_text", {
        text: textToInject,
        method: settings.injectionMethod,
        speedMs: Number(settings.typingSpeed)
      });
      setStatus("idle");
      setStatusText(t.spotlight.statusIdle);
    } catch (err: any) {
      setStatus("error");
      setStatusText(err.message || t.spotlight.statusError);
      await invoke("show_window");
    }
  }, [closeHistoryVault, settings.injectionMethod, settings.typingSpeed, t.spotlight.statusIdle, t.spotlight.statusError]);

  const handleVaultKeyDown = (e: React.KeyboardEvent, items: HistoryEntry[]) => {
    if (e.key === "Escape") {
      e.preventDefault();
      closeHistoryVault();
      return;
    }
    if (items.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setVaultActiveIdx(i => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setVaultActiveIdx(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selected = items[vaultActiveIdx];
      if (selected) injectVaultItem(selected);
    } else if (e.key === "Delete") {
      e.preventDefault();
      const selected = items[vaultActiveIdx];
      if (selected) {
        setHistoryVault(prev => {
          const next = prev.filter(entry => entry.id !== selected.id);
          saveHistoryVault(next);
          return next;
        });
        setStatusText(t.historyVault.itemDeleted);
        setTimeout(() => setStatusText(t.spotlight.statusIdle), 2000);
        if (vaultActiveIdx >= items.length - 1) {
          setVaultActiveIdx(Math.max(0, items.length - 2));
        }
      }
    } else if ((e.ctrlKey || e.metaKey) && (e.key === "c" || e.key === "C")) {
      const selected = items[vaultActiveIdx];
      if (selected && selected.result) {
        e.preventDefault();
        navigator.clipboard.writeText(selected.result).then(() => {
          setStatusText(t.spotlight.copySuccess);
          setTimeout(() => setStatusText(t.spotlight.statusIdle), 2000);
        }).catch(() => {});
      }
    }
  };

  const confirmPreview = useCallback(async () => {
    if (!previewData) return;
    const text = previewData.result;
    setPreviewData(null);
    try {
      await invoke("hide_window");
      await invoke("inject_text", {
        text,
        method: settings.injectionMethod,
        speedMs: Number(settings.typingSpeed)
      });
      setStatus("idle");
      setStatusText(t.spotlight.statusIdle);
    } catch (err: any) {
      setStatus("error");
      setStatusText(err.message || t.spotlight.statusError);
      await invoke("show_window");
    }
  }, [previewData, settings.injectionMethod, settings.typingSpeed, t.spotlight.statusIdle, t.spotlight.statusError]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleEscape();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "h" || e.key === "H")) {
        e.preventDefault();
        toggleHistoryVault();
      }
      // Preview mode: Enter to confirm inject
      if (e.key === "Enter" && previewData && !e.shiftKey) {
        e.preventDefault();
        confirmPreview();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleEscape, toggleHistoryVault, previewData, confirmPreview]);


  const openSettings = async () => {
    isOpeningSettingsRef.current = true;
    setTimeout(() => { isOpeningSettingsRef.current = false; }, 500);

    // Check if settings window already exists
    const existing = await WebviewWindow.getByLabel("settings");
    if (existing) {
      await existing.setFocus();
      return;
    }

    new WebviewWindow("settings", {
      url: "/?page=settings",
      title: `CoreType — ${t.settings.windowTitle}`,
      width: 900,
      height: 1000,
      resizable: false,
      decorations: false,
      transparent: true,
      center: true,
      alwaysOnTop: true,
      visible: false,
    });
  };

  // Local text transforms (no AI)
  const handleLocalTransform = async (commandId: string, text: string) => {
    if (!text) {
      setStatus("error");
      setStatusText(t.spotlight.selectTextToTransform);
      return;
    }

    let result = "";
    switch (commandId) {
      case "buyuk":
      case "upper":
        result = text.toLocaleUpperCase(currentLang === "tr" ? "tr" : "en");
        break;
      case "kucuk":
      case "lower":
        result = text.toLocaleLowerCase(currentLang === "tr" ? "tr" : "en");
        break;
      case "baslik":
      case "title":
        result = text.replace(/\S+/g, w => w.charAt(0).toLocaleUpperCase(currentLang === "tr" ? "tr" : "en") + w.slice(1).toLocaleLowerCase(currentLang === "tr" ? "tr" : "en"));
        break;
      case "say":
      case "count": {
        const chars = text.length;
        const words = text.trim().split(/\s+/).filter(Boolean).length;
        const lines = text.split("\n").length;
        setPrompt("");
        setSelectedText("");
        if (inputRef.current) inputRef.current.style.height = "auto";
        setStatusText(`${chars} ${t.spotlight.chars} · ${words} ${t.spotlight.words} · ${lines} ${t.spotlight.lines}`);
        setTimeout(() => setStatusText(t.spotlight.statusIdle), 4000);
        return;
      }
      case "slug":
        result = text
          .toLocaleLowerCase("tr")
          .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
          .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "");
        break;
      case "json":
        try {
          result = JSON.stringify(JSON.parse(text), null, 2);
        } catch {
          setStatus("error");
          setStatusText(t.spotlight.invalidJson);
          return;
        }
        break;
      default:
        return;
    }

    // Save transform to history vault
    const newEntry: HistoryEntry = {
      id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
      prompt: `/${commandId} ${text}`,
      result,
      type: "transform",
      selectedContext: text,
    };
    setHistoryVault(prev => {
      const next = [newEntry, ...prev.filter(e => e.id !== newEntry.id)];
      saveHistoryVault(next);
      return next;
    });

    setPrompt("");
    setSelectedText("");
    setShowSlashMenu(false);
    resizeForSlash(0);
    if (inputRef.current) inputRef.current.style.height = "auto";

    try {
      await invoke("hide_window");
      await invoke("inject_text", {
        text: result,
        method: settings.injectionMethod,
        speedMs: Number(settings.typingSpeed)
      });
      setStatus("idle");
      setStatusText(t.spotlight.statusIdle);
    } catch (err: any) {
      setStatus("error");
      setStatusText(err.message || t.spotlight.statusError);
      await invoke("show_window");
    }
  };

  // Strip markdown formatting
  const cleanLLMResponse = (text: string): string => {
    let cleaned = text.trim();
    // Strip markdown code blocks
    const codeBlockRegex = /^```[a-zA-Z]*\n?([\s\S]*?)\n?```$/;
    const match = cleaned.match(codeBlockRegex);
    if (match) cleaned = match[1].trim();
    // Strip inline backticks
    if (cleaned.startsWith('`') && cleaned.endsWith('`') && !cleaned.includes('\n')) {
      cleaned = cleaned.slice(1, -1);
    }
    // Strip triple quotes ("""...""" or '''...''')
    const tripleQuoteRegex = /^("""|''')\n?([\s\S]*?)\n?\1$/;
    const tqMatch = cleaned.match(tripleQuoteRegex);
    if (tqMatch) cleaned = tqMatch[2].trim();
    // Strip wrapping double quotes
    if (cleaned.startsWith('"') && cleaned.endsWith('"') && !cleaned.slice(1, -1).includes('"')) {
      cleaned = cleaned.slice(1, -1);
    }
    return cleaned;
  };

  const handleSend = async (promptOverride?: string) => {
    const effectivePrompt = promptOverride ?? prompt;
    if (!effectivePrompt.trim()) return;

    const trimmed = effectivePrompt.trim();

    // --- Snippet: /kaydet or /save name ---
    const saveMatch = trimmed.match(/^\/(?:kaydet|save)\s+(.+)$/i);
    if (saveMatch) {
      const snippetName = saveMatch[1].trim();
      if (!selectedText) {
        setStatus("error");
        setStatusText(t.spotlight.selectTextBeforeSave);
        return;
      }
      saveSnippet(snippetName, selectedText);
      setPrompt("");
      setSelectedText("");
      setStatus("idle");
      setStatusText(`📌 "${snippetName}" ${t.spotlight.savedSnippet}`);
      setTimeout(() => setStatusText(t.spotlight.statusIdle), 2000);
      return;
    }

    // --- Snippet: /sil or /delete name ---
    const deleteMatch = trimmed.match(/^\/(?:sil|delete)\s+(.+)$/i);
    if (deleteMatch) {
      const snippetName = deleteMatch[1].trim();
      deleteSnippet(snippetName);
      setPrompt("");
      setStatus("idle");
      setStatusText(`🗑️ "${snippetName}" ${t.spotlight.deletedSnippet}`);
      setTimeout(() => setStatusText(t.spotlight.statusIdle), 2000);
      return;
    }

    // --- Snippet: check if prompt matches a saved snippet ---
    const snippets = loadSnippets();
    const matchedSnippet = snippets.find(s => 
      trimmed === `/${s.name}` || trimmed === s.name
    );
    if (matchedSnippet) {
      setPrompt("");
      setShowSlashMenu(false);
      resizeForSlash(0);

      // Save snippet injection to history vault
      const newEntry: HistoryEntry = {
        id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: Date.now(),
        prompt: `/${matchedSnippet.name}`,
        result: matchedSnippet.text,
        type: "transform",
      };
      setHistoryVault(prev => {
        const next = [newEntry, ...prev.filter(e => e.id !== newEntry.id)];
        saveHistoryVault(next);
        return next;
      });

      try {
        await invoke("hide_window");
        await invoke("inject_text", {
          text: matchedSnippet.text,
          method: settings.injectionMethod,
          speedMs: Number(settings.typingSpeed)
        });
        setStatus("idle");
        setStatusText(t.spotlight.statusIdle);
      } catch (err: any) {
        setStatus("error");
        setStatusText(err.message || t.spotlight.statusError);
        await invoke("show_window");
      }
      return;
    }

    // --- Snippet or Slash Command matching ---
    // 1. Check if prompt starts with a known slash command trigger or alias
    const { cmd: matchedCmd, arg: cmdArg } = findMatchedSlashCommand(slashCommands, trimmed);

    // History vault slash command
    if (matchedCmd && (matchedCmd.id === "gecmis" || matchedCmd.trigger === "/geçmiş" || matchedCmd.trigger === "/history")) {
      setPrompt("");
      openHistoryVault();
      return;
    }

    // 2. Partial slash match without space (e.g. user typed /ko, /cm, /fi and pressed Enter)
    if (!matchedCmd && trimmed.startsWith("/") && !trimmed.includes(" ")) {
      const filter = trimmed.slice(1).toLowerCase();
      const partialCmd = slashCommands.find(c =>
        c.trigger.slice(1).toLowerCase().startsWith(filter) ||
        c.label.toLowerCase().startsWith(filter) ||
        c.aliases.some(a => a.slice(1).toLowerCase().startsWith(filter))
      );
      const matchedSnip = loadSnippets().find(s =>
        s.name.toLowerCase().startsWith(filter)
      );

      if (partialCmd) {
        // Autocomplete command into input box and let user continue typing!
        applySlashCommand(partialCmd.trigger);
        return;
      } else if (matchedSnip) {
        setPrompt("");
        setShowSlashMenu(false);
        resizeForSlash(0);
        try {
          await invoke("hide_window");
          await invoke("inject_text", {
            text: matchedSnip.text,
            method: settings.injectionMethod,
            speedMs: Number(settings.typingSpeed)
          });
          setStatus("idle");
          setStatusText(t.spotlight.statusIdle);
        } catch (err: any) {
          setStatus("error");
          setStatusText(err.message || t.spotlight.statusError);
          await invoke("show_window");
        }
        return;
      }
    }

    // 3. Process matched slash command or normal prompt
    let finalPrompt = effectivePrompt;
    const contextForPreview = selectedText; // capture before clearing

    if (matchedCmd) {
      setShowSlashMenu(false);
      resizeForSlash(0);

      // Local transforms (no AI)
      if (matchedCmd.isLocal) {
        const textToTransform = cmdArg || selectedText;
        if (!textToTransform) {
          setStatus("error");
          setStatusText(t.spotlight.selectTextToTransform);
          return;
        }
        return handleLocalTransform(matchedCmd.id, textToTransform);
      }

      // AI Slash Commands
      if (!cmdArg && !selectedText) {
        setStatus("error");
        setStatusText(`${t.spotlight.pleaseEnterPrompt} (${matchedCmd.trigger} ...)`);
        applySlashCommand(matchedCmd.trigger);
        return;
      }

      if (cmdArg && selectedText) {
        finalPrompt = `${t.spotlight.selectedTextLabel}:\n---\n${selectedText}\n---\n\n${t.spotlight.instructionLabel}: ${matchedCmd.template} ${cmdArg}`;
      } else if (cmdArg) {
        finalPrompt = `${matchedCmd.template} ${cmdArg}`;
      } else {
        finalPrompt = `${t.spotlight.selectedTextLabel}:\n---\n${selectedText}\n---\n\n${t.spotlight.instructionLabel}: ${matchedCmd.template}`;
      }
    } else {
      if (selectedText) {
        finalPrompt = `${t.spotlight.selectedTextLabel}:\n---\n${selectedText}\n---\n\n${t.spotlight.instructionLabel}: ${effectivePrompt}`;
      } else {
        finalPrompt = effectivePrompt;
      }
    }

    setHistoryIndex(-1);

    setStatus("thinking");
    setStatusText(t.spotlight.statusProcessing);
    const currentPrompt = finalPrompt;
    setPrompt("");
    setSelectedText("");
    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }

    try {
      // Validate API keys BEFORE hiding window
      if (settings.provider === "gemini" && !settings.geminiKey) {
        setStatus("error");
        setStatusText(t.spotlight.enterGeminiKey);
        return;
      }
      if (settings.provider === "openai" && !settings.openaiKey) {
        setStatus("error");
        setStatusText(t.spotlight.enterOpenaiKey);
        return;
      }


      await invoke("hide_window");

      // Fetch dynamic system context for environment-aware intelligence
      let currentSysCtx: SystemContext | null = sysContext;
      try {
        currentSysCtx = await invoke<SystemContext>("get_system_context");
        setSysContext(currentSysCtx);
      } catch (e) {
        console.warn("[CoreType] Could not fetch system context:", e);
      }
      const systemPrompt = buildSystemPrompt(currentSysCtx, currentLang);

      let responseText = "";

      if (settings.provider === "gemini") {
        responseText = await callGeminiAPI(currentPrompt, settings.geminiKey, systemPrompt);
      } else if (settings.provider === "openai") {
        responseText = await callOpenAIAPI(currentPrompt, settings.openaiKey, systemPrompt);
      } else if (settings.provider === "ollama") {
        responseText = await callOllamaAPI(settings.ollamaUrl, settings.ollamaModel, currentPrompt, systemPrompt);
      }

      setStatus("writing");
      setStatusText(t.spotlight.statusInjecting);
      responseText = cleanLLMResponse(responseText);

      // Save to history vault
      const newEntry: HistoryEntry = {
        id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: Date.now(),
        prompt: trimmed,
        result: responseText,
        type: "ai",
        provider: settings.provider,
        model: settings.provider === "gemini" ? "gemini-2.5-flash" : settings.provider === "openai" ? "gpt-4o-mini" : settings.ollamaModel,
        selectedContext: contextForPreview || undefined,
      };
      setHistoryVault(prev => {
        const next = [newEntry, ...prev.filter(e => e.id !== newEntry.id)];
        saveHistoryVault(next);
        return next;
      });

      if (settings.previewMode) {
        // Preview mode: show result before injecting
        setPreviewData({ original: contextForPreview || effectivePrompt, result: responseText });
        setStatus("idle");
        setStatusText(t.spotlight.statusPreviewHint);
        await invoke("show_window");
        // Resize window for preview
        applyWindowHeight(PREVIEW_HEIGHT);
      } else {
        await invoke("inject_text", {
          text: responseText,
          method: settings.injectionMethod,
          speedMs: Number(settings.typingSpeed)
        });
        setStatus("idle");
        setStatusText(t.spotlight.statusIdle);
      }
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setStatusText(err.message || t.spotlight.statusError);
      await invoke("show_window");
    }
  };

  // LLM API Calls with Dynamic Context Injection
  const callGeminiAPI = async (promptText: string, apiKey: string, systemPrompt: string): Promise<string> => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{
            text: systemPrompt
          }]
        },
        contents: [{
          parts: [{
            text: promptText
          }]
        }]
      })
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Gemini API isteği başarısız oldu");
    }
    const data = await response.json();
    const result = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!result) throw new Error("Gemini'den boş yanıt döndü");
    return result;
  };

  const callOpenAIAPI = async (promptText: string, apiKey: string, systemPrompt: string): Promise<string> => {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: promptText }
        ]
      })
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "OpenAI API isteği başarısız oldu");
    }
    const data = await response.json();
    const result = data.choices?.[0]?.message?.content;
    if (!result) throw new Error("OpenAI'dan boş yanıt döndü");
    return result;
  };

  const callOllamaAPI = async (baseUrl: string, model: string, promptText: string, systemPrompt: string): Promise<string> => {
    const cleanUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    try {
      const response = await fetch(`${cleanUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model, stream: false,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: promptText }
          ]
        })
      });
      if (!response.ok) throw new Error("Ollama sunucusu hata döndü");
      const data = await response.json();
      const result = data.message?.content;
      if (!result) throw new Error("Ollama'dan boş yanıt döndü");
      return result;
    } catch (err: any) {
      if (err.message?.includes("Ollama")) throw err;
      throw new Error("Ollama sunucusuna bağlanılamadı. Servisin açık olduğundan emin olun.");
    }
  };
  // Check if API key is configured for current provider
  const isApiConfigured = (() => {
    switch (settings.provider) {
      case "gemini": return !!settings.geminiKey;
      case "openai": return !!settings.openaiKey;

      case "ollama": return true; // local, no key needed
      default: return false;
    }
  })();

  const [onboardingDismissed, setOnboardingDismissed] = useState(
    () => !!localStorage.getItem("coretype_onboarding_dismissed")
  );
  const needsOnboarding = secretsLoaded && !isApiConfigured && !onboardingDismissed;

  return (
    <div className="coretype-app">
      {/* Onboarding Overlay */}
      {needsOnboarding && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 100,
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", gap: "10px", padding: "20px",
          background: "var(--glass-bg)", backdropFilter: "blur(20px)",
          borderRadius: "var(--window-radius)", textAlign: "center"
        }}>
          <div style={{ fontSize: "22px" }}>👋</div>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
            {t.spotlight.onboardingTitle}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: 1.5, maxWidth: "280px" }}>
            {t.spotlight.onboardingDesc}
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
            <button
              onClick={() => { localStorage.setItem("coretype_onboarding_dismissed", "1"); setOnboardingDismissed(true); openSettings(); }}
              style={{
                padding: "6px 16px", borderRadius: "6px", fontSize: "12px", fontWeight: 600,
                border: "none", background: "var(--accent-color)", color: "#fff", cursor: "pointer"
              }}
            >
              {t.spotlight.onboardingOpenSettings}
            </button>
            <button
              onClick={() => { localStorage.setItem("coretype_onboarding_dismissed", "1"); setOnboardingDismissed(true); }}
              style={{
                padding: "6px 12px", borderRadius: "6px", fontSize: "11px",
                border: "1px solid var(--border-color)", background: "transparent",
                color: "var(--text-secondary)", cursor: "pointer"
              }}
            >
              {t.spotlight.onboardingLater}
            </button>
          </div>
        </div>
      )}
      {/* Header Bar */}
      <div className="header-bar">
        <div className="logo-section">
          <div className="logo-icon" />
          <span className="logo-text">CORETYPE</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            className={`settings-toggle ${showHistoryVault ? "active" : ""}`}
            onClick={toggleHistoryVault}
            title={t.historyVault.title}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </button>
          <button className="settings-toggle" onClick={openSettings} title={t.settings.windowTitle}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
          <button className="close-toggle" onClick={handleEscape} title={t.settings.common.close}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      {showHistoryVault ? (
        <div className="history-vault-view">
          <div className="history-vault-header">
            <div className="history-vault-title-box">
              <span className="history-vault-title">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                {t.historyVault.title}
              </span>
              <span className="history-vault-badge">
                {filteredVault.length} / {historyVault.length}
              </span>
            </div>
            <button
              className="history-vault-close-btn"
              onClick={closeHistoryVault}
              title={t.historyVault.closeHint}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div className="history-vault-search-box">
            <svg className="history-vault-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              ref={vaultInputRef}
              type="text"
              className="history-vault-search-input"
              placeholder={t.historyVault.searchPlaceholder}
              value={vaultFilter}
              onChange={(e) => {
                setVaultFilter(e.target.value);
                setVaultActiveIdx(0);
              }}
              onKeyDown={(e) => handleVaultKeyDown(e, filteredVault)}
              autoFocus
            />
          </div>

          <div className="history-vault-list">
            {filteredVault.length === 0 ? (
              <div className="history-vault-empty">
                <span>
                  {historyVault.length === 0
                    ? t.historyVault.empty
                    : (currentLang === "tr" ? "Aramanızla eşleşen kayıt bulunamadı." : "No matching entries found.")}
                </span>
              </div>
            ) : (
              filteredVault.map((item, idx) => (
                <div
                  key={item.id}
                  className={`history-vault-item ${idx === vaultActiveIdx ? "active" : ""}`}
                  onClick={() => injectVaultItem(item)}
                  onMouseEnter={() => setVaultActiveIdx(idx)}
                >
                  <div className="history-vault-item-header">
                    <span className="history-vault-item-prompt" title={item.prompt}>
                      {item.prompt}
                    </span>
                    <div className="history-vault-item-meta">
                      <span className={`history-vault-type-tag ${item.type}`}>
                        {item.type === "ai" ? (item.model || t.historyVault.aiType) : t.historyVault.transformType}
                      </span>
                      <span className="history-vault-item-time">
                        {formatRelativeTime(item.timestamp, currentLang)}
                      </span>
                    </div>
                  </div>
                  {item.result && (
                    <div className="history-vault-item-result">
                      {item.result}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="history-vault-footer">
            <div className="history-vault-hints">
              <div className="history-vault-hint-item">
                <kbd>↑</kbd><kbd>↓</kbd>
              </div>
              <div className="history-vault-hint-item">
                <kbd>{t.historyVault.injectHint.split(": ")[0]}</kbd> {t.historyVault.injectHint.split(": ")[1]}
              </div>
              <div className="history-vault-hint-item">
                <kbd>{t.historyVault.copyHint.split(": ")[0]}</kbd> {t.historyVault.copyHint.split(": ")[1]}
              </div>
              <div className="history-vault-hint-item">
                <kbd>{t.historyVault.deleteHint.split(": ")[0]}</kbd> {t.historyVault.deleteHint.split(": ")[1]}
              </div>
            </div>
            <div className="history-vault-hint-item">
              <kbd>{t.historyVault.closeHint.split(": ")[0]}</kbd> {t.historyVault.closeHint.split(": ")[1]}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Input */}
          {selectedText && (
            <div className="context-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
              <span className="context-text">{selectedText.length > 50 ? selectedText.slice(0, 50) + '…' : selectedText}</span>
              <span className="context-stats">{selectedText.length} {t.spotlight.chars} · {selectedText.trim().split(/\s+/).filter(Boolean).length} {t.spotlight.words}</span>
              <button className="context-clear" onClick={() => setSelectedText("")}>×</button>
            </div>
          )}
          <div className="input-wrapper">
            {/* Slash Command Dropdown */}
            {showSlashMenu && (() => {
              const filter = prompt.slice(1).toLowerCase();
              const filtered = filterSlashCommands(slashCommands, filter);
              const snippets = loadSnippets().filter(s =>
                s.name.toLowerCase().startsWith(filter)
              );
              if (filtered.length === 0 && snippets.length === 0) return null;
              return (
                <div className="slash-menu">
                  {filtered.map((cmd, i) => (
                    <div
                      key={cmd.id}
                      className={`slash-item${i === slashActiveIdx ? " active" : ""}`}
                      onMouseEnter={() => setSlashActiveIdx(i)}
                      onClick={() => {
                        applySlashCommand(cmd.trigger);
                      }}
                    >
                      <span className="slash-trigger">{cmd.trigger}</span>
                      <span className="slash-desc">{cmd.desc}</span>
                    </div>
                  ))}
                  {filtered.length > 0 && snippets.length > 0 && (
                    <div className="slash-separator" />
                  )}
                  {snippets.map((snip, i) => {
                    const idx = filtered.length + i;
                    return (
                      <div
                        key={`snip-${snip.name}`}
                        className={`slash-item snippet-item${idx === slashActiveIdx ? " active" : ""}`}
                        onMouseEnter={() => setSlashActiveIdx(idx)}
                        onClick={async () => {
                          setPrompt("");
                          setShowSlashMenu(false);
                          resizeForSlash(0);
                          await invoke("hide_window");
                          await invoke("inject_text", {
                            text: snip.text,
                            method: settings.injectionMethod,
                            speedMs: Number(settings.typingSpeed)
                          });
                        }}
                      >
                        <span className="slash-trigger">📌 /{snip.name}</span>
                        <span className="slash-desc">{snip.text.length > 40 ? snip.text.slice(0, 40) + "…" : snip.text}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            <textarea
              ref={inputRef}
              className={`main-input${status === "thinking" ? " thinking-glow" : ""}`}
              value={prompt}
              onChange={(e) => {
                const val = e.target.value;
                setPrompt(val);
                if (historyIndex !== -1) setHistoryIndex(-1);
                autoResize();

                // Slash menu logic
                if (val.startsWith("/") && !val.includes("\n") && !val.includes(" ")) {
                  const filter = val.slice(1).toLowerCase();
                  const cmds = filterSlashCommands(slashCommands, filter);
                  const snips = loadSnippets().filter(s =>
                    s.name.toLowerCase().startsWith(filter)
                  );
                  const total = cmds.length + snips.length;
                  setShowSlashMenu(true);
                  setSlashActiveIdx(0);
                  resizeForSlash(total);
                } else {
                  setShowSlashMenu(false);
                  resizeForSlash(0);
                }
              }}
              onKeyDown={(e) => {
                // Toggle history vault
                if ((e.ctrlKey || e.metaKey) && (e.key === "h" || e.key === "H")) {
                  e.preventDefault();
                  toggleHistoryVault();
                  return;
                }

                // Slash menu navigation
                if (showSlashMenu) {
                  const filter = prompt.slice(1).toLowerCase();
                  const filtered = filterSlashCommands(slashCommands, filter);
                  const snips = loadSnippets().filter(s =>
                    s.name.toLowerCase().startsWith(filter)
                  );
                  const totalItems = filtered.length + snips.length;

                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setSlashActiveIdx(Math.min(slashActiveIdx + 1, totalItems - 1));
                    return;
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setSlashActiveIdx(Math.max(slashActiveIdx - 1, 0));
                    return;
                  } else if ((e.key === "Tab" || e.key === "Enter") && totalItems > 0) {
                    e.preventDefault();
                    if (slashActiveIdx < filtered.length) {
                      // Command: Tab or Enter completes the command into input box
                      const cmd = filtered[slashActiveIdx];
                      applySlashCommand(cmd.trigger);
                    } else {
                      // Snippet
                      const snip = snips[slashActiveIdx - filtered.length];
                      setShowSlashMenu(false);
                      resizeForSlash(0);
                      handleSend("/" + snip.name);
                    }
                    return;
                  } else if (e.key === "Escape") {
                    setShowSlashMenu(false);
                    resizeForSlash(0);
                    return;
                  }
                }

                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                } else if (e.key === "ArrowUp" && !prompt.includes("\n")) {
                  e.preventDefault();
                  if (promptList.length === 0) return;
                  if (historyIndex === -1) savedPromptRef.current = prompt;
                  const nextIdx = historyIndex === -1 ? 0 : Math.min(promptList.length - 1, historyIndex + 1);
                  setHistoryIndex(nextIdx);
                  setPrompt(promptList[nextIdx]);
                } else if (e.key === "ArrowDown" && !prompt.includes("\n")) {
                  e.preventDefault();
                  if (historyIndex === -1) return;
                  if (historyIndex === 0) {
                    setHistoryIndex(-1);
                    setPrompt(savedPromptRef.current);
                  } else {
                    const nextIdx = historyIndex - 1;
                    setHistoryIndex(nextIdx);
                    setPrompt(promptList[nextIdx]);
                  }
                }

                // Ctrl+1-9: Quick command shortcuts
                if (e.ctrlKey && e.key >= "1" && e.key <= "9" && selectedText) {
                  e.preventDefault();
                  const idx = parseInt(e.key) - 1;
                  const allCmds = slashCommands.filter(c => !c.isLocal);
                  if (idx < allCmds.length) {
                    const cmd = allCmds[idx];
                    handleSend(cmd.template);
                  }
                  return;
                }

                // Keypress glow effect
                if (!e.ctrlKey && !e.altKey && !e.metaKey && e.key.length === 1) {
                  const el = inputRef.current;
                  if (el) {
                    el.classList.add("keypress-glow");
                    if (glowTimerRef.current) clearTimeout(glowTimerRef.current);
                    glowTimerRef.current = window.setTimeout(() => {
                      el.classList.remove("keypress-glow");
                    }, 150);
                  }
                }
              }}
              placeholder={
                selectedText
                  ? (currentLang === "en" ? "Enter command: /en, /duzelt, /ozetle..." : "Komut girin: /çevir, /düzelt, /özetle...")
                  : typedPlaceholder
              }
              rows={1}
              disabled={status === "thinking" || status === "writing"}
            />
            <button
              className="send-button"
              onClick={() => handleSend()}
              disabled={!prompt.trim() || status === "thinking" || status === "writing"}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>

          {/* Preview Panel */}
          {previewData && (
            <div className="preview-panel">
              <div className="preview-section">
                <div className="preview-label original">📄 {t.spotlight.previewOriginal}</div>
                <div className="preview-text">{previewData.original}</div>
              </div>
              <div className="preview-section">
                <div className="preview-label result">✨ {t.spotlight.previewResult}</div>
                <div className="preview-text">{previewData.result}</div>
              </div>
              <div className="preview-actions">
                <button className="preview-btn" onClick={() => handleEscape()}>
                  {t.spotlight.previewCancel} <kbd>Esc</kbd>
                </button>
                <button className="preview-btn confirm" onClick={() => confirmPreview()}>
                  {t.spotlight.previewInject} <kbd>Enter</kbd>
                </button>
              </div>
            </div>
          )}

          {/* Status Bar */}
          {!showSlashMenu && !previewData && (
            <div className="status-bar">
              <div className="status-indicator">
                <div className={`status-dot ${status}`} />
                <span>{statusText}</span>
              </div>
              {sysContext?.active_app && sysContext.active_app !== "none" && (
                <div style={{
                  fontSize: "11px",
                  opacity: 0.65,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  letterSpacing: "0.02em"
                }}>
                  <span>{sysContext.is_terminal ? "💻" : "🎯"}</span>
                  <span>{sysContext.active_app}</span>
                  {sysContext.is_terminal && sysContext.shell && (
                    <span style={{
                      padding: "1px 6px",
                      borderRadius: "4px",
                      background: "var(--accent-glow)",
                      color: "var(--accent-color)",
                      fontSize: "10px",
                      fontWeight: 600
                    }}>
                      {sysContext.shell}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Error Boundary ───

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: "" };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="coretype-app" style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", height: "100vh", gap: "12px",
          color: "var(--text-primary)", padding: "20px", textAlign: "center"
        }}>
          <div style={{ fontSize: "24px" }}>⚠️</div>
          <div style={{ fontSize: "13px", fontWeight: 600 }}>
            {resolveLanguage(loadSettings().language) === "en" ? "An unexpected error occurred" : "Beklenmeyen bir hata oluştu"}
          </div>
          <div style={{ fontSize: "11px", opacity: 0.6, maxWidth: "300px", wordBreak: "break-word" }}>
            {this.state.error}
          </div>
          <button
            onClick={() => { this.setState({ hasError: false, error: "" }); window.location.reload(); }}
            style={{
              marginTop: "8px", padding: "6px 16px", borderRadius: "6px",
              border: "1px solid var(--border-color)", background: "var(--glass-bg)",
              color: "var(--text-primary)", cursor: "pointer", fontSize: "12px"
            }}
          >
            {resolveLanguage(loadSettings().language) === "en" ? "Restart" : "Yeniden Başlat"}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Router ───
function App() {
  if (isSettingsPage) return <SettingsView />;
  return (
    <ErrorBoundary>
      <MainView />
    </ErrorBoundary>
  );
}

export default App;
