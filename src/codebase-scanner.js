const fs = require('fs');
const path = require('path');

const DEFAULT_CONSOLE_REPO_PATH = 'D:\\GitHub\\BunnyEraRepos\\bunnyera-console';

const IGNORE_DIRS = new Set(['node_modules', '.git', '.next', 'dist', 'build', 'coverage']);
const MAX_FILE_SIZE_BYTES = 50 * 1024;
const MAX_SCANNED_FILES = 500;

function nowIso() {
  return new Date().toISOString();
}

function normalizePath(p) {
  return path.resolve(String(p || '')).trim();
}

function safeReadText(filePath, maxBytes) {
  const stat = fs.statSync(filePath);
  if (!stat.isFile()) return { ok: false, reason: 'not a file' };
  if (stat.size > maxBytes) return { ok: false, reason: 'file too large', size: stat.size };
  const buf = fs.readFileSync(filePath);
  if (buf.length > maxBytes) return { ok: false, reason: 'file too large', size: buf.length };
  return { ok: true, text: buf.toString('utf8'), size: stat.size };
}

function extLower(filePath) {
  return path.extname(filePath).toLowerCase();
}

function baseLower(filePath) {
  return path.basename(filePath).toLowerCase();
}

function isIgnoredDir(name) {
  return IGNORE_DIRS.has(String(name || '').toLowerCase());
}

function isSensitiveFileName(filePath) {
  const base = baseLower(filePath);
  if (base === '.env' || base === '.env.local') return true;
  if (base.startsWith('.env.')) return true;
  if (base.includes('secret')) return true;
  if (base.includes('apikey')) return true;
  if (base.includes('api_key')) return true;
  if (base.includes('privatekey')) return true;
  if (base.includes('private_key')) return true;
  if (base.includes('credentials')) return true;
  if (base.endsWith('.pem') || base.endsWith('.p12') || base.endsWith('.pfx')) return true;
  return false;
}

function isTextLikeFile(filePath) {
  const ext = extLower(filePath);
  if (!ext) return false;
  return [
    '.js',
    '.cjs',
    '.mjs',
    '.ts',
    '.tsx',
    '.jsx',
    '.json',
    '.md',
    '.txt',
    '.yml',
    '.yaml',
    '.css',
    '.scss',
    '.html',
    '.graphql'
  ].includes(ext);
}

function detectFrameworkFromPackageJson(pkg) {
  const deps = Object.assign({}, pkg.dependencies || {}, pkg.devDependencies || {});
  const keys = Object.keys(deps);
  if (keys.includes('next')) return 'Next.js';
  if (keys.includes('react') && keys.includes('react-dom')) return 'React';
  if (keys.includes('vite')) return 'Vite';
  if (keys.includes('@remix-run/react')) return 'Remix';
  return 'unknown';
}

function normalizeRoutePath(raw) {
  const withSlashes = raw.split(path.sep).join('/');
  const cleaned = withSlashes.replace(/\/+/g, '/');
  return cleaned.startsWith('/') ? cleaned : `/${cleaned}`;
}

