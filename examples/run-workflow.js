const { workflowRegistry } = require('../src/workflows');

function main() {
  console.log('BunnyEra AI Example: Run Workflow');
  console.log('');

  const workflow = workflowRegistry.find((item) => item.id === 'product-research');

  if (!workflow) {
    console.error('Workflow not found.');
    process.exit(1);
  }

  console.log('Workflow:');
  console.log(JSON.stringify(workflow, null, 2));
  console.log('');
  console.log('Next step: implement actual workflow execution in bunnyera-claw.');
}

main();