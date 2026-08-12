# AIFOREC LangGraph 框架思路

> 状态：搭建前设计稿（先文档，后代码）  
> 更新日期：2026-08-10  
> 关联文档：[系统设计草案.md](./系统设计草案.md)

本文描述 **如何用 LangGraph 搭主框架**：图拓扑、State 契约、节点职责、记忆与检查点、工具边界、异步总结子图、目录规划与分阶段落地。实现细节以本文为准，产品边界以《系统设计草案》为准。

---

## 1. 框架目标

用 LangGraph 搭一条 **可路由、可审计、可续聊、可扩展子图** 的主链路，而不是先堆 Prompt。

| 目标 | 含义 |
|------|------|
| 路由清晰 | 学生/老师身份与意图决定走哪条专家子图 |
| 状态可控 | State 只放当回合切片；全文与画像在图外 Store |
| 安全优先 | guard / risk 可短路，高风险不进刷题 |
| 记忆分层 | Checkpointer（会话）≠ Profile Store（长期）≠ Message DB（原文） |
| 可测可演进 | 节点契约稳定，专家子图可独立加测与替换 |

**刻意不做（框架期）**

- 不上复杂 Multi-Agent 自由辩论
- 不把完整聊天历史塞进每一跳 State
- 不在图内直接给老师返回 `support` 字段
- 不先做前端；先保证「一次 invoke 的输入输出契约」稳定

---

## 2. 总体拓扑

### 2.1 主图（同步请求路径）

```text
START
  → load_context          # 鉴权结果、consent、profile 切片、thread
  → guard                 # 安全/合规/角色门禁；可直接 END
  → risk_screen           # 输入侧风险初筛（规则 + 轻量模型）
  → route                 # Supervisor：写出 intent / next_expert
  → experts (条件边)
       ├─ question_gen
       ├─ practice
       ├─ diagnose        # MVP 可先并入 practice
       └─ counsel
  → post_risk_check       # 专家输出后再检一次（尤其 counsel）
  → review                # 出题/练习产物质检；counsel 可跳过或轻检
  → assemble              # 统一对外回复 + UI hints
  → persist_turn          # 写 Message / Artifact / Audit / question_asks（学习意图）
  → END

  （旁路）若 risk=high 或 guard 拒绝：
  → safety_reply → persist_turn → END
```

### 2.2 异步图（总结 / 画像，不挡用户首包）

```text
触发：会话结束 | 每 N 轮 | 定时周任务 | 学生「更新对我的理解」
  → gather_recent_messages
  → session_summarize
  → profile_merge_patch     # 结构化 patch learning / support
  → persist_profile
  → END
```

主图与总结图 **解耦**：主图最多写 `needs_resummary=true` 或投递队列任务。

### 2.3 为何用「条件边专家」而不是 Supervisor 工具循环

| 方案 | 适用 | 本项目选择 |
|------|------|------------|
| Supervisor 调工具式专家 | 探索性强、路径不固定 | 后期可局部使用 |
| **条件边切入固定专家子图** | 意图类别稳定、要强管控 | **MVP 主方案** |

出题 / 练习 / 辅导边界清晰，固定路由更易验权、测回归、控风险。

---

## 3. 图与子图划分

| 单元 | 类型 | 职责 |
|------|------|------|
| `main_graph` | StateGraph | 请求主链路 |
| `question_gen_graph` | 子图或节点组 | 出题草稿 →（可选自检） |
| `practice_graph` | 子图或节点组 | 出题/讲解/判分编排（MVP 可简） |
| `counsel_graph` | 子图或节点组 | 支持对话 + 风险标签 |
| `summary_graph` | 独立图 | 摘要与 Profile 合并 |
| `diagnose` | MVP 可作 practice 内步骤 | 薄弱点更新建议 |

原则：**主图管流量与安全，子图管专业质量**。

---

## 4. State 设计思路

### 4.1 设计原则

1. State = **当回合工作记忆**，不是数据库镜像  
2. 大对象用 ID 引用（`artifact_id`、`thread_id`）  
3. `messages` 只保留本 thread 窗口内必要轮次（或由 Checkpointer 管理）  
4. `support_snapshot` 在 `teacher_view=true` 时物理为空  
5. 每个关键节点写回 **显式字段**，避免「只在自然语言里改了状态」

### 4.2 建议 State 字段分组

