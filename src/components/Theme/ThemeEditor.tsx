'use client';

import React from 'react';
import {
  Bookmark,
  ChevronDown,
  Code2,
  Droplets,
  Grid2X2,
  MessageSquare,
  Save,
  Sparkles,
} from 'lucide-react';
import useStore, { type Bot } from '@/lib/store';
import {
  applyThemeTemplate,
  fontOptions,
  getAvatarRadius,
  getTemplatePreviewStyle,
  normalizeThemeSettings,
  sampleThemeMessages,
  THEME_STORAGE_KEY,
  themeTemplates,
  type BotThemeSettings,
  type SavedThemeRecord,
  withOpacity,
} from '@/lib/theme';

interface ThemeEditorProps {
  bot: Bot;
}

type SectionKey = 'templates' | 'global' | 'chat' | 'customCss';

function createSavedTheme(name: string, settings: BotThemeSettings): SavedThemeRecord {
  const timestamp = Date.now();
  return {
    id: `${timestamp}`,
    name,
    createdAt: timestamp,
    settings,
  };
}

export default function ThemeEditor({ bot }: ThemeEditorProps) {
  const updateBotTheme = useStore((state) => state.updateBotTheme);
  const theme = normalizeThemeSettings(bot.theme);
  const [templateTab, setTemplateTab] = React.useState<'saved' | 'gallery'>('gallery');
  const [savedThemes, setSavedThemes] = React.useState<SavedThemeRecord[]>([]);
  const [openSections, setOpenSections] = React.useState<Record<SectionKey, boolean>>({
    templates: true,
    global: true,
    chat: true,
    customCss: false,
  });

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as SavedThemeRecord[];
      setSavedThemes(parsed);
    } catch (error) {
      console.error('Failed to read saved themes.', error);
    }
  }, []);

  const persistSavedThemes = React.useCallback((nextThemes: SavedThemeRecord[]) => {
    setSavedThemes(nextThemes);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(nextThemes));
    }
  }, []);

  const patchTheme = React.useCallback(
    (patch: Partial<BotThemeSettings>) => {
      updateBotTheme(bot.id, patch);
    },
    [bot.id, updateBotTheme]
  );

  const toggleSection = (key: SectionKey) => {
    setOpenSections((current) => ({ ...current, [key]: !current[key] }));
  };

  const saveCurrentTheme = () => {
    const name = window.prompt('Name this theme template', `${bot.name} Theme`);
    if (!name?.trim()) return;

    const nextThemes = [
      createSavedTheme(name.trim(), theme),
      ...savedThemes,
    ];
    persistSavedThemes(nextThemes);
    patchTheme({ savedThemeName: name.trim() });
    setTemplateTab('saved');
  };

  const deleteSavedTheme = (themeId: string) => {
    persistSavedThemes(savedThemes.filter((item) => item.id !== themeId));
  };

  const applySavedTheme = (savedTheme: SavedThemeRecord) => {
    patchTheme({
      ...savedTheme.settings,
      savedThemeName: savedTheme.name,
    });
  };

  const applyGalleryTheme = (templateId: string) => {
    patchTheme({
      ...applyThemeTemplate(templateId, theme),
      savedThemeName: undefined,
    });
  };

  return (
    <div className="flex h-[calc(100vh-64px)] min-h-0 bg-white text-slate-900">
      <aside className="w-[520px] min-w-[320px] border-r border-orange-100 bg-[#fffaf4] p-5">
        <div className="h-full overflow-y-auto rounded-[28px] border border-orange-100 bg-white shadow-[0_12px_40px_rgba(255,106,0,0.08)]">
          <SectionShell
            icon={<Grid2X2 size={18} />}
            label="Templates"
            open={openSections.templates}
            onToggle={() => toggleSection('templates')}
          >
            <div className="space-y-5">
              <div className="flex gap-3">
                <TabButton active={templateTab === 'saved'} onClick={() => setTemplateTab('saved')}>
                  My templates
                </TabButton>
                <TabButton active={templateTab === 'gallery'} onClick={() => setTemplateTab('gallery')}>
                  Gallery
                </TabButton>
              </div>

              <button
                onClick={saveCurrentTheme}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#ff5a24] px-4 py-4 text-sm font-semibold text-white transition hover:bg-[#ff6e40]"
              >
                <Save size={16} />
                Save current theme
              </button>

              {templateTab === 'gallery' ? (
                <div className="grid grid-cols-2 gap-4">
                  {themeTemplates.map((templateItem) => (
                    <TemplateCard
                      key={templateItem.id}
                      name={templateItem.name}
                      active={theme.templateId === templateItem.id}
                      settings={templateItem.settings}
                      onClick={() => applyGalleryTheme(templateItem.id)}
                    />
                  ))}
                </div>
              ) : savedThemes.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {savedThemes.map((savedTheme) => (
                    <TemplateCard
                      key={savedTheme.id}
                      name={savedTheme.name}
                      active={theme.savedThemeName === savedTheme.name}
                      settings={savedTheme.settings}
                      onClick={() => applySavedTheme(savedTheme)}
                      onDelete={() => deleteSavedTheme(savedTheme.id)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<Bookmark size={18} />}
                  title="No saved themes yet"
                  description="Save the current look to reuse it on other bots."
                />
              )}
            </div>
          </SectionShell>

          <SectionShell
            icon={<Droplets size={18} />}
            label="Global"
            open={openSections.global}
            onToggle={() => toggleSection('global')}
          >
            <div className="space-y-5">
              <ToggleRow
                label="Show Typebot brand"
                checked={theme.showBranding}
                onChange={(checked) => patchTheme({ showBranding: checked })}
              />
              <ToggleRow
                label="Enable progress bar"
                checked={theme.enableProgressBar}
                onChange={(checked) => patchTheme({ enableProgressBar: checked })}
              />

              <FieldShell label="Font">
                <select
                  value={theme.fontFamily}
                  onChange={(event) => patchTheme({ fontFamily: event.target.value })}
                  className="w-full rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-orange-300"
                >
                  {fontOptions.map((option) => (
                    <option key={option.id} value={`"${option.label}", "Segoe UI", sans-serif`}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </FieldShell>

              <FieldShell label="Background">
                <div className="grid grid-cols-2 gap-3">
                  <ColorField
                    label="Canvas"
                    value={theme.backgroundColor}
                    onChange={(value) => patchTheme({ backgroundColor: value })}
                  />
                  <div>
                    <div className="mb-2 text-xs font-medium text-slate-500">Pattern</div>
                    <select
                      value={theme.backgroundPattern}
                      onChange={(event) =>
                        patchTheme({ backgroundPattern: event.target.value as BotThemeSettings['backgroundPattern'] })
                      }
                      className="w-full rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-orange-300"
                    >
                      <option value="none">None</option>
                      <option value="grid">Grid</option>
                      <option value="glow">Glow</option>
                    </select>
                  </div>
                </div>
              </FieldShell>

              <div className="grid grid-cols-2 gap-3">
                <ColorField
                  label="Accent"
                  value={theme.accentColor}
                  onChange={(value) => patchTheme({ accentColor: value })}
                />
                <ColorField
                  label="Accent text"
                  value={theme.accentTextColor}
                  onChange={(value) => patchTheme({ accentTextColor: value })}
                />
              </div>
            </div>
          </SectionShell>

          <SectionShell
            icon={<MessageSquare size={18} />}
            label="Chat"
            open={openSections.chat}
            onToggle={() => toggleSection('chat')}
          >
            <div className="space-y-5">
              <div className="rounded-[24px] border border-orange-100 bg-[#fffaf4] p-5">
                <div className="mb-4 text-xl font-semibold text-slate-900">Container</div>
                <div className="space-y-4">
                  <StepperField
                    label="Max width"
                    value={theme.containerMaxWidth}
                    unit={theme.containerWidthUnit}
                    min={360}
                    max={1200}
                    step={20}
                    onValueChange={(value) => patchTheme({ containerMaxWidth: value })}
                    onUnitChange={(value) =>
                      patchTheme({ containerWidthUnit: value as BotThemeSettings['containerWidthUnit'] })
                    }
                  />
                  <StepperField
                    label="Max height"
                    value={theme.containerMaxHeight}
                    unit={theme.containerHeightUnit}
                    min={40}
                    max={100}
                    step={5}
                    onValueChange={(value) => patchTheme({ containerMaxHeight: value })}
                    onUnitChange={(value) =>
                      patchTheme({ containerHeightUnit: value as BotThemeSettings['containerHeightUnit'] })
                    }
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <ColorField
                      label="Card background"
                      value={theme.cardBackground}
                      onChange={(value) => patchTheme({ cardBackground: value })}
                    />
                    <ColorField
                      label="Card text"
                      value={theme.cardTextColor}
                      onChange={(value) => patchTheme({ cardTextColor: value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <ColorField
                      label="Bot bubble"
                      value={theme.botBubbleColor}
                      onChange={(value) => patchTheme({ botBubbleColor: value })}
                    />
                    <ColorField
                      label="User bubble"
                      value={theme.userBubbleColor}
                      onChange={(value) => patchTheme({ userBubbleColor: value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <ColorField
                      label="Bot text"
                      value={theme.botTextColor}
                      onChange={(value) => patchTheme({ botTextColor: value })}
                    />
                    <ColorField
                      label="User text"
                      value={theme.userTextColor}
                      onChange={(value) => patchTheme({ userTextColor: value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <ColorField
                      label="Input background"
                      value={theme.inputBackground}
                      onChange={(value) => patchTheme({ inputBackground: value })}
                    />
                    <ColorField
                      label="Input text"
                      value={theme.inputTextColor}
                      onChange={(value) => patchTheme({ inputTextColor: value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <ColorField
                      label="Border"
                      value={theme.borderColor}
                      onChange={(value) => patchTheme({ borderColor: value })}
                    />
                    <FieldShell label="Border radius">
                      <input
                        type="range"
                        min={8}
                        max={36}
                        value={theme.borderRadius}
                        onChange={(event) => patchTheme({ borderRadius: Number(event.target.value) })}
                        className="w-full accent-[#ff5a24]"
                      />
                      <div className="mt-2 text-xs text-slate-500">{theme.borderRadius}px</div>
                    </FieldShell>
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-orange-100 bg-[#fffaf4] p-5">
                <div className="mb-4 text-xl font-semibold text-slate-900">Bot avatar</div>
                <div className="space-y-4">
                  <ToggleRow
                    label="Show avatar"
                    checked={theme.showAvatar}
                    onChange={(checked) => patchTheme({ showAvatar: checked })}
                  />
                  <FieldShell label="Avatar shape">
                    <div className="grid grid-cols-3 gap-2">
                      {(['circle', 'rounded', 'square'] as const).map((shape) => (
                        <button
                          key={shape}
                          onClick={() => patchTheme({ avatarShape: shape })}
                          className={`rounded-2xl border px-3 py-3 text-xs font-semibold capitalize transition ${
                            theme.avatarShape === shape
                              ? 'border-[#ff5a24] bg-orange-50 text-[#ff5a24]'
                              : 'border-orange-100 bg-white text-slate-600'
                          }`}
                        >
                          {shape}
                        </button>
                      ))}
                    </div>
                  </FieldShell>
                </div>
              </div>
            </div>
          </SectionShell>

          <SectionShell
            icon={<Code2 size={18} />}
            label="Custom CSS"
            open={openSections.customCss}
            onToggle={() => toggleSection('customCss')}
          >
            <div className="space-y-3">
                <div className="text-xs text-slate-500">
                Target classes like <code>.theme-preview-card</code>, <code>.theme-preview-bot</code>, and{' '}
                <code>.theme-preview-input</code>.
              </div>
              <textarea
                value={theme.customCss}
                onChange={(event) => patchTheme({ customCss: event.target.value })}
                className="min-h-[220px] w-full rounded-[20px] border border-orange-100 bg-slate-950 px-4 py-4 font-mono text-sm text-orange-50 outline-none"
                placeholder=".theme-preview-card { box-shadow: 0 24px 80px rgba(0,0,0,.18); }"
              />
            </div>
          </SectionShell>
        </div>
      </aside>

      <main className="flex-1 overflow-hidden bg-white p-5">
        <ThemePreview bot={bot} theme={theme} />
      </main>
    </div>
  );
}

function ThemePreview({ bot, theme }: { bot: Bot; theme: BotThemeSettings }) {
  const canvasStyle = {
    ...getTemplatePreviewStyle(theme),
    maxWidth: `${theme.containerMaxWidth}${theme.containerWidthUnit}`,
    maxHeight: `${theme.containerMaxHeight}${theme.containerHeightUnit}`,
    borderColor: theme.borderColor,
    borderRadius: `${theme.borderRadius + 8}px`,
    fontFamily: theme.fontFamily,
  } as React.CSSProperties;

  const cardStyle = {
    background: theme.cardBackground,
    color: theme.cardTextColor,
    borderColor: withOpacity(theme.borderColor, 0.45),
    borderRadius: `${theme.borderRadius}px`,
  } as React.CSSProperties;

  return (
    <div className="flex h-full items-center justify-center">
      <style>{theme.customCss}</style>
      <div
        className="theme-preview-canvas relative flex h-full w-full items-center justify-center overflow-hidden rounded-[32px] border border-orange-100 bg-[#fffaf4] p-5 shadow-[0_20px_60px_rgba(255,106,0,0.12)]"
        style={canvasStyle}
      >
        {theme.enableProgressBar ? (
          <div className="absolute left-8 right-8 top-6 h-2 overflow-hidden rounded-full bg-black/10">
            <div className="h-full rounded-full" style={{ width: '54%', background: theme.accentColor }} />
          </div>
        ) : null}

        <div
          className="theme-preview-card flex h-full w-full flex-col overflow-hidden border"
          style={cardStyle}
        >
          <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: withOpacity(theme.borderColor, 0.18) }}>
            <div className="flex items-center gap-3">
              {theme.showAvatar ? (
                <div
                  className="flex h-11 w-11 items-center justify-center text-base font-semibold text-white"
                  style={{
                    background: theme.accentColor,
                    borderRadius: getAvatarRadius(theme.avatarShape),
                  }}
                >
                  {bot.name.slice(0, 1).toUpperCase()}
                </div>
              ) : null}
              <div>
                <div className="text-sm font-semibold">{bot.name}</div>
                <div className="text-xs opacity-60">Lead qualification flow</div>
              </div>
            </div>
            <div className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: withOpacity(theme.accentColor, 0.12), color: theme.accentColor }}>
              Theme preview
            </div>
          </div>

          <div className="flex-1 overflow-hidden px-8 py-8">
            <div className="mx-auto flex h-full max-w-[880px] flex-col justify-between gap-6">
              <div className="space-y-4">
                {sampleThemeMessages.map((message, index) => (
                  <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex items-end gap-3 ${message.type === 'user' ? 'flex-row-reverse' : ''}`}>
                      {theme.showAvatar && message.type === 'bot' && index === 3 ? (
                        <div
                          className="flex h-13 w-13 shrink-0 items-center justify-center border text-lg font-semibold"
                          style={{
                            background: theme.cardBackground,
                            color: theme.accentColor,
                            borderColor: withOpacity(theme.borderColor, 0.35),
                            borderRadius: getAvatarRadius(theme.avatarShape),
                          }}
                        >
                          {bot.name.slice(0, 1).toUpperCase()}
                        </div>
                      ) : theme.showAvatar && message.type === 'bot' ? (
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center text-sm font-semibold text-white"
                          style={{
                            background: theme.accentColor,
                            borderRadius: getAvatarRadius(theme.avatarShape),
                            opacity: index === 0 ? 0 : 1,
                          }}
                        >
                          {bot.name.slice(0, 1).toUpperCase()}
                        </div>
                      ) : null}

                      <div
                        className={`theme-preview-bubble max-w-[72%] border px-5 py-4 text-[15px] shadow-sm ${
                          message.type === 'user' ? 'theme-preview-user' : 'theme-preview-bot'
                        }`}
                        style={{
                          background: message.type === 'user' ? theme.userBubbleColor : theme.botBubbleColor,
                          color: message.type === 'user' ? theme.userTextColor : theme.botTextColor,
                          borderColor: withOpacity(theme.borderColor, 0.18),
                          borderRadius: `${theme.borderRadius}px`,
                        }}
                      >
                        {index === 1 ? (
                          <div className="space-y-4">
                            <div className="overflow-hidden rounded-[24px] border" style={{ borderColor: withOpacity(theme.borderColor, 0.14) }}>
                              <div className="aspect-[4/3] w-full bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.45),transparent_18%),linear-gradient(135deg,#d89b52,#f1c27b_40%,#6b8dbf)]" />
                            </div>
                            <div>{message.text}</div>
                          </div>
                        ) : (
                          message.text
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between gap-6">
                <div className="theme-preview-input flex min-w-[320px] items-center gap-3 rounded-[24px] border px-4 py-3" style={{ background: theme.inputBackground, color: theme.inputTextColor, borderColor: withOpacity(theme.borderColor, 0.24) }}>
                  <Sparkles size={16} className="opacity-60" />
                  <span className="text-sm opacity-70">Write your reply...</span>
                </div>

                {theme.showBranding ? (
                  <div className="rounded-2xl border px-4 py-3 text-sm font-semibold" style={{ borderColor: withOpacity(theme.borderColor, 0.24), background: withOpacity(theme.cardBackground, 0.9) }}>
                    Made with Typebot
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionShell({
  icon,
  label,
  open,
  onToggle,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-orange-100">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-6 py-6 text-left"
      >
        <div className="flex items-center gap-4 text-[18px] font-semibold text-slate-900">
          <span className="text-orange-500">{icon}</span>
          {label}
        </div>
        <ChevronDown size={18} className={`text-slate-400 transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open ? <div className="px-5 pb-5">{children}</div> : null}
    </section>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl border px-5 py-3 text-sm font-semibold transition ${
        active ? 'border-orange-200 bg-orange-50 text-orange-600' : 'border-orange-100 bg-white text-slate-600'
      }`}
    >
      {children}
    </button>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[24px] border border-dashed border-orange-200 bg-[#fffaf4] p-6 text-slate-500">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">{icon}</div>
      <div className="mb-1 font-semibold text-slate-900">{title}</div>
      <div className="text-sm">{description}</div>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[22px] border border-orange-100 bg-[#fffaf4] px-4 py-4">
      <div className="text-sm font-medium text-slate-900">{label}</div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative h-8 w-14 rounded-full transition ${checked ? 'bg-[#ff5a24]' : 'bg-slate-200'}`}
      >
        <span className={`absolute top-1 h-6 w-6 rounded-full bg-white transition ${checked ? 'left-7' : 'left-1'}`} />
      </button>
    </div>
  );
}

function FieldShell({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 text-xs font-medium text-slate-500">{label}</div>
      {children}
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <div className="mb-2 text-xs font-medium text-slate-500">{label}</div>
      <label className="flex items-center gap-3 rounded-2xl border border-orange-100 bg-white px-3 py-3">
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 w-9 rounded-xl border-none bg-transparent p-0"
        />
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full bg-transparent text-sm text-slate-900 outline-none"
        />
      </label>
    </div>
  );
}

function StepperField({
  label,
  value,
  unit,
  min,
  max,
  step,
  onValueChange,
  onUnitChange,
}: {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step: number;
  onValueChange: (value: number) => void;
  onUnitChange: (value: string) => void;
}) {
  const nextDown = Math.max(min, value - step);
  const nextUp = Math.min(max, value + step);

  return (
    <div>
      <div className="mb-2 text-sm font-medium text-slate-900">{label}</div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onValueChange(nextDown)}
          className="rounded-2xl border border-orange-100 bg-white px-4 py-3 text-xl text-slate-500"
        >
          -
        </button>
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(event) => onValueChange(Number(event.target.value))}
          className="w-24 rounded-2xl border border-orange-100 bg-white px-4 py-3 text-center text-lg font-semibold text-slate-900 outline-none"
        />
        <button
          onClick={() => onValueChange(nextUp)}
          className="rounded-2xl border border-orange-100 bg-white px-4 py-3 text-xl text-slate-500"
        >
          +
        </button>
        <select
          value={unit}
          onChange={(event) => onUnitChange(event.target.value)}
          className="rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
        >
          <option value="px">px</option>
          <option value="%">%</option>
        </select>
      </div>
    </div>
  );
}

function TemplateCard({
  name,
  settings,
  active,
  onClick,
  onDelete,
}: {
  name: string;
  settings: BotThemeSettings;
  active: boolean;
  onClick: () => void;
  onDelete?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`group overflow-hidden rounded-[22px] border text-left transition ${
        active ? 'border-[#ff5a24] shadow-[0_0_0_1px_rgba(255,90,36,0.35)]' : 'border-orange-100 bg-white'
      }`}
    >
      <div className="aspect-[1.1/0.9] p-3" style={getTemplatePreviewStyle(settings)}>
        <div className="flex h-full flex-col justify-between rounded-[18px] border px-3 py-3" style={{ background: withOpacity(settings.cardBackground, 0.96), borderColor: withOpacity(settings.borderColor, 0.22) }}>
          <div className="space-y-2">
            <div className="h-4 w-4 rounded-full" style={{ background: settings.accentColor }} />
            <div className="h-4 w-24 rounded-full" style={{ background: withOpacity(settings.botBubbleColor, 0.95) }} />
            <div className="h-4 w-18 rounded-full" style={{ background: withOpacity(settings.botBubbleColor, 0.95) }} />
          </div>
          <div className="flex justify-end">
            <div className="h-5 w-24 rounded-full" style={{ background: settings.userBubbleColor }} />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-orange-100 bg-white px-4 py-3">
        <span className="text-base font-medium text-slate-900">{name}</span>
        {onDelete ? (
          <span
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
            className="rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-orange-50 hover:text-orange-600"
          >
            Delete
          </span>
        ) : null}
      </div>
    </button>
  );
}
