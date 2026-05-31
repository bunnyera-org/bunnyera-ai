# bunnyera-ai (BunnyEra AI Brain V1 / V1.5)

这个仓库是 BunnyEra AI Brain V1（公司大脑/知识与流程资产仓库）。

它不是 Console，也不是 Claw：
- Brain：存放 Agent 定义、Prompt、Workflow、模型配置与本地演示入口
- Console：人机界面与业务控制台（不在此仓库修改）
- Claw：执行引擎/自动化执行（不在此仓库修改）

## V1 功能

- 统一入口：`BunnyEraAI.runTask(input)` 输出结构稳定
- 本地可演示：默认使用 mock provider，不依赖网络与第三方 API
- 五角色 Agent（Leader / Planner / Executor / Reviewer / Coder）
- 保留并继续使用现有目录：`docs/`、`examples/`、`models/`、`prompts/`、`src/`、`workflows/`

## V1.1 功能（多 Provider 免费优先架构）

V1.1 引入 Provider Router，用于在多 Provider 之间做选择，并在不可用时自动 fallback 到 mock：
- 默认 Provider 仍然是 `mock`
- 通过环境变量 `AI_PROVIDER` 选择：`mock | ollama | openrouter | gemini | groq`
- 没有 API Key / 外部服务不可用时，不允许 demo 崩溃，必须 fallback 到 `mock`
- demo 输出会展示 `Fallback Used` 与 `Provider Status`

## V1.2 功能（Code Health Monitor）

V1.2 增加对 `bunnyera-console` 的只读健康检查：
- 只读扫描整个仓库（默认路径 `D:\GitHub\BunnyEraRepos\bunnyera-console`）
- 不自动修改、不写入被检查仓库任何文件
- 不读取 `.env/.env.local/secret/key` 等敏感文件内容（只记录文件名/路径）
- 限制扫描规模：单文件最大 50KB，总扫描文件上限 500，忽略 `node_modules/.git/.next/dist/build/coverage`
- 本地生成报告到 `reports/` 并通过 `notification` 对象提示是否需要处理
- 后续可扩展接入 Email / Telegram / Console Notify Center（V1.2 不接真实外部通知）

## V1.3 功能（Console Contract Alignment）

V1.3 对齐 `bunnyera-console-v2` 当前的 AI Assistant mock API 契约：
- 参考目标：`bunnyera-console-v2` master / `v0.3.5-console-v2-demo-complete`
- Console V2 当前调用语义：`POST /api/ai/run-task`
- Console V2 当前请求字段：`taskId`、`agentRole`、`taskType`、`input`、`context`、`options`
- Console V2 当前响应字段：`requestId`、`taskId`、`agentRole`、`taskType`、`provider`、`result`、`error`、`createdAt`
- `BunnyEraAI.runTask()` 现在可接收 Console V2 风格请求对象，也继续支持旧的字符串输入
- 输出增加 `success`、`data`、`error`、`meta` 包装，`meta.contractVersion = v1.3.0-console-contract-alignment`
- 顶层保留 Console V2 风格 `provider` 与 `result`，其中 `result` 包含 `selectedAgent`、`taskSummary`、`suggestedPlan`、`nextSteps`、`providerStatus`、`summary`、`plan`、`rawText`
- `data` 中保留旧 demo 依赖字段：`agentName`、`taskType`、`plan`、`result`、`review`、`nextSteps`、`provider`、`model`、`fallbackUsed`、`providerStatus`
- 顶层 `result` 按 Console V2 契约保留为对象；旧顶层结果正文同步提供在 `legacyResult`
- Provider Router、mock fallback、V1.2 Code Health Monitor 均保留

## V1.4 功能（Free Provider Runtime）

