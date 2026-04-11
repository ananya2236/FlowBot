'use client';

import React from 'react';
import {
  ChevronDown,
  Code2,
  Info,
  Lock,
  MessageSquare,
  MoreHorizontal,
} from 'lucide-react';
import useStore, { type Bot } from '@/lib/store';
import { normalizeBotSettings, type BotSettings } from '@/lib/botSettings';
import FlowPreview from '@/components/Preview/FlowPreview';

interface SettingsEditorProps {
  bot: Bot;
}

type SettingsSection = 'general' | 'typing' | 'security' | 'metadata';
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

export default function SettingsEditor({ bot }: SettingsEditorProps) {
  const updateBotSettings = useStore((state) => state.updateBotSettings);
  const settings = normalizeBotSettings(bot.settings);
  const [openSections, setOpenSections] = React.useState<Record<SettingsSection, boolean>>({
    general: false,
    typing: false,
    security: false,
    metadata: false,
  });

  const patchSettings = React.useCallback(
    (patch: DeepPartial<BotSettings>) => {
      updateBotSettings(bot.id, patch);
    },
    [bot.id, updateBotSettings]
  );

  const toggleSection = (section: SettingsSection) => {
    setOpenSections((current) => ({
      general: false,
      typing: false,
      security: false,
      metadata: false,
      [section]: !current[section],
    }));
  };

  return (
    <div className="flex h-full min-h-0 bg-white text-slate-900">
      <aside className="w-[400px] min-w-[320px] border-r border-orange-100 bg-[#fffaf4] p-4">
        <div className="h-full overflow-y-auto rounded-[24px] border border-orange-100 bg-white shadow-[0_12px_32px_rgba(255,106,0,0.07)]">
          <SettingsSectionShell
            icon={<MoreHorizontal size={18} />}
            label="General"
            open={openSections.general}
            onToggle={() => toggleSection('general')}
          >
            <div className="space-y-5">
              <ToggleRow
                label="Prefill input"
                checked={settings.general.prefillInput}
                onChange={(checked) => patchSettings({ general: { prefillInput: checked } })}
                info="Prefills fields from matching query params."
              />
              <ToggleRow
                label="Hide query params on bot start"
                checked={settings.general.hideQueryParamsOnStart}
                onChange={(checked) => patchSettings({ general: { hideQueryParamsOnStart: checked } })}
                info="Cleans the URL once the bot starts."
              />
              <ToggleRow
                label="Remember user"
                checked={settings.general.rememberUser}
                onChange={(checked) => patchSettings({ general: { rememberUser: checked } })}
                info="Keep captured answers across visits on this device."
              />

              <CardBlock title="System messages">
                <TextareaField
                  label="Default invalid message reply"
                  value={settings.general.defaultInvalidMessageReply}
                  onChange={(value) => patchSettings({ general: { defaultInvalidMessageReply: value } })}
                />
                <InputField
                  label="Network error title"
                  value={settings.general.networkErrorTitle}
                  onChange={(value) => patchSettings({ general: { networkErrorTitle: value } })}
                />
                <TextareaField
                  label="Network error message"
                  value={settings.general.networkErrorMessage}
                  onChange={(value) => patchSettings({ general: { networkErrorMessage: value } })}
                />
                <InputField
                  label="Popup blocked title"
                  value={settings.general.popupBlockedTitle}
                  onChange={(value) => patchSettings({ general: { popupBlockedTitle: value } })}
                />
                <TextareaField
                  label="Popup blocked description"
                  value={settings.general.popupBlockedDescription}
                  onChange={(value) => patchSettings({ general: { popupBlockedDescription: value } })}
                />
                <InputField
                  label="Popup blocked button label"
                  value={settings.general.popupBlockedButtonLabel}
                  onChange={(value) => patchSettings({ general: { popupBlockedButtonLabel: value } })}
                />
                <TextareaField
                  label="Bot closed message"
                  value={settings.general.botClosedMessage}
                  onChange={(value) => patchSettings({ general: { botClosedMessage: value } })}
                />
                <TextareaField
                  label="File upload error message"
                  value={settings.general.fileUploadErrorMessage}
                  onChange={(value) => patchSettings({ general: { fileUploadErrorMessage: value } })}
                />
                <TextareaField
                  label="File too large message"
                  value={settings.general.fileTooLargeMessage}
                  onChange={(value) => patchSettings({ general: { fileTooLargeMessage: value } })}
                  info="Supports placeholders like [[file]] and [[limit]]."
                />
                <InputField
                  label="WhatsApp picture choice select label"
                  value={settings.general.whatsappPictureChoiceSelectLabel}
                  onChange={(value) => patchSettings({ general: { whatsappPictureChoiceSelectLabel: value } })}
                />
              </CardBlock>
            </div>
          </SettingsSectionShell>

          <SettingsSectionShell
            icon={<MessageSquare size={18} />}
            label="Typing"
            open={openSections.typing}
            onToggle={() => toggleSection('typing')}
          >
            <div className="space-y-5">
              <CardBlock>
                <ToggleRow
                  label="Typing emulation"
                  checked={settings.typing.typingEmulation}
                  onChange={(checked) => patchSettings({ typing: { typingEmulation: checked } })}
                />
                <StepperField
                  label="Words per minute"
                  value={settings.typing.wordsPerMinute}
                  min={60}
                  max={1200}
                  step={20}
                  unitLabel=""
                  onChange={(value) => patchSettings({ typing: { wordsPerMinute: value } })}
                />
                <StepperField
                  label="Max delay"
                  value={settings.typing.maxDelaySeconds}
                  min={0}
                  max={10}
                  step={1}
                  unitLabel="seconds"
                  onChange={(value) => patchSettings({ typing: { maxDelaySeconds: value } })}
                />
                <ToggleRow
                  label="Disable on first message"
                  checked={settings.typing.disableOnFirstMessage}
                  onChange={(checked) => patchSettings({ typing: { disableOnFirstMessage: checked } })}
                  info="Sends the first bubble instantly."
                />
              </CardBlock>

              <StepperField
                label="Delay between messages"
                value={settings.typing.delayBetweenMessagesSeconds}
                min={0}
                max={10}
                step={1}
                unitLabel="seconds"
                onChange={(value) => patchSettings({ typing: { delayBetweenMessagesSeconds: value } })}
              />
            </div>
          </SettingsSectionShell>

          <SettingsSectionShell
            icon={<Lock size={18} />}
            label="Security"
            open={openSections.security}
            onToggle={() => toggleSection('security')}
          >
            <div className="space-y-4">
              <InputField
                label="Allowed origins"
                value={settings.security.allowedOrigins}
                onChange={(value) => patchSettings({ security: { allowedOrigins: value } })}
                placeholder="https://yourapp.com, https://admin.yourapp.com"
                info="Comma-separated list of origins allowed to embed or use the bot."
              />
            </div>
          </SettingsSectionShell>

          <SettingsSectionShell
            icon={<Code2 size={18} />}
            label="Metadata"
            open={openSections.metadata}
            onToggle={() => toggleSection('metadata')}
          >
            <div className="space-y-5">
              <InputField
                label="Google Tag Manager ID"
                value={settings.metadata.googleTagManagerId}
                onChange={(value) => patchSettings({ metadata: { googleTagManagerId: value } })}
                placeholder="GTM-XXXXXXX"
              />
              <TextareaField
                label="Custom head code"
                value={settings.metadata.customHeadCode}
                onChange={(value) => patchSettings({ metadata: { customHeadCode: value } })}
                placeholder="<script>...</script>"
              />
              <ToggleRow
                label="Allow search engines to index"
                checked={settings.metadata.allowSearchEnginesToIndex}
                onChange={(checked) => patchSettings({ metadata: { allowSearchEnginesToIndex: checked } })}
                info="Useful for public share pages intended to be discoverable."
              />
            </div>
          </SettingsSectionShell>
        </div>
      </aside>

      <main className="flex-1 min-h-0 overflow-hidden bg-white p-4">
        <SettingsPreview bot={bot} settings={settings} />
      </main>
    </div>
  );
}

