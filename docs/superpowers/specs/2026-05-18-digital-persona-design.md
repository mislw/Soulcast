# 数字分身项目设计文档

## 1. 项目目标

构建一个用户为自己创建的私人陪伴型文本分身系统。系统通过分析用户授权导入的私聊记录，蒸馏出相对稳定的表达风格、偏好、观点和记忆线索，并基于这些蒸馏结果生成一个可持续对话的文本分身。

第一阶段只交付文本陪聊能力，但架构上要为后续语音和形象层预留扩展接口。

## 2. 核心定位

### 2.1 产品定位

- 面向用户本人授权创建
- 主场景是“和自己的数字分身持续对话”
- 重点不是替用户代发，而是延续陪伴感

### 2.2 非目标

第一阶段不做以下内容：

- 不做第三方代聊或自动外发
- 不做已故亲友复刻
- 不做实时同步用户所有外部聊天
- 不承诺绝对准确复现真实人格
- 不做医疗、法律、财务等高风险建议系统

## 3. 用户故事

### 3.1 核心用户

有较多私聊记录、愿意授权系统学习自己表达方式，并希望获得一个“像自己”的文本陪聊分身的个人用户。

### 3.2 核心用户故事

1. 作为用户，我可以上传自己的聊天记录并创建一个数字分身。
2. 作为用户，我可以看到系统提炼出的“我的风格画像”和“我的记忆摘要”。
3. 作为用户，我可以删除不想让系统学习的内容。
4. 作为用户，我可以和分身进行文本聊天，并感受到它的表达方式接近我本人。
5. 作为用户，我可以修正系统，让它逐渐更像我。

## 4. 产品原则

- 明确授权：只有用户本人可以为自己创建分身
- 可解释：用户能看到系统学到了什么
- 可修正：用户能修改、删除、屏蔽蒸馏结果
- 可控：分身不伪造实时事实，不冒充真人外发
- 可扩展：文本核心可复用到语音和形象层

## 5. MVP 范围

### 5.1 用户可见功能

1. 数据导入
   - 上传私聊记录文件
   - 查看导入结果和数据规模
2. 分身生成
   - 生成风格画像
   - 生成记忆卡片
   - 生成禁区规则
3. 分身聊天
   - 与数字分身进行 1v1 文本对话
   - 展示部分记忆引用或“为什么这么回答”
4. 分身校正
   - 标记“像我”或“不像我”
   - 编辑部分画像内容
   - 屏蔽不该学习的语料
5. 数据控制
   - 删除聊天源数据
   - 删除蒸馏画像
   - 重建分身

### 5.2 不进入 MVP 的功能

- 多用户社交关系图谱
- 多人格版本切换
- 语音克隆
- 数字形象驱动
- 跨平台消息联动
- 自动发布或代发

## 6. 系统架构

系统分为五层。

### 6.1 Data Ingestion

职责：

- 导入聊天记录
- 识别发送方和时间线
- 消息标准化
- 去重和清洗
- 基础脱敏

输入：

- 聊天导出文件

输出：

- 标准化消息流

### 6.2 Distillation Engine

职责：

- 提取语言风格特征
- 归纳稳定偏好和表达习惯
- 生成长期记忆卡片
- 生成风险和禁区规则

输出：

- persona profile
- memory cards
- safety policy

### 6.3 Memory & Retrieval

职责：

- 根据当前对话检索最相关的记忆和画像
- 控制上下文长度
- 管理长期记忆和短期会话记忆

### 6.4 Response Engine

职责：

- 基于画像、记忆、当前对话生成回复
- 做安全检查和一致性检查
- 产出统一响应对象

### 6.5 Extension Interfaces

职责：

- 对外提供统一 persona response
- 供未来的语音和形象模块复用

## 7. 数据流

1. 用户上传聊天记录
2. Ingestion 服务解析为统一消息格式
3. Distillation 服务生成风格、记忆、规则
4. 数据写入画像库和记忆库
5. 用户发起聊天
6. Retrieval 服务检索相关记忆和画像片段
7. Response Engine 组装 prompt 并生成回复
8. Safety 层过滤高风险输出
9. 返回统一响应对象给前端