function routeFromAppPage(relPath) {
  const p = relPath.split(path.sep).join('/');
  if (!p.startsWith('app/')) return null;
  if (!p.endsWith('/page.tsx') && !p.endsWith('/page.jsx') && !p.endsWith('/page.ts') && !p.endsWith('/page.js')) return null;
  const routePart = p.replace(/^app\//, '').replace(/\/page\.(tsx|jsx|ts|js)$/, '');
  if (!routePart) return '/';
  return normalizeRoutePath(routePart);
}

function routeFromAppApi(relPath) {
  const p = relPath.split(path.sep).join('/');
  if (!p.startsWith('app/api/')) return null;
  if (!p.endsWith('/route.ts') && !p.endsWith('/route.js') && !p.endsWith('/route.tsx') && !p.endsWith('/route.jsx')) return null;
  const routePart = p.replace(/^app\//, '').replace(/\/route\.(ts|js|tsx|jsx)$/, '');
  return normalizeRoutePath(routePart);
}

function countMatches(text, regex) {
  if (!text) return 0;
  const m = text.match(regex);
  return m ? m.length : 0;
}

function scanSignalsFromText(text) {
  const todoCount = countMatches(text, /\b(TODO|FIXME|HACK)\b/g);
  const consoleLogCount = countMatches(text, /\bconsole\.log\s*\(/g);
  const hardcodedGitHubPathCount =
    countMatches(text, /[A-Z]:\\GitHub\\BunnyEraRepos\\bunnyera-console/gi) + countMatches(text, /D:\\GitHub\\/g);

  const apiKeyLikeCount =
    countMatches(text, /\bsk-[A-Za-z0-9]{20,}\b/g) +
    countMatches(text, /\bAIza[0-9A-Za-z\-_]{20,}\b/g) +
    countMatches(text, /\b(gsk|grq|gsk_)[A-Za-z0-9_\-]{10,}\b/gi);

  const apiKeyWordCount =
    countMatches(text, /\b(OPENAI_API_KEY|OPENROUTER_API_KEY|GEMINI_API_KEY|GROQ_API_KEY)\b/g) +
    countMatches(text, /\b(api[_-]?key)\b/gi);

  return {
    todoCount,
    consoleLogCount,
    hardcodedGitHubPathCount,
    apiKeyLikeCount,
    apiKeyWordCount
  };
}

function makePackageJsonSummary(pkg) {
  const deps = Object.keys(pkg.dependencies || {});
  const devDeps = Object.keys(pkg.devDependencies || {});
  const scripts = Object.keys(pkg.scripts || {});
  return {
    name: pkg.name || '',
    version: pkg.version || '',
    private: Boolean(pkg.private),
    scripts,
    dependenciesCount: deps.length,
    devDependenciesCount: devDeps.length
  };
}

function pushUnique(arr, value, limit) {
  if (arr.includes(value)) return;
  if (typeof limit === 'number' && arr.length >= limit) return;
  arr.push(value);
}

function scanCodebase(repoPath) {
  const targetRepoPath = normalizePath(repoPath || DEFAULT_CONSOLE_REPO_PATH);
  const scannedAt = nowIso();

  const scanSummary = {
    repoPath: targetRepoPath,
    scannedAt,
    totalFiles: 0,
    packageJson: null,
    detectedFramework: 'unknown',
    importantFiles: [],
    appRoutes: [],
    apiRoutes: [],
    configFiles: [],
    suspiciousFiles: [],
    risks: [],
    recommendations: []
  };

  if (!fs.existsSync(targetRepoPath)) {
    scanSummary.risks.push('Target repo path does not exist.');
    scanSummary.recommendations.push('Verify repoPath points to an existing bunnyera-console checkout.');
    return scanSummary;
  }

  const rootStat = fs.statSync(targetRepoPath);
  if (!rootStat.isDirectory()) {
    scanSummary.risks.push('Target repo path is not a directory.');
    scanSummary.recommendations.push('Verify repoPath points to the bunnyera-console repository root.');
    return scanSummary;
  }

  const requiredChecks = [
    'package.json',
    'next.config.ts',
    path.join('app', 'api'),
    path.join('app', 'ai-company', 'page.tsx'),
    path.join('app', 'api', 'ai', 'run-task', 'route.ts'),
    path.join('lib', 'ai', 'brainConnector.ts')
  ];

  for (const rel of requiredChecks) {
    const abs = path.join(targetRepoPath, rel);
    scanSummary.importantFiles.push({
      path: rel.split(path.sep).join('/'),
      exists: fs.existsSync(abs)
    });
  }

  const stack = [targetRepoPath];
  let scannedCount = 0;

  const aggregated = {
    todoCount: 0,
    consoleLogCount: 0,
    hardcodedGitHubPathCount: 0,
    apiKeyLikeCount: 0,
    apiKeyWordCount: 0,
    oversizedFiles: 0,
    envFiles: 0
  };

  while (stack.length > 0 && scannedCount < MAX_SCANNED_FILES) {
    const current = stack.pop();
    if (!current) break;

    let entries = [];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch (_) {
      continue;
    }

    for (const entry of entries) {
      if (scannedCount >= MAX_SCANNED_FILES) break;

      const name = entry.name;
      const absPath = path.join(current, name);
      const relPath = path.relative(targetRepoPath, absPath);

      if (entry.isDirectory()) {
        if (isIgnoredDir(name)) continue;
        stack.push(absPath);
        continue;
      }

      if (!entry.isFile()) continue;

      scannedCount += 1;
      scanSummary.totalFiles = scannedCount;

      const base = baseLower(absPath);
      if (isSensitiveFileName(absPath)) {
        aggregated.envFiles += base.startsWith('.env') ? 1 : 0;
        scanSummary.suspiciousFiles.push({
          path: relPath.split(path.sep).join('/'),
          reason: 'sensitive file (content not read)'
        });
        continue;
      }

      let size = 0;
      try {
        size = fs.statSync(absPath).size;
      } catch (_) {
        continue;
      }

      if (size > MAX_FILE_SIZE_BYTES) {
        aggregated.oversizedFiles += 1;
        scanSummary.suspiciousFiles.push({
          path: relPath.split(path.sep).join('/'),
          reason: `oversized file (> ${MAX_FILE_SIZE_BYTES} bytes)`,
          size
        });
        continue;
      }

      const relUnix = relPath.split(path.sep).join('/');
      const appRoute = routeFromAppPage(relPath);
      if (appRoute) pushUnique(scanSummary.appRoutes, appRoute, 120);
      const apiRoute = routeFromAppApi(relPath);
      if (apiRoute) pushUnique(scanSummary.apiRoutes, apiRoute, 200);

      if (
        relUnix === 'next.config.ts' ||
        relUnix === 'next.config.js' ||
        relUnix === 'tsconfig.json' ||
        relUnix === 'eslint.config.js' ||
        relUnix === '.eslintrc.json' ||
        relUnix === '.eslintrc.js' ||
        relUnix === 'tailwind.config.js' ||
        relUnix === 'tailwind.config.ts' ||
        relUnix === 'postcss.config.js' ||
        relUnix === 'next-env.d.ts'
      ) {
        scanSummary.configFiles.push(relUnix);
      }

      if (base === 'package.json') {
        const pkgRead = safeReadText(absPath, MAX_FILE_SIZE_BYTES);
        if (pkgRead.ok) {
          try {
            const pkg = JSON.parse(pkgRead.text);
            scanSummary.packageJson = makePackageJsonSummary(pkg);
            scanSummary.detectedFramework = detectFrameworkFromPackageJson(pkg);
          } catch (_) {
            scanSummary.risks.push('package.json exists but is not valid JSON.');
          }
        } else {
          scanSummary.risks.push('package.json exists but is too large to read.');
        }
      }

      if (!isTextLikeFile(absPath)) continue;

      const readRes = safeReadText(absPath, MAX_FILE_SIZE_BYTES);
      if (!readRes.ok) continue;

      const signals = scanSignalsFromText(readRes.text);
      aggregated.todoCount += signals.todoCount;
      aggregated.consoleLogCount += signals.consoleLogCount;
      aggregated.hardcodedGitHubPathCount += signals.hardcodedGitHubPathCount;
      aggregated.apiKeyLikeCount += signals.apiKeyLikeCount;
      aggregated.apiKeyWordCount += signals.apiKeyWordCount;

      if (signals.apiKeyLikeCount > 0) {
        scanSummary.suspiciousFiles.push({
          path: relUnix,
          reason: 'api key like pattern detected'
        });
      }
    }
  }

  if (!scanSummary.packageJson) {
    scanSummary.risks.push('package.json not detected within scan limits.');
    scanSummary.recommendations.push('Ensure bunnyera-console has a valid package.json at repo root.');
  }

  if (scanSummary.detectedFramework === 'unknown') {
    const nextConfigExists =
      scanSummary.importantFiles.find((x) => x.path === 'next.config.ts' && x.exists) ||
      scanSummary.configFiles.includes('next.config.js');
    if (nextConfigExists) scanSummary.detectedFramework = 'Next.js';
  }

  const missingImportant = scanSummary.importantFiles.filter((x) => !x.exists).map((x) => x.path);
  if (missingImportant.length > 0) {
    scanSummary.risks.push(`Missing important files: ${missingImportant.join(', ')}`);
    scanSummary.recommendations.push('Restore missing core files required by BunnyEra console integration.');
  }

  if (aggregated.envFiles > 0) {
    scanSummary.risks.push('Environment files exist (.env*), content was not read.');
    scanSummary.recommendations.push('Review .env files manually and ensure secrets are not committed.');
  }

  if (aggregated.oversizedFiles > 0) {
    scanSummary.risks.push(`Found ${aggregated.oversizedFiles} oversized files (>50KB) that were not read.`);
    scanSummary.recommendations.push('Consider splitting overly large source files for readability and reviewability.');
  }

  if (aggregated.todoCount > 0) {
    scanSummary.risks.push(`Found TODO/FIXME/HACK markers: ${aggregated.todoCount}`);
    scanSummary.recommendations.push('Triage TODO/FIXME/HACK items and convert critical ones into tracked tasks.');
  }

  if (aggregated.hardcodedGitHubPathCount > 0) {
    scanSummary.risks.push(`Found hardcoded local path references (e.g. D:\\\\GitHub): ${aggregated.hardcodedGitHubPathCount}`);
    scanSummary.recommendations.push('Replace hardcoded local paths with environment-based or relative paths.');
  }

  if (aggregated.consoleLogCount > 50) {
    scanSummary.risks.push(`High console.log usage detected: ${aggregated.consoleLogCount}`);
    scanSummary.recommendations.push('Reduce noisy console.log usage or gate it behind debug flags.');
  }

  if (aggregated.apiKeyLikeCount > 0) {
    scanSummary.risks.push('Potential real API key patterns detected in source content.');
    scanSummary.recommendations.push('Immediately rotate and remove exposed keys if they are real secrets.');
  } else if (aggregated.apiKeyWordCount > 0) {
    scanSummary.risks.push('API key related keywords detected; ensure no real keys are committed.');
    scanSummary.recommendations.push('Prefer reading secrets from environment variables and avoid hardcoding.');
  }

  if (scanSummary.totalFiles >= MAX_SCANNED_FILES) {
    scanSummary.risks.push(`Scan stopped at file limit: ${MAX_SCANNED_FILES}`);
    scanSummary.recommendations.push('Narrow scan scope or increase limits if deeper analysis is needed.');
  }

  return scanSummary;
}

module.exports = {
  scanCodebase,
  DEFAULT_CONSOLE_REPO_PATH
};