function SettingsPreview({ bot, settings }: { bot: Bot; settings: BotSettings }) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="relative flex h-full w-full max-w-[980px] overflow-hidden rounded-[28px] border border-orange-100 bg-[#fffaf4] p-4 shadow-[0_18px_48px_rgba(255,106,0,0.10)]">
        <div className="mx-auto flex h-full w-full max-w-[980px] gap-6">
          <div className="flex flex-1 flex-col gap-4">
            <FlowPreview
              bot={bot}
              className="flex-1 shadow-[0_12px_32px_rgba(15,23,42,0.08)]"
              headerLabel="Settings preview"
              showVariables={false}
            />
            <div className="grid grid-cols-2 gap-4">
              <PreviewStat label="Words per minute" value={`${settings.typing.wordsPerMinute}`} />
              <PreviewStat label="Max delay" value={`${settings.typing.maxDelaySeconds}s`} />
              <PreviewStat label="Remember user" value={settings.general.rememberUser ? 'On' : 'Off'} />
              <PreviewStat label="Allowed origins" value={settings.security.allowedOrigins || 'Any'} />
            </div>
          </div>

          <div className="w-[300px] shrink-0 rounded-[28px] border border-orange-100 bg-white p-5 text-slate-900">
            <div className="mb-5 text-sm font-semibold text-slate-500">Runtime summary</div>
            <SummaryRow label="Prefill input" value={settings.general.prefillInput ? 'Enabled' : 'Disabled'} />
            <SummaryRow label="Hide query params" value={settings.general.hideQueryParamsOnStart ? 'Enabled' : 'Disabled'} />
            <SummaryRow label="Remember user" value={settings.general.rememberUser ? 'Enabled' : 'Disabled'} />
            <SummaryRow label="Typing emulation" value={settings.typing.typingEmulation ? 'Enabled' : 'Disabled'} />
            <SummaryRow label="First message" value={settings.typing.disableOnFirstMessage ? 'Instant' : 'Typed'} />
            <SummaryRow label="Delay between messages" value={`${settings.typing.delayBetweenMessagesSeconds}s`} />
            <SummaryRow label="GTM" value={settings.metadata.googleTagManagerId || 'Not set'} />
            <SummaryRow label="Indexing" value={settings.metadata.allowSearchEnginesToIndex ? 'Allowed' : 'Blocked'} />

            <div className="mt-6 rounded-2xl border border-orange-100 bg-[#fffaf4] p-4 text-sm text-slate-600">
              <div className="mb-2 font-semibold text-slate-900">System message preview</div>
              <div>{settings.general.defaultInvalidMessageReply}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsSectionShell({
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
      <button onClick={onToggle} className="flex w-full items-center justify-between px-5 py-4 text-left">
        <div className="flex items-center gap-3 text-base font-semibold text-slate-900">
          <span className="text-orange-500">{icon}</span>
          {label}
        </div>
        <ChevronDown size={18} className={`text-slate-400 transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open ? <div className="px-4 pb-4">{children}</div> : null}
    </section>
  );
}

function CardBlock({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-orange-100 bg-[#fffaf4] p-5">
      {title ? <div className="mb-4 text-xl font-semibold text-slate-900">{title}</div> : null}
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
  info,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  info?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[22px] border border-orange-100 bg-[#fffaf4] px-4 py-4">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
        <span>{label}</span>
        {info ? <InfoPill text={info} /> : null}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative h-8 w-14 rounded-full transition ${checked ? 'bg-[#ff5a24]' : 'bg-slate-200'}`}
      >
        <span className={`absolute top-1 h-6 w-6 rounded-full bg-white transition ${checked ? 'left-7' : 'left-1'}`} />
      </button>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  info,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  info?: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-900">
        <span>{label}</span>
        {info ? <InfoPill text={info} /> : null}
      </div>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-[18px] border border-orange-100 bg-white px-4 py-3 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:border-orange-300"
      />
    </div>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  placeholder,
  info,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  info?: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-900">
        <span>{label}</span>
        {info ? <InfoPill text={info} /> : null}
      </div>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-[102px] w-full rounded-[18px] border border-orange-100 bg-white px-4 py-3 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:border-orange-300"
      />
    </div>
  );
}

