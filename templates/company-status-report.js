function normalizeString(value) {
  return String(value || '').trim();
}

function formatBoolean(value) {
  return typeof value === 'boolean' ? String(value) : '未确认';
}

function formatError(value) {
  if (!value) return 'null';
  if (typeof value === 'string') return value;
  return normalizeString(value.message || JSON.stringify(value)) || '未确认';
}

function isCompanyStatusReportIntent(input) {
  const text = normalizeString(input).toLowerCase();
  if (!text) return false;

  return [
    '公司状态报告',
    'company os 状态',
    'ai company os 当前状态',
    'console v2 状态',
    'ai brain 状态',
    'provider 状态',
    'fallback 状态',
    'provider / fallback 状态',
    'provider/fallback 状态',
    'company status report',
    'company os status',
    'console v2 status',
    'ai brain status',
    'provider status',
    'fallback status'
  ].some((keyword) => text.includes(keyword.toLowerCase()));
}

function createCompanyStatusReportInstructions() {
  return [
    'BunnyEra Company Status Report Template:',
    'When the task asks for a company status report, Company OS status, Console V2 status, AI Brain status, or Provider/fallback status, use this exact structure:',
    '1. 标题',
    '2. 已验证事实',
    '3. 当前系统状态',
    '4. Provider 状态',
    '5. 风险与限制',
    '6. 建议下一步',
    '7. 未提供或未确认信息',
    'Rules:',
    '- Do not invent dates, platforms, versions, log results, testers, deployment state, browser state, or provider key state.',
    '- Use ProviderStatus fields as verified facts when present: mode, name, available, fallbackUsed, requestedProviderSource, reason, error, model.',
    '- Missing information must be written as "未提供" or "未确认".',
    '- Keep verified facts separate from recommendations.'
  ].join('\n');
}

function createProviderFacts(providerStatus) {
  const status = providerStatus || {};
  const usedProvider = normalizeString(status.usedProvider || status.mode);
  const nestedProvider = status.providers && usedProvider ? status.providers[usedProvider] : null;
  const model = normalizeString(status.model || (nestedProvider && nestedProvider.model));
  return [
    `provider.mode: ${normalizeString(status.mode || status.usedProvider) || '未提供'}`,
    `provider.name: ${normalizeString(status.name) || '未提供'}`,
    `available: ${formatBoolean(status.available)}`,
    `fallbackUsed: ${formatBoolean(status.fallbackUsed)}`,
    `requestedProviderSource: ${normalizeString(status.requestedProviderSource) || '未提供'}`,
    `reason: ${normalizeString(status.reason) || '未提供'}`,
    `error: ${formatError(status.error)}`,
    `model: ${model || '未提供'}`
  ];
}

function renderCompanyStatusReport(params) {
  const opts = params || {};
  const input = normalizeString(opts.input) || '未提供';
  const providerStatus = opts.providerStatus || {};
  const facts = createProviderFacts(providerStatus);

  return [
    '# BunnyEra Company Status Report',
    '',
    '## 已验证事实',
    `- 用户任务: ${input}`,
    '- BunnyEraAI.runTask 已返回当前响应对象。',
    ...facts.map((line) => `- ${line}`),
    '',
    '## 当前系统状态',
    '- Console V2 状态: 未确认',
    '- AI Brain 状态: 当前响应由 BunnyEra AI 生成。',
    '- Provider / fallback 状态: 以 Provider 状态字段为准。',
    '- 部署状态: 未确认',
    '',
    '## Provider 状态',
    ...facts.map((line) => `- ${line}`),
    '',
    '## 风险与限制',
    '- 未提供的信息不会被推断为事实。',
    '- 没有日志、测试记录或浏览器验收输入时，不能声明对应结果已发生。',
    '- Provider key 状态只能由 providerStatus 或本地运行结果确认。',
    '',
    '## 建议下一步',
    '- 在 Console V2 浏览器中按实际 provider 选择提交同一任务并核对 Provider Status。',
    '- 如果需要真实 Groq 验收，请在本地环境配置 key 后运行，不要提交密钥。',
    '- 将已验证的版本、平台、日志和测试结果作为 input/context 传入后再生成正式状态报告。',
    '',
    '## 未提供或未确认信息',
    '- 日期: 未提供',
    '- 平台: 未提供',
    '- BunnyEra 版本: 未确认',
    '- 日志结果: 未提供',
    '- 测试人员: 未提供',
    '- 未验证部署状态: 未确认'
  ].join('\n');
}

module.exports = {
  createCompanyStatusReportInstructions,
  isCompanyStatusReportIntent,
  renderCompanyStatusReport
};
