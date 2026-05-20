import React from "react";

import type { PersonaAssets, PersonaResponse } from "@ta/shared";

type PersonaSummaryProps = {
  assets: PersonaAssets;
  previewResponse: PersonaResponse;
};

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function buildInitial(name: string) {
  return name.slice(0, 1).toUpperCase();
}

export function PersonaSummary({ assets, previewResponse }: PersonaSummaryProps) {
  const { profile, policy, memories } = assets;
  const personaName = profile.name ?? profile.personaId;
  const summaryCopy =
    profile.description ??
    "这是一个从聊天记录中蒸馏出的文字分身草稿，重点保留你重复出现的语气、回应方式和边界感。";
  const toneTags = [
    `温度 ${formatPercent(profile.tone.warmth)}`,
    `直接度 ${formatPercent(profile.tone.directness)}`,
    `轻松感 ${formatPercent(profile.tone.playfulness)}`,
  ];

  return (
    <section className="panel" style={{ display: "grid", gap: 18 }}>
      <div className="persona-header">
        <div>
          <p className="eyebrow">人格档案预览</p>
          <h2 className="section-title">{personaName}</h2>
          <p className="section-copy">
            这不是“现在实时在线的你”，而是根据你提供的聊天记录和自我描述蒸馏出的文字人格草稿。
          </p>
        </div>

        <div className="header-actions">
          <a href="/import" className="btn-secondary">
            不太像，修改资料
          </a>
          <a href={`/chat/${profile.personaId}`} className="btn-primary">
            很像，进入聊天
          </a>
        </div>
      </div>

      <div className="persona-hero">
        <div className="persona-mark">
          <div className="persona-seal">{buildInitial(personaName)}</div>
          <p className="quote-note">{summaryCopy}</p>
          <div className="tag-row">
            {toneTags.map((tag) => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="preview-box">
          <p className="preview-label">示例回复</p>
          <p className="preview-text">{previewResponse.text}</p>
          <p className="metric-line">
            当前情绪：{previewResponse.emotion} · 句长节奏：{previewResponse.pacing} ·
            置信度：{Math.round(previewResponse.confidence * 100)}%
          </p>
        </div>
      </div>

      <div className="summary-grid">
        <article className="summary-card">
          <h3>人格概述</h3>
          <p>{summaryCopy}</p>
        </article>

        <article className="summary-card">
          <h3>说话风格</h3>
          <ul className="detail-list">
            {profile.speechPatterns.map((pattern) => (
              <li key={pattern}>{pattern}</li>
            ))}
          </ul>
        </article>

        <article className="summary-card">
          <h3>常见表达</h3>
          <ul className="detail-list">
            {profile.signaturePhrases.map((phrase) => (
              <li key={phrase}>{phrase}</li>
            ))}
          </ul>
        </article>

        <article className="summary-card">
          <h3>回复习惯</h3>
          <ul className="detail-list">
            {profile.conversationHabits.map((habit) => (
              <li key={habit}>{habit}</li>
            ))}
          </ul>
        </article>

        <article className="summary-card">
          <h3>长期记忆卡片</h3>
          {memories.length > 0 ? (
            <ul className="detail-list">
              {memories.slice(0, 4).map((memory) => (
                <li key={memory.memoryId}>{memory.summary}</li>
              ))}
            </ul>
          ) : (
            <p>当前聊天材料还不足，长期记忆层会更偏保守。</p>
          )}
        </article>

        <article className="summary-card">
          <h3>边界与禁区</h3>
          <ul className="detail-list">
            {policy.boundaries.map((boundary) => (
              <li key={boundary}>{boundary}</li>
            ))}
          </ul>
        </article>
      </div>

      <div className="progress-card">
        <p className="preview-label">档案可信度</p>
        <div className="header-actions" style={{ justifyContent: "space-between" }}>
          <strong>{Math.round(previewResponse.confidence * 100)}%</strong>
          <span className="helper-note">资料越完整，可塑性越高</span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${Math.round(previewResponse.confidence * 100)}%` }}
          />
        </div>
      </div>

      <div>
        <p className="eyebrow">记忆卡片</p>
        <div className="memory-grid">
          {memories.length > 0 ? (
            memories.map((memory) => (
              <article key={memory.memoryId} className="memory-card">
                <p className="preview-label">{memory.type}</p>
                <h3>{memory.summary}</h3>
                <p className="memory-meta">
                  置信度：{Math.round(memory.confidence * 100)}% · 依据：
                  {memory.evidenceRefs.join("、")}
                </p>
                <div className="memory-tags">
                  {memory.tags.map((tag) => (
                    <span key={tag} className="memory-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            ))
          ) : (
            <article className="memory-card">
              <p className="preview-label">memory</p>
              <h3>还没有提炼出足够稳定的长期记忆。</h3>
              <p className="memory-meta">可以补更多聊天记录，或者把自我描述写得更具体一点。</p>
            </article>
          )}
        </div>
      </div>
    </section>
  );
}
