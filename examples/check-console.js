const path = require('path');
const { runCodeHealthMonitor } = require('../src/code-health-monitor');

const DEFAULT_CONSOLE_REPO_PATH = 'D:\\GitHub\\BunnyEraRepos\\bunnyera-console';

function printLine(title, value) {
  console.log(`${title}:`, value);
}

async function main() {
  const repoPath = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_CONSOLE_REPO_PATH;
  const { report, reportPaths } = await runCodeHealthMonitor(repoPath);

  printLine('Severity', report.severity);
  printLine('Summary', report.summary);
  console.log('');
  printLine('Issues', report.issues);
  console.log('');
  printLine('Recommendations', report.recommendations);
  console.log('');
  printLine('Notification Message', report.notification.message);
  printLine('Report JSON Path', reportPaths.jsonPath);
  printLine('Report MD Path', reportPaths.mdPath);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(String(err && err.stack ? err.stack : err));
    process.exitCode = 1;
  });
}