```text
# 身份与策略
user_id, role, teacher_view, consent_flags, org_id?, class_ids?

# 会话
thread_id, messages, session_summary_so_far

# 路由与安全
user_text, intent, risk_level, guard_decision, route_reason

# 记忆切片
learning_snapshot, support_snapshot, retrieved_history

# 专家产物（中间态）
expert_raw, artifact_draft, review_result

# 对外
response_text, response_payload, ui_hints

# 副作用标记（供 persist / 异步）
persist_ops[], needs_resummary, audit_events[]
```

### 4.3 Reducer 约定（实现时）

| 字段 | 合并策略 |
|------|----------|
| `messages` | append（LangGraph 常用 add_messages） |
| `audit_events` / `persist_ops` | append |
| `intent` / `risk_level` / `response_*` | 覆盖写 |
| `learning_snapshot` / `support_snapshot` | 由 `load_context` 写入；回合内一般不改，改动走异步 Profile |

### 4.4 与 Checkpointer / Store 的边界

| 机制 | 存什么 | 生命周期 |
|------|--------|----------|
| **Checkpointer** | 同一 `thread_id` 的图执行检查点、短会话续聊 | 会话级 |
| **Profile Store（业务 DB）** | Student Profile、同意、关系 | 长期 |
| **Message Store** | 原文消息、会话元数据 | 按留存策略 |
| **Artifact Store** | 题目 JSON、练习包 | 按课程周期 |
| **Audit Store** | 鉴权/危机/导出等事件 | 更长 |

框架约定：**节点不直接「偷偷写全局变量」；持久化集中在 `persist_*` 节点或明确的 Store 端口。**

---

## 5. 节点契约（框架核心）

每个节点：读哪些 State → 写哪些 State → 允许的副作用。

### 5.1 `load_context`

- **读**：调用方传入的 `user_id/role/thread_id/user_text`  
- **写**：`consent_flags`、snapshots、`session_summary_so_far`、可选 `retrieved_history`  
- **副作用**：只读 DB  
- **规则**：若 `role=teacher` → `teacher_view=true`，`support_snapshot={}`，不检索学生私聊

### 5.2 `guard`

- **写**：`guard_decision` = `allow` | `deny` | `limited`  
- **deny 示例**：老师试图命中心理接口、无 consent 却要求写长期 support 记忆、越权 thread  
- **limited**：可对话但禁用画像写入 / 禁用共享学情

### 5.3 `risk_screen`

- **写**：`risk_level`（`none`|`watch`|`high`）  
- **high**：边直接进 `safety_reply`，不进 practice/question 加压逻辑  
- 实现：关键词/分类器 + 可选小模型；框架期先留接口与枚举

### 5.4 `route`（Supervisor）

- **写**：`intent`、`route_reason`  
- **intent 枚举（MVP）**：`question_gen` | `practice` | `diagnose` | `counsel` | `general` | `safety`  
- **输入**：`user_text` + role + 当前 risk + 简单会话摘要  
- **约束**：`risk=high` 时强制 `safety`；老师默认不得路由到 `counsel` 读学生 support（老师自己的使用场景若需要「教学压力倾诉」二期再定，MVP 老师主路径是出题）

### 5.5 专家节点 / 子图

**共同约定**

- 读：对应 snapshot + 窗口 messages + user_text  
- 写：`expert_raw`；若有题包则 `artifact_draft`  
- 禁止：counsel 写老师可见字段；question_gen 把情绪隐私写进题面

**question_gen**

- 输出结构化题目列表（见系统设计草案 2.3）  
- 可调用工具：知识点检索、教材 RAG（可选）

**practice**

- 可能多步：出题 → 等待用户作答（**中断/续跑**）→ 判分 → 讲解  
- 框架需支持 **interrupt / 人机多轮**：同一 `thread_id` 用 Checkpointer 恢复

**counsel**

- 输出：回复文案 + 更新用的 support 标签建议（如 mood/themes）  
- 不在此节点直接 merge Profile；标签进 `persist_ops` 或等 summary_graph

### 5.6 `post_risk_check`

- 防止专家输出不当内容（尤其 counsel）  
- 可抬升 `risk_level` 并改道 `safety_reply`

### 5.7 `review`

- 对 `artifact_draft`：答案存在性、选项数、解析非空、难度字段、敏感词  
- 失败：回写 `review_result`，可重试一次或降级提示「生成失败请调整参数」

### 5.8 `assemble`

- 生成对外 `response_text` + `response_payload`（题包、练习卡、安全卡）  
- `ui_hints`：如 `show_private_badge`、`suggest_open_history`、`disable_more_practice`

### 5.9 `persist_turn`

