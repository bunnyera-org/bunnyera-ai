const workflowRegistry = [
  {
    id: 'product-research',
    name: 'Product Research Workflow',
    path: 'workflows/product-research.workflow.json',
    description: 'Analyze market trends and select product opportunities.'
  },
  {
    id: 'listing-generation',
    name: 'Listing Generation Workflow',
    path: 'workflows/listing-generation.workflow.json',
    description: 'Generate marketplace listing content.'
  },
  {
    id: 'marketing-campaign',
    name: 'Marketing Campaign Workflow',
    path: 'workflows/marketing-campaign.workflow.json',
    description: 'Generate campaign ideas, ads, and social content.'
  },
  {
    id: 'daily-report',
    name: 'Daily Report Workflow',
    path: 'workflows/daily-report.workflow.json',
    description: 'Generate daily operation summary.'
  }
];

function listWorkflows() {
  console.log('BunnyEra Workflow Registry');
  console.log('');

  for (const workflow of workflowRegistry) {
    console.log(`${workflow.name} -> ${workflow.path}`);
  }
}

if (require.main === module) {
  listWorkflows();
}

module.exports = {
  workflowRegistry,
  listWorkflows
};