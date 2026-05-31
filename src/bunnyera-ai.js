const fs = require('fs');
const path = require('path');
const { inferTaskType } = require('../providers/mock-provider');
const { ProviderRouter } = require('../providers/provider-router');

const CONTRACT_VERSION = 'v1.7.0-business-output-templates';
const SOURCE = 'bunnyera-ai';
const CONSOLE_TASK_TYPES = new Set(['strategy', 'planning', 'execution', 'review', 'coding', 'general']);

function readJsonFile(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(text);
}

function listFiles(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  return fs.readdirSync(dirPath).map((name) => path.join(dirPath, name));
}

function normalizeString(value) {
  return String(value || '').trim();
}

function createRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function createTaskId() {
  return `ai_task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeAgentRole(value) {
  const text = normalizeString(value);
  const roles = ['Leader', 'Planner', 'Executor', 'Reviewer', 'Coder'];
  return roles.includes(text) ? text : 'Leader';
}

function normalizeConsoleTaskType(value) {
  const text = normalizeString(value);
  if (CONSOLE_TASK_TYPES.has(text)) return text;
  if (text.includes('research') || text.includes('planning')) return 'planning';
  if (text.includes('marketing') || text.includes('strategy')) return 'strategy';
  if (text.includes('listing') || text.includes('execution')) return 'execution';
  if (text.includes('review')) return 'review';
  if (text.includes('coding') || text.includes('code')) return 'coding';
  return 'general';
}

function asStringList(value) {
  const text = normalizeString(value);
  if (!text) return [];
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*\d.\s]+/, '').trim())
    .filter(Boolean);
}

function createConsoleProvider(session, model) {
  const providerStatus = session.providerStatus || {};
  const providerInfo =
    providerStatus.providers && providerStatus.usedProvider
      ? providerStatus.providers[providerStatus.usedProvider]
      : null;
  const providerName =
    session.usedProvider === 'mock' ? 'bunnyera-ai-router-mock' : `bunnyera-ai-router-${session.usedProvider}`;
  const reason =
    providerStatus.reason ||
    providerStatus.error?.message ||
    (providerInfo && providerInfo.reason) ||
    'BunnyEra AI provider router response.';

  return {
    mode: session.usedProvider || 'mock',
    name: providerName,
    available: providerInfo && typeof providerInfo.available === 'boolean' ? providerInfo.available : true,
    fallbackUsed: Boolean(session.fallbackUsed),
    reason,
    error: providerStatus.error ? providerStatus.error.message : null,
    latencyMs: providerStatus.latencyMs,
    message: reason,
    model: normalizeString(model)
  };
}

function createMeta() {
  return {
    source: SOURCE,
    contractVersion: CONTRACT_VERSION
  };
}

function createErrorOutput(params) {
  const now = new Date().toISOString();
  const error = {
    message: params.message,
    code: params.code || 'TASK_FAILED',
    retryable: Boolean(params.retryable)
  };
  const providerStatus = {
    requestedProvider: 'mock',
    usedProvider: 'mock',
    mode: 'mock',
    name: 'bunnyera-ai-router-mock',
    available: false,
    fallbackUsed: true,
    reason: params.message,
    error: params.message
  };

  return {
    success: false,
    data: null,
    error,
    meta: createMeta(),
    requestId: params.requestId || createRequestId(),
    taskId: params.taskId,
    agentRole: normalizeAgentRole(params.agentRole),
    taskType: normalizeConsoleTaskType(params.taskType),
    provider: {
      mode: 'mock',
      name: 'bunnyera-ai-router-mock',
      available: false,
      fallbackUsed: true,
      reason: params.message,
      error: params.message,
      message: params.message
    },
    fallbackUsed: true,
    providerStatus,
    createdAt: now
  };
}

class BunnyEraAI {
  constructor(options) {
    const opts = options || {};
    this.rootDir = opts.rootDir ? path.resolve(opts.rootDir) : path.resolve(__dirname, '..');
    this.agentsDir = path.join(this.rootDir, 'agents');
    this.providerRouter = opts.providerRouter || new ProviderRouter();
    this._agentsCache = null;
  }

  loadAgents() {
    if (this._agentsCache) return this._agentsCache;

    const files = listFiles(this.agentsDir)
      .filter((p) => p.toLowerCase().endsWith('.agent.json'))
      .sort((a, b) => a.localeCompare(b));

    const agents = files.map((filePath) => readJsonFile(filePath));
    this._agentsCache = agents;
    return agents;
  }

  _getAgentById(id) {
    const agents = this.loadAgents();
    const targetId = normalizeString(id);
    return agents.find((a) => normalizeString(a.id) === targetId) || null;
  }

  async runTask(input) {
    const request = typeof input === 'object' && input !== null ? input : { input };
    const taskInput = normalizeString(request.input || request.task || request.prompt || input);
    const legacyTaskType = inferTaskType(taskInput);
    const taskType = normalizeConsoleTaskType(request.taskType || legacyTaskType);
    const requestId = createRequestId();
    const taskId = normalizeString(request.taskId) || createTaskId();
    const agentRole = normalizeAgentRole(request.agentRole || request.agentName);
    const providerSelection = {
      provider: request.provider,
      providerMode: request.providerMode
    };

    if (!taskInput) {
      return createErrorOutput({
        requestId,
        taskId,
        agentRole,
        taskType,
        code: 'INVALID_REQUEST',
        message: 'input is required.',
        retryable: false
      });
    }

    try {
      const leader = this._getAgentById('leader') || { id: 'leader', name: 'Leader', role: 'Orchestrator' };
      const planner = this._getAgentById('planner') || { id: 'planner', name: 'Planner', role: 'Planner' };
      const executor = this._getAgentById('executor') || { id: 'executor', name: 'Executor', role: 'Executor' };
      const reviewer = this._getAgentById('reviewer') || { id: 'reviewer', name: 'Reviewer', role: 'Reviewer' };
      const coder = this._getAgentById('coder') || { id: 'coder', name: 'Coder', role: 'Coder' };

      const session = await this.providerRouter.createSession(providerSelection);
      const runProviderStatus = session.providerStatus || {};

      const planRes = await session.run({
        agent: planner,
        taskType: legacyTaskType,
        input: taskInput,
        stage: 'plan',
        providerStatus: runProviderStatus
      });

      const resultRes = await session.run({
        agent: executor,
        taskType: legacyTaskType,
        input: taskInput,
        stage: 'execute',
        context: { plan: planRes.text },
        providerStatus: runProviderStatus
      });

      const reviewRes = await session.run({
        agent: reviewer,
        taskType: legacyTaskType,
        input: taskInput,
        stage: 'review',
        context: { plan: planRes.text, result: resultRes.text },
        providerStatus: runProviderStatus
      });

      const nextRes = await session.run({
        agent: coder,
        taskType: legacyTaskType,
        input: taskInput,
        stage: 'next',
        context: { plan: planRes.text, result: resultRes.text, review: reviewRes.text },
        providerStatus: runProviderStatus
      });

      const agentName = normalizeString(leader.name) || 'Leader';
      const model = normalizeString(planRes.model);
      const provider = createConsoleProvider(session, model);
      const providerStatus = {
        ...session.providerStatus,
        consoleProvider: provider
      };
      const data = {
        agentName,
        agentRole,
        taskType,
        legacyTaskType,
        taskSummary: taskInput,
        plan: normalizeString(planRes.text),
        result: normalizeString(resultRes.text),
        review: normalizeString(reviewRes.text),
        nextSteps: normalizeString(nextRes.text),
        provider,
        providerId: session.usedProvider,
        model,
        fallbackUsed: session.fallbackUsed,
        providerStatus
      };
      const consoleResult = {
        selectedAgent: agentRole,
        taskSummary: taskInput,
        suggestedPlan: asStringList(data.plan),
        nextSteps: asStringList(data.nextSteps),
        providerStatus: provider,
        summary: taskInput,
        plan: asStringList(data.plan),
        rawText: [
          `selectedAgent: ${agentRole}`,
          `taskSummary: ${taskInput}`,
          `suggestedPlan: ${data.plan}`,
          `result: ${data.result}`,
          `review: ${data.review}`,
          `nextSteps: ${data.nextSteps}`,
          `provider: ${provider.mode}`,
          `fallbackUsed: ${String(provider.fallbackUsed)}`
        ].join('\n')
      };

      return {
        success: true,
        data,
        error: null,
        meta: createMeta(),
        requestId,
        taskId,
        agentRole,
        taskType,
        provider,
        result: consoleResult,
        createdAt: new Date().toISOString(),
        agentName,
        legacyTaskType,
        plan: data.plan,
        legacyResult: data.result,
        review: data.review,
        nextSteps: data.nextSteps,
        providerId: session.usedProvider,
        model,
        fallbackUsed: session.fallbackUsed,
        providerStatus
      };
    } catch (err) {
      return createErrorOutput({
        requestId,
        taskId,
        agentRole,
        taskType,
        code: 'TASK_FAILED',
        message: String(err && err.message ? err.message : err),
        retryable: true
      });
    }
  }
}

module.exports = {
  BunnyEraAI,
  CONTRACT_VERSION
};
