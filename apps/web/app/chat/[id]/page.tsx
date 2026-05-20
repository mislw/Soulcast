import React from "react";

import { ChatThread } from "../../../components/chat/chat-thread";
import { FlowSteps, ProductShell } from "../../../components/layout/product-shell";
import { getChatPreview } from "../../../lib/api";

type ChatPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ChatPage({ params }: ChatPageProps) {
  const resolvedParams = await params;
  const thread = await getChatPreview(resolvedParams.id);
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? null;

  return (
    <ProductShell activeNav="chat" personaId={resolvedParams.id}>
      <main className="page-shell">
        <section className="panel">
          <FlowSteps current={4} />
          <div style={{ marginTop: 14 }}>
            <p className="eyebrow">聊天验证</p>
            <h1 className="section-title">和你的文字分身聊一聊</h1>
            <p className="section-copy">
              这里展示的是多轮文本对话效果。它会尽量保留你的表达习惯和边界感，
              但不会装作是真人实时在线。
            </p>
          </div>
        </section>

        <ChatThread thread={thread} apiBaseUrl={apiBaseUrl} />
      </main>
    </ProductShell>
  );
}
