# bunnyera-ai (BunnyEra AI Brain V1 / V1.1)

这个仓库是 BunnyEra AI Brain V1（公司大脑/知识与流程资产仓库）。

它不是 Console，也不是 Claw：
- Brain：存放 Agent 定义、Prompt、Workflow、模型配置与本地演示入口
- Console：人机界面与业务控制台（不在此仓库修改）
- Claw：执行引擎/自动化执行（不在此仓库修改）

## V1 功能

- 统一入口：`BunnyEraAI.runTask(input)` 输出结构稳定
- 本地可演示：仅使用 mock provider，不依赖网络与第三方 API
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

## 目录结构（关键）

```txt
bunnyera-ai/
├─ agents/                     # V1：Agent 定义（JSON）
├─ providers/                  # V1：Provider（当前仅 mock）
├─ prompts/                    # Prompt 资产（含 V1 五个角色 prompt）
├─ workflows/                  # Workflow 定义（JSON）
├─ models/                     # 模型注册表配置（V1 不接真实 provider）
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

## Provider 说明（V1 / V1.1）

Provider 区别（V1.1）：
- `mock`：永久可用，本地模拟输出（最终 fallback），Model 固定 `mock-brain-v1`
- `ollama`：本地 Ollama，无需 API Key；服务未启动时会被判定为 unavailable 并 fallback mock
- `openrouter`：需要 `OPENROUTER_API_KEY`；OpenAI-compatible `chat/completions`
- `gemini`：需要 `GEMINI_API_KEY`；使用 Google Generative Language API
- `groq`：需要 `GROQ_API_KEY`；OpenAI-compatible `chat/completions`

注意：
- 免费平台额度可能变化，V1.1 不承诺任何外部额度稳定性
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

## 验收标准（V1）

必须成功运行：

```powershell
npm install
npm run build
npm run demo
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
- Provider: mock
- Model: mock-brain-v1
- Fallback Used
- Provider Status

## V1 不做什么（明确非目标）

- 不接真实数据库
- 不接 Telegram
- 不接支付
- 不放真实 API Key
- 不接真实 OpenAI / OpenRouter / Gemini / Groq
- 不改服务器
- 不改 bunnyera-console
- V1.2 不接真实 Telegram
- V1.2 不接真实 Email

## License

MIT
