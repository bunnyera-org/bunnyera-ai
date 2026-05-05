const promptRegistry = [
  {
    id: 'product-title',
    category: 'ecommerce',
    path: 'prompts/ecommerce/product-title.md',
    description: 'Generate marketplace-ready product titles.'
  },
  {
    id: 'product-description',
    category: 'ecommerce',
    path: 'prompts/ecommerce/product-description.md',
    description: 'Generate product descriptions for ecommerce listings.'
  },
  {
    id: 'ad-copy',
    category: 'ecommerce',
    path: 'prompts/ecommerce/ad-copy.md',
    description: 'Generate paid advertising copy.'
  },
  {
    id: 'social-post',
    category: 'ecommerce',
    path: 'prompts/ecommerce/social-post.md',
    description: 'Generate social media posts.'
  },
  {
    id: 'ai-ceo',
    category: 'company',
    path: 'prompts/company/ai-ceo.md',
    description: 'AI CEO operating prompt.'
  },
  {
    id: 'risk-review',
    category: 'security',
    path: 'prompts/security/risk-review.md',
    description: 'Review security and operational risk.'
  }
];

function listPrompts() {
  console.log('BunnyEra Prompt Registry');
  console.log('');

  for (const prompt of promptRegistry) {
    console.log(`${prompt.id} -> ${prompt.path}`);
  }
}

if (require.main === module) {
  listPrompts();
}

module.exports = {
  promptRegistry,
  listPrompts
};