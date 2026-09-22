export type SupportedLanguage = "tr" | "en";
export type LanguageSetting = "system" | "tr" | "en";

export interface TranslationSchema {
  spotlight: {
    placeholder: string;
    placeholderHints: string[];
    capturedSelection: string;
    chars: string;
    words: string;
    statusIdle: string;
    statusThinking: string;
    statusTyping: string;
    statusDone: string;
    statusError: string;
    statusProcessing: string;
    statusInjecting: string;
    statusPreviewHint: string;
    selectTextToTransform: string;
    invalidJson: string;
    selectTextBeforeSave: string;
    enterGeminiKey: string;
    enterOpenaiKey: string;
    pleaseEnterPrompt: string;
    previewTitle: string;
    previewOriginal: string;
    previewResult: string;
    previewInject: string;
    previewCancel: string;
    copySuccess: string;
    onboardingTitle: string;
    onboardingDesc: string;
    onboardingOpenSettings: string;
    onboardingLater: string;
    noSnippets: string;
    snippetHint: string;
    errorTitle: string;
    errorRestart: string;
    lines: string;
    savedSnippet: string;
    deletedSnippet: string;
    selectedTextLabel: string;
    instructionLabel: string;
    apiFailedGemini: string;
    apiEmptyGemini: string;
    apiFailedOpenAI: string;
    apiEmptyOpenAI: string;
    apiFailedOllama: string;
    apiEmptyOllama: string;
    apiConnectOllama: string;
    tooltipIncrease: string;
    tooltipDecrease: string;
    tooltipShow: string;
    tooltipHide: string;
  };
  settings: {
    windowTitle: string;
    windowSubtitle: string;
    tabs: {
      general: string;
      models: string;
      appearance: string;
      history: string;
      shortcuts: string;
      snippets: string;
      about: string;
    };
    general: {
      languageLabel: string;
      languageDesc: string;
      langSystem: string;
      langTr: string;
      langEn: string;
      typingSpeedLabel: string;
      typingSpeedDesc: string;
      injectionLabel: string;
      injectionDesc: string;
      methodHybrid: string;
      methodHybridDesc: string;
      methodTyping: string;
      methodTypingDesc: string;
      methodPaste: string;
      methodPasteDesc: string;
      previewModeLabel: string;
      previewModeDesc: string;
      autoCloseLabel: string;
      autoCloseDesc: string;
      accentColorLabel: string;
      accentColorDesc: string;
      opacityLabel: string;
      opacityDesc: string;
      autostartLabel: string;
      autostartDesc: string;
    };
    models: {
      providerLabel: string;
      geminiKeyLabel: string;
      geminiKeyHelp: string;
      openaiKeyLabel: string;
      openaiKeyHelp: string;
      ollamaUrlLabel: string;
      ollamaModelLabel: string;
      saveSecretsBtn: string;
      secretsSaved: string;
      secretsError: string;
      keyHidden: string;
      keyPlaceholder: string;
      clearKey: string;
    };
    shortcuts: {
      globalToggle: string;
      globalToggleDesc: string;
      hideWindow: string;
      hideWindowDesc: string;
      submitPrompt: string;
      submitPromptDesc: string;
      previewConfirm: string;
      previewConfirmDesc: string;
    };
    snippets: {
      title: string;
      desc: string;
      addBtn: string;
      prefixLabel: string;
      contentLabel: string;
      deleteBtn: string;
      emptyList: string;
    };
    about: {
      appName: string;
      version: string;
      description: string;
      stack: string;
      githubRepo: string;
      copyInfo: string;
    };
    common: {
      save: string;
      saved: string;
      close: string;
      cancel: string;
      delete: string;
      reset: string;
      copied: string;
    };
  };
  historyVault: {
    title: string;
    empty: string;
    searchPlaceholder: string;
    itemDeleted: string;
    allCleared: string;
    injectHint: string;
    copyHint: string;
    deleteHint: string;
    closeHint: string;
    clearHistoryBtn: string;
    privacyWarning: string;
    entriesCount: string;
    aiType: string;
    transformType: string;
    viewHistoryHint: string;
  };
  desktopAction: {
    badgeText: string;
    actionExecuting: string;
    sudoBlockedTitle: string;
    sudoBlockedMessage: string;
    commandSuccess: string;
    commandFailed: string;
    dismissHint: string;
  };
  slashCommands: LocalizedSlashCommand[];
}

export interface DesktopActionPayload {
  action_type: "execute" | "query" | "blocked_root" | "error";
  command?: string;
  title: string;
  message: string;
  icon: string;
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  prompt: string;
  result: string;
  type: "ai" | "transform";
  provider?: string;
  model?: string;
  selectedContext?: string;
}

export interface LocalizedSlashCommand {
  id: string;
  trigger: string;
  aliases: string[];
  label: string;
  desc: string;
  template: string;
  isLocal?: boolean;
}
