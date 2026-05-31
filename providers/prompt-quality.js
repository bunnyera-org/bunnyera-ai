const {
  createCompanyStatusReportInstructions,
  isCompanyStatusReportIntent
} = require('../templates/company-status-report');

function normalizeString(value) {
  return String(value || '').trim();
}

function formatValue(value, missingValue) {
  if (typeof value === 'boolean') return String(value);
  const text = normalizeString(value);
  return text || missingValue || '未提供';
}

function formatError(value) {
  if (!value) return 'null';
  if (typeof value === 'string') return value;
  return normalizeString(value.message || JSON.stringify(value)) || '未确认';
}

function formatContext(context) {
  const source = context || {};
  const extra = {};
  Object.keys(source).forEach((key) => {
    if (!['plan', 'result', 'review'].includes(key)) extra[key] = source[key];
  });

  if (Object.keys(extra).length === 0) return '未提供';

  try {
    return JSON.stringify(extra, null, 2);
  } catch (_) {
    return '未确认';
  }
}

function formatProviderStatus(providerStatus) {
  const status = providerStatus || {};
  return [
    `provider.mode: ${formatValue(status.mode || status.usedProvider)}`,
    `provider.name: ${formatValue(status.name)}`,
    `provider.available: ${typeof status.available === 'boolean' ? String(status.available) : '未确认'}`,
    `provider.fallbackUsed: ${typeof status.fallbackUsed === 'boolean' ? String(status.fallbackUsed) : '未确认'}`,
    `provider.requestedProvider: ${formatValue(status.requestedProvider)}`,
    `provider.requestedProviderSource: ${formatValue(status.requestedProviderSource)}`,
    `provider.reason: ${formatValue(status.reason)}`,
    `provider.error: ${formatError(status.error)}`
  ].join('\n');
}

function createOutputQualityInstructions() {
  return [
    'Output quality and factuality rules:',
    '- 不要编造日期、版本、平台、测试人员、日志结果、部署结果、浏览器结果或 API Key 状态。',
    '- If a fact is not present in Input, Agent Role, TaskType, Stage, Context, or ProviderStatus, write "未提供" or "未确认".',
    '- Base every claim only on the supplied Input, Agent Role, TaskType, Stage, Context, and ProviderStatus.',
    '- For system status, QA, connection status, provider status, or architecture status tasks, clearly separate "已验证事实", "未提供或未确认", and "建议下一步".',
    '- Do not claim that tests passed, a browser check ran, a cloud provider succeeded, or a fallback happened unless that exact status is supplied.',
    '- Do not reveal, request, infer, or describe secrets. Treat API keys as unavailable unless explicitly represented by ProviderStatus.',
    '- Keep recommendations separate from verified facts.'
  ].join('\n');
}

function createProviderSystemPrompt(agent) {
  const role = agent && agent.role ? agent.role : 'Agent';
  return [
    `You are BunnyEra AI Brain V1.7. Role=${role}.`,
    createOutputQualityInstructions(),
    'Respond with clear structured text.'
  ].join('\n\n');
}

function createBusinessTemplatePrompt(input) {
  if (!isCompanyStatusReportIntent(input)) return '';
  return createCompanyStatusReportInstructions();
}

function createProviderUserPrompt(params) {
  const opts = params || {};
  const context = opts.context || {};
  const agent = opts.agent || {};
  return [
    `TaskType: ${normalizeString(opts.taskType) || 'unknown'}`,
    `Stage: ${normalizeString(opts.stage) || 'general'}`,
    `AgentRole: ${normalizeString(agent.role || agent.name) || '未提供'}`,
    `Input:\n${normalizeString(opts.input) || '未提供'}`,
    createBusinessTemplatePrompt(opts.input),
    `Context:\n${formatContext(context)}`,
    `ProviderStatus:\n${formatProviderStatus(opts.providerStatus)}`,
    `Plan:\n${normalizeString(context.plan) || '未提供'}`,
    `Result:\n${normalizeString(context.result) || '未提供'}`,
    `Review:\n${normalizeString(context.review) || '未提供'}`
  ].join('\n\n');
}

module.exports = {
  createBusinessTemplatePrompt,
  createOutputQualityInstructions,
  createProviderSystemPrompt,
  createProviderUserPrompt,
  formatProviderStatus
};
