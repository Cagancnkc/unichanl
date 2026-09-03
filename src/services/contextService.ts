import { sessionRepository } from '../db/repositories/sessionRepository.js';
import { ValidationError } from '../utils/errors.js';
import type { ChatMessage } from '../types/index.js';

const MAX_CONTEXT_MESSAGES = 20;
const MAX_CONTEXT_CHARS = 400_000; // ~100k token

class ContextService {
  async buildContextPackage(
    sessionId: string,
    newMessage: ChatMessage,
    systemPrompt?: string,
  ): Promise<ChatMessage[]> {
    const session = await sessionRepository.findById(sessionId);
    if (!session) throw new ValidationError('Oturum bulunamadı');

    const history = session.messages
      .slice(-MAX_CONTEXT_MESSAGES)
      .map((m) => ({ role: m.role as ChatMessage['role'], content: m.content }));

    const trimmed = this.trimToCharBudget(history);

    const messages: ChatMessage[] = [];

    const sysPrompt = systemPrompt ?? session.systemPrompt;
    if (sysPrompt) {
      messages.push({ role: 'system', content: sysPrompt });
    }

    messages.push(...trimmed);
    messages.push(newMessage);

    return messages;
  }

  private trimToCharBudget(messages: ChatMessage[]): ChatMessage[] {
    let budget = MAX_CONTEXT_CHARS;
    const result: ChatMessage[] = [];

    for (let i = messages.length - 1; i >= 0; i--) {
      budget -= messages[i].content.length;
      if (budget < 0) break;
      result.unshift(messages[i]);
    }

    return result;
  }
}

export const contextService = new ContextService();