function StepperField({
  label,
  value,
  min,
  max,
  step,
  unitLabel,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unitLabel: string;
  onChange: (value: number) => void;
}) {
  const nextDown = Math.max(min, value - step);
  const nextUp = Math.min(max, value + step);

  return (
    <div>
      <div className="mb-2 text-sm font-medium text-slate-900">{label}</div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(nextDown)}
          className="rounded-2xl border border-orange-100 bg-white px-4 py-3 text-xl text-slate-500"
        >
          -
        </button>
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="w-24 rounded-2xl border border-orange-100 bg-white px-4 py-3 text-center text-lg font-semibold text-slate-900 outline-none"
        />
        <button
          onClick={() => onChange(nextUp)}
          className="rounded-2xl border border-orange-100 bg-white px-4 py-3 text-xl text-slate-500"
        >
          +
        </button>
        {unitLabel ? <span className="px-2 text-sm font-semibold text-slate-700">{unitLabel}</span> : null}
      </div>
    </div>
  );
}

function InfoPill({ text }: { text: string }) {
  return (
    <span title={text} className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-orange-200 text-slate-500">
      <Info size={12} />
    </span>
  );
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#ececf5] bg-[#fafafc] px-4 py-4">
      <div className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</div>
      <div className="text-lg font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-orange-100 py-3 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="max-w-[150px] truncate text-right font-medium text-slate-900">{value}</span>
    </div>
  );
}