- 写 messages、artifact、audit、学习事件  
- 学习意图回合额外写入 **`question_asks`**（模块打标；counsel/safety 跳过）  
- 标记 `needs_resummary`  
- **幂等**：以 `turn_id` / 执行 id 去重

### 5.10 `safety_reply`

- 固定话术模板 + 可配置求助资源  
- 不调用出题工具  
- 必写 audit

---

## 6. 路由策略

### 6.1 优先级（从高到低）

1. `guard=deny` → 拒绝说明  
2. `risk=high` → safety  
3. 显式 UI 模式（用户点了「出题」「练习」「聊聊心情」）→ 信任前端 mode，仍跑 risk  
4. Supervisor 文本分类 → intent  
5. `general` → 短答后可追问澄清意图

### 6.2 混合意图

一例：「好焦虑，但又想练二次函数」

- MVP 策略：`counsel` 优先一轮（先稳情绪），`ui_hints` 提供「准备好了再练」按钮  
- 或：`practice` 但强制 `difficulty` 下调且题量减少（需读 support_snapshot）  
- 框架用 `route_reason` 记下选择，便于评测

---

## 7. 工具（Tools）边界

工具挂在专家子图，不挂在裸 Supervisor（MVP）。

| 工具 | 谁用 | 说明 |
|------|------|------|
| `search_knowledge_points` | 出题/练习 | 返回标准知识点标签 |
| `fetch_file_extract` | 出题/对话 | 按 `file_id` 取抽取文本切片（非全文灌 State） |
| `search_in_upload` | 出题/练习 | 在用户上传材料内检索片段 |
| `fetch_learning_events` | 练习/诊断 | 近 N 次对错 |
| `save_artifact` | persist 或出题末 | 最好经 persist 统一写 |
| `retrieve_student_history` | load_context | 已按角色过滤 |
| `update_profile_patch` | **仅 summary_graph** | 主图禁用，防频繁抖动 |

**禁止工具**

- 任意 SQL  
- 「获取某学生完整心理记录」类老师接口  
- 主图内直接 `merge_profile`（除纠正 API 的专用短图）

---

## 8. 流式、中断与人机多轮

| 能力 | 框架态度 |
|------|----------|
| Token 流式 | `assemble` 前专家节点支持 stream；API 层转发 |
| 练习作答等待 | `practice_graph` 使用 interrupt；前端提交答案后 `update`/`invoke` 续跑 |
| 老师审题（二期） | interrupt 在 review 后，人批过再 publish |
| 超时/失败 | 节点异常 → assemble 友好错误；audit 记 failure |

线程键建议：

```text
thread_id = f"{env}:{user_id}:{conversation_uuid}"
```

配置里区分 dev/staging/prod，避免检查点串环境。

---

## 9. 观测、评测与回归

### 9.1 每回合必打点（日志/轨迹）

- `trace_id` / `thread_id` / `user_id` / `role`  
- `intent` / `route_reason` / `risk_level`  
- 各节点耗时、模型名、token  
- 是否写入 artifact / 是否触发 safety  

**注意**：生产日志对 support 原文脱敏；默认打标签与枚举。

### 9.2 评测集（框架搭好即可建目录）

| 套件 | 测什么 |
|------|--------|
| routing_cases | 意图是否分对 |
| privacy_cases | 老师路径永远无 support |
| safety_cases | 高风险是否短路 |
| question_schema_cases | 出题 JSON 是否过 review |
| memory_cases | 总结 patch 是否保持字段形态 |

图测试优先 **节点/子图单测 + 金样例快照**，少依赖全链路真人 Prompt。

---

## 10. 推荐目录结构（落地时）

先约定包边界，便于搭空壳：

```text
aiforec/
  apps/
    api/                 # HTTP 入口（后做）
  packages/
    agent/
      graph/
        main.py          # 主图编译
        summary.py       # 异步总结图
      nodes/
        load_context.py
        guard.py
        risk.py
        route.py
        assemble.py
        persist.py
        safety.py
      experts/
        question_gen/
        practice/
        counsel/
      state/
        schema.py        # TypedDict / Pydantic
      prompts/           # 版本化 prompt
      tools/
      policies/          # 权限与可见性纯函数
    domain/
      models/            # Profile、Message、Artifact...
      services/          # ProfileService、HistoryService
    infra/
      db/
      llm/
      telemetry/
  tests/
    agent/
      routing/
      privacy/
      safety/
  docs/                  # 已有设计文档
```

依赖方向：

```text
api → agent.graph → agent.nodes/experts → domain.services → infra
policies 可被 nodes 与 api 共用（纯函数，无 I/O）
```

