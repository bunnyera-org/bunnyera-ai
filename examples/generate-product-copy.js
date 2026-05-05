const { promptRegistry } = require('../src/prompts');

const sampleProduct = {
  name: 'Portable Mini Blender',
  market: 'Thailand',
  platform: 'TikTok Shop',
  audience: 'young office workers and fitness users',
  sellingPoints: [
    'portable',
    'USB charging',
    'easy to clean',
    'suitable for smoothies'
  ]
};

function main() {
  console.log('BunnyEra AI Example: Generate Product Copy');
  console.log('');
  console.log('Selected prompt:', promptRegistry.find((prompt) => prompt.id === 'product-description'));
  console.log('');
  console.log('Sample product:');
  console.log(JSON.stringify(sampleProduct, null, 2));
  console.log('');
  console.log('Next step: connect this example to an AI provider such as OpenAI or Ollama.');
}

main();