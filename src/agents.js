const agents = [
  {
    id: 'ai-ceo',
    name: 'AI CEO',
    department: 'Core',
    description: 'Coordinates BunnyEra AI departments and decides task priority.',
    status: 'active',
    capabilities: [
      'strategy_planning',
      'workflow_routing',
      'daily_summary',
      'business_decision_support'
    ]
  },
  {
    id: 'product-selection-agent',
    name: 'Product Selection Agent',
    department: 'Product Research',
    description: 'Finds product opportunities for cross-border ecommerce markets.',
    status: 'active',
    capabilities: [
      'trend_analysis',
      'competitor_scan',
      'margin_estimation',
      'market_fit_review'
    ]
  },
  {
    id: 'listing-agent',
    name: 'Listing Agent',
    department: 'Listing',
    description: 'Generates product titles, descriptions, SEO copy, and marketplace listing content.',
    status: 'active',
    capabilities: [
      'title_generation',
      'description_generation',
      'seo_keywords',
      'marketplace_localization'
    ]
  },
  {
    id: 'marketing-agent',
    name: 'Marketing Agent',
    department: 'Marketing',
    description: 'Creates ads, social media posts, campaign angles, and promotional materials.',
    status: 'active',
    capabilities: [
      'ad_copy',
      'social_posts',
      'campaign_strategy',
      'ugc_script'
    ]
  },
  {
    id: 'customer-service-agent',
    name: 'Customer Service Agent',
    department: 'Customer Support',
    description: 'Handles FAQ, support replies, refund explanation, and escalation suggestions.',
    status: 'planning',
    capabilities: [
      'faq_answering',
      'ticket_reply',
      'sentiment_review',
      'human_escalation'
    ]
  },
  {
    id: 'finance-agent',
    name: 'Finance Agent',
    department: 'Finance',
    description: 'Summarizes revenue, cost, profit, refunds, and advertising ROI.',
    status: 'planning',
    capabilities: [
      'sales_summary',
      'profit_estimation',
      'roi_review',
      'daily_report'
    ]
  }
];

function listAgents() {
  console.log('BunnyEra AI Agents');
  console.log('');

  for (const agent of agents) {
    console.log(`${agent.name}`);
    console.log(`ID: ${agent.id}`);
    console.log(`Department: ${agent.department}`);
    console.log(`Status: ${agent.status}`);
    console.log(`Description: ${agent.description}`);
    console.log('');
  }
}

if (require.main === module) {
  listAgents();
}

module.exports = {
  agents,
  listAgents
};