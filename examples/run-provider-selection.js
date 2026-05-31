const { BunnyEraAI, CONTRACT_VERSION } = require('../src/bunnyera-ai');

function assertProviderSource(output, expected) {
  const status = output.providerStatus || {};
  const provider = output.provider || {};
  const failures = [];

  if (output.success !== true) failures.push('success must be true');
  if (output.error !== null) failures.push('error must be null');
  if (!output.meta || output.meta.contractVersion !== CONTRACT_VERSION) {
    failures.push(`meta.contractVersion must be ${CONTRACT_VERSION}`);
  }
  if (status.requestedProviderSource !== expected.source) {
    failures.push(`requestedProviderSource must be ${expected.source}`);
  }
  if (status.requestedProvider !== expected.requestedProvider) {
    failures.push(`requestedProvider must be ${expected.requestedProvider}`);
  }
  if (provider.mode !== expected.usedProvider) {
    failures.push(`provider.mode must be ${expected.usedProvider}`);
  }
  if (!String(provider.reason || '').includes(expected.source)) {
    failures.push(`provider.reason must mention ${expected.source}`);
  }

  if (failures.length > 0) {
    throw new Error(`Provider selection check failed:\n- ${failures.join('\n- ')}`);
  }
}

async function runCase(ai, name, input, expected) {
  const output = await ai.runTask(input);
  assertProviderSource(output, expected);

  console.log(`Case: ${name}`);
  console.log(
    JSON.stringify(
      {
        requestedProvider: output.providerStatus.requestedProvider,
        requestedProviderSource: output.providerStatus.requestedProviderSource,
        usedProvider: output.provider.mode,
        fallbackUsed: output.provider.fallbackUsed,
        reason: output.provider.reason
      },
      null,
      2
    )
  );
  console.log('');
}

async function main() {
  const ai = new BunnyEraAI();
  const originalEnvProvider = process.env.AI_PROVIDER;
  const originalOllamaBaseUrl = process.env.OLLAMA_BASE_URL;

  try {
    process.env.AI_PROVIDER = 'groq';
    process.env.OLLAMA_BASE_URL = 'http://127.0.0.1:9';

    await runCase(
      ai,
      'input.provider overrides env.AI_PROVIDER',
      {
        task: 'Verify provider selection priority with explicit mock provider.',
        provider: 'mock',
        providerMode: 'ollama'
      },
      {
        requestedProvider: 'mock',
        usedProvider: 'mock',
        source: 'input.provider'
      }
    );

    await runCase(
      ai,
      'input.providerMode is used when input.provider is absent',
      {
        task: 'Verify providerMode can select ollama and fallback safely when unavailable.',
        providerMode: 'ollama'
      },
      {
        requestedProvider: 'ollama',
        usedProvider: 'mock',
        source: 'input.providerMode'
      }
    );
  } finally {
    if (typeof originalEnvProvider === 'undefined') {
      delete process.env.AI_PROVIDER;
    } else {
      process.env.AI_PROVIDER = originalEnvProvider;
    }
    if (typeof originalOllamaBaseUrl === 'undefined') {
      delete process.env.OLLAMA_BASE_URL;
    } else {
      process.env.OLLAMA_BASE_URL = originalOllamaBaseUrl;
    }
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(String(err && err.stack ? err.stack : err));
    process.exitCode = 1;
  });
}
