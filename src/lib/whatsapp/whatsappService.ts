import type { RuntimeMessage } from '@/lib/flowRuntime/types';

export interface WhatsAppConfig {
  phoneNumberId: string;
  accessToken: string;
  businessAccountId: string;
}

export interface WhatsAppMessage {
  messaging_product: 'whatsapp';
  to: string;
  type: 'text' | 'image' | 'document' | 'audio';
  text?: { body: string };
  image?: { link: string };
  document?: { link: string };
  audio?: { link: string };
}

export interface WhatsAppIncomingMessage {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      field: string;
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{ profile: { name: string }; wa_id: string }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          type: string;
          text?: { body: string };
          image?: { mime_type: string; sha256: string; id: string };
          document?: { mime_type: string; sha256: string; id: string; filename: string };
          audio?: { mime_type: string; sha256: string; id: string };
        }>;
      };
    }>;
  }>;
}

export class WhatsAppService {
  private config: WhatsAppConfig | null = null;
  private webhookVerifyToken: string = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'flowbot_webhook_token';

  setConfig(config: WhatsAppConfig) {
    this.config = config;
  }

  getConfig(): WhatsAppConfig | null {
    return this.config;
  }

  /**
   * Send a message to WhatsApp user
   */
  async sendMessage(
    phoneNumber: string,
    message: { type: string; content: string; metadata?: Record<string, unknown> }
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.config) {
      return { success: false, error: 'WhatsApp not configured' };
    }

    try {
      const whatsappMessage: WhatsAppMessage = {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'text',
      };

      // Handle different message types
      if (message.type === 'text') {
        whatsappMessage.text = { body: message.content };
      } else if (message.type === 'image' && message.metadata?.link) {
        whatsappMessage.type = 'image';
        whatsappMessage.image = { link: message.metadata.link as string };
      } else if (message.type === 'document' && message.metadata?.link) {
        whatsappMessage.type = 'document';
        whatsappMessage.document = { link: message.metadata.link as string };
      } else if (message.type === 'audio' && message.metadata?.link) {
        whatsappMessage.type = 'audio';
        whatsappMessage.audio = { link: message.metadata.link as string };
      }

      const response = await fetch(
        `https://graph.instagram.com/v18.0/${this.config.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.config.accessToken}`,
          },
          body: JSON.stringify(whatsappMessage),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: JSON.stringify(error) };
      }

      const data = (await response.json()) as { messages?: Array<{ id: string }> };
      return {
        success: true,
        messageId: data.messages?.[0]?.id,
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Verify webhook token
   */
  verifyWebhookToken(token: string): boolean {
    return token === this.webhookVerifyToken;
  }

  /**
   * Parse incoming webhook message
   */
  parseIncomingMessage(
    body: WhatsAppIncomingMessage
  ): {
    phoneNumber: string;
    message: string;
    userName: string;
    messageId: string;
  } | null {
    try {
      const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
      const contact = body.entry?.[0]?.changes?.[0]?.value?.contacts?.[0];

      if (!message || !contact) {
        return null;
      }

      return {
        phoneNumber: message.from,
        message: message.text?.body || '[Media message received]',
        userName: contact.profile.name,
        messageId: message.id,
      };
    } catch {
      return null;
    }
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId: string): Promise<{ success: boolean }> {
    if (!this.config) {
      return { success: false };
    }

    try {
      await fetch(
        `https://graph.instagram.com/v18.0/${this.config.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.config.accessToken}`,
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            status: 'read',
            message_id: messageId,
          }),
        }
      );

      return { success: true };
    } catch {
      return { success: false };
    }
  }
}

// Export singleton instance
export const whatsappService = new WhatsAppService();