V1.4 在不破坏 V1.3 Console contract 的前提下，补齐真实免费 Provider runtime：
- `BunnyEraAI.runTask()` 继续输出 `success/data/error/meta`，并保留旧字段兼容
- `meta.contractVersion = v1.4.0-free-provider-runtime`
- Provider Router 继续支持 `mock | openrouter | groq | gemini | ollama`
- 默认仍为 `mock`，不需要密钥即可运行 demo
- 选择云端 provider 但没有 API Key 时，自动 fallback 到 `mock`，不抛出到 Console
- API 调用失败或本地 Ollama 不可用时，自动 fallback 到 `mock`，不让 demo 崩溃
- `providerStatus` 明确包含 `mode`、`name`、`available`、`fallbackUsed`、`reason`、`error`
- Console V2 可继续读取 `provider.mode`、`provider.name`、`fallbackUsed`、`available`
- Provider Router、mock fallback、V1.2 Code Health Monitor 均保留

## V1.5 功能（Provider Selection Support）

V1.5 允许调用方在 `BunnyEraAI.runTask(input)` 的 input 对象中选择 provider，而不只能依赖 `AI_PROVIDER` 环境变量：
- 支持 `input.provider`，例如 `{ "task": "...", "provider": "mock" }`
- 支持 `input.providerMode`，例如 `{ "task": "...", "providerMode": "ollama" }`
- 选择优先级：`input.provider` > `input.providerMode` > `process.env.AI_PROVIDER` > `mock`
- `providerStatus.requestedProviderSource` 会记录来源：`input.provider`、`input.providerMode`、`env.AI_PROVIDER` 或 `default.mock`
- `providerStatus.reason` 会说明 provider 来自 input 还是 env
- provider 不支持、没有 API Key、外部 API 失败或本地 Ollama 不可用时，仍然 fallback 到 `mock`
- V1.4 free provider runtime、V1.3 `success/data/error/meta` contract、旧字段兼容、mock fallback 均保留

成功响应示例结构：

```json
{
  "success": true,
  "data": {
    "agentName": "Leader",
    "agentRole": "Planner",
    "taskType": "planning",
    "plan": "...",
    "result": "...",
    "review": "...",
    "nextSteps": "...",
    "provider": {
      "mode": "mock",
      "name": "bunnyera-ai-router-mock",
      "available": true,
      "fallbackUsed": false
    },
    "model": "mock-brain-v1",
    "fallbackUsed": false,
    "providerStatus": {}
  },
  "error": null,
  "meta": {
    "source": "bunnyera-ai",
    "contractVersion": "v1.5.0-provider-selection-support"
  },
  "requestId": "req_...",
  "taskId": "task_...",
  "agentRole": "Planner",
  "taskType": "planning",
  "provider": {
    "mode": "mock",
    "name": "bunnyera-ai-router-mock",
    "available": true,
    "fallbackUsed": false
  },
  "result": {
    "selectedAgent": "Planner",
    "taskSummary": "...",
    "suggestedPlan": [],
    "nextSteps": [],
    "providerStatus": {},
    "summary": "...",
    "plan": [],
    "rawText": "..."
  },
  "createdAt": "2026-05-30T00:00:00.000Z"
}
```

## 目录结构（关键）

```txt
bunnyera-ai/
├─ agents/                     # V1：Agent 定义（JSON）
├─ providers/                  # Provider Router、mock fallback 与免费 provider runtime
├─ prompts/                    # Prompt 资产（含 V1 五个角色 prompt）
├─ workflows/                  # Workflow 定义（JSON）
├─ models/                     # 模型注册表配置
├─ src/                        # CLI 与 BunnyEraAI 入口
├─ examples/                   # 示例脚本（含 run-demo.js）
└─ docs/                       # 说明文档
```

## 五个 Agent 角色

- Leader：任务理解与总控，统一收敛输出
- Planner：产出可执行计划
- Executor：按计划生成主要结果正文
- Reviewer：检查质量与风险，提出改进
- Coder：把下一步转成可落地的实现/自动化建议（V1 仅建议，不接外部系统）

对应文件：
- `agents/leader.agent.json` -> `prompts/leader.md`
- `agents/planner.agent.json` -> `prompts/planner.md`
- `agents/executor.agent.json` -> `prompts/executor.md`
- `agents/reviewer.agent.json` -> `prompts/reviewer.md`
- `agents/coder.agent.json` -> `prompts/coder.md`

