---
name: bunnyera-ai-coding
description: "Maintain, inspect, and safely upgrade the BunnyEra AI repository."
argument-hint: What BunnyEra AI repo task should be inspected, fixed, or upgraded?
disable-model-invocation: false
---

# BunnyEra AI Coding Skill

Use this skill only for the current bunnyera-ai repository.

## Scope

Allowed areas:

- package.json
- src/
- providers/
- agents/
- prompts/
- examples/
- docs/
- README.md
- existing test or validation scripts

Do not modify unrelated BunnyEra repositories, including bunnyera-console, bunnyera-workflow-engine, bunnyera-claw, bunnyera-resources, or bunnyera-docs.

## Safety Rules

Never read, print, copy, summarize, or expose secrets.

Forbidden files:

- .env
- .env.local
- .env.production
- *.pem
- *.key
- files containing API keys, tokens, passwords, cookies, verification codes, or private credentials

Never make real external API requests unless the user explicitly approves.

Default mode must be local, mock, dry-run, or validation-only.

Do not change deployment, server, Nginx, PM2, GitHub Actions, billing, or production configuration unless the user specifically asks.

Prefer small, reviewable, versioned upgrades. Do not perform broad rewrites.

## Standard Workflow

When asked to work on this repository:

1. Inspect the current repository structure.
2. Read package.json to understand scripts, dependencies, package metadata, and module type.
3. Review relevant source areas: src, providers, agents, prompts, examples, docs, README.
4. Identify the smallest safe change that solves the task.
5. Implement the change only in relevant files.
6. Update documentation when behavior changes.
7. Run safe local validation commands.
8. Produce a Chinese validation report.

## Preferred Validation Commands

Use only scripts that exist in package.json.

Common commands:

- npm run build
- npm run demo
- npm test

If a command does not exist, report it as unavailable. Do not invent commands.

If provider tests require real API keys, skip real provider calls unless the user explicitly approves.

## Report Format

Always report in Chinese:

BunnyEra AI 验收报告

一、修改目标
二、修改文件
三、验证命令
四、安全检查
五、当前 Git 状态
六、下一步建议

Safety checklist:

- 未读取 .env 或 secrets
- 未输出 token/password/key
- 未执行真实外部 API 请求
- 未修改其他 BunnyEra 仓库

## Git Rules

Before and after changes, check:

git status --short

Do not commit, tag, or push unless the user explicitly asks.

## Final Principle

This repository is the BunnyEra AI Brain.

Protect it by default:

- local-first
- mock-first
- no secrets
- no real external API calls
- no unrelated repository changes
- small versioned upgrades
- clear validation report
