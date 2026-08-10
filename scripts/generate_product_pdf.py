"""Generate AIFOREC product explanation PDF (Chinese)."""

from __future__ import annotations

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm, mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    HRFlowable,
    ListFlowable,
    ListItem,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
OUT_PDF = ROOT / "docs" / "AIFOREC-product-overview.pdf"
OUT_MD = ROOT / "docs" / "产品说明.md"

# Prefer YaHei for readability on Windows
FONT_PATHS = [
    Path(r"C:\Windows\Fonts\msyh.ttc"),
    Path(r"C:\Windows\Fonts\simhei.ttf"),
    Path(r"C:\Windows\Fonts\simsun.ttc"),
]


def register_font() -> str:
    for path in FONT_PATHS:
        if path.exists():
            # TTC subfont index 0
            if path.suffix.lower() == ".ttc":
                pdfmetrics.registerFont(TTFont("CN", str(path), subfontIndex=0))
            else:
                pdfmetrics.registerFont(TTFont("CN", str(path)))
            return "CN"
    raise FileNotFoundError("未找到可用中文字体（微软雅黑/黑体/宋体）")


def build_styles(font: str):
    base = getSampleStyleSheet()
    styles = {
        "title": ParagraphStyle(
            "title_cn",
            parent=base["Title"],
            fontName=font,
            fontSize=18,
            leading=26,
            alignment=TA_CENTER,
            spaceAfter=6,
            textColor=colors.HexColor("#1a2332"),
        ),
        "subtitle": ParagraphStyle(
            "subtitle_cn",
            parent=base["Normal"],
            fontName=font,
            fontSize=10,
            leading=14,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#5a6577"),
            spaceAfter=16,
        ),
        "h1": ParagraphStyle(
            "h1_cn",
            parent=base["Heading1"],
            fontName=font,
            fontSize=13,
            leading=18,
            spaceBefore=14,
            spaceAfter=8,
            textColor=colors.HexColor("#1a2332"),
        ),
        "body": ParagraphStyle(
            "body_cn",
            parent=base["Normal"],
            fontName=font,
            fontSize=10,
            leading=16,
            alignment=TA_JUSTIFY,
            spaceAfter=6,
            textColor=colors.HexColor("#222"),
        ),
        "bullet": ParagraphStyle(
            "bullet_cn",
            parent=base["Normal"],
            fontName=font,
            fontSize=10,
            leading=15,
            leftIndent=8,
            spaceAfter=3,
        ),
        "table": ParagraphStyle(
            "table_cn",
            parent=base["Normal"],
            fontName=font,
            fontSize=8.5,
            leading=12,
            alignment=TA_LEFT,
        ),
        "footer": ParagraphStyle(
            "footer_cn",
            parent=base["Normal"],
            fontName=font,
            fontSize=8,
            leading=11,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#888"),
        ),
    }
    return styles


def p(text: str, style) -> Paragraph:
    return Paragraph(text.replace("\n", "<br/>"), style)


def bullets(items: list[str], style) -> ListFlowable:
    return ListFlowable(
        [ListItem(Paragraph(i, style), leftIndent=12, bulletColor=colors.HexColor("#3d5a80")) for i in items],
        bulletType="bullet",
        start="•",
        leftIndent=15,
        bulletFontName=style.fontName,
        bulletFontSize=10,
    )


def make_table(rows: list[list[str]], styles, col_widths) -> Table:
    data = [[Paragraph(c, styles["table"]) for c in row] for row in rows]
    t = Table(data, colWidths=col_widths, repeatRows=1)
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2c3e50")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#f7f9fb")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#f7f9fb"), colors.white]),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#cfd8e3")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    return t


