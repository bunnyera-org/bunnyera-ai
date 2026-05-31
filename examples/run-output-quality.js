const { BunnyEraAI, CONTRACT_VERSION } = require('../src/bunnyera-ai');
const {
  createOutputQualityInstructions,
  createProviderSystemPrompt,
  createProviderUserPrompt
} = require('../providers/prompt-quality');

const QUALITY_TASK =
  '用中文生成一份 BunnyEra AI Company OS 当前状态报告，说明 Console V2、AI Brain、Groq Provider、fallback 的连接状态。不要编造日期、版本、平台、测试人员或日志结果。';

const QUALITY_REQUEST = {
  taskId: 'task_output_quality_demo',
  agentRole: 'Leader',
  taskType: 'review',
  input: QUALITY_TASK,
  provider: 'mock',
  context: {
    source: 'bunnyera-ai',
    contractVersion: CONTRACT_VERSION,
    verifiedFacts: [
      'Console V2 can call BunnyEraAI.runTask(input).',
      'Provider selection supports input.provider.',
      'Missing provider credentials must fallback to mock.'
    ]
  },
  options: {
    language: 'zh-CN'
  }
};

function assertPromptControls() {
  const instructions = createOutputQualityInstructions();
  const systemPrompt = createProviderSystemPrompt({ role: 'Leader' });
  const userPrompt = createProviderUserPrompt({
    agent: { role: 'Leader' },
    taskType: QUALITY_REQUEST.taskType,
    stage: 'quality-check',
    input: QUALITY_REQUEST.input,
    providerStatus: {
      mode: 'mock',
      name: 'bunnyera-ai-router-mock',
      available: true,
      fallbackUsed: false,
      requestedProvider: 'mock',
      requestedProviderSource: 'input.provider',
      reason: 'provider "mock" selected from input.provider',
      error: null
    }
  });
  const promptText = [instructions, systemPrompt, userPrompt].join('\n\n');
  const required = [
    '不要编造日期',
    '未提供',
    '未确认',
    '已验证事实',
    '建议下一步',
    'ProviderStatus'
  ];
  const missing = required.filter((token) => !promptText.includes(token));

  if (missing.length > 0) {
    throw new Error(`Output quality prompt controls missing: ${missing.join(', ')}`);
  }
}

function assertOutput(output, expectedProvider) {
  const failures = [];
  const provider = output.provider || {};
  const providerStatus = output.providerStatus || {};

  if (output.success !== true) failures.push('success must be true');
  if (output.error !== null) failures.push('error must be null');
  if (!output.meta || output.meta.contractVersion !== CONTRACT_VERSION) {
    failures.push(`meta.contractVersion must be ${CONTRACT_VERSION}`);
  }
  if (!output.data || !output.data.plan || !output.data.result || !output.data.review || !output.data.nextSteps) {
    failures.push('data must include plan/result/review/nextSteps');
  }
  if (providerStatus.requestedProvider !== expectedProvider) {
    failures.push(`providerStatus.requestedProvider must be ${expectedProvider}`);
  }
  if (!provider.mode) failures.push('provider.mode must be present');
  if (typeof provider.fallbackUsed !== 'boolean') failures.push('provider.fallbackUsed must be boolean');

  if (failures.length > 0) {
    throw new Error(`Output quality check failed:\n- ${failures.join('\n- ')}`);
  }
}

async function runMockCase(ai) {
  const output = await ai.runTask(QUALITY_REQUEST);
  assertOutput(output, 'mock');

  console.log('Case: provider=mock output quality controls');
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

async function runGroqCaseIfConfigured(ai) {
  if (!process.env.GROQ_API_KEY) {
    console.log('Case: provider=groq output quality controls');
    console.log('GROQ_API_KEY not set; skipping real Groq quality call.');
    console.log('');
    return;
  }

  const output = await ai.runTask({
    ...QUALITY_REQUEST,
    taskId: 'task_output_quality_groq_demo',
    provider: 'groq'
  });
  assertOutput(output, 'groq');

  console.log('Case: provider=groq output quality controls');
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
  assertPromptControls();

  const ai = new BunnyEraAI();
  await runMockCase(ai);
  await runGroqCaseIfConfigured(ai);

  console.log('BunnyEra AI V1.6 Output Quality Prompt Control checks passed.');
}

if (require.main === module) {
  main().catch((err) => {
    console.error(String(err && err.stack ? err.stack : err));
    process.exitCode = 1;
  });
}
