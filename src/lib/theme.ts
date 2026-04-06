export interface BotThemeSettings {
  templateId: string;
  savedThemeName?: string;
  showBranding: boolean;
  enableProgressBar: boolean;
  fontFamily: string;
  backgroundColor: string;
  backgroundPattern: 'none' | 'grid' | 'glow';
  cardBackground: string;
  cardTextColor: string;
  accentColor: string;
  accentTextColor: string;
  userBubbleColor: string;
  userTextColor: string;
  botBubbleColor: string;
  botTextColor: string;
  inputBackground: string;
  inputTextColor: string;
  borderColor: string;
  borderRadius: number;
  containerMaxWidth: number;
  containerWidthUnit: 'px' | '%';
  containerMaxHeight: number;
  containerHeightUnit: 'px' | '%';
  showAvatar: boolean;
  avatarShape: 'rounded' | 'circle' | 'square';
  customCss: string;
}

export interface ThemeTemplate {
  id: string;
  name: string;
  description: string;
  category: 'light' | 'dark' | 'minimal' | 'vivid';
  settings: BotThemeSettings;
}

export interface SavedThemeRecord {
  id: string;
  name: string;
  createdAt: number;
  settings: BotThemeSettings;
}

export const THEME_STORAGE_KEY = 'flowbot-theme-library';

const fontFamilyMap = {
  manrope: '"Manrope", "Segoe UI", sans-serif',
  outfit: '"Outfit", "Segoe UI", sans-serif',
  sora: '"Sora", "Segoe UI", sans-serif',
  urbanist: '"Urbanist", "Segoe UI", sans-serif',
  nunito: '"Nunito", "Segoe UI", sans-serif',
} as const;

export const fontOptions = [
  { id: 'manrope', label: 'Manrope' },
  { id: 'outfit', label: 'Outfit' },
  { id: 'sora', label: 'Sora' },
  { id: 'urbanist', label: 'Urbanist' },
  { id: 'nunito', label: 'Nunito' },
] as const;

export function createDefaultThemeSettings(): BotThemeSettings {
  return {
    templateId: 'typebot-light',
    showBranding: true,
    enableProgressBar: false,
    fontFamily: fontFamilyMap.manrope,
    backgroundColor: '#f4f4f2',
    backgroundPattern: 'none',
    cardBackground: '#ffffff',
    cardTextColor: '#111111',
    accentColor: '#ff5a24',
    accentTextColor: '#ffffff',
    userBubbleColor: '#1d4ed8',
    userTextColor: '#ffffff',
    botBubbleColor: '#f3f5fe',
    botTextColor: '#0f172a',
    inputBackground: '#ffffff',
    inputTextColor: '#111827',
    borderColor: '#2a2a2a',
    borderRadius: 26,
    containerMaxWidth: 800,
    containerWidthUnit: 'px',
    containerMaxHeight: 100,
    containerHeightUnit: '%',
    showAvatar: true,
    avatarShape: 'circle',
    customCss: '',
  };
}

function makeTemplate(
  id: string,
  name: string,
  description: string,
  category: ThemeTemplate['category'],
  overrides: Partial<BotThemeSettings>
): ThemeTemplate {
  return {
    id,
    name,
    description,
    category,
    settings: {
      ...createDefaultThemeSettings(),
      ...overrides,
      templateId: id,
    },
  };
}

