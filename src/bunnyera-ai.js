const fs = require('fs');
const path = require('path');
const { inferTaskType } = require('../providers/mock-provider');
const { ProviderRouter } = require('../providers/provider-router');

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
    const taskInput = normalizeString(input);
    const taskType = inferTaskType(taskInput);

    const leader = this._getAgentById('leader') || { id: 'leader', name: 'Leader', role: 'Orchestrator' };
    const planner = this._getAgentById('planner') || { id: 'planner', name: 'Planner', role: 'Planner' };
    const executor = this._getAgentById('executor') || { id: 'executor', name: 'Executor', role: 'Executor' };
    const reviewer = this._getAgentById('reviewer') || { id: 'reviewer', name: 'Reviewer', role: 'Reviewer' };
    const coder = this._getAgentById('coder') || { id: 'coder', name: 'Coder', role: 'Coder' };

    const session = await this.providerRouter.createSession();

    const planRes = await session.run({
      agent: planner,
      taskType,
      input: taskInput,
      stage: 'plan'
    });

    const resultRes = await session.run({
      agent: executor,
      taskType,
      input: taskInput,
      stage: 'execute',
      context: { plan: planRes.text }
    });

    const reviewRes = await session.run({
      agent: reviewer,
      taskType,
      input: taskInput,
      stage: 'review',
      context: { plan: planRes.text, result: resultRes.text }
    });

    const nextRes = await session.run({
      agent: coder,
      taskType,
      input: taskInput,
      stage: 'next',
      context: { plan: planRes.text, result: resultRes.text, review: reviewRes.text }
    });

    return {
      agentName: normalizeString(leader.name) || 'Leader',
      taskType,
      plan: normalizeString(planRes.text),
      result: normalizeString(resultRes.text),
      review: normalizeString(reviewRes.text),
      nextSteps: normalizeString(nextRes.text),
      provider: session.usedProvider,
      model: normalizeString(planRes.model),
      fallbackUsed: session.fallbackUsed,
      providerStatus: session.providerStatus
    };
  }
}

module.exports = {
  BunnyEraAI
};
