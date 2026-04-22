import { NextRequest, NextResponse } from 'next/server';
import { whatsappService } from '@/lib/whatsapp/whatsappService';

/**
 * GET /api/whatsapp/config
 * Get WhatsApp configuration for a bot
 */
export async function GET(request: NextRequest) {
  try {
    const botId = request.nextUrl.searchParams.get('botId');
    if (!botId) {
      return NextResponse.json({ error: 'Missing botId' }, { status: 400 });
    }

    // TODO: Fetch bot settings from database
    // const bot = await db.query('SELECT settings FROM bots WHERE id = ?', [botId]);
    // Return only non-sensitive data
    
    return NextResponse.json({
      configured: !!whatsappService.getConfig(),
      webhookUrl: `${request.nextUrl.origin}/api/whatsapp/webhook?botId=${botId}`,
    });
  } catch (error) {
    console.error('Error fetching WhatsApp config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/whatsapp/config
 * Update WhatsApp configuration for a bot
 */
export async function POST(request: NextRequest) {
  try {
    const botId = request.nextUrl.searchParams.get('botId');
    if (!botId) {
      return NextResponse.json({ error: 'Missing botId' }, { status: 400 });
    }

    const body = await request.json() as {
      phoneNumberId?: string;
      accessToken?: string;
      businessAccountId?: string;
    };

    // Validate required fields
    if (!body.phoneNumberId || !body.accessToken || !body.businessAccountId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Configure service
    whatsappService.setConfig({
      phoneNumberId: body.phoneNumberId,
      accessToken: body.accessToken,
      businessAccountId: body.businessAccountId,
    });

    // TODO: Save to database
    // await db.query(
    //   'UPDATE bots SET settings = ? WHERE id = ?',
    //   [{ ...existingSettings, whatsapp: body }, botId]
    // );

    return NextResponse.json({
      success: true,
      message: 'WhatsApp configuration updated',
    });
  } catch (error) {
    console.error('Error updating WhatsApp config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/whatsapp/config
 * Remove WhatsApp configuration for a bot
 */
export async function DELETE(request: NextRequest) {
  try {
    const botId = request.nextUrl.searchParams.get('botId');
    if (!botId) {
      return NextResponse.json({ error: 'Missing botId' }, { status: 400 });
    }

    // TODO: Remove from database
    // await db.query(
    //   'UPDATE bots SET settings = ? WHERE id = ?',
    //   [{ ...existingSettings, whatsapp: null }, botId]
    // );

    return NextResponse.json({
      success: true,
      message: 'WhatsApp configuration removed',
    });
  } catch (error) {
    console.error('Error deleting WhatsApp config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
