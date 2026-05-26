const { BunnyEraAI } = require('./bunnyera-ai');

const DEMO_INPUT = 'Generate a product research report for BunnyEra';

function printDemoOutput(output) {
  console.log('Agent Name:', output.agentName);
  console.log('Task Type:', output.taskType);
  console.log('Provider:', output.provider);
  console.log('Model:', output.model);
  console.log('Fallback Used:', output.fallbackUsed);
  console.log('Provider Status:', JSON.stringify(output.providerStatus, null, 2));
  console.log('');
  console.log('Plan:');
  console.log(output.plan);
  console.log('');
  console.log('Result:');
  console.log(output.result);
  console.log('');
  console.log('Review:');
  console.log(output.review);
  console.log('');
  console.log('Next Steps:');
  console.log(output.nextSteps);
}

async function main() {
  const ai = new BunnyEraAI();
  const agents = ai.loadAgents();
  const output = await ai.runTask(DEMO_INPUT);

  console.log('BunnyEra AI Brain V1.1');
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

module.exports = {
  BunnyEraAI
};
