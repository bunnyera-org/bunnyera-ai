const fs = require('fs');
const path = require('path');
const { scanCodebase, DEFAULT_CONSOLE_REPO_PATH } = require('./codebase-scanner');

function normalizeString(value) {
  return String(value || '').trim();
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function safeWriteFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf8');
}

function isCriticalIssue(issue) {
  return issue && issue.severity === 'critical';
}

function isWarningIssue(issue) {
  return issue && issue.severity === 'warning';
}

function buildIssuesFromScan(scanSummary) {
  const issues = [];

  const missing = (scanSummary.importantFiles || []).filter((x) => x && x.exists === false);
  if (missing.length > 0) {
    issues.push({
      id: 'missing_important_files',
      severity: 'critical',
      title: 'Missing important files',
      details: missing.map((x) => x.path).join(', ')
    });
  }

  if (!scanSummary.packageJson) {
    issues.push({
      id: 'missing_package_json',
      severity: 'critical',
      title: 'package.json not detected',
      details: 'package.json was not found or not readable within scan limits.'
    });
  }

  const apiKeySuspects = (scanSummary.suspiciousFiles || []).filter((x) => x && x.reason === 'api key like pattern detected');
  if (apiKeySuspects.length > 0) {
    issues.push({
      id: 'api_key_like_pattern',
      severity: 'critical',
      title: 'Potential API key pattern detected',
      details: apiKeySuspects.map((x) => x.path).slice(0, 20).join(', ')
    });
  }

  const hasEnv = (scanSummary.suspiciousFiles || []).some((x) => x && String(x.reason || '').includes('sensitive file'));
  if (hasEnv) {
    issues.push({
      id: 'env_files_present',
      severity: 'warning',
      title: 'Sensitive files exist (.env/secret/key)',
      details: 'Content was not read. Ensure secrets are not committed.'
    });
  }

  const riskText = (scanSummary.risks || []).join('\n');
  const todoMatch = riskText.match(/Found TODO\/FIXME\/HACK markers:\s*(\d+)/);
  const todoCount = todoMatch ? Number(todoMatch[1]) : 0;
  if (todoCount > 0) {
    issues.push({
      id: 'todo_fixme_hack',
      severity: 'warning',
      title: 'TODO/FIXME/HACK markers found',
      details: `Count: ${todoCount}`
    });
  }

  const hardcodedMatch = riskText.match(/Found hardcoded local path references.*:\s*(\d+)/);
  const hardcodedCount = hardcodedMatch ? Number(hardcodedMatch[1]) : 0;
  if (hardcodedCount > 0) {
    issues.push({
      id: 'hardcoded_local_paths',
      severity: 'warning',
      title: 'Hardcoded local path references found',
      details: `Count: ${hardcodedCount}`
    });
  }

  const consoleLogMatch = riskText.match(/High console\.log usage detected:\s*(\d+)/);
  const consoleLogCount = consoleLogMatch ? Number(consoleLogMatch[1]) : 0;
  if (consoleLogCount > 0) {
    issues.push({
      id: 'excessive_console_log',
      severity: 'warning',
      title: 'High console.log usage',
      details: `Count: ${consoleLogCount}`
    });
  }

  const oversizedMatch = riskText.match(/Found\s+(\d+)\s+oversized files/);
  const oversizedCount = oversizedMatch ? Number(oversizedMatch[1]) : 0;
  if (oversizedCount > 0) {
    issues.push({
      id: 'oversized_files',
      severity: 'warning',
      title: 'Oversized files not scanned',
      details: `Count: ${oversizedCount}`
    });
  }

  const scanStopped = (scanSummary.risks || []).find((x) => String(x || '').includes('Scan stopped at file limit'));
  if (scanStopped) {
    issues.push({
      id: 'scan_limit_reached',
      severity: 'warning',
      title: 'Scan limit reached',
      details: scanStopped
    });
  }

  return issues;
}

function computeSeverity(issues) {
  if (issues.some(isCriticalIssue)) return 'critical';
  if (issues.some(isWarningIssue)) return 'warning';
  return 'healthy';
}

function buildSummary(severity, scanSummary, issues) {
  const repoName = path.basename(scanSummary.repoPath || 'repo');
  if (severity === 'healthy') return `${repoName}: no significant code health issues detected.`;
  if (severity === 'warning') return `${repoName}: warnings detected (${issues.length} issues).`;
  return `${repoName}: critical issues detected (${issues.length} issues).`;
}

function buildRecommendations(severity, scanSummary, issues) {
  const recs = [];
  const missingCritical = issues.find((x) => x.id === 'missing_important_files') || issues.find((x) => x.id === 'missing_package_json');
  if (missingCritical) recs.push('Restore missing core files and ensure the console can build and run.');
  if (issues.some((x) => x.id === 'api_key_like_pattern')) recs.push('Search and remove exposed secrets immediately; rotate keys if necessary.');
  if (issues.some((x) => x.id === 'todo_fixme_hack')) recs.push('Triage TODO/FIXME/HACK items; convert high-priority items into tracked tasks.');
  if (issues.some((x) => x.id === 'hardcoded_local_paths')) recs.push('Replace hardcoded local paths with relative paths or environment configuration.');
  if (issues.some((x) => x.id === 'excessive_console_log')) recs.push('Reduce console logging in production paths; gate with debug flags.');
  if (issues.some((x) => x.id === 'env_files_present')) recs.push('Verify .env files are ignored and secrets are not committed.');

  if (recs.length === 0 && severity !== 'healthy') recs.push('Review risks and address high-impact issues first.');
  if (severity === 'healthy') recs.push('Keep the repo healthy by enforcing linting, formatting, and secret scanning in CI.');

  return recs;
}

