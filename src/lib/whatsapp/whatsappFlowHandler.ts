import { whatsappService } from '@/lib/whatsapp/whatsappService';
import { whatsappSessionManager, type WhatsAppSession } from '@/lib/whatsapp/whatsappSessionManager';
import type { RuntimeMessage } from '@/lib/flowRuntime/types';

/**
 * Executes a bot flow in response to WhatsApp message
 * Fetches bot flow from database and processes it
 */
export async function executeWhatsAppFlow(
  botId: string,
  phoneNumber: string,
  userMessage: string,
  session: WhatsAppSession
) {
  try {
    // TODO: Fetch bot flow from your database (Convex)
    // For now, this is a placeholder
    const botFlow = await fetchBotFlow(botId);
    if (!botFlow) {
      await whatsappService.sendMessage(phoneNumber, {
        type: 'text',
        content: 'Bot configuration not found',
      });
      return;
    }

    // TODO: Execute flow using your existing flow engine
    // This should call your runtime with the user message
    const messages = await runBotFlow(
      botFlow,
      userMessage,
      session.variables,
      session.currentNodeId
    );

    // Send response messages back to WhatsApp
    for (const message of messages) {
      if (message.type === 'bot') {
        await whatsappService.sendMessage(phoneNumber, {
          type: message.contentType || 'text',
          content: message.content,
          metadata: message.meta,
        });

        // Add to session history
        whatsappSessionManager.updateSession(phoneNumber, botId, {
          addMessage: { sender: 'bot', message: message.content },
        });
      }
    }

    // Update session with new state
    whatsappSessionManager.updateSession(phoneNumber, botId, {
      variables: session.variables,
      currentNodeId: session.currentNodeId,
    });
  } catch (error) {
    console.error('Error executing WhatsApp flow:', error);

    // Send error message to user
    await whatsappService.sendMessage(phoneNumber, {
      type: 'text',
      content: 'Sorry, an error occurred. Please try again later.',
    });
  }
}

/**
 * Fetch bot flow configuration from database
 */
async function fetchBotFlow(botId: string): Promise<{ nodes: unknown[]; edges: unknown[] } | null> {
  try {
    // TODO: Replace with your actual database call (Convex)
    // Example:
    // const response = await fetch(`/api/bots/${botId}`);
    // return response.json();

    return null;
  } catch (error) {
    console.error('Error fetching bot flow:', error);
    return null;
  }
}

interface BotFlowMessage {
  type: 'bot' | 'user' | 'system' | 'integration';
  content: string;
  contentType?: string;
  meta?: Record<string, unknown>;
}

/**
 * Run bot flow logic
 * TODO: Integrate with your existing flow engine
 */
async function runBotFlow(
  flow: { nodes: unknown[]; edges: unknown[] },
  userMessage: string,
  variables: Record<string, unknown>,
  currentNodeId: string
): Promise<BotFlowMessage[]> {
  // TODO: Call your existing flow engine/Inngest function
  // For now, return a simple response
  return [
    {
      type: 'bot',
      content: `You said: ${userMessage}`,
      contentType: 'text',
    },
  ];
}

/**
 * Send WhatsApp message without executing flow
 * Useful for sending notifications or messages outside of conversation flow
 */
export async function sendWhatsAppNotification(
  phoneNumber: string,
  message: { type: string; content: string; metadata?: Record<string, unknown> }
): Promise<boolean> {
  const result = await whatsappService.sendMessage(phoneNumber, message);
  return result.success;
}
