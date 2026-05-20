"use client";

import React, { useState } from "react";

import {
  createImportDraft,
  getPersonaPreview,
  getPersonaPreviewStorageKey,
  getPersonaTemplateStorageKey,
} from "../../lib/api";

type SourceMode = "paste" | "upload";

export function ImportForm() {
  const draft = createImportDraft();
  const [sourceText, setSourceText] = useState(draft.sourceText);
  const [sourceMode, setSourceMode] = useState<SourceMode>("paste");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const text = await file.text();
    setSourceText(text);
    setSourceMode("upload");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!sourceText.trim()) {
      setSubmitError("请先粘贴或上传聊天记录。");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const formData = new FormData(event.currentTarget);
    const selfProfile = {
      speakingStyle: String(formData.get("speakingStyle") ?? ""),
      values: String(formData.get("values") ?? ""),
      responsePatterns: String(formData.get("responsePatterns") ?? ""),
      boundaries: String(formData.get("boundaries") ?? ""),
      freeformNotes: String(formData.get("freeformNotes") ?? ""),
    };

    try {
      const preview = await getPersonaPreview(draft.personaId, sourceText, selfProfile);
      const serializedPreview = JSON.stringify(preview);
      sessionStorage.setItem(getPersonaPreviewStorageKey(draft.personaId), serializedPreview);
      localStorage.setItem(getPersonaTemplateStorageKey(draft.personaId), serializedPreview);
      window.location.assign(`/persona/${draft.personaId}`);
    } catch {
      setSubmitError("生成人格档案时出了点问题，请稍后再试。");
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form-shell">
      <div className="source-grid">
        <div style={{ display: "grid", gap: 16 }}>
          <div>
            <p className="eyebrow">步骤 1</p>
            <h2 className="card-title">导入你的聊天记录</h2>
            <p className="card-copy">
              支持粘贴文本或上传微信导出的 `.txt` 文件。我们只使用你本人授权的聊天内容。
            </p>
          </div>

          <div className="tab-bar" role="tablist" aria-label="导入方式">
            <button
              type="button"
              className={`tab-button ${sourceMode === "paste" ? "active" : ""}`}
              onClick={() => {
                setSourceMode("paste");
              }}
            >
              粘贴文本
            </button>
            <button
              type="button"
              className={`tab-button ${sourceMode === "upload" ? "active" : ""}`}
              onClick={() => {
                setSourceMode("upload");
              }}
            >
              上传文件
            </button>
          </div>

          <label className="label-stack">
            聊天内容
            <span className="field-caption">
              支持微信、QQ、Telegram 等导出的文本内容。越接近日常聊天，蒸馏结果越像你。
            </span>
            <textarea
              name="source"
              value={sourceText}
              onChange={(event) => {
                setSourceText(event.target.value);
              }}
              rows={10}
              className="text-area"
              placeholder="请粘贴聊天记录文本"
            />
          </label>
        </div>

        <div className="upload-zone">
          <div className="upload-mark">↑</div>
          <div>
            <h3 className="card-title">上传聊天文件</h3>
            <p className="card-copy">
              点击或拖拽上传微信导出的 TXT 文件。
              <br />
              仅支持 `.txt` 文本，建议 50MB 以内。
            </p>
          </div>
          <input
            type="file"
            accept=".txt,text/plain"
            onChange={handleFileChange}
            className="file-input"
          />
        </div>
      </div>

      <div className="micro-grid">
        <div className="micro-card">
          <h3>导入须知</h3>
          <p>建议只上传你授权的内容，避免混入过多无关片段。</p>
        </div>
        <div className="micro-card">
          <h3>导入状态</h3>
          <p>{sourceText.trim() ? "已准备好进入下一步" : "请先填写聊天内容"}</p>
        </div>
      </div>

      <div>
        <p className="eyebrow">步骤 2</p>
        <h2 className="card-title">补充自我描述</h2>
        <p className="card-copy">
          这一页是给分身“校准人格”的。聊天记录能学到你的文风，自我描述能帮它更像你本人。
        </p>
      </div>

      <div className="detail-grid">
        <label className="detail-card label-stack">
          我通常怎么说话
          <span className="field-caption">例如：偏温和、先接住情绪、解释会分步骤。</span>
          <textarea
            name="speakingStyle"
            defaultValue={draft.selfProfile.speakingStyle}
            rows={5}
            className="text-area"
          />
        </label>

        <label className="detail-card label-stack">
          我在意什么
          <span className="field-caption">例如：真诚、边界感、清楚表达，不喜欢被误解。</span>
          <textarea
            name="values"
            defaultValue={draft.selfProfile.values}
            rows={5}
            className="text-area"
          />
        </label>

        <label className="detail-card label-stack">
          我平时怎么回应别人
          <span className="field-caption">例如：先安慰，再帮对方理清问题，最后给建议。</span>
          <textarea
            name="responsePatterns"
            defaultValue={draft.selfProfile.responsePatterns}
            rows={5}
            className="text-area"
          />
        </label>

        <label className="detail-card label-stack">
          哪些内容不该被模仿
          <span className="field-caption">例如：不要写得太攻击，不要伪造我的实时状态。</span>
          <textarea
            name="boundaries"
            defaultValue={draft.selfProfile.boundaries}
            rows={5}
            className="text-area"
          />
        </label>

        <label className="detail-card label-stack" style={{ gridColumn: "span 2" }}>
          自由补充说明
          <span className="field-caption">
            如果只用一段话介绍你的说话方式和人格，可以在这里告诉系统。
          </span>
          <textarea
            name="freeformNotes"
            defaultValue={draft.selfProfile.freeformNotes}
            rows={5}
            className="text-area"
          />
        </label>
      </div>

      <div className="header-actions" style={{ justifyContent: "space-between" }}>
        <p className="helper-note">
          下一步会进入人格档案预览页，你可以先看“像不像我”，再决定是否进入聊天页。
        </p>
        <div style={{ display: "grid", gap: 8 }}>
          {submitError ? <p className="helper-note">{submitError}</p> : null}
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? "正在生成..." : "生成人格档案"}
          </button>
        </div>
      </div>
    </form>
  );
}
