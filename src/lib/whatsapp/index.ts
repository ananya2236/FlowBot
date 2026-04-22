/**
 * WhatsApp Integration Module
 * 
 * This module handles all WhatsApp integration functionality including:
 * - Message sending/receiving
 * - Session management
 * - Flow execution
 * - Webhook handling
 * 
 * Usage:
 * 
 * import { whatsappService, whatsappSessionManager } from '@/lib/whatsapp';
 * 
 * // Send message
 * await whatsappService.sendMessage('1234567890', {
 *   type: 'text',
 *   content: 'Hello!'
 * });
 * 
 * // Get session
 * const session = whatsappSessionManager.getSession(phoneNumber, botId);
 * 
 * // Send notification
 * import { sendWhatsAppNotification } from '@/lib/whatsapp/whatsappFlowHandler';
 * await sendWhatsAppNotification(phoneNumber, { type: 'text', content: 'Alert!' });
 */

export { whatsappService, type WhatsAppConfig, type WhatsAppMessage } from './whatsappService';
export { whatsappSessionManager, type WhatsAppSession } from './whatsappSessionManager';
export { executeWhatsAppFlow, sendWhatsAppNotification } from './whatsappFlowHandler';
