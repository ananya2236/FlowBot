import type { FlowSessionState } from '@/lib/flowRuntime/types';

class RuntimeSessionStore {
  private sessions = new Map<string, FlowSessionState>();

  create(session: FlowSessionState) {
    this.sessions.set(session.id, session);
    return session;
  }

  get(sessionId: string) {
    return this.sessions.get(sessionId) || null;
  }

  save(session: FlowSessionState) {
    session.updatedAt = Date.now();
    this.sessions.set(session.id, session);
    return session;
  }

  delete(sessionId: string) {
    return this.sessions.delete(sessionId);
  }
}

export const runtimeSessionStore = new RuntimeSessionStore();
