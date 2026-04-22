/**
 * Manages WhatsApp user sessions and conversation context
 * Maps phone numbers to bot flow state
 */

export interface WhatsAppSession {
  phoneNumber: string;
  userName: string;
  botId: string;
  currentNodeId: string;
  variables: Record<string, unknown>;
  conversationHistory: Array<{
    timestamp: number;
    sender: 'user' | 'bot';
    message: string;
  }>;
  lastInteractionAt: number;
  createdAt: number;
}

export class WhatsAppSessionManager {
  private sessions: Map<string, WhatsAppSession> = new Map();
  private readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Get or create a session for a phone number
   */
  getOrCreateSession(
    phoneNumber: string,
    userName: string,
    botId: string,
    startNodeId: string
  ): WhatsAppSession {
    const key = this.getSessionKey(phoneNumber, botId);
    let session = this.sessions.get(key);

    if (!session) {
      session = {
        phoneNumber,
        userName,
        botId,
        currentNodeId: startNodeId,
        variables: {},
        conversationHistory: [],
        lastInteractionAt: Date.now(),
        createdAt: Date.now(),
      };
      this.sessions.set(key, session);
    } else {
      session.lastInteractionAt = Date.now();
    }

    return session;
  }

  /**
   * Get existing session
   */
  getSession(phoneNumber: string, botId: string): WhatsAppSession | undefined {
    const key = this.getSessionKey(phoneNumber, botId);
    return this.sessions.get(key);
  }

  /**
   * Update session state after node execution
   */
  updateSession(
    phoneNumber: string,
    botId: string,
    update: {
      currentNodeId?: string;
      variables?: Record<string, unknown>;
      addMessage?: { sender: 'user' | 'bot'; message: string };
    }
  ): void {
    const session = this.getSession(phoneNumber, botId);
    if (!session) return;

    if (update.currentNodeId) {
      session.currentNodeId = update.currentNodeId;
    }

    if (update.variables) {
      session.variables = { ...session.variables, ...update.variables };
    }

    if (update.addMessage) {
      session.conversationHistory.push({
        timestamp: Date.now(),
        sender: update.addMessage.sender,
        message: update.addMessage.message,
      });
    }

    session.lastInteractionAt = Date.now();
  }

  /**
   * Clear expired sessions
   */
  clearExpiredSessions(): void {
    const now = Date.now();
    for (const [key, session] of this.sessions.entries()) {
      if (now - session.lastInteractionAt > this.SESSION_TIMEOUT) {
        this.sessions.delete(key);
      }
    }
  }

  /**
   * Delete session
   */
  deleteSession(phoneNumber: string, botId: string): void {
    const key = this.getSessionKey(phoneNumber, botId);
    this.sessions.delete(key);
  }

  /**
   * Get conversation history
   */
  getConversationHistory(phoneNumber: string, botId: string): WhatsAppSession['conversationHistory'] {
    const session = this.getSession(phoneNumber, botId);
    return session?.conversationHistory || [];
  }

  private getSessionKey(phoneNumber: string, botId: string): string {
    return `${botId}:${phoneNumber}`;
  }
}

// Export singleton instance
export const whatsappSessionManager = new WhatsAppSessionManager();
