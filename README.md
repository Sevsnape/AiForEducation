# AIFOREC

以学生为中心的支持型 AI 后端（LangGraph）：出题、巩固练习、学业情绪支持；老师可协作出题/看学情，**看不到心理支持域**。

## 文档

| 文档 | 说明 |
|------|------|
| [docs/系统设计草案.md](docs/系统设计草案.md) | 产品与权责 |
| [docs/LangGraph框架思路.md](docs/LangGraph框架思路.md) | 图与节点契约 |
| [docs/数据库表结构.md](docs/数据库表结构.md) | 表说明 |
| [docs/sql/001_init.sql](docs/sql/001_init.sql) | PostgreSQL 建表脚本 |

## 当前进度

- Phase 1：主图可跑（规则路由 + 专家占位，无 LLM）
- Phase 2 骨架：policies / risk_screen / 老师隔离 / safety 短路
- 运行时记忆：进程内 `InMemoryDomainStore`（对齐 SQL 概念）
- ORM：`src/aiforec/infra/db/models.py` 已与 SQL 对齐，尚未替换内存存储

## 快速开始

### 前端（React + Vite，Mock，不连后端）

```bash
cd apps/web
npm install
npm run dev
```

### 后端（LangGraph CLI）

```bash
python -m venv .venv
# Windows: .venv\Scripts\activate
pip install -e ".[dev]"

# 对话一次
aiforec chat "帮我出题：一次函数"
aiforec chat "最近好焦虑" --mode counsel

# 登录（返回 token）后再带 token 对话
aiforec login --email linxiao@student.demo --password student123
aiforec users
aiforec chat "你好" --token <上一步返回的token>

# 跑测试
pytest -q
```

## 包结构

```text
src/aiforec/
  agent/          # LangGraph 图、节点、专家、policies
  domain/         # 画像模型与内存仓储
  infra/db/       # SQLAlchemy 模型 / session
  cli.py
docs/sql/         # SQL 源文件
tests/agent/
```

## 环境变量

见 [.env.example](.env.example)。
