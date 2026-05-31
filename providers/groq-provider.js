const { ProviderIds } = require('./types');
const { createProviderSystemPrompt, createProviderUserPrompt } = require('./prompt-quality');

function normalizeString(value) {
  return String(value || '').trim();
}

function safeErrorMessage(err) {
  if (!err) return 'unknown error';
  if (typeof err === 'string') return err;
  return String(err.message || err);
}

function getFetch() {
  if (typeof fetch === 'function') return fetch;
  return null;
}

async function fetchJson(url, options) {
  const f = getFetch();
  if (!f) {
    const err = new Error('fetch is not available in this Node.js runtime');
    err.code = 'fetch_unavailable';
    throw err;
  }

  const timeoutMs = options && options.timeoutMs ? options.timeoutMs : 15000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await f(url, {
      method: options && options.method ? options.method : 'GET',
      headers: options && options.headers ? options.headers : undefined,
      body: options && options.body ? options.body : undefined,
      signal: controller.signal
    });

    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (_) {
      data = null;
    }

    if (!res.ok) {
      const err = new Error(`HTTP ${res.status}: ${text || 'request failed'}`);
      err.code = 'http_error';
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data;
  } finally {
    clearTimeout(timer);
  }
}

class GroqProvider {
  constructor(options) {
    const opts = options || {};
    this.id = ProviderIds.GROQ;
    this.apiKey = normalizeString(opts.apiKey || process.env.GROQ_API_KEY);
    this.model = normalizeString(opts.model || process.env.GROQ_MODEL || 'llama-3.1-8b-instant');
    this.baseUrl = normalizeString(opts.baseUrl || process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1');
  }

  async getStatus() {
    if (!this.apiKey) return { id: this.id, available: false, reason: 'missing GROQ_API_KEY', model: this.model };
    return { id: this.id, available: true, model: this.model, baseUrl: this.baseUrl };
  }

  async run(params) {
    const status = await this.getStatus();
    if (!status.available) {
      const err = new Error(status.reason || 'groq unavailable');
      err.code = 'provider_unavailable';
      throw err;
    }

    const agent = (params && params.agent) || null;
    const input = normalizeString(params && params.input);
    const taskType = normalizeString(params && params.taskType);
    const stage = normalizeString(params && params.stage);
    const context = (params && params.context) || {};
    const providerStatus = (params && params.providerStatus) || {};

    const messages = [
      {
        role: 'system',
        content: createProviderSystemPrompt(agent)
      },
      {
        role: 'user',
        content: createProviderUserPrompt({ agent, input, taskType, stage, context, providerStatus })
      }
    ];

    const data = await fetchJson(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      timeoutMs: 20000,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({ model: this.model, messages, temperature: 0.2 })
    });

    const text =
      data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content
        ? String(data.choices[0].message.content)
        : '';

    return {
      provider: this.id,
      model: this.model,
      agent: agent ? { id: agent.id, name: agent.name, role: agent.role } : null,
      taskType: taskType || '',
      stage: stage || '',
      text: normalizeString(text)
    };
  }
}

module.exports = {
  GroqProvider
};
