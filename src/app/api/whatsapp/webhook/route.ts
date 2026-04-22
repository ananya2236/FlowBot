import { NextRequest, NextResponse } from 'next/server';
import { whatsappService, type WhatsAppIncomingMessage } from '@/lib/whatsapp/whatsappService';
import { whatsappSessionManager } from '@/lib/whatsapp/whatsappSessionManager';
import { executeWhatsAppFlow } from '@/lib/whatsapp/whatsappFlowHandler';

/**
 * GET /api/whatsapp/webhook
 * Webhook verification endpoint for WhatsApp
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    // Verify webhook token
    if (mode === 'subscribe' && token && challenge) {
      if (whatsappService.verifyWebhookToken(token)) {
        return new NextResponse(challenge, { status: 200 });
      } else {
        return new NextResponse('Unauthorized', { status: 403 });
      }
    }

    return new NextResponse('Forbidden', { status: 403 });
  } catch (error) {
    console.error('WhatsApp webhook verification error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

/**
 * POST /api/whatsapp/webhook
 * Receives incoming WhatsApp messages
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as WhatsAppIncomingMessage;

    // Parse incoming message
    const incomingData = whatsappService.parseIncomingMessage(body);
    if (!incomingData) {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const { phoneNumber, message, userName, messageId } = incomingData;

    // Get bot ID from query params or headers
    const botId = request.nextUrl.searchParams.get('botId');
    if (!botId) {
      console.warn('No botId provided in webhook');
      return NextResponse.json({ success: false, error: 'Missing botId' }, { status: 400 });
    }

    // Get or create session
    const session = whatsappSessionManager.getOrCreateSession(phoneNumber, userName, botId, 'start');

    // Add user message to history
    whatsappSessionManager.updateSession(phoneNumber, botId, {
      addMessage: { sender: 'user', message },
    });

    // Mark message as read
    await whatsappService.markAsRead(messageId);

    // Execute flow
    await executeWhatsAppFlow(botId, phoneNumber, message, session);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
