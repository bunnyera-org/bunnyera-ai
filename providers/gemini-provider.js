const { ProviderIds } = require('./types');

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

class GeminiProvider {
  constructor(options) {
    const opts = options || {};
    this.id = ProviderIds.GEMINI;
    this.apiKey = normalizeString(opts.apiKey || process.env.GEMINI_API_KEY);
    this.model = normalizeString(opts.model || process.env.GEMINI_MODEL || 'gemini-1.5-flash');
    this.baseUrl = normalizeString(opts.baseUrl || process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com');
  }

  async getStatus() {
    if (!this.apiKey) return { id: this.id, available: false, reason: 'missing GEMINI_API_KEY', model: this.model };
    return { id: this.id, available: true, model: this.model, baseUrl: this.baseUrl };
  }

  async run(params) {
    const status = await this.getStatus();
    if (!status.available) {
      const err = new Error(status.reason || 'gemini unavailable');
      err.code = 'provider_unavailable';
      throw err;
    }

    const agent = (params && params.agent) || null;
    const input = normalizeString(params && params.input);
    const taskType = normalizeString(params && params.taskType);
    const stage = normalizeString(params && params.stage);
    const context = (params && params.context) || {};

    const prompt = [
      `You are BunnyEra AI Brain V1.1. Role=${agent && agent.role ? agent.role : 'Agent'}.`,
      'Respond with clear structured text.',
      '',
      `TaskType: ${taskType || 'unknown'}`,
      `Stage: ${stage || 'general'}`,
      `Input: ${input}`,
      context && context.plan ? `\nPlan:\n${context.plan}` : '',
      context && context.result ? `\nResult:\n${context.result}` : '',
      context && context.review ? `\nReview:\n${context.review}` : ''
    ]
      .filter(Boolean)
      .join('\n');

    const url = `${this.baseUrl}/v1beta/models/${encodeURIComponent(this.model)}:generateContent?key=${encodeURIComponent(
      this.apiKey
    )}`;

    const data = await fetchJson(url, {
      method: 'POST',
      timeoutMs: 20000,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2 }
      })
    });

    const text =
      data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts
        ? data.candidates[0].content.parts.map((p) => p.text || '').join('')
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
  GeminiProvider
};
