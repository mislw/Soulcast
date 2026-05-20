import React from "react";

import type { SelfProfileInput } from "@ta/shared";

import { FlowSteps, ProductShell } from "../../../components/layout/product-shell";
import { PersonaSummary } from "../../../components/persona/persona-summary";
import { getPersonaPreview } from "../../../lib/api";

type PersonaPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PersonaPage({ params, searchParams }: PersonaPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const sourceText =
    typeof resolvedSearchParams?.source === "string" ? resolvedSearchParams.source : null;
  const selfProfile = parseSelfProfile(resolvedSearchParams);
  const persona = await getPersonaPreview(resolvedParams.id, sourceText, selfProfile);

  return (
    <ProductShell activeNav="persona" personaId={resolvedParams.id}>
      <main className="page-shell">
        <section className="panel">
          <FlowSteps current={3} />
          <div style={{ marginTop: 14 }}>
            <p className="eyebrow">人格档案评审</p>
            <h1 className="section-title">你的数字人格档案（草稿）</h1>
            <p className="section-copy">
              这里展示的是根据聊天记录和自我描述蒸馏出来的初版分身档案。
              先看像不像你，再决定要不要进入聊天验证。
            </p>
          </div>
        </section>

        <PersonaSummary assets={persona.assets} previewResponse={persona.response} />
      </main>
    </ProductShell>
  );
}

function parseSelfProfile(
  searchParams: Record<string, string | string[] | undefined> | undefined,
): SelfProfileInput | null {
  if (!searchParams) {
    return null;
  }

  const speakingStyle = asSingleString(searchParams.speakingStyle);
  const values = asSingleString(searchParams.values);
  const responsePatterns = asSingleString(searchParams.responsePatterns);
  const boundaries = asSingleString(searchParams.boundaries);
  const freeformNotes = asSingleString(searchParams.freeformNotes);

  if (!speakingStyle && !values && !responsePatterns && !boundaries && !freeformNotes) {
    return null;
  }

  return {
    speakingStyle,
    values,
    responsePatterns,
    boundaries,
    freeformNotes,
  };
}

function asSingleString(value: string | string[] | undefined): string {
  if (typeof value === "string") {
    return value;
  }

  return "";
}