function buildNextSteps(severity) {
  if (severity === 'healthy') {
    return ['Keep monitoring periodically (local).', 'Optionally integrate CI checks in the future.'];
  }
  if (severity === 'warning') {
    return ['Fix warnings and rerun the check.', 'Prioritize TODO/FIXME cleanup and path/config hardening.'];
  }
  return ['Fix critical issues first (missing core files / secrets).', 'Rerun the check and confirm severity is reduced.'];
}

function markdownReport(report, scanSummary) {
  const lines = [];
  lines.push(`# Code Health Report: bunnyera-console`);
  lines.push('');
  lines.push(`- Repo Path: ${scanSummary.repoPath}`);
  lines.push(`- Scanned At: ${scanSummary.scannedAt}`);
  lines.push(`- Severity: ${report.severity}`);
  lines.push('');
  lines.push(`## Summary`);
  lines.push(report.summary);
  lines.push('');
  lines.push(`## Issues`);
  if (!report.issues || report.issues.length === 0) {
    lines.push('- (none)');
  } else {
    for (const issue of report.issues) {
      lines.push(`- [${issue.severity}] ${issue.title}${issue.details ? `: ${issue.details}` : ''}`);
    }
  }
  lines.push('');
  lines.push(`## Risks`);
  if (!report.risks || report.risks.length === 0) lines.push('- (none)');
  else for (const r of report.risks) lines.push(`- ${r}`);
  lines.push('');
  lines.push(`## Recommendations`);
  if (!report.recommendations || report.recommendations.length === 0) lines.push('- (none)');
  else for (const r of report.recommendations) lines.push(`- ${r}`);
  lines.push('');
  lines.push(`## Next Steps`);
  if (!report.nextSteps || report.nextSteps.length === 0) lines.push('- (none)');
  else for (const r of report.nextSteps) lines.push(`- ${r}`);
  lines.push('');
  lines.push(`## Key Signals`);
  lines.push(`- Detected Framework: ${scanSummary.detectedFramework}`);
  if (scanSummary.packageJson) lines.push(`- package.json: ${JSON.stringify(scanSummary.packageJson)}`);
  lines.push(`- App Routes (sample): ${(scanSummary.appRoutes || []).slice(0, 20).join(', ') || '(none)'}`);
  lines.push(`- API Routes (sample): ${(scanSummary.apiRoutes || []).slice(0, 20).join(', ') || '(none)'}`);
  lines.push(`- Config Files: ${(scanSummary.configFiles || []).slice(0, 30).join(', ') || '(none)'}`);
  lines.push('');
  return lines.join('\n');
}

function makeReportPaths(repoPath) {
  const repoName = path.basename(repoPath || 'repo').toLowerCase();
  const reportsDir = path.resolve(__dirname, '..', 'reports');
  const jsonPath = path.join(reportsDir, `code-health-${repoName}-latest.json`);
  const mdPath = path.join(reportsDir, `code-health-${repoName}-latest.md`);
  return { reportsDir, jsonPath, mdPath };
}

async function runCodeHealthMonitor(repoPath) {
  const targetRepoPath = normalizeString(repoPath) || DEFAULT_CONSOLE_REPO_PATH;
  const scanSummary = scanCodebase(targetRepoPath);
  const issues = buildIssuesFromScan(scanSummary);
  const severity = computeSeverity(issues);
  const summary = buildSummary(severity, scanSummary, issues);
  const recommendations = buildRecommendations(severity, scanSummary, issues);
  const nextSteps = buildNextSteps(severity);

  const report = {
    ok: true,
    repoPath: scanSummary.repoPath,
    scannedAt: scanSummary.scannedAt,
    severity,
    summary,
    issues,
    risks: scanSummary.risks || [],
    recommendations,
    nextSteps,
    notification: {
      channel: 'local',
      shouldNotify: severity !== 'healthy',
      title: `Code Health ${severity.toUpperCase()}: bunnyera-console`,
      message: `${summary} See reports for details.`,
      reportPath: ''
    }
  };

  const paths = makeReportPaths(scanSummary.repoPath);
  ensureDir(paths.reportsDir);

  const jsonPayload = JSON.stringify({ report, scanSummary }, null, 2);
  safeWriteFile(paths.jsonPath, jsonPayload);

  const mdPayload = markdownReport(report, scanSummary);
  safeWriteFile(paths.mdPath, mdPayload);

  report.notification.reportPath = paths.mdPath;

  return {
    report,
    scanSummary,
    reportPaths: paths
  };
}

module.exports = {
  runCodeHealthMonitor
};