CONTENT_MD = """# AIFOREC 产品说明

> 项目名称：AIFOREC（以学生为中心的学业支持多智能体系统）  
> 行业方向：智慧教育 / AI+教育  
> 文档用途：说明场景来源、用户痛点、核心流程、产品形态、Agent 能力、工具/数据/模型、合规边界与落地计划

---

## 1. 场景来源

教育场景中，学生学习压力与情绪困扰高度交织：既需要针对知识点的巩固与变式练习，也需要可倾诉、不加压的学业情绪支持。学校侧同时存在教师备课出题、班级学情跟踪的真实需求。

AIFOREC 选择**混合场景、学生主视角**：有教师协作能力，但产品灵魂是学生支持 AI——老师看见「学得怎样」，AI 才真正「懂这个学生」；「懂」的支持侧信息默认只对学生本人开放。

场景动机来自三类一线诉求：

1. **学生**：不会的题需要讲与练，考前焦虑需要被听见，但不希望情绪内容被老师当作考核材料。  
2. **教师**：组卷与变式成本高，希望基于薄弱点出题，但不希望也不应介入学生私密情绪档案。  
3. **学校/合规**：未成年人数据与心理健康相关内容需要最小必要、可审计、可拒绝越权访问。

---

## 2. 用户痛点

| 角色 | 痛点 |
|------|------|
| 学生 | 辅导与安慰混在一起，容易被继续催刷题；缺少「只属于我」的连续记忆；不敢把真实压力告诉会通报老师的系统 |
| 教师 | 出题耗时、难以对齐学生薄弱点；若系统把心理信息推给老师，既越界又不可用 |
| 学校 | 通用聊天机器人难落地：缺权责、缺审计、缺危机处理边界 |

核心矛盾可概括为：**个性化学习需要数据，心理健康支持需要隐私；二者必须同系统共存，但不能同视图共享。**

---

## 3. 核心流程

### 3.1 主对话流程（LangGraph）

```text
用户输入
  → 加载上下文（角色、同意、画像切片、会话）
  → 安全门禁 guard
  → 风险初筛 risk_screen
  → 意图路由 Supervisor
       ├─ 出题 / 练习巩固 / 学习诊断
       └─ 学业情绪支持（counsel）
  → 输出质检（题目）/ 二次风险检查
  → 统一组装回复
  → 落库消息与审计
  →（异步）会话摘要 → 滚动更新学生画像
```

### 3.2 关键分支

- **高风险**：短路至安全回复，切断加压练习/出题，写入审计，提示求助资源。  
- **老师路径**：强制 `teacher_view`，不加载支持侧画像，不可进入学生心理会话。  
- **混合意图**（既焦虑又想练）：优先稳情绪，或降难度/减题量，且不对老师暴露情绪原因。

### 3.3 学习闭环

测 → 诊 → 练 → 再测；事件写入 `learning_events`，驱动学习侧画像更新。

---

## 4. 产品形态

| 端 | 形态 | 核心能力 |
|----|------|----------|
| 学生端 | 对话主界面 + 历史三 Tab | 练习/出题求助/聊聊心情；对话历史；成长总结；「AI 记得你」（可纠正） |
| 教师端 | 出题台 + 学情只读 | 组卷与题包；授权范围内学习报告；无心理历史、无支持侧画像 |
| 管理/学校 | 配置与审计（二期加强） | 组织班级、同意策略模板、审计查询 |

技术形态（当前）：Python 后端 + LangGraph 多智能体编排；PostgreSQL 业务库设计；CLI 可本地调用；HTTP API 预留。

---

## 5. Agent 能力

| Agent | 能力 | 边界 |
|-------|------|------|
| Supervisor（路由） | 识别角色与意图，决定专家路径 | 不长篇出题、不做深度心理干预 |
| 出题 Agent | 按学科/知识点/题型/难度生成结构化题目与解析 | 不把情绪隐私写进题面 |
| 巩固练习 Agent | 阶梯练习、讲解、判分准备（续跑） | 风险高或压力大时可降量 |
| 学习诊断 Agent | 基于学情给出薄弱点与建议 | 不编造成绩 |
| 心理支持 Agent | 倾听、情绪命名、学业压力疏导 | 非诊疗；危机转介话术 |
| 总结 Agent（异步） | 会话摘要与 Profile 结构化 patch | 不向老师视图写 support |

「专属 Agent 感」通过每学生 **Memory Profile + 历史总结** 实现，而非一人一常驻进程。

---

## 6. 工具 / 数据 / 模型使用方式

### 6.1 工具（Tools）

挂在专家子图，主路由不做自由工具循环（便于安全管控）：

- 知识点检索、近场学习事件读取  
- 历史检索（按角色过滤）  
- 产物保存（题包/练习包）  
- 画像 patch **仅**总结图或纠正 API 使用  

### 6.2 数据

- **业务 SQL**：用户、组织班级、同意、会话消息、画像、题包、学习事件、周报、审计（见 `docs/sql/001_init.sql`）。  
- **LangGraph Checkpointer**：会话级图状态，支持续聊与中断恢复。  
- **画像双域**：`learning_json` 可授权教师；`support_json` 仅学生。  
- **State 切片**：图内只注入当回合需要的 snapshot，不把全文与审计塞进每一跳状态。

### 6.3 模型

| 用途 | 策略 |
|------|------|
| 路由 / 风险初筛 | 小模型或规则+轻量分类，低延迟 |
| 出题 / 解析 | 强模型 + 结构化输出 + review 质检 |
| 情绪支持 | 中强模型 + 严格 system + 较低温度 |
| 摘要 / 画像 patch | 中模型 + JSON Schema / 结构化补丁 |

**当前进展说明**：主图已可跑通，专家为规则占位，**尚未绑定具体云厂商与 API Token**；落地时通过环境变量配置 endpoint 与密钥，密钥仅存服务端。

---

## 7. 合规边界

1. **定位**：学业情绪支持，不是心理诊断、治疗或危机干预替代品。  
2. **可见性**：老师默认不可见心理原文与支持侧摘要；学情共享需同意或校方合法策略。  
3. **未成年人**：更严文案与留存；Consent 可读可查。  
4. **危机**：识别高风险后停止刷题链路，提示求助，记审计；MVP 不自动把聊天推给任课老师。  
5. **数据最小化**：教学数据可详，心理数据摘要优先；审计细节脱敏。  
6. **可追溯**：门禁拒绝、安全短路、导出等进入 `audit_logs`。  

---

## 8. 后续落地计划

| 阶段 | 内容 |
|------|------|
| 近程 | 接入大模型；SQL 仓储替换内存库；学生历史三 Tab API |
| 中程 | 练习 interrupt 多轮；出题质检强化；老师出题台与班级学情 |
| 远程 | 知识点图谱/RAG；人在回路审题；学校同意模板与（可选）危机人工协议；家长角色评估 |

开放复用：主图编排、可见性策略、表结构与画像契约可迁移到校本助手、学科练习助手、轻量支持机器人等场景。

---

## 修订记录

| 日期 | 说明 |
|------|------|
| 2026-08-10 | 首版产品说明（Markdown + PDF）
"""


