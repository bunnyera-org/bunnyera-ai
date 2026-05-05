const { agents } = require('./agents');
const { promptRegistry } = require('./prompts');
const { workflowRegistry } = require('./workflows');

function main() {
  console.log('🐰 BunnyEra AI');
  console.log('BunnyEra AI brain repository for agents, prompts, workflows, and model configuration.');
  console.log('');

  console.log('Agents:', agents.length);
  console.log('Prompts:', promptRegistry.length);
  console.log('Workflows:', workflowRegistry.length);
  console.log('');

  console.log('Available agents:');
  for (const agent of agents) {
    console.log(`- ${agent.name} (${agent.id})`);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  agents,
  promptRegistry,
  workflowRegistry
};