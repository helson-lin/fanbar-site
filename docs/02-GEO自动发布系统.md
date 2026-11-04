# FanBar GEO 自动发布系统

## 目标

每次 FanBar 发布新版本后，自动更新 getfanbar.com 上的：

1. 英文/中文 release notes 页面（`/releases/{v}`、`/zh/releases/{v}`）
2. 机器可读版本（`/releases/{v}.md`、`/zh/releases/{v}.md`）
3. 发布索引、RSS、sitemap
4. `llms.txt`、`llms-full.txt`、`api/product.json`、`api/health.json`

## 数据源

| 数据 | 来源 |
| --- | --- |
| 发布说明正文 | FanBar 仓库 `docs/releases/vX.Y.Z.md` |
| 发布时间、DMG 文件名与大小 | GitHub Releases API |
| 站点外壳与页面设计 | `site/`（线上站点快照）+ `templates/` |
| 历史索引 | `data/releases.json` |

## 触发方式

```
tag push (v*)
  -> FanBar / macOS build and release
  -> Publish GitHub Release
  -> geo job
  -> fanbar-site build + validate + wrangler deploy
```

`geo` job 与发布任务在同一个 workflow 中，因为 FanBar 用 `GITHUB_TOKEN` 创建 Release，
GitHub 不会为这种 Release 再触发 `release: published` workflow。

## 失败与补偿

- `fanbar-site` 每天 03:17 UTC 定时构建最新版本，补偿漏触发的发布。
- `backfill.yml` 支持按 tag 顺序重建历史版本。
- 构建后 `validate-build.mjs` 校验标题、canonical、hreflang、JSON-LD、RSS/sitemap/llms
  与产品 JSON；失败则不部署。

## 维护边界

- 站点设计更新后运行 `node scripts/refresh-baseline.mjs`，提交 `site/` 与 `templates/`。
- 发布说明格式变化时更新 `scripts/lib/markdown.mjs` 与测试 fixture。
- 新版本如果缺少 `docs/releases/vX.Y.Z.md`，Release body 会作为回退数据源。
