export const INTEGRATION_PROVIDERS = [
  'sheets',
  'analytics',
  'http_request',
  'send_email',
  'zapier',
  'make',
  'pabbly',
  'chatwoot',
  'pixel',
  'openai',
  'cal',
  'chatnode',
  'qrcode',
  'dify',
  'mistral',
  'elevenlabs',
  'anthropic',
  'together',
  'openrouter',
  'nocodb',
  'segment',
  'groq',
  'zendesk',
  'postgres',
  'perplexity',
  'deepseek',
  'blink',
  'gmail',
] as const;

export type IntegrationProvider = (typeof INTEGRATION_PROVIDERS)[number];
export type IntegrationHttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface IntegrationHeader {
  id: string;
  key: string;
  value: string;
}

export interface IntegrationBlockConfig {
  provider: IntegrationProvider;
  operation: string;
  method: IntegrationHttpMethod;
  url: string;
  headers: IntegrationHeader[];
  body: string;
  targetVariable: string;
  apiKey: string;
  model: string;
  prompt: string;
  to: string;
  subject: string;
}

export const INTEGRATION_LABELS: Record<IntegrationProvider, string> = {
  sheets: 'Google Sheets',
  analytics: 'Analytics',
  http_request: 'HTTP request',
  send_email: 'Email',
  zapier: 'Zapier',
  make: 'Make.com',
  pabbly: 'Pabbly',
  chatwoot: 'Chatwoot',
  pixel: 'Pixel',
  openai: 'OpenAI',
  cal: 'Cal.com',
  chatnode: 'ChatNode',
  qrcode: 'QR code',
  dify: 'Dify.AI',
  mistral: 'Mistral',
  elevenlabs: 'ElevenLabs',
  anthropic: 'Anthropic',
  together: 'Together',
  openrouter: 'OpenRouter',
  nocodb: 'NocoDB',
  segment: 'Segment',
  groq: 'Groq',
  zendesk: 'Zendesk',
  postgres: 'Postgres',
  perplexity: 'Perplexity',
  deepseek: 'DeepSeek',
  blink: 'Blink',
  gmail: 'Gmail',
};

export function isIntegrationProvider(value: string): value is IntegrationProvider {
  return INTEGRATION_PROVIDERS.includes(value as IntegrationProvider);
}

export function createDefaultIntegrationConfig(provider: IntegrationProvider): IntegrationBlockConfig {
  return {
    provider,
    operation: getDefaultOperation(provider),
    method: provider === 'analytics' || provider === 'pixel' || provider === 'qrcode' ? 'GET' : 'POST',
    url: '',
    headers: [],
    body: '',
    targetVariable: `${provider}_result`,
    apiKey: '',
    model: getDefaultModel(provider),
    prompt: '',
    to: '',
    subject: '',
  };
}

function getDefaultOperation(provider: IntegrationProvider) {
  switch (provider) {
    case 'sheets':
      return 'append_row';
    case 'analytics':
    case 'segment':
    case 'pixel':
      return 'track_event';
    case 'send_email':
    case 'gmail':
      return 'send_email';
    case 'chatwoot':
    case 'zendesk':
      return 'create_ticket';
    case 'openai':
    case 'anthropic':
    case 'mistral':
    case 'together':
    case 'openrouter':
    case 'groq':
    case 'perplexity':
    case 'deepseek':
    case 'dify':
    case 'chatnode':
      return 'generate_text';
    case 'elevenlabs':
      return 'text_to_speech';
    case 'postgres':
    case 'nocodb':
      return 'query';
    case 'cal':
      return 'create_booking';
    case 'qrcode':
      return 'generate_qr';
    default:
      return 'call_api';
  }
}

function getDefaultModel(provider: IntegrationProvider) {
  switch (provider) {
    case 'openai':
      return 'gpt-4.1-mini';
    case 'anthropic':
      return 'claude-3-5-sonnet';
    case 'mistral':
      return 'mistral-large-latest';
    case 'groq':
      return 'llama-3.3-70b-versatile';
    case 'deepseek':
      return 'deepseek-chat';
    default:
      return '';
  }
}
