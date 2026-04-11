import type { ActionLogicBlock, Block } from '@/lib/blocks';
import type {
  IntegrationContext,
  IntegrationHandler,
  IntegrationResult,
} from '@/lib/flowRuntime/types';
import { INTEGRATION_PROVIDERS, type IntegrationHeader } from '@/lib/integrations';

class IntegrationService {
  private handlers = new Map<string, IntegrationHandler>();

  register(type: string, handler: IntegrationHandler) {
    this.handlers.set(type, handler);
    return () => this.handlers.delete(type);
  }

  async execute(block: Block, context: IntegrationContext): Promise<IntegrationResult> {
    const handler = this.handlers.get(block.type) || defaultIntegrationHandler;
    return handler(block, context);
  }
}

export const integrationService = new IntegrationService();

integrationService.register('http_request', async (block, context) => {
  return executeHttpRequest(block, context, 'HTTP endpoint');
});

integrationService.register('webhook', async (block, context) => {
  return executeHttpRequest(block, context, 'webhook URL');
});

for (const type of INTEGRATION_PROVIDERS) {
  if (type === 'http_request') continue;
  if (type === 'send_email') {
    integrationService.register(type, async (block, context) => executeEmailRequest(block, context));
    continue;
  }
  integrationService.register(type, async (block, context) => executeProviderRequest(block, context));
}

for (const type of ['script', 'typebot', 'redirect', 'wait', 'ab_test', 'jump', 'return']) {
  integrationService.register(type, async (block) => skipped(block, 'No runtime integration configuration supplied yet.'));
}

async function executeHttpRequest(block: Block, context: IntegrationContext, configLabel: string) {
  const actionBlock = block as ActionLogicBlock;
  const endpoint = context.variables.resolve(actionBlock.integration?.url || actionBlock.label || '').trim();
  const method = actionBlock.integration?.method || 'POST';
  const body = context.variables.resolve(actionBlock.integration?.body || '');

  if (!isHttpUrl(endpoint)) {
    return skipped(block, `No ${configLabel} configured in the block label.`);
  }

  const response = await fetch(endpoint, {
    method,
    headers: normalizeHeaders(actionBlock.integration?.headers, {
      'content-type': 'application/json',
      authorization: actionBlock.integration?.apiKey || '',
    }),
    body: method === 'GET'
      ? undefined
      : body || JSON.stringify({
          flowId: context.flow.id,
          sessionId: context.session.id,
          variables: context.variables.all(),
        }),
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : await response.text();

  return {
    ok: response.ok,
    message: response.ok ? `HTTP request completed (${response.status}).` : `HTTP request failed (${response.status}).`,
    variable: actionBlock.integration?.targetVariable || `${block.type}_response`,
    value: data,
    data,
  };
}

async function executeProviderRequest(block: Block, context: IntegrationContext) {
  const actionBlock = block as ActionLogicBlock;
  const config = actionBlock.integration;
  const endpoint = context.variables.resolve(config?.url || actionBlock.label || '').trim();

  if (!isHttpUrl(endpoint)) {
    return skipped(block, 'No integration API URL configured.');
  }

  const payload = {
    provider: block.type,
    operation: config?.operation || 'call_api',
    model: context.variables.resolve(config?.model || ''),
    prompt: context.variables.resolve(config?.prompt || ''),
    variables: context.variables.all(),
    sessionId: context.session.id,
    flowId: context.flow.id,
  };

  const response = await fetch(endpoint, {
    method: config?.method || 'POST',
    headers: normalizeHeaders(config?.headers, {
      'content-type': 'application/json',
      authorization: config?.apiKey || '',
    }),
    body: (config?.method || 'POST') === 'GET'
      ? undefined
      : context.variables.resolve(config?.body || JSON.stringify(payload)),
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : await response.text();

  return {
    ok: response.ok,
    message: response.ok ? `${block.type} integration completed.` : `${block.type} integration failed (${response.status}).`,
    variable: config?.targetVariable || `${block.type}_result`,
    value: data,
    data,
  };
}

async function executeEmailRequest(block: Block, context: IntegrationContext) {
  const actionBlock = block as ActionLogicBlock;
  const config = actionBlock.integration;
  const endpoint = context.variables.resolve(config?.url || actionBlock.label || '').trim();

  if (!isHttpUrl(endpoint)) {
    return skipped(block, 'No email API URL configured.');
  }

  const response = await fetch(endpoint, {
    method: config?.method || 'POST',
    headers: normalizeHeaders(config?.headers, {
      'content-type': 'application/json',
      authorization: config?.apiKey || '',
    }),
    body: JSON.stringify({
      provider: block.type,
      to: context.variables.resolve(config?.to || ''),
      subject: context.variables.resolve(config?.subject || ''),
      body: context.variables.resolve(config?.body || config?.prompt || ''),
      variables: context.variables.all(),
    }),
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : await response.text();

  return {
    ok: response.ok,
    message: response.ok ? 'Email integration completed.' : `Email integration failed (${response.status}).`,
    variable: config?.targetVariable || `${block.type}_result`,
    value: data,
    data,
  };
}

async function defaultIntegrationHandler(block: Block) {
  return skipped(block, `No integration handler registered for "${block.type}".`);
}

function skipped(block: Block, reason: string): IntegrationResult {
  return {
    ok: true,
    message: reason,
    variable: `${block.type}_result`,
    value: { ok: true, skipped: true, reason },
  };
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function normalizeHeaders(headers: IntegrationHeader[] | undefined, defaults: Record<string, string>) {
  const nextHeaders: Record<string, string> = {};

  Object.entries(defaults).forEach(([key, value]) => {
    if (value) nextHeaders[key] = value;
  });

  for (const header of headers || []) {
    if (!header.key.trim()) continue;
    nextHeaders[header.key.trim()] = header.value;
  }

  return nextHeaders;
}