---

## 11. 配置与模型分层

| 用途 | 模型档位建议 | 说明 |
|------|--------------|------|
| route / risk 初筛 | 小/快 | 低延迟、可加规则兜底 |
| 出题 / 解析 | 强 | 结构化输出 + review |
| counsel | 中强 + 严 system | 温度偏低，安全优先 |
| summary / profile patch | 中 | 强制 JSON schema |

配置项（环境变量级，不写死密钥）：

- 模型 endpoint / 名称  
- 风险词表路径  
- 求助资源文案  
- 历史检索 top_k  
- Profile 合并最小间隔  
- Checkpointer 后端（内存 / Postgres 等）

---

## 12. 权限在框架中的落点

权限不只在 API，**图内再守一道**：

```text
API 鉴权 → load_context 按角色裁剪 → guard 校验
→ 专家节点禁止越权工具 → persist 再校验写权限 → 响应序列化剥离 support
```

`policies/` 提供纯函数，例如：

- `can_read_support(viewer, student_id) -> bool`（MVP：仅本人）  
- `filter_profile_for_viewer(profile, viewer) -> public_view`  
- `can_write_learning_event(...)`

任何「给老师的 response_payload」必须经过 filter。

---

## 13. 分阶段搭建顺序（仍不写业务代码时的施工图）

### Phase 0 — 文档与契约

- [x] 系统设计草案  
- [x] 本框架思路  
- [x] SQL 表结构（`docs/sql/001_init.sql`）  
- [ ]（可选）OpenAPI / 事件字段草稿

### Phase 1 — 空图可跑

1. [x] 定义 State schema（字段齐、专家先占位）  
2. [x] 编译 `main_graph`：load → guard → risk → route → experts → review → assemble → persist  
3. [x] 内存 Checkpointer，本地 invoke / CLI / pytest 通  
4. [x] 路由用规则关键词（尚未接 LLM）  

### Phase 2 — 安全与隐私夹具

1. [x] 实现 `policies` 与 `risk_screen` 骨架  
2. [x] 老师 fixture：断言响应无 support  
3. [x] high risk → safety_reply 金样例  
4. [ ] 将 `InMemoryDomainStore` 切换为 SQL 仓储（ORM 已就绪）  

### Phase 3 — 第一个专家：出题

1. `question_gen` 结构化输出  
2. `review` 规则质检  
3. Artifact 落库端口  

### Phase 4 — 练习多轮 + Checkpointer 续跑

1. interrupt 作答  
2. `learning_events` 写入  
3. 与 learning_snapshot 联动（可读）  

### Phase 5 — 辅导子图

1. counsel prompts + post_risk  
2. 与刷题短路联调  

### Phase 6 — summary_graph

1. session summary  
2. profile JSON patch  
3. 「AI 记得你」读改 API（可后于图）  

---

## 14. 调用方契约（API 尚未实现时的逻辑接口）

### 14.1 主对话

```text
InvokeAgentRequest
  user_id, role
  thread_id?
  user_text
  client_mode?          # question_gen | practice | counsel | auto
  metadata?

InvokeAgentResponse
  thread_id
  response_text
  intent, risk_level
  response_payload      # 题目/练习/安全卡等
  ui_hints
  trace_id
```

### 14.2 续跑练习

```text
ResumePracticeRequest
  thread_id
  answers | user_text
```

### 14.3 纠正画像（可用短图或 Service）

```text
CorrectProfileRequest
  student_id (== self)
  domain: learning | support
  patch
```

框架要求：所有入口最终要么进 graph，要么进受 policies 约束的 domain service，**禁止旁路写 support 给老师**。

---

## 15. 风险与技术债（预承认）

| 风险 | 缓解 |
|------|------|
| Supervisor 误路由 | client_mode 优先 + 评测集 |
| 画像被单次情绪污染 | patch 限幅、冷却时间、学生可纠正 |
| 练习 interrupt 状态复杂 | 先做「单题回合」，再扩展整卷 |
| 模型幻觉出题 | review 节点 + 后期题库对齐 |
| 隐私泄漏 | 多层 filter + 自动化 privacy_cases |

---

## 16. 与《系统设计草案》的衔接

