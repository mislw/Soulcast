"use client";

import React, { useState } from "react";

import { asNormalizedScore, type PersonaResponse } from "@ta/shared";

type ChatThreadProps = {
  thread: {
    personaId: string;
    draftMessage: string;
    previewResponse: PersonaResponse;
    policyBoundaries: string[];
    history: {
      role: "user" | "assistant";
      body: string;
    }[];
  };
  apiBaseUrl: string | null;
};

type ChatReplyPayload = {
  personaId: string;
  message: string;
};

type ChatHistoryItem = {
  id: string;
  role: "user" | "persona" | "system";
  label: string;
  text: string;
  responseMeta?: PersonaResponse;
};

function trimApiBaseUrl(value: string | null): string | null {
  if (!value) {
    return null;
  }

  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function buildLocalReply(message: string, previous: PersonaResponse): PersonaResponse {
  return {
    ...previous,
    text: `如果我是这个分身，我会先接住你的问题，再慢慢整理重点：${message}`,
    confidence: asNormalizedScore(0.7),
  };
}

async function requestChatReply(
  apiBaseUrl: string,
  payload: ChatReplyPayload,
): Promise<PersonaResponse | null> {
  try {
    const response = await fetch(`${apiBaseUrl}/chat/reply`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-user-id": payload.personaId,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as PersonaResponse;
  } catch {
    return null;
  }
}

function createInitialHistory(
  thread: ChatThreadProps["thread"],
  apiBaseUrl: string | null,
): ChatHistoryItem[] {
  const seededHistory: ChatHistoryItem[] = [
    {
      id: "system-1",
      role: "system",
      label: "会话说明",
      text: apiBaseUrl
        ? "当前会话已连接真实聊天接口。"
        : "当前会话运行在本地预览模式，没连上 API 时也会先给你一个本地回复。",
    },
    {
      id: "user-1",
      role: "user",
      label: "你刚刚的问题",
      text: thread.draftMessage,
    },
    {
      id: "persona-1",
      role: "persona",
      label: "分身回复预览",
      text: thread.previewResponse.text,
      responseMeta: thread.previewResponse,
    },
  ];

  if (thread.history.length > 0) {
    const historicalTurns = thread.history.map((message, index) => ({
      id: `stored-${index + 1}`,
      role: message.role === "assistant" ? ("persona" as const) : ("user" as const),
      label: message.role === "assistant" ? "历史回复" : "历史提问",
      text: message.body,
    }));

    return [seededHistory[0], ...historicalTurns];
  }

  return seededHistory;
}

export function ChatThread({ thread, apiBaseUrl }: ChatThreadProps) {
  const normalizedApiBaseUrl = trimApiBaseUrl(apiBaseUrl);
  const [draftMessage, setDraftMessage] = useState(thread.draftMessage);
  const [reply, setReply] = useState(thread.previewResponse);
  const [history, setHistory] = useState(() =>
    createInitialHistory(thread, normalizedApiBaseUrl),
  );
  const [status, setStatus] = useState(
    normalizedApiBaseUrl ? "已连接真实回复接口" : "当前是本地预览模式",
  );
  const [isSending, setIsSending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextMessage = draftMessage.trim();

    if (!nextMessage) {
      setStatus("先输入一句话，分身才能继续接住你。");
      return;
    }

    setIsSending(true);

    let nextReply: PersonaResponse;
    let nextStatus: string;

    if (normalizedApiBaseUrl) {
      const liveReply = await requestChatReply(normalizedApiBaseUrl, {
        personaId: thread.personaId,
        message: nextMessage,
      });

      if (liveReply) {
        nextReply = liveReply;
        nextStatus = "刚刚这条回复来自实时 API。";
      } else {
        nextReply = buildLocalReply(nextMessage, reply);
        nextStatus = "实时接口暂时失败，已退回本地预览回复。";
      }
    } else {
      nextReply = buildLocalReply(nextMessage, reply);
      nextStatus = "已生成本地预览回复。";
    }

    setReply(nextReply);
    setStatus(nextStatus);
    setHistory((previous) => [
      ...previous,
      {
        id: `user-${previous.length + 1}`,
        role: "user",
        label: "你刚刚的问题",
        text: nextMessage,
      },
      {
        id: `persona-${previous.length + 2}`,
        role: "persona",
        label: "分身回复预览",
        text: nextReply.text,
        responseMeta: nextReply,
      },
    ]);
    setDraftMessage("");
    setIsSending(false);
  }

  return (
    <section className="panel chat-frame">
      <div className="chat-history">
        {history.map((item) => (
          <article
            key={item.id}
            className={`chat-bubble ${
              item.role === "persona" ? "persona" : item.role === "system" ? "system" : "user"
            }`}
          >
            <p className="preview-label">{item.label}</p>
            <p className="preview-text">{item.text}</p>
            {item.responseMeta ? (
              <p className="metric-line">
                情绪：{item.responseMeta.emotion} · 节奏：{item.responseMeta.pacing} · 置信度：
                {Math.round(item.responseMeta.confidence * 100)}%
              </p>
            ) : null}
          </article>
        ))}

        <article className="chat-bubble policy">
          <p className="preview-label">可见边界</p>
          <p className="preview-text">{thread.policyBoundaries.join(" / ")}</p>
        </article>
      </div>

      <form className="chat-composer" onSubmit={handleSubmit}>
        <div className="chat-toolbar">
          <div>
            <p className="eyebrow">输入消息</p>
            <p className="status-note">
              这是一个文字分身，不会伪装成真人正在经历现实中的事情。
            </p>
          </div>
          <div className="chat-mini-actions">
            <button
              type="button"
              className="circle-button"
              onClick={() => {
                setDraftMessage(thread.draftMessage);
                setStatus("已恢复默认示例问题。");
              }}
            >
              ↺
            </button>
            <button
              type="button"
              className="circle-button"
              onClick={() => {
                setDraftMessage("");
                setStatus("已清空输入框。");
              }}
            >
              ×
            </button>
          </div>
        </div>

        <textarea
          name="message"
          rows={4}
          className="text-area"
          value={draftMessage}
          onChange={(event) => {
            setDraftMessage(event.target.value);
          }}
          placeholder="输入你的问题，和分身聊聊吧..."
        />

        <div className="chat-actions">
          <button type="submit" className="btn-primary" disabled={isSending}>
            {isSending ? "发送中..." : "发送消息"}
          </button>
          <p className="status-note">{status}</p>
        </div>
      </form>
    </section>
  );
}
