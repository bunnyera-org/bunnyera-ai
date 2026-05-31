const { BunnyEraAI, CONTRACT_VERSION } = require('../src/bunnyera-ai');

const DEMO_INPUT = 'Generate a product research report for BunnyEra';

function printDemoOutput(output) {
  const data = output.data || output;
  const provider = data.provider || output.provider || {};

  console.log('Agent Name:', data.agentName);
  console.log('Task Type:', data.taskType);
  console.log('Provider:', provider.mode || data.providerId || provider);
  console.log('Model:', data.model);
  console.log('Fallback Used:', data.fallbackUsed);
  console.log('Provider Status:', JSON.stringify(data.providerStatus, null, 2));
  console.log('');
  console.log('Plan:');
  console.log(data.plan);
  console.log('');
  console.log('Result:');
  console.log(data.result);
  console.log('');
  console.log('Review:');
  console.log(data.review);
  console.log('');
  console.log('Next Steps:');
  console.log(data.nextSteps);
}

async function main() {
  const ai = new BunnyEraAI();
  const agents = ai.loadAgents();
  const output = await ai.runTask(DEMO_INPUT);

  console.log(`BunnyEra AI Brain ${CONTRACT_VERSION}`);
  console.log('Local demo (provider router with fallback)');
  console.log('');
  console.log('Input Task:');
  console.log(DEMO_INPUT);
  console.log('');
  console.log('Loaded Agents:', agents.length);
  console.log('');
  printDemoOutput(output);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(String(err && err.stack ? err.stack : err));
    process.exitCode = 1;
  });
}