export const themeTemplates: ThemeTemplate[] = [
  makeTemplate('typebot-light', 'Typebot Light', 'Clean light cards with orange accents', 'light', {}),
  makeTemplate('typebot-dark', 'Typebot Dark', 'Dark shell with warm action color', 'dark', {
    backgroundColor: '#080808',
    cardBackground: '#111111',
    cardTextColor: '#f8fafc',
    botBubbleColor: '#191d2d',
    botTextColor: '#f8fafc',
    inputBackground: '#0f172a',
    inputTextColor: '#f8fafc',
    borderColor: '#303030',
  }),
  makeTemplate('typebot-light-legacy', 'Typebot Light Legacy', 'Legacy light blue action palette', 'light', {
    accentColor: '#2563eb',
    userBubbleColor: '#2563eb',
  }),
  makeTemplate('typebot-dark-legacy', 'Typebot Dark Legacy', 'Legacy dark blue contrast', 'dark', {
    backgroundColor: '#0b1020',
    cardBackground: '#12182a',
    cardTextColor: '#f8fafc',
    accentColor: '#ff5a24',
    userBubbleColor: '#2563eb',
    botBubbleColor: '#1c2742',
    botTextColor: '#e2e8f0',
    inputBackground: '#111827',
    inputTextColor: '#f8fafc',
    borderColor: '#2a3553',
  }),
  makeTemplate('minimalist-black', 'Minimalist Black', 'Minimal neutral interface', 'minimal', {
    accentColor: '#2f2f2f',
    userBubbleColor: '#3f3f46',
    botBubbleColor: '#fafaf9',
    borderColor: '#2d2d2d',
  }),
  makeTemplate('minimalist-teal', 'Minimalist Teal', 'Minimal shell with teal highlights', 'minimal', {
    accentColor: '#0f766e',
    userBubbleColor: '#0f766e',
    borderColor: '#2d2d2d',
  }),
  makeTemplate('bright-rain', 'Bright Rain', 'Vivid gradient with playful energy', 'vivid', {
    backgroundColor: '#1f1147',
    backgroundPattern: 'glow',
    cardBackground: '#201132',
    cardTextColor: '#ffffff',
    accentColor: '#ff8c5a',
    userBubbleColor: '#d67b83',
    botBubbleColor: '#4a2f7f',
    botTextColor: '#fff8ec',
    inputBackground: '#25173a',
    inputTextColor: '#ffffff',
    borderColor: '#5f4b8b',
  }),
  makeTemplate('ray-of-lights', 'Ray of Lights', 'Neon cyan and indigo glow', 'vivid', {
    backgroundColor: '#111827',
    backgroundPattern: 'glow',
    cardBackground: '#111827',
    cardTextColor: '#f8fafc',
    accentColor: '#2dd4bf',
    accentTextColor: '#052e2b',
    userBubbleColor: '#1d4ed8',
    botBubbleColor: '#1f2a44',
    botTextColor: '#f8fafc',
    inputBackground: '#172036',
    inputTextColor: '#f8fafc',
    borderColor: '#34508a',
  }),
  makeTemplate('aqua-glass', 'Aqua Glass', 'Watery light canvas with glass accents', 'vivid', {
    backgroundColor: '#eaf7ff',
    backgroundPattern: 'grid',
    accentColor: '#ff5a24',
    userBubbleColor: '#0ea5e9',
    botBubbleColor: '#eef8ff',
    borderColor: '#b7ddf4',
  }),
  makeTemplate('pi', 'Pi', 'Soft ivory workspace with green highlights', 'minimal', {
    backgroundColor: '#f4efe5',
    cardBackground: '#f7f2e7',
    accentColor: '#15803d',
    userBubbleColor: '#15803d',
    botBubbleColor: '#fff7ed',
    borderColor: '#d8cdb8',
  }),
];

export function applyThemeTemplate(templateId: string, previous?: BotThemeSettings): BotThemeSettings {
  const template = themeTemplates.find((item) => item.id === templateId) ?? themeTemplates[0];
  return {
    ...(previous ?? createDefaultThemeSettings()),
    ...template.settings,
    templateId: template.id,
  };
}

export function normalizeThemeSettings(input?: Partial<BotThemeSettings> | null): BotThemeSettings {
  const defaults = createDefaultThemeSettings();
  if (!input) return defaults;
  return {
    ...defaults,
    ...input,
  };
}

export function getTemplatePreviewStyle(template: BotThemeSettings) {
  return {
    background: template.backgroundPattern === 'glow'
      ? `radial-gradient(circle at 20% 20%, ${withOpacity(template.accentColor, 0.4)} 0%, transparent 35%), radial-gradient(circle at 80% 20%, ${withOpacity(template.userBubbleColor, 0.35)} 0%, transparent 28%), ${template.backgroundColor}`
      : template.backgroundPattern === 'grid'
        ? `linear-gradient(${withOpacity(template.borderColor, 0.18)} 1px, transparent 1px), linear-gradient(90deg, ${withOpacity(template.borderColor, 0.18)} 1px, transparent 1px), ${template.backgroundColor}`
        : template.backgroundColor,
  };
}

export function withOpacity(hex: string, opacity: number) {
  const sanitized = hex.replace('#', '');
  const value = sanitized.length === 3
    ? sanitized.split('').map((char) => char + char).join('')
    : sanitized;
  const alpha = Math.round(opacity * 255)
    .toString(16)
    .padStart(2, '0');
  return `#${value}${alpha}`;
}

export function getAvatarRadius(shape: BotThemeSettings['avatarShape']) {
  if (shape === 'circle') return '999px';
  if (shape === 'square') return '12px';
  return '20px';
}

export const sampleThemeMessages = [
  { id: 'm1', type: 'bot', text: 'Hey - wave' },
  { id: 'm2', type: 'bot', text: 'Thank you for your interest in our marketing services.' },
  { id: 'm3', type: 'bot', text: "Let's have a quick chat about your current situation." },
  { id: 'm4', type: 'bot', text: 'Ready?' },
  { id: 'm5', type: 'user', text: 'Yes!' },
] as const;