## 8. 蒸馏流程设计

蒸馏采用四层结构。

### 8.1 原始层

对导入消息进行标准化：

- sender_id
- timestamp
- conversation_id
- text
- attachments_meta
- reply_relation

并按时间、主题、会话对象切片。

### 8.2 语言特征层

抽取：

- 高频词
- 常用语气词
- 常用开场和结尾
- 平均句长
- 长短句分布
- 表达直接度
- 情绪表达模式
- 提建议、安慰、吐槽时的固定句式

### 8.3 人格认知层

抽取：

- 长期兴趣
- 稳定偏好
- 常见价值判断
- 冲突处理习惯
- 安慰他人的方式
- 遇到不确定信息时的表达方式

### 8.4 生成约束层

转成机器可执行的约束：

- preferred patterns
- avoid patterns
- uncertainty rules
- taboo topics
- memory confidence rules

## 9. 核心数据结构

### 9.1 标准消息结构

```json
{
  "message_id": "msg_001",
  "user_id": "u_001",
  "conversation_id": "c_001",
  "sender_role": "self",
  "timestamp": "2026-05-18T10:00:00Z",
  "text": "今天有点累，不过问题不大",
  "reply_to": null,
  "meta": {
    "source": "wechat",
    "has_emoji": false
  }
}
```

### 9.2 Persona Profile

```json
{
  "persona_id": "p_001",
  "version": 1,
  "tone": {
    "warmth": 0.82,
    "directness": 0.61,
    "playfulness": 0.34
  },
  "speech_patterns": [
    "偏口语化",
    "常先安抚再表达观点",
    "较少使用特别正式的句式"
  ],
  "signature_phrases": [
    "问题不大",
    "慢慢来",
    "先别急"
  ],
  "conversation_habits": [
    "倾向短句连续回复",
    "很少长篇说教"
  ],
  "boundaries": [
    "不伪造实时近况",
    "不冒充本人对外发言"
  ]
}
```

### 9.3 Memory Card

```json
{
  "memory_id": "m_001",
  "type": "preference",
  "summary": "用户在压力场景下倾向先稳定情绪，再讨论解决方案",
  "evidence_refs": ["msg_101", "msg_233", "msg_901"],
  "confidence": 0.76,
  "valid_from": "2024-01-01",
  "valid_to": null,
  "tags": ["emotion", "support_style"]
}
```

### 9.4 Unified Persona Response

```ts
type PersonaResponse = {
  text: string
  emotion: "calm" | "warm" | "playful" | "serious"
  pacing: "short" | "medium" | "long"
  style_tags: string[]
  memory_refs: string[]
  safety_flags: string[]
  confidence: number
}
```

## 10. 前端页面设计

### 10.1 Onboarding / 导入页

目标：

- 解释产品用途
- 获取明确授权
- 上传聊天记录

要点：

- 必须显示授权说明
- 必须显示“仅支持为自己创建”
- 展示支持的导入格式

### 10.2 Distillation Review / 蒸馏审核页

目标：

- 让用户理解系统学到了什么

模块：

- 我的说话风格
- 我的高频表达
- 我的长期兴趣
- 我的记忆卡片
- 不想被学习的内容

### 10.3 Chat / 分身聊天页

目标：

- 与分身持续对话

模块：

- 聊天窗口
- 分身状态说明
- 回答反馈按钮
- 记忆引用提示

### 10.4 Persona Settings / 分身设置页

目标：

- 调整边界和风格

模块：

- 边界规则
- 黑名单语料
- 分身重建
- 删除数据

## 11. 后端服务拆分

### 11.1 ingestion-service

接口：

- POST /imports
- GET /imports/:id

职责：

- 上传和解析文件
- 输出统一消息结构

### 11.2 distillation-service

接口：

- POST /personas/build
- GET /personas/:id/profile
- GET /personas/:id/memories

职责：

- 离线蒸馏
- 生成 persona profile 和 memory cards

### 11.3 memory-service

接口：

