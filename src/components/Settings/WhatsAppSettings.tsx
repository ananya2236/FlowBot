'use client';

import React, { useState } from 'react';
import useStore from '@/lib/store';

interface WhatsAppSettingsProps {
  botId: string;
}

export function WhatsAppSettings({ botId }: WhatsAppSettingsProps) {
  const { updateBotSettings } = useStore();
  const bot = useStore((state) => state.bots.find((b) => b.id === botId));
  const whatsappSettings = bot?.settings?.whatsapp;

  const [isEnabled, setIsEnabled] = useState(whatsappSettings?.enabled || false);
  const [phoneNumberId, setPhoneNumberId] = useState(whatsappSettings?.phoneNumberId || '');
  const [accessToken, setAccessToken] = useState(whatsappSettings?.accessToken || '');
  const [businessAccountId, setBusinessAccountId] = useState(whatsappSettings?.businessAccountId || '');
  const [autoReply, setAutoReply] = useState(whatsappSettings?.autoReply || '');
  const [allowFileUploads, setAllowFileUploads] = useState(whatsappSettings?.allowFileUploads ?? true);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      updateBotSettings(botId, {
        whatsapp: {
          enabled: isEnabled,
          phoneNumberId,
          accessToken,
          businessAccountId,
          autoReply,
          allowFileUploads,
          webhookUrl: `${window.location.origin}/api/whatsapp/webhook?botId=${botId}`,
        },
      });
      // Show success message
      console.log('WhatsApp settings saved');
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg border border-slate-200">
      <div>
        <h3 className="text-lg font-bold text-black mb-4">WhatsApp Integration</h3>
        <p className="text-sm text-slate-600 mb-6">
          Enable your bot to communicate via WhatsApp. Users can message your bot through WhatsApp and receive instant responses.
        </p>
      </div>

      {/* Enable/Disable Toggle */}
      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
        <div>
          <label className="font-semibold text-slate-900">Enable WhatsApp</label>
          <p className="text-sm text-slate-600">Activate WhatsApp integration for this bot</p>
        </div>
        <input
          type="checkbox"
          checked={isEnabled}
          onChange={(e) => setIsEnabled(e.target.checked)}
          className="w-5 h-5 cursor-pointer"
        />
      </div>

      {isEnabled && (
        <>
          {/* Phone Number ID */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Phone Number ID *
            </label>
            <input
              type="text"
              value={phoneNumberId}
              onChange={(e) => setPhoneNumberId(e.target.value)}
              placeholder="Enter WhatsApp Phone Number ID"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <p className="text-xs text-slate-500 mt-1">
              Get this from your WhatsApp Business Account settings
            </p>
          </div>

          {/* Access Token */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Access Token *
            </label>
            <input
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="Enter WhatsApp Access Token"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <p className="text-xs text-slate-500 mt-1">
              Your token will be encrypted and stored securely
            </p>
          </div>

          {/* Business Account ID */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Business Account ID *
            </label>
            <input
              type="text"
              value={businessAccountId}
              onChange={(e) => setBusinessAccountId(e.target.value)}
              placeholder="Enter WhatsApp Business Account ID"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Auto Reply Message */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Auto Reply Message
            </label>
            <textarea
              value={autoReply}
              onChange={(e) => setAutoReply(e.target.value)}
              placeholder="Thanks for reaching out! I will respond shortly."
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <p className="text-xs text-slate-500 mt-1">
              Sent automatically when a user first messages
            </p>
          </div>

          {/* File Uploads */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <label className="font-semibold text-slate-900">Allow File Uploads</label>
              <p className="text-sm text-slate-600">Users can upload images, documents, etc.</p>
            </div>
            <input
              type="checkbox"
              checked={allowFileUploads}
              onChange={(e) => setAllowFileUploads(e.target.checked)}
              className="w-5 h-5 cursor-pointer"
            />
          </div>

          {/* Webhook URL */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Webhook URL
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/api/whatsapp/webhook?botId=${botId}`}
                readOnly
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 text-slate-600"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `${typeof window !== 'undefined' ? window.location.origin : ''}/api/whatsapp/webhook?botId=${botId}`
                  );
                }}
                className="px-3 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-sm font-medium transition-colors"
              >
                Copy
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Add this URL to your WhatsApp webhook settings
            </p>
          </div>

          {/* Setup Instructions */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-semibold text-blue-900 mb-2">Setup Instructions:</p>
            <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
              <li>Fill in Phone Number ID, Access Token, and Business Account ID</li>
              <li>Copy the Webhook URL above</li>
              <li>Go to your WhatsApp Business Account</li>
              <li>Add the webhook URL in webhook settings</li>
              <li>Verify your webhook and save</li>
            </ol>
          </div>
        </>
      )}

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={isSaving || (isEnabled && (!phoneNumberId || !accessToken || !businessAccountId))}
        className="w-full px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white rounded-lg font-semibold transition-colors"
      >
        {isSaving ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  );
}
