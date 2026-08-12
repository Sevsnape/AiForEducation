# AIFOREC 文档索引

| 文档 | 内容 | 状态 |
|------|------|------|
| [系统设计草案.md](./系统设计草案.md) | 产品定位、权责、Profile、历史、API 轮廓、安全与 MVP | 讨论基线 |
| [LangGraph框架思路.md](./LangGraph框架思路.md) | 图拓扑、State/节点契约、工具边界、目录与分阶段搭建 | 搭建中 |
| [数据库表结构.md](./数据库表结构.md) | 表说明与持久化分工 | 与代码同步 |
| [数据库表结构解析.md](./数据库表结构解析.md) | 白话逐表/字段解析与可见性 | 讲解用 |
| [三角色与管理后台.md](./三角色与管理后台.md) | 管理员/老师/学生职责与后台模块（侧栏可收起） | 产品补充 |
| [同意策略管理员配置.md](./同意策略管理员配置.md) | 同意开关由管理员配置，学生端暂不开放 | 产品约定 |
| [学情分析与问题模块.md](./学情分析与问题模块.md) | 提问记录、模块热点、个人提问分布与后端 Analytics | 产品+后端 |
| [学习计划共创.md](./学习计划共创.md) | 学生与 AI 共创学习计划 | 产品+后端 |
| [学生历史管理.md](./学生历史管理.md) | 对话治理、多阶段成长总结 | 产品+前端 |
| [文件对话与文件出题.md](./文件对话与文件出题.md) | 对话附件、出题台按文件组卷 | 产品+前端 |
| [登录鉴权与数据库变更.md](./登录鉴权与数据库变更.md) | 密码/会话表与 AuthService | 鉴权 |
| [sql/001_init.sql](./sql/001_init.sql) | PostgreSQL 建表 + COMMENT ON（含 auth） | 与 ORM 对齐 |
| [sql/002_auth.sql](./sql/002_auth.sql) | 已有库鉴权升级脚本 | 迁移 |
| [sql/003_question_asks.sql](./sql/003_question_asks.sql) | 学业提问模块表 | 迁移 |
| [sql/004_learning_plans.sql](./sql/004_learning_plans.sql) | 学习计划表 + consents 注释更新 | 迁移 |
| [sql/005_uploads.sql](./sql/005_uploads.sql) | 上传文件元数据与题包来源关联 | 迁移 |
| [作品简介.md](./作品简介.md) | 赛事/立项作品简介 | 申报用 |
| [产品说明.md](./产品说明.md) | 场景/痛点/流程/Agent/合规/落地（全文） | 说明稿 |
| [AIFOREC-product-overview.pdf](./AIFOREC-product-overview.pdf) | 同上内容的 PDF | 申报附件 |

前端工程见仓库 `apps/web`（React + Vite，当前 Mock）。

后端已进入 **Phase 1（主图可跑）+ Phase 2 骨架**（鉴权、学情 Analytics、学习计划）；运行方式见仓库根目录 `README.md`。
