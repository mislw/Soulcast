"use client";

import React, { useEffect, useState } from "react";

import type { PersonaAssets, PersonaResponse } from "@ta/shared";

import { getPersonaPreview } from "../../lib/api";
import { PersonaSummary } from "./persona-summary";

type PersonaPreviewLoaderProps = {
  personaId: string;
};

type PersonaPreviewPayload = {
  assets: PersonaAssets;
  response: PersonaResponse;
};

export function PersonaPreviewLoader({ personaId }: PersonaPreviewLoaderProps) {
  const [payload, setPayload] = useState<PersonaPreviewPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPreview() {
      const storageKey = `persona-preview:${personaId}`;
      const cachedValue = sessionStorage.getItem(storageKey);

      if (cachedValue) {
        try {
          const cachedPayload = JSON.parse(cachedValue) as PersonaPreviewPayload;

          if (!cancelled) {
            setPayload(cachedPayload);
          }

          return;
        } catch {
          sessionStorage.removeItem(storageKey);
        }
      }

      try {
        const nextPayload = await getPersonaPreview(personaId);

        if (!cancelled) {
          setPayload(nextPayload);
        }
      } catch {
        if (!cancelled) {
          setError("暂时没能读取人格档案，请返回上一步重新生成。");
        }
      }
    }

    void loadPreview();

    return () => {
      cancelled = true;
    };
  }, [personaId]);

  if (error) {
    return (
      <section className="panel">
        <p className="helper-note">{error}</p>
      </section>
    );
  }

  if (!payload) {
    return (
      <section className="panel">
        <p className="helper-note">正在整理你的人格档案，请稍等一下...</p>
      </section>
    );
  }

  return <PersonaSummary assets={payload.assets} previewResponse={payload.response} />;
}
