export interface BotGeneralSettings {
  prefillInput: boolean;
  hideQueryParamsOnStart: boolean;
  rememberUser: boolean;
  defaultInvalidMessageReply: string;
  networkErrorTitle: string;
  networkErrorMessage: string;
  popupBlockedTitle: string;
  popupBlockedDescription: string;
  popupBlockedButtonLabel: string;
  botClosedMessage: string;
  fileUploadErrorMessage: string;
  fileTooLargeMessage: string;
  whatsappPictureChoiceSelectLabel: string;
}

export interface BotTypingSettings {
  typingEmulation: boolean;
  wordsPerMinute: number;
  maxDelaySeconds: number;
  disableOnFirstMessage: boolean;
  delayBetweenMessagesSeconds: number;
}

export interface BotSecuritySettings {
  allowedOrigins: string;
}

export interface BotMetadataSettings {
  googleTagManagerId: string;
  customHeadCode: string;
  allowSearchEnginesToIndex: boolean;
}

export interface BotSettings {
  general: BotGeneralSettings;
  typing: BotTypingSettings;
  security: BotSecuritySettings;
  metadata: BotMetadataSettings;
}

export function createDefaultBotSettings(): BotSettings {
  return {
    general: {
      prefillInput: false,
      hideQueryParamsOnStart: true,
      rememberUser: false,
      defaultInvalidMessageReply: 'Invalid message. Please, try again.',
      networkErrorTitle: 'Network Error',
      networkErrorMessage: 'Please check your internet connection and try again.',
      popupBlockedTitle: 'Popup blocked',
      popupBlockedDescription: 'The bot wants to open a new tab but it was blocked by your browser. It needs a manual approval.',
      popupBlockedButtonLabel: 'Continue in new tab',
      botClosedMessage: 'This bot is now closed',
      fileUploadErrorMessage: 'An error occurred while uploading the files',
      fileTooLargeMessage: '[[file]] is larger than [[limit]]MB',
      whatsappPictureChoiceSelectLabel: 'Select',
    },
    typing: {
      typingEmulation: true,
      wordsPerMinute: 400,
      maxDelaySeconds: 3,
      disableOnFirstMessage: true,
      delayBetweenMessagesSeconds: 0,
    },
    security: {
      allowedOrigins: '',
    },
    metadata: {
      googleTagManagerId: '',
      customHeadCode: '',
      allowSearchEnginesToIndex: false,
    },
  };
}

export function normalizeBotSettings(input?: Partial<BotSettings> | null): BotSettings {
  const defaults = createDefaultBotSettings();
  return {
    general: {
      ...defaults.general,
      ...(input?.general ?? {}),
    },
    typing: {
      ...defaults.typing,
      ...(input?.typing ?? {}),
    },
    security: {
      ...defaults.security,
      ...(input?.security ?? {}),
    },
    metadata: {
      ...defaults.metadata,
      ...(input?.metadata ?? {}),
    },
  };
}
