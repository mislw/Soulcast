import React from "react";

import { ProductShell } from "../components/layout/product-shell";

const workflow = [
  {
    order: "1 导入聊天记录",
    title: "导入聊天记录",
    copy: "上传或粘贴你已经导出的聊天文本，先让系统理解你平时是怎么说话的。",
    icon: "1",
  },
  {
    order: "2 补充自我描述",
    title: "补充自我描述",
    copy: "把聊天记录里学不到的那部分你，再明确告诉系统一次。",
    icon: "2",
  },
  {
    order: "3 生成人格档案",
    title: "生成人格档案",
    copy: "用结构化的方式展示说话风格、长期记忆和边界感。",
    icon: "3",
  },
  {
    order: "4 与分身对话",
    title: "与分身对话",
    copy: "先在文本里验证像不像你，再逐步扩展到声音和形象。",
    icon: "4",
  },
];

export default function LandingPage() {
  return (
    <ProductShell activeNav="home">
      <main className="page-shell">
        <section className="hero-panel hero-split">
          <div>
            <p className="eyebrow">数字分身 · 起点</p>
            <h1 className="headline">你的数字分身，从这里开始</h1>
            <p className="subhead">
              上传你授权的聊天记录，补充自我描述，生成一个更像你的文字分身。
              它会保留你的语气、表达习惯和边界感，但不会伪装成真人实时在线。
            </p>
            <div className="btn-row hero-actions">
              <a href="/import" className="btn-primary">
                创建我的数字分身
              </a>
              <a href="/persona/demo-persona" className="btn-secondary">
                看看人格档案示例
              </a>
            </div>
          </div>

          <div className="hero-ghost" aria-hidden="true" />
        </section>

        <section className="panel">
          <div className="header-actions" style={{ justifyContent: "space-between" }}>
            <div>
              <p className="eyebrow">工作流程</p>
              <h2 className="card-title">先把功能链路跑顺，再慢慢做得更像你</h2>
            </div>
          </div>

          <div className="workflow-grid" style={{ marginTop: 18 }}>
            {workflow.map((item) => (
              <article key={item.title} className="workflow-card">
                <div className="workflow-icon">{item.icon}</div>
                <p className="workflow-order">{item.order}</p>
                <h3 className="workflow-title">{item.title}</h3>
                <p className="card-copy">{item.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="note-card">
          <div className="header-actions" style={{ justifyContent: "space-between" }}>
            <div>
              <p className="eyebrow">重要说明</p>
              <h2 className="card-title">这不是“复刻真人”，而是受边界约束的文字分身</h2>
            </div>
            <a href="/import" className="btn-ghost">
              查看创建流程
            </a>
          </div>

          <ul className="note-list">
            <li>仅支持本人授权的数据导入。</li>
            <li>不会伪造实时近况，不替代真人对外发言。</li>
            <li>你可以随时补充自我描述，修正“不像我”的地方。</li>
            <li>后续可以扩展到语音与形象，但第一步先验证文本像不像。</li>
          </ul>
        </section>
      </main>
    </ProductShell>
  );
}
