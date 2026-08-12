# AIFOREC Web（React + Vite）

学生中心学业支持前端。当前使用 **Mock Agent**，不连接后端。

## 启动

```bash
cd apps/web
npm install
npm run dev
```

浏览器打开终端提示的本地地址（默认 `http://localhost:5173`）。

## 页面

| 角色 | 路由 | 说明 |
|------|------|------|
| 入口 | `/` | **账号密码登录**，按角色跳转 |
| 学生 | `/student/chat` | 对话 + 模式（练习/出题/**学习计划**/心情） |
| 学生 | `/student/history` | 对话治理、多阶段成长总结、AI 记得你 |
| 学生 | `/student/me` | 学习计划、画像纠正；同意只读说明 |
| 老师 | `/teacher/studio` | 知识点 / 文件 / 混合出题台 |
| 学生/老师 | 对话 | 可添加 PDF/文档/图片附件 |
| 老师 | `/teacher/class` | 班级学情（无支持侧） |
| 老师 | `/teacher/chat` | 助手对话（无心情/计划入口） |
| 管理员 | `/admin/*` | 左侧**可收起侧栏**：用户 / 组织 / **同意** / 学情 / 审计 |

### 演示账号

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 学生 | `linxiao@student.demo` | `student123` |
| 老师 | `wang@school.demo` | `teacher123` |
| 管理员 | `admin@school.demo` | `admin123` |

## 后续接后端

将 `src/mock/agent.ts` 的 `mockInvoke` 替换为调用 `POST /agent/invoke` 即可；类型字段已与产品契约对齐。
