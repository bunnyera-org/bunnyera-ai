const { BunnyEraAI, CONTRACT_VERSION } = require('../src/bunnyera-ai');

const REQUEST = {
  taskId: 'task_console_v2_contract_demo',
  agentRole: 'Planner',
  taskType: 'planning',
  input: 'Prepare the next implementation plan for BunnyEra Console V2.',
  context: {
    source: 'bunnyera-console',
    version: 'v0.3.5-console-v2-demo-complete',
    conversationId: 'conv_console_contract_demo'
  },
  options: {
    mockFirst: true,
    stream: false,
    language: 'en-US'
  }
};

function assertContract(output) {
  const failures = [];

  if (output.success !== true) failures.push('success must be true');
  if (!output.data) failures.push('data must be present');
  if (output.error !== null) failures.push('error must be null');
  if (!output.meta || output.meta.contractVersion !== CONTRACT_VERSION) {
    failures.push(`meta.contractVersion must be ${CONTRACT_VERSION}`);
  }
  if (!output.requestId) failures.push('requestId must be present');
  if (output.taskId !== REQUEST.taskId) failures.push('taskId must echo request taskId');
  if (output.agentRole !== REQUEST.agentRole) failures.push('agentRole must echo request agentRole');
  if (output.taskType !== REQUEST.taskType) failures.push('taskType must echo request taskType');
  if (!output.provider || output.provider.mode !== 'mock') failures.push('provider.mode must be mock for default demo');
  if (!output.result || output.result.selectedAgent !== REQUEST.agentRole) {
    failures.push('result.selectedAgent must match request agentRole');
  }
  if (!Array.isArray(output.result && output.result.suggestedPlan)) {
    failures.push('result.suggestedPlan must be an array');
  }
  if (!Array.isArray(output.result && output.result.nextSteps)) {
    failures.push('result.nextSteps must be an array');
  }
  if (!output.data.plan || !output.data.result || !output.data.review || !output.data.nextSteps) {
    failures.push('data must keep backward-compatible plan/result/review/nextSteps fields');
  }
  if (!output.legacyResult) failures.push('legacyResult must keep the previous top-level result text');

  if (failures.length > 0) {
    const error = new Error(`Console contract check failed:\n- ${failures.join('\n- ')}`);
    error.failures = failures;
    throw error;
  }
}

async function main() {
  const ai = new BunnyEraAI();
  const output = await ai.runTask(REQUEST);

  assertContract(output);

  console.log('BunnyEra AI Console Contract Alignment');
  console.log('');
  console.log(JSON.stringify(output, null, 2));
}

if (require.main === module) {
  main().catch((err) => {
    console.error(String(err && err.stack ? err.stack : err));
    process.exitCode = 1;
  });
}
