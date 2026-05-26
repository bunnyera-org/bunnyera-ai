const { ProviderIds } = require('./types');
const { MockProvider } = require('./mock-provider');
const { OllamaProvider } = require('./ollama-provider');
const { OpenRouterProvider } = require('./openrouter-provider');
const { GeminiProvider } = require('./gemini-provider');
const { GroqProvider } = require('./groq-provider');

function normalizeProviderId(value) {
  return String(value || '').trim().toLowerCase();
}

function isSupportedProvider(id) {
  return Object.values(ProviderIds).includes(id);
}

function safeErrorMessage(err) {
  if (!err) return 'unknown error';
  if (typeof err === 'string') return err;
  return String(err.message || err);
}

async function getStatusSafe(provider) {
  try {
    if (provider && typeof provider.getStatus === 'function') return await provider.getStatus();
    return { id: provider && provider.id ? provider.id : 'unknown', available: true, model: provider && provider.model ? provider.model : '' };
  } catch (err) {
    return { id: provider && provider.id ? provider.id : 'unknown', available: false, reason: safeErrorMessage(err), model: provider && provider.model ? provider.model : '' };
  }
}

class ProviderRouterSession {
  constructor(params) {
    this.requestedProvider = params.requestedProvider;
    this.usedProvider = params.usedProvider;
    this.fallbackUsed = params.fallbackUsed;
    this.providerStatus = params.providerStatus;
    this._primary = params.primary;
    this._fallback = params.fallback;
  }

  async run(runParams) {
    try {
      return await this._primary.run(runParams);
    } catch (err) {
      const errorMessage = safeErrorMessage(err);
      this.fallbackUsed = true;
      this.usedProvider = this._fallback.id;
      this.providerStatus.usedProvider = this.usedProvider;
      this.providerStatus.fallbackUsed = true;
      this.providerStatus.error = {
        provider: this._primary.id,
        message: errorMessage
      };
      return await this._fallback.run(runParams);
    }
  }
}

class ProviderRouter {
  constructor(options) {
    this.options = options || {};
    this.mockProvider = new MockProvider();
  }

  async createSession() {
    const requestedRaw = normalizeProviderId(process.env.AI_PROVIDER || ProviderIds.MOCK);
    const requestedProvider = isSupportedProvider(requestedRaw) ? requestedRaw : ProviderIds.MOCK;

    let primary = this.mockProvider;
    if (requestedProvider === ProviderIds.OLLAMA) primary = new OllamaProvider();
    else if (requestedProvider === ProviderIds.OPENROUTER) primary = new OpenRouterProvider();
    else if (requestedProvider === ProviderIds.GEMINI) primary = new GeminiProvider();
    else if (requestedProvider === ProviderIds.GROQ) primary = new GroqProvider();

    const mockStatus = await getStatusSafe(this.mockProvider);
    const primaryStatus = primary.id === this.mockProvider.id ? mockStatus : await getStatusSafe(primary);

    const providerStatus = {
      requestedProvider: requestedRaw || ProviderIds.MOCK,
      usedProvider: primary.id,
      fallbackUsed: false,
      providers: {
        [ProviderIds.MOCK]: mockStatus,
        [primary.id]: primaryStatus
      }
    };

    let fallbackUsed = false;
    let usedProvider = primary.id;

    if (requestedRaw !== requestedProvider) {
      fallbackUsed = true;
      usedProvider = ProviderIds.MOCK;
      providerStatus.usedProvider = usedProvider;
      providerStatus.fallbackUsed = true;
      providerStatus.reason = `unknown provider "${requestedRaw}", fallback to mock`;
      primary = this.mockProvider;
    } else if (!primaryStatus.available) {
      fallbackUsed = true;
      usedProvider = ProviderIds.MOCK;
      providerStatus.usedProvider = usedProvider;
      providerStatus.fallbackUsed = true;
      providerStatus.reason = `provider "${requestedProvider}" unavailable, fallback to mock`;
      primary = this.mockProvider;
    }

    return new ProviderRouterSession({
      requestedProvider: requestedProvider,
      usedProvider,
      fallbackUsed,
      providerStatus,
      primary,
      fallback: this.mockProvider
    });
  }
}

module.exports = {
  ProviderRouter
};
