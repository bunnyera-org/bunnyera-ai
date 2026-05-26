# bunnyera-ai (BunnyEra AI Brain V1)

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

## Provider 说明（V1）

V1 只使用 mock provider：
- Provider: `mock`
- Model: `mock-brain-v1`
- 不调用真实 OpenAI / OpenRouter / Gemini / Groq
- 不读取/不需要任何真实 API Key

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

## V1 不做什么（明确非目标）

- 不接真实数据库
- 不接 Telegram
- 不接支付
- 不放真实 API Key
- 不接真实 OpenAI / OpenRouter / Gemini / Groq
- 不改服务器
- 不改 bunnyera-console

## License

MIT
