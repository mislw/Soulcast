import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";

import ChatPage from "../app/chat/[id]/page";
import ImportPage from "../app/import/page";
import LandingPage from "../app/page";
import PersonaPage from "../app/persona/[id]/page";

test("首页展示中文入口和创建按钮", async () => {
  const markup = renderToStaticMarkup(await LandingPage());

  assert.match(markup, /你的数字分身，从这里开始/);
  assert.match(markup, /创建我的数字分身/);
  assert.match(markup, /工作流程/);
  assert.match(markup, /\/persona\/demo-persona/);
});

test("导入页渲染聊天导入和自我描述模块", async () => {
  const markup = renderToStaticMarkup(await ImportPage());

  assert.match(markup, /导入你的聊天记录/);
  assert.match(markup, /上传聊天文件/);
  assert.match(markup, /我通常怎么说话/);
  assert.match(markup, /自由补充说明/);
  assert.match(markup, /生成人格档案/);
  assert.match(markup, /name="source"/);
});

test("人格页渲染档案页头和加载提示", async () => {
  const markup = renderToStaticMarkup(
    await PersonaPage({
      params: Promise.resolve({ id: "user-1" }),
    }),
  );

  assert.match(markup, /你的人格档案（草稿）/);
  assert.match(markup, /正在整理你的人格档案，请稍等一下/);
});

test("聊天页渲染中文对话预览和边界提示", async () => {
  const markup = renderToStaticMarkup(
    await ChatPage({ params: Promise.resolve({ id: "user-1" }) }),
  );

  assert.match(markup, /和你的文字分身聊一聊/);
  assert.match(markup, /会话说明/);
  assert.match(markup, /输入消息/);
  assert.match(markup, /发送消息/);
  assert.match(markup, /你刚刚的问题/);
  assert.match(markup, /分身回复预览/);
  assert.match(markup, /可见边界/);
});
