import React from "react";

import { ImportForm } from "../../components/import/import-form";
import { FlowSteps, ProductShell } from "../../components/layout/product-shell";

export default function ImportPage() {
  return (
    <ProductShell activeNav="boundary">
      <main className="page-shell">
        <section className="panel">
          <FlowSteps current={1} />
          <div style={{ marginTop: 14 }}>
            <p className="eyebrow">导入阶段</p>
            <h1 className="section-title">导入你的聊天记录</h1>
            <p className="section-copy">
              先上传或粘贴你已经导出的聊天文本，再补充一部分自我描述。系统会用这两部分内容一起生成更细致的人格档案。
            </p>
          </div>
        </section>

        <section className="panel">
          <ImportForm />
        </section>
      </main>
    </ProductShell>
  );
}
