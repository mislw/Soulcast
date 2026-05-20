import React from "react";

import { FlowSteps, ProductShell } from "../../../components/layout/product-shell";
import { PersonaPreviewLoader } from "../../../components/persona/persona-preview-loader";

type PersonaPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PersonaPage({ params }: PersonaPageProps) {
  const resolvedParams = await params;

  return (
    <ProductShell activeNav="persona" personaId={resolvedParams.id}>
      <main className="page-shell">
        <section className="panel">
          <FlowSteps current={3} />
          <div style={{ marginTop: 14 }}>
            <p className="eyebrow">人格档案评审</p>
            <h1 className="section-title">你的人格档案（草稿）</h1>
            <p className="section-copy">
              这里展示的是根据聊天记录和自我描述蒸馏出来的初版分身档案。先看像不像你，再决定要不要进入聊天验证。
            </p>
          </div>
        </section>

        <PersonaPreviewLoader personaId={resolvedParams.id} />
      </main>
    </ProductShell>
  );
}