## Provider 说明（V1.5）

Provider 区别（V1.5）：
- `mock`：永久可用，本地模拟输出（最终 fallback），Model 固定 `mock-brain-v1`
- `ollama`：本地 Ollama，无需 API Key；服务未启动时会被判定为 unavailable 并 fallback mock
- `openrouter`：需要 `OPENROUTER_API_KEY`；OpenAI-compatible `chat/completions`
- `gemini`：需要 `GEMINI_API_KEY`；使用 Google Generative Language API
- `groq`：需要 `GROQ_API_KEY`；OpenAI-compatible `chat/completions`

配置示例见 `.env.example`。不要提交真实 `.env` 或 API Key。

调用时选择 provider：

```js
const { BunnyEraAI } = require('./src/bunnyera-ai');

const ai = new BunnyEraAI();

await ai.runTask({
  task: 'Draft a launch plan.',
  provider: 'mock'
});

await ai.runTask({
  task: 'Draft a local model plan.',
  providerMode: 'ollama'
});
```

常用配置：

```powershell
# Default local mock
$env:AI_PROVIDER="mock"

# OpenRouter
$env:AI_PROVIDER="openrouter"
$env:OPENROUTER_API_KEY="..."
$env:OPENROUTER_MODEL="openrouter/auto"

# Groq
$env:AI_PROVIDER="groq"
$env:GROQ_API_KEY="..."
$env:GROQ_MODEL="llama-3.1-8b-instant"

# Gemini
$env:AI_PROVIDER="gemini"
$env:GEMINI_API_KEY="..."
$env:GEMINI_MODEL="gemini-1.5-flash"

# Ollama
$env:AI_PROVIDER="ollama"
$env:OLLAMA_BASE_URL="http://localhost:11434"
$env:OLLAMA_MODEL="qwen2.5:7b"
```

注意：
- 免费平台额度可能变化，V1.5 不承诺任何外部额度稳定性
- 默认仍然是 mock，且所有真实 provider 失败时必须 fallback mock

## 本地运行方式

安装：

```powershell
npm install
```

运行本地 demo（固定输入）：

```powershell
npm start
```

或：

```powershell
npm run demo
```

构建检查（语法校验）：

```powershell
npm run build
```

运行 console 健康检查（只读）：

```powershell
npm run check:console
```

运行 Console V2 contract 示例：

```powershell
node examples/run-console-contract.js
```

运行 V1.5 Provider Runtime 示例：

```powershell
node examples/run-provider-runtime.js
```

运行 V1.5 Provider Selection 示例：

```powershell
node examples/run-provider-selection.js
```

## 验收标准（V1）

必须成功运行：

```powershell
npm install
npm run build
npm run demo
node examples/run-console-contract.js
node examples/run-provider-runtime.js
node examples/run-provider-selection.js
```

demo 固定输入：

```txt
Generate a product research report for BunnyEra
```

demo 输出必须包含：
- Agent 名称
- 任务类型
- 推理计划
- 结果正文
- Review 结果
- 下一步建议
- Provider: mock 或配置的免费 provider；不可用时 fallback 到 mock
- Model: mock-brain-v1
- Fallback Used
- Provider Status，包含 `mode/name/available/fallbackUsed/reason/error/requestedProviderSource`
- V1.5 Console contract wrapper: `success/data/error/meta`
- Console V2 fields: `requestId/taskId/agentRole/provider/result/createdAt`

## V1 不做什么（明确非目标）

- 不接真实数据库
- 不接 Telegram
- 不接支付
- 不放真实 API Key
- 不接真实 OpenAI 官方付费 Provider（V1.5 仅支持免费优先 provider runtime 配置）
- 不改服务器
- 不改 bunnyera-console
- 不改 bunnyera-console-v2
- V1.2 不接真实 Telegram
- V1.2 不接真实 Email

## License

MIT
