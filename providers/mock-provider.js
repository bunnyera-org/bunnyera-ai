const { ProviderIds, Models } = require('./types');

function normalizeText(text) {
  return String(text || '').trim();
}

function safeLines(lines) {
  return lines.filter(Boolean).map((x) => String(x).trim()).filter(Boolean);
}

function stageLabel(stage) {
  if (stage === 'plan') return 'Planning';
  if (stage === 'execute') return 'Execution';
  if (stage === 'review') return 'Review';
  if (stage === 'next') return 'Next Steps';
  return 'General';
}

function inferTaskType(input) {
  const text = normalizeText(input).toLowerCase();
  if (text.includes('product research report')) return 'product_research_report';
  if (text.includes('research report')) return 'research_report';
  if (text.includes('marketing')) return 'marketing_task';
  if (text.includes('listing')) return 'listing_task';
  return 'general_task';
}

function makePlan(taskType, input) {
  const lines = [
    `Clarify objective and scope for: ${normalizeText(input)}`,
    'Collect assumptions and constraints (local-first, no external APIs)',
    'Outline sections and data points needed',
    'Draft content with clear structure',
    'Review for gaps, risks, and improvements',
    'Propose next steps and automation ideas'
  ];

  if (taskType === 'product_research_report') {
    return safeLines([
      'Define target market, customer persona, and success metrics',
      'Identify competing products and positioning hypotheses',
      'List key differentiators and risks',
      'Draft a structured report (summary, market, competitors, strategy)',
      'Provide review notes and next steps'
    ]).join('\n- ').replace(/^/, '- ');
  }

  return safeLines(lines).join('\n- ').replace(/^/, '- ');
}

function makeResult(taskType) {
  if (taskType === 'product_research_report') {
    return [
      '## Executive Summary',
      'BunnyEra should position itself as a lightweight, workflow-ready AI brain for cross-border ecommerce teams, focusing on clarity, repeatability, and local-first demos.',
      '',
      '## Market Context',
      '- Teams want faster iteration on product research, listing generation, and campaign planning.',
      '- Most solutions are either chat-only or require heavy infra; a "brain repository" that is auditable is a strong differentiator.',
      '',
      '## Competitor Snapshot (High-level)',
      '- Chat-centric assistants: fast, but outputs are hard to version and repeat.',
      '- Agent frameworks: powerful, but often complex and infra-heavy.',
      '',
      '## BunnyEra Opportunity',
      '- Provide a stable V1 baseline: agents + prompts + workflows + mock provider demo.',
      '- Enable teams to iterate on content assets and execution workflows safely.',
      '',
      '## Proposed Strategy',
      '- Ship Brain V1 baseline with 5 core roles (Leader/Planner/Executor/Reviewer/Coder).',
      '- Ensure outputs are structured and consistent via runTask() contract.',
      '- Keep provider mock-only in V1 to prove end-to-end flow without external dependency.',
      '',
      '## Risks & Mitigations',
      '- Risk: Users expect "real model quality" immediately. Mitigation: clearly label mock outputs and acceptance criteria.',
      '- Risk: Over-expansion into multi-provider too early. Mitigation: freeze V1 scope and document non-goals.'
    ].join('\n');
  }

  return [
    '## Result',
    'This is a mock result produced by BunnyEra AI Brain V1.',
    '- The provider is local-only and does not call external APIs.',
    '- The content is structured to demonstrate the end-to-end pipeline.',
    '',
    '## Notes',
    '- Replace this mock content with a real provider in a future version (not in V1).'
  ].join('\n');
}

function makeReview(taskType) {
  if (taskType === 'product_research_report') {
    return [
      'Strengths:',
      '- Clear positioning around "brain repository" and repeatability.',
      '- V1 scope is constrained and demo-friendly.',
      '',
      'Issues:',
      '- Competitive analysis is high-level and lacks concrete evidence.',
      '- No explicit KPI targets (conversion, CTR, time saved).',
      '',
      'Recommendations:',
      '- Add a lightweight template for evidence collection (links, pricing, feature matrix) in future iterations.',
      '- Define 2-3 measurable KPIs for V1 demo evaluation.'
    ].join('\n');
  }

  return [
    'Strengths:',
    '- Output is structured and stable.',
    '',
    'Issues:',
    '- Mock content is generic by design.',
    '',
    'Recommendations:',
    '- Add domain-specific templates for the most common task types.'
  ].join('\n');
}

function makeNextSteps(taskType) {
  if (taskType === 'product_research_report') {
    return [
      '- Confirm target customer segment and primary channel (Amazon/TikTok/Shopify).',
      '- Create a competitor evidence checklist and fill it for top 5 competitors.',
      '- Convert report into a workflow JSON for repeatable generation.',
      '- Add a real provider in a future version (explicitly not in V1).'
    ].join('\n');
  }

  return [
    '- Decide the next most common task type to template.',
    '- Add workflow definitions to standardize outputs.'
  ].join('\n');
}

class MockProvider {
  constructor(options) {
    this.id = ProviderIds.MOCK;
    this.model = Models.MOCK_BRAIN_V1;
    this.options = options || {};
  }

  run(params) {
    const input = normalizeText(params && params.input);
    const taskType = normalizeText(params && params.taskType) || inferTaskType(input);
    const stage = normalizeText(params && params.stage) || 'general';
    const agent = (params && params.agent) || null;

    let text = '';
    if (stage === 'plan') text = makePlan(taskType, input);
    else if (stage === 'execute') text = makeResult(taskType);
    else if (stage === 'review') text = makeReview(taskType);
    else if (stage === 'next') text = makeNextSteps(taskType);
    else text = `(${stageLabel(stage)}) Mock response for taskType=${taskType}`;

    return {
      provider: this.id,
      model: this.model,
      agent: agent ? { id: agent.id, name: agent.name, role: agent.role } : null,
      taskType,
      stage,
      text
    };
  }
}

module.exports = {
  MockProvider,
  inferTaskType
};