| 草案章节 | 本框架落点 |
|----------|------------|
| Agent 角色 | experts/* + route |
| Profile 两域 | load_context 切片 + summary_graph |
| 历史三 Tab | Message Store；图外查询 |
| 权责 | policies + guard + 响应过滤 |
| MVP 顺序 | 本文第 13 章 Phase 对齐 |

---

## 17. 与 LangGraph 官方规范符合性对照

结论：**方向正确，可作为落地基线**。下列对照基于 LangGraph 官方 Memory / Graph API / Multi-agent / Checkpointer 概念（含短记忆 Checkpointer、长记忆 Store、后台写记忆、Supervisor 与自定义工作流等）。

### 17.1 已对齐（应保持）

| 规范点 | 官方立场 | 本框架 |
|--------|----------|--------|
| 短记忆 vs 长记忆 | Checkpointer = thread 内；Store/跨会话 = 长期 | Checkpointer ≠ Profile ≠ Message DB，分层清晰 |
| 画像式语义记忆 | 用户 Profile 用 JSON + 更新/patch | Student Profile + 结构化 patch |
| 后台写记忆 | 总结可走 background，降延迟、逻辑分离 | `summary_graph` 与主图解耦 |
| 多 Agent | Supervisor / 自定义工作流 / 子图均可 | 主图路由 + 专家子图（自定义工作流） |
| 强管控路由 | 意图稳定时可用条件边/显式工作流，不必上自由工具循环 | MVP 选条件边专家，合理 |
| State 精简 | 检查点会序列化 State，宜瘦、大对象外置 | ID 引用 Artifact/全文，符合生产经验 |
| Reducer | `messages` 用 `add_messages` 等 append | 已约定 |
| 人机多轮 | `interrupt` + 同 `thread_id` 续跑 | 练习作答、二期审题 |
| Checkpointer 选型 | Memory → SQLite → Postgres | 文档已按此演进 |
| 子图拆分 | 按功能边界拆，便于测与维护 | experts / summary 拆分 |

### 17.2 实现时建议补强（非推翻）

| 点 | 说明 | 建议 |
|----|------|------|
| `Command` API | 节点可同时 `update` + `goto`，是现行推荐写法之一 | `route` / 安全短路可用 `Command`；**同一节点不要混用「静态边 + Command 动态边」** |
| LangGraph `BaseStore` | 官方长记忆常挂 Store + namespace（如 `(student_id,"profile")`） | Profile 可用业务 DB（更利权责/同意）；或做 Store 适配层。关键是 **跨 thread 可读、主图热路径不重算全文** |
| 消息裁剪 | 长会话会胀检查点与上下文 | 实现 `load_context`/`assemble` 前增加窗口裁剪或摘要替换；关注后续 `DeltaChannel`（若版本支持） |
| State 版本 | 检查点反序列化会随字段演进出问题 | Schema 加 `state_version`，迁移策略写进 infra |
| Runtime Context | 新版本倾向把 `user_id`/配置与业务 State 适度分离 | MVP 放 State 可接受；编译图时可用 `context`/`config` 传鉴权结果，减少敏感字段进检查点 |
| `create_supervisor` | 预置 Supervisor 适合探索式委派 | **本项目不必强用**；安全/权责场景自定义工作流更贴官方「Custom workflow」 |

### 17.3 明确「符合规范但不是唯一写法」的选择

1. **不用 tool-calling Supervisor 当 MVP 主路由** — 符合「边界清晰用自定义工作流」；不是落后。  
2. **persist 放在图内节点** — 常见；须幂等 + 失败可观测。也可改成图外 Unit of Work，属工程偏好。  
3. **业务 DB 承载 Profile** — 与官方 Store 目标一致（跨会话长期记忆）；因老师隔离/同意/审计，业务库往往更合适。

### 17.4 总评

| 维度 | 评分 | 说明 |
|------|------|------|
| 架构模式 | ✅ | Supervisor + 专家子图 / 自定义工作流 |
| 记忆模型 | ✅ | 短/长分离 + 后台 Profile，贴近官方 Memory 指南 |
| 生产可运维 | ✅ | 瘦 State、interrupt、分层持久化、可测节点契约 |
| API 细节完备度 | ⚠️ | 落地时补 Command、消息裁剪、state_version、Store/DB 关系说明即可 |

**可以按本文进入 Phase 1 搭空图**；上述 17.2 作为编码清单，不必先改产品设计。

---

## 18. 修订记录

| 日期 | 说明 |
|------|------|
| 2026-08-10 | 首版：搭建前框架思路 |
| 2026-08-10 | 增补第 17 章：与官方规范符合性对照 |
| 2026-08-10 | persist_turn 写入 question_asks；关联学情分析文档 |
| 2026-08-10 | 新增 study_plan 专家；learning_plans 持久化 |
| 2026-08-12 | 工具：文件抽取/上传材料检索；关联文件出题文档 |