- POST /memory/search
- POST /memory/feedback

职责：

- 检索长期记忆
- 基于反馈调整权重

### 11.4 chat-service

接口：

- POST /chat/sessions
- POST /chat/sessions/:id/messages

职责：

- 拼接上下文
- 调用对话模型
- 产出统一响应

### 11.5 policy-service

接口：

- POST /policy/evaluate

职责：

- 风险内容识别
- 实时事实伪造检查
- 输出降级策略

## 12. 模型与提示词策略

### 12.1 建议策略

采用双阶段模型：

- 蒸馏模型：做离线分析归纳
- 对话模型：做在线聊天生成

### 12.2 Prompt 组成

在线生成 prompt 建议包含：

1. system policy
2. persona summary
3. current session summary
4. top-k relevant memories
5. latest messages
6. answer constraints

### 12.3 输出约束

- 不知道时承认不知道
- 不伪造用户最近真实经历
- 不脱离设定突然变成通用助手口吻
- 优先保持风格一致和情感一致

## 13. 评测设计

MVP 要重点验证“像不像”和“能不能持续陪聊”。

### 13.1 离线评测

- 风格相似度评分
- 高频表达命中率
- 句长分布接近度
- 记忆引用相关性

### 13.2 人工评测

让用户对回复做三维打分：

- 像不像我
- 舒不舒服
- 有没有胡编

### 13.3 关键指标

- Persona build success rate
- First-chat satisfaction
- “像我”反馈占比
- 不像我反馈占比
- 高风险回复拦截率

## 14. 扩展接口预留

### 14.1 VoiceAdapter

输入：

- PersonaResponse.text
- PersonaResponse.emotion
- PersonaResponse.pacing

输出：

- 音频流或 TTS 任务 id

### 14.2 AvatarAdapter

输入：

- PersonaResponse.emotion
- style_tags
- future gesture hints

输出：

- 驱动动画参数

### 14.3 Session SDK

统一对外暴露：

- createPersona
- rebuildPersona
- chatWithPersona
- exportPersonaSpec

## 15. 技术选型建议

### 15.1 前端

- Next.js
- TypeScript
- Tailwind 或 shadcn/ui 作为基础 UI

### 15.2 后端

- Node.js + NestJS 或 Fastify
- Python 作为蒸馏和 NLP 处理辅助服务

### 15.3 存储

- PostgreSQL：用户、会话、画像元数据
- Object Storage：原始导入文件
- Vector DB 或 pgvector：记忆检索
- Redis：会话缓存

### 15.4 模型层

- 蒸馏：强分析模型
- 在线对话：稳定、成本可控的聊天模型
- Embedding：用于记忆检索

## 16. 8 周开发路线图

### Week 1-2

- 明确导入格式
- 搭建项目骨架
- 实现聊天记录解析和标准化

### Week 3-4

- 实现第一版蒸馏 pipeline
- 生成 persona profile 和 memory cards
- 完成蒸馏审核页

### Week 5-6

- 实现记忆检索
- 实现聊天接口和统一响应结构
- 完成聊天页 MVP

### Week 7

- 加入反馈闭环
- 加入安全策略和边界控制
- 补齐数据删除和重建能力

### Week 8

- 做内部评测
- 调整 prompt 和检索逻辑
- 准备种子用户测试

## 17. 风险与边界

### 17.1 法律与伦理

- 必须是本人授权
- 用户可随时删除数据和画像
- 不支持冒充第三方社交发言

### 17.2 产品风险

- 可能出现表面像、深层不像
- 可能对记忆做错误归纳
- 可能让用户误以为这是“真实的自己”

### 17.3 技术风险

- 聊天记录格式碎片化
- 风格蒸馏容易过拟合口头禅
- 记忆检索可能引入不相关上下文

## 18. 结论

建议先做一个可控的文本分身 MVP：把“像我说话”和“能持续陪聊”跑通，再把同一人格核心扩展到语音和形象层。整个系统的关键不是单纯聊天，而是把聊天记录转成结构化人格资产，并让生成层始终受这些资产约束。