def build_pdf():
    font = register_font()
    styles = build_styles(font)
    OUT_PDF.parent.mkdir(parents=True, exist_ok=True)

    doc = SimpleDocTemplate(
        str(OUT_PDF),
        pagesize=A4,
        leftMargin=1.8 * cm,
        rightMargin=1.8 * cm,
        topMargin=1.6 * cm,
        bottomMargin=1.6 * cm,
        title="AIFOREC 产品说明",
        author="AIFOREC",
    )

    story = []
    story.append(p("AIFOREC 产品说明", styles["title"]))
    story.append(
        p(
            "以学生为中心的学业支持多智能体系统<br/>"
            "场景来源 · 用户痛点 · 核心流程 · 产品形态 · Agent 能力<br/>"
            "工具 / 数据 / 模型 · 合规边界 · 后续落地计划",
            styles["subtitle"],
        )
    )
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#2c3e50"), spaceAfter=10))

    # 1
    story.append(p("一、场景来源", styles["h1"]))
    story.append(
        p(
            "教育场景中，学习压力与情绪困扰高度交织：学生既需要针对知识点的巩固与变式练习，"
            "也需要可倾诉、不加压的学业情绪支持；学校侧同时存在教师备课出题与班级学情跟踪需求。",
            styles["body"],
        )
    )
    story.append(
        p(
            "AIFOREC 选择<strong>混合场景、学生主视角</strong>：具备教师协作能力，但产品灵魂是学生支持 AI——"
            "老师看见「学得怎样」，AI 才真正「懂这个学生」；支持侧信息默认仅对学生本人开放。",
            styles["body"],
        )
    )
    story.append(
        bullets(
            [
                "学生：需要讲与练，也需要被听见；不希望情绪内容被当作考核材料。",
                "教师：组卷成本高，希望基于薄弱点出题，但不应介入学生私密情绪档案。",
                "学校：需要最小必要、可审计、可拒绝越权的未成年人与心理健康相关数据处理。",
            ],
            styles["bullet"],
        )
    )

    # 2
    story.append(p("二、用户痛点", styles["h1"]))
    story.append(
        make_table(
            [
                ["角色", "痛点"],
                ["学生", "辅导与安慰混杂易被催刷题；缺少连续私密记忆；担心情绪内容被老师看见"],
                ["教师", "出题耗时、难对齐薄弱点；心理数据推送既越界又不可用"],
                ["学校", "通用聊天机器人缺权责、缺审计、缺危机边界，难以合规落地"],
            ],
            styles,
            [2.2 * cm, 14.5 * cm],
        )
    )
    story.append(Spacer(1, 6))
    story.append(
        p(
            "核心矛盾：<strong>个性化学习需要数据，心理健康支持需要隐私；二者必须同系统共存，但不能同视图共享。</strong>",
            styles["body"],
        )
    )

    # 3
    story.append(p("三、核心流程", styles["h1"]))
    story.append(p("<strong>3.1 主对话流程（LangGraph）</strong>", styles["body"]))
    story.append(
        p(
            "用户输入 → 加载上下文（角色 / 同意 / 画像切片 / 会话）→ 安全门禁 → 风险初筛 → "
            "意图路由（出题 / 练习 / 诊断 / 学业情绪支持）→ 质检与二次风险检查 → 统一组装回复 → "
            "落库与审计 →（异步）会话摘要并滚动更新学生画像。",
            styles["body"],
        )
    )
    story.append(p("<strong>3.2 关键分支</strong>", styles["body"]))
    story.append(
        bullets(
            [
                "高风险：安全回复短路，切断加压练习，写入审计并提示求助资源。",
                "老师路径：强制教师视图，不加载支持侧画像，不可进入学生心理会话。",
                "混合意图（焦虑又想练）：优先稳情绪或降难度减题量，不对老师暴露情绪原因。",
            ],
            styles["bullet"],
        )
    )
    story.append(
        p(
            "<strong>3.3 学习闭环</strong>：测 → 诊 → 练 → 再测；事件写入学习流水，驱动学习侧画像更新。",
            styles["body"],
        )
    )

    # 4
    story.append(p("四、产品形态", styles["h1"]))
    story.append(
        make_table(
            [
                ["端", "形态", "核心能力"],
                ["学生端", "对话 + 历史三 Tab", "练习 / 出题求助 / 聊聊心情；成长总结；「AI 记得你」可纠正"],
                ["教师端", "出题台 + 学情只读", "组卷与题包；授权学情；无心理历史与支持侧画像"],
                ["管理端", "配置与审计（加强中）", "组织班级、同意策略、审计查询"],
            ],
            styles,
            [2.2 * cm, 4.0 * cm, 10.5 * cm],
        )
    )
    story.append(Spacer(1, 6))
    story.append(
        p(
            "技术形态：Python 后端 + LangGraph 多智能体；PostgreSQL 业务库设计；CLI 可本地调用；HTTP API 预留。",
            styles["body"],
        )
    )

    # 5
    story.append(p("五、Agent 能力", styles["h1"]))
    story.append(
        make_table(
            [
                ["Agent", "能力", "边界"],
                ["Supervisor", "角色与意图路由", "不亲自长篇出题或深度心理干预"],
                ["出题", "结构化题目与解析", "不把情绪隐私写入题面"],
                ["巩固练习", "阶梯练、讲解、续跑准备", "风险/高压时可降量"],
                ["学习诊断", "薄弱点与建议", "不编造成绩"],
                ["心理支持", "倾听与学业压力疏导", "非诊疗；危机转介"],
                ["总结（异步）", "摘要与画像 patch", "不向老师视图写 support"],
            ],
            styles,
            [3.0 * cm, 6.5 * cm, 7.2 * cm],
        )
    )
    story.append(Spacer(1, 6))
    story.append(
        p(
            "「专属 Agent 感」来自每学生 Memory Profile + 历史总结，而非一人一常驻进程。",
            styles["body"],
        )
    )

    # 6
    story.append(p("六、工具 / 数据 / 模型使用方式", styles["h1"]))
    story.append(p("<strong>工具</strong>：挂在专家子图；主路由采用条件边固定专家，避免失控工具循环。"
                   "包括知识点检索、学习事件读取、按角色过滤的历史检索、题包保存；画像合并仅总结图或纠正接口执行。", styles["body"]))
    story.append(p("<strong>数据</strong>：业务 SQL 存用户、同意、消息、双域画像、题包、事件、周报与审计；"
                   "Checkpointer 存会话级图状态。图内 State 只注入切片，全文与审计在库中。", styles["body"]))
    story.append(p("<strong>模型分层</strong>：路由/风险用小模型或规则；出题用强模型+结构化质检；"
                   "支持对话用严约束 system；摘要用结构化 patch。"
                   "当前专家为规则占位，尚未绑定云厂商 Token；落地时以环境变量配置服务端密钥。", styles["body"]))

    # 7
    story.append(p("七、合规边界", styles["h1"]))
    story.append(
        bullets(
            [
                "定位为学业情绪支持，不替代心理诊断、治疗或专业危机干预。",
                "教师默认可协作教学，不可见心理原文与支持侧摘要；学情共享需同意。",
                "未成年人保护优先：更严文案、留存与最小必要原则。",
                "高风险停止刷题链路，提示求助并记审计；MVP 不自动把聊天推送任课老师。",
                "教学数据可详，心理数据摘要优先；审计细节脱敏。",
            ],
            styles["bullet"],
        )
    )

    # 8
    story.append(p("八、后续落地计划", styles["h1"]))
    story.append(
        make_table(
            [
                ["阶段", "计划"],
                ["近程", "接入大模型；SQL 仓储替换内存库；学生历史相关 API"],
                ["中程", "练习多轮 interrupt；出题质检强化；教师出题台与班级学情"],
                ["远程", "知识点图谱/RAG；人在回路审题；学校同意模板与可选危机人工协议"],
            ],
            styles,
            [2.5 * cm, 14.2 * cm],
        )
    )
    story.append(Spacer(1, 8))
    story.append(
        p(
            "开放复用价值：主图编排、可见性策略、表结构与画像契约可迁移至校本助手、学科练习助手等场景。",
            styles["body"],
        )
    )
    story.append(Spacer(1, 16))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#cfd8e3"), spaceAfter=6))
    story.append(p("AIFOREC · 产品说明 · 2026-08-10", styles["footer"]))

    doc.build(story)
    return OUT_PDF


def main():
    OUT_MD.write_text(CONTENT_MD, encoding="utf-8")
    pdf_path = build_pdf()
    print(f"Markdown: {OUT_MD}")
    print(f"PDF: {pdf_path}")


if __name__ == "__main__":
    main()
