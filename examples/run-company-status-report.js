const { BunnyEraAI, CONTRACT_VERSION } = require('../src/bunnyera-ai');
const {
  createCompanyStatusReportInstructions,
  isCompanyStatusReportIntent
} = require('../templates/company-status-report');

const STATUS_TASK =
  '用中文生成一份 BunnyEra AI Company OS 当前状态报告，说明 Console V2 状态、AI Brain 状态、Provider / fallback 状态。不要编造日期、平台、版本、日志结果或测试人员。';

function assertCompanyStatusReport(output, expectedProvider) {
  const failures = [];
  const resultText = String(output.data && output.data.result ? output.data.result : '');
  const providerStatus = output.providerStatus || {};

  if (output.success !== true) failures.push('success must be true');
  if (output.error !== null) failures.push('error must be null');
  if (!output.meta || output.meta.contractVersion !== CONTRACT_VERSION) {
    failures.push(`meta.contractVersion must be ${CONTRACT_VERSION}`);
  }
  if (providerStatus.requestedProvider !== expectedProvider) {
    failures.push(`providerStatus.requestedProvider must be ${expectedProvider}`);
  }

  const titleOk = resultText.includes('BunnyEra Company Status Report') || resultText.includes('标题');
  if (!titleOk) failures.push('result must include a title');

  [
    '已验证事实',
    '当前系统状态',
    'Provider 状态',
    '风险与限制',
    '建议下一步',
    '未提供或未确认信息'
  ].forEach((section) => {
    if (!resultText.includes(section)) failures.push(`result must include section: ${section}`);
  });

  if (!resultText.includes('未提供') && !resultText.includes('未确认')) {
    failures.push('result must mark missing information as 未提供 or 未确认');
  }

  if (failures.length > 0) {
    throw new Error(`Company status report check failed:\n- ${failures.join('\n- ')}`);
  }
}

function assertTemplateIntent() {
  const instructions = createCompanyStatusReportInstructions();
  const required = ['标题', '已验证事实', '当前系统状态', 'Provider 状态', '风险与限制', '建议下一步', '未提供或未确认信息'];
  const missing = required.filter((token) => !instructions.includes(token));

  if (!isCompanyStatusReportIntent(STATUS_TASK)) {
    missing.push('company status report intent detection');
  }

  if (missing.length > 0) {
    throw new Error(`Company status template controls missing: ${missing.join(', ')}`);
  }
}

async function runCase(ai, provider) {
  const output = await ai.runTask({
    taskId: `task_company_status_${provider}`,
    agentRole: 'Leader',
    taskType: 'review',
    input: STATUS_TASK,
    provider,
    context: {
      source: 'bunnyera-ai',
      contractVersion: CONTRACT_VERSION
    },
    options: {
      language: 'zh-CN',
      stream: false
    }
  });

  assertCompanyStatusReport(output, provider);

  console.log(`Case: provider=${provider} BunnyEra Company Status Report`);
  console.log(
    JSON.stringify(
      {
        contractVersion: output.meta.contractVersion,
        provider: output.provider,
        requestedProviderSource: output.providerStatus.requestedProviderSource
      },
      null,
      2
    )
  );
  console.log('');
}

async function main() {
  assertTemplateIntent();

  const ai = new BunnyEraAI();
  await runCase(ai, 'mock');

  if (!process.env.GROQ_API_KEY) {
    console.log('Case: provider=groq BunnyEra Company Status Report');
    console.log('GROQ_API_KEY not set; skipping real Groq company status report call.');
    console.log('');
    return;
  }

  await runCase(ai, 'groq');
}

if (require.main === module) {
  main().catch((err) => {
    console.error(String(err && err.stack ? err.stack : err));
    process.exitCode = 1;
  });
}
