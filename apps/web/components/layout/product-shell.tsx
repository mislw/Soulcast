import React, { type ReactNode } from "react";

type NavKey = "home" | "persona" | "chat" | "boundary";

type ProductShellProps = {
  activeNav: NavKey;
  personaId?: string;
  children: ReactNode;
};

type FlowStepsProps = {
  current: 1 | 2 | 3 | 4;
};

const navItems = [
  { key: "home" as const, label: "首页", icon: "⌂", href: "/" },
  {
    key: "persona" as const,
    label: "我的分身",
    icon: "◌",
    href: (personaId: string) => `/persona/${personaId}`,
  },
  {
    key: "chat" as const,
    label: "聊天记录",
    icon: "☰",
    href: (personaId: string) => `/chat/${personaId}`,
  },
  { key: "boundary" as const, label: "数据与边界", icon: "□", href: "/import" },
];

const flowLabels = ["导入聊天记录", "补充自我描述", "人格档案评审", "开始聊天"] as const;

export function ProductShell({
  activeNav,
  personaId = "demo-persona",
  children,
}: ProductShellProps) {
  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="brand-mark">
          <span className="brand-badge">◎</span>
          <div>
            <p className="brand-title">数字分身</p>
            <p className="brand-subtitle">温柔蒸馏你的表达方式</p>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="主导航">
          {navItems.map((item) => {
            const href =
              typeof item.href === "function" ? item.href(personaId) : item.href;

            return (
              <a
                key={item.key}
                href={href}
                className={`sidebar-link ${activeNav === item.key ? "active" : ""}`}
              >
                <span className="sidebar-icon">{item.icon}</span>
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>

        <div className="sidebar-box">
          <p className="sidebar-box-title">即将支持</p>
          <ul className="sidebar-box-list">
            <li>语音分身</li>
            <li>数字人形象</li>
          </ul>
        </div>

        <div className="account-box">
          <div className="account-avatar">我</div>
          <div>
            <p className="account-name">我的账号</p>
            <p className="account-copy">本地体验版</p>
          </div>
        </div>
      </aside>

      <main className="app-main">{children}</main>
    </div>
  );
}

export function FlowSteps({ current }: FlowStepsProps) {
  return (
    <div className="flow-steps" aria-label="流程步骤">
      {flowLabels.map((label, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === current;
        const isDone = stepNumber < current;

        return (
          <React.Fragment key={label}>
            <div className={`flow-step ${isActive ? "active" : ""} ${isDone ? "done" : ""}`}>
              <span className="flow-dot">{stepNumber}</span>
              <span>{label}</span>
            </div>
            {stepNumber < flowLabels.length ? <span className="flow-divider">›</span> : null}
          </React.Fragment>
        );
      })}
    </div>
  );
}
