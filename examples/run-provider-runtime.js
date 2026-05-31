const { BunnyEraAI, CONTRACT_VERSION } = require('../src/bunnyera-ai');

const REQUEST = {
  taskId: 'task_provider_runtime_demo',
  agentRole: 'Planner',
  taskType: 'planning',
  input: 'Create a practical launch checklist for BunnyEra AI free provider runtime.',
  provider: 'mock',
  context: {
    source: 'bunnyera-ai',
    version: CONTRACT_VERSION
  },
  options: {
    stream: false,
    language: 'en-US'
  }
};

function assertProviderRuntime(output) {
  const failures = [];
  const data = output && output.data ? output.data : {};
  const providerStatus = data.providerStatus || output.providerStatus || {};
  const provider = data.provider || output.provider || {};

  if (output.success !== true) failures.push('success must be true');
  if (!data.plan || !data.result || !data.review || !data.nextSteps) {
    failures.push('data must include plan/result/review/nextSteps');
  }
  if (output.error !== null) failures.push('error must be null');
  if (!output.meta || output.meta.contractVersion !== CONTRACT_VERSION) {
    failures.push(`meta.contractVersion must be ${CONTRACT_VERSION}`);
  }
  if (!provider.mode) failures.push('provider.mode must be present');
  if (!provider.name) failures.push('provider.name must be present');
  if (typeof provider.available !== 'boolean') failures.push('provider.available must be boolean');
  if (typeof provider.fallbackUsed !== 'boolean') failures.push('provider.fallbackUsed must be boolean');
  if (!provider.reason && !provider.message) failures.push('provider.reason or provider.message must be present');
  if (!providerStatus.mode) failures.push('providerStatus.mode must be present');
  if (!providerStatus.name) failures.push('providerStatus.name must be present');
  if (typeof providerStatus.available !== 'boolean') failures.push('providerStatus.available must be boolean');
  if (typeof providerStatus.fallbackUsed !== 'boolean') failures.push('providerStatus.fallbackUsed must be boolean');
  if (providerStatus.requestedProviderSource !== 'input.provider') {
    failures.push('providerStatus.requestedProviderSource must be input.provider for this demo');
  }

  if (failures.length > 0) {
    const err = new Error(`Provider runtime check failed:\n- ${failures.join('\n- ')}`);
    err.failures = failures;
    throw err;
  }
}

async function main() {
  const ai = new BunnyEraAI();
  const output = await ai.runTask(REQUEST);

  assertProviderRuntime(output);

  console.log('BunnyEra AI V1.7 Free Provider Runtime');
  console.log('');
  console.log('AI_PROVIDER:', process.env.AI_PROVIDER || 'mock');
  console.log('Input Provider:', REQUEST.provider);
  console.log('Provider Status:', JSON.stringify(output.providerStatus, null, 2));
  console.log('');
  console.log(JSON.stringify(output, null, 2));
}

if (require.main === module) {
  main().catch((err) => {
    console.error(String(err && err.stack ? err.stack : err));
    process.exitCode = 1;
  });
}
