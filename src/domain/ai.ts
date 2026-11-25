import type { YaoResult } from './dayan';
import type { DivinationResult } from './interpret';
import { KNOWLEDGE_VERSION, MODEL_VERSION, PROMPT_VERSION, RULE_VERSION } from './versions';

export interface SourceMaterial { id: string; type: '卦辞' | '爻辞' | '规则'; title: string; text: string; }
export interface AiReading {
  originalAnalysis: string; movingAnalysis: string; changedAnalysis: string;
  questionAnalysis: string; summary: string; sourceIds: string[]; uncertainty: string;
}
export interface AiInput {
  sessionId: string; question: string; lines: YaoResult[]; reading: DivinationResult;
  ruleVersion: string; knowledgeVersion: string; promptVersion: string; modelVersion: string;
  materials: SourceMaterial[];
}
export type AiFailureCode = 'cancelled' | 'not-ready' | 'timeout' | 'service-exited' | 'http' | 'empty' | 'parse' | 'incomplete';

export class AiRequestError extends Error {
  constructor(public code: AiFailureCode, message: string, public userMessage: string, public retryable = true) { super(message); }
}

export const SYSTEM_PROMPT = `你是大衍筮法系统中的传统《周易》解卦助手。你的职责是解释程序提供的确定性卦象，而不是重新起卦或预测必然结果。
一、绝不可改变本卦、卦码、六爻顺序、动爻位置、之卦及程序给出的取辞规则。经典原文和来源只能使用本次 sourceMaterials，不能凭记忆补写。不得自行从卦名编造人物关系、故事设定或古义。
二、先说明卦象概览，再依据 selected materials 分析传统卦义，继而结合用户的具体问题说明变化方向和可参考的行动启发。经典依据与现代类比必须明确区分。若资料不支持某个结论，直接说明依据不足。
三、现实问题不作确定性预言；医疗、法律、投资等问题不得用卦象替代专业判断。游戏、小说、动漫、电影等虚构问题可作叙事与创作分析，但只能使用用户提供的设定。
四、统一使用简体中文，避免套话、重复、过度神秘化和机械的吉凶结论。questionAnalysis 不得只复述问题，必须比较用户提出的选项或直接回应其关切，并说明卦象依据；summary 必须给出有条件、非确定性的综合方向。
五、优先输出符合 JSON Schema 的对象。sourceIds 只能逐字选取输入中存在的 ID；资料缺失、类比边界及其他不确定性写入 uncertainty。
六、面向用户的五段正文不得显示卦码、source ID、模型名称、版本号或其他程序内部标识。`;

export function buildAiInput(sessionId: string, question: string, lines: YaoResult[], reading: DivinationResult): AiInput {
  const materials: SourceMaterial[] = [
    { id: `gua:${reading.original.code}:judgment`, type: '卦辞', title: `${reading.original.fullName}卦辞`, text: reading.original.guaCi },
    ...reading.references.map((ref, index) => ({
      id: `selected:${reading.original.code}:${index + 1}`,
      type: ref.title.includes('爻') ? '爻辞' as const : ref.title.includes('卦辞') ? '卦辞' as const : '规则' as const,
      title: ref.title, text: ref.text,
    })),
  ];
  if (reading.changed) materials.push({ id: `gua:${reading.changed.code}:judgment`, type: '卦辞', title: `${reading.changed.fullName}卦辞`, text: reading.changed.guaCi });
  materials.push({ id: `rule:${RULE_VERSION}`, type: '规则', title: '本次取辞规则', text: reading.method });
  return { sessionId, question, lines, reading, materials, ruleVersion: RULE_VERSION, knowledgeVersion: KNOWLEDGE_VERSION, promptVersion: PROMPT_VERSION, modelVersion: MODEL_VERSION };
}

const baseSchema = { type: 'object', additionalProperties: false, required: ['originalAnalysis','movingAnalysis','changedAnalysis','questionAnalysis','summary','sourceIds','uncertainty'], properties: {
  originalAnalysis: { type: 'string' }, movingAnalysis: { type: 'string' }, changedAnalysis: { type: 'string' }, questionAnalysis: { type: 'string', minLength: 40 }, summary: { type: 'string', minLength: 30 }, sourceIds: { type: 'array', items: { type: 'string' } }, uncertainty: { type: 'string' },
} };

const delay = (ms: number, signal: AbortSignal) => new Promise<void>((resolve, reject) => {
  const timer = globalThis.setTimeout(resolve, ms);
  signal.addEventListener('abort', () => { globalThis.clearTimeout(timer); reject(new AiRequestError('cancelled', 'Request cancelled', '已取消本次本地 AI 解读。', false)); }, { once: true });
});

async function waitForService(signal: AbortSignal, timeoutMs = 75_000): Promise<void> {
  const started = Date.now(); let lastStatus = 0;
  while (Date.now() - started < timeoutMs) {
    if (signal.aborted) throw new AiRequestError('cancelled', 'Request cancelled', '已取消本次本地 AI 解读。', false);
    try {
      const response = await fetch('http://127.0.0.1:19331/health', { signal }); lastStatus = response.status;
      if (response.ok) return;
    } catch (error) {
      if (signal.aborted) throw new AiRequestError('cancelled', 'Request cancelled', '已取消本次本地 AI 解读。', false);
      if (!(error instanceof TypeError)) throw error;
    }
    await delay(900, signal);
  }
  throw new AiRequestError('not-ready', `Health check did not become ready; last status ${lastStatus}`, '本地 AI 仍在加载，请稍后重新生成。');
}

function extractJson(content: string): unknown {
  const cleaned = content.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
  try { return JSON.parse(cleaned); } catch { /* try the outermost JSON object */ }
  const first = cleaned.indexOf('{'); const last = cleaned.lastIndexOf('}');
  if (first >= 0 && last > first) { try { return JSON.parse(cleaned.slice(first, last + 1)); } catch { /* handled below */ } }
  return cleaned;
}

function cleanVisibleText(value: string): string {
  return value
    .replace(/[（(]\s*卦码\s*[01]{6}\s*[）)]/g, '')
    .replace(/卦码\s*[01]{6}/g, '')
    .replace(/\b(?:gua|selected|rule):[^\s，。；、]+/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function normalizeReading(value: unknown, input: AiInput): AiReading {
  if (typeof value === 'string') {
    if (!value.trim()) throw new AiRequestError('empty', 'Model returned empty text', '本地 AI 没有返回有效内容，请重新生成。');
    return { originalAnalysis: '', movingAnalysis: '', changedAnalysis: '', questionAnalysis: '', summary: cleanVisibleText(value), sourceIds: [], uncertainty: '模型本次未按结构化格式返回，正文已保留；经典依据请以页面上方程序校验内容为准。' };
  }
  if (!value || typeof value !== 'object') throw new AiRequestError('parse', 'Model response is not an object', '本地 AI 返回格式异常，请重新生成。');
  const raw = value as Partial<AiReading>;
  const text = (field: keyof AiReading) => typeof raw[field] === 'string' ? cleanVisibleText(String(raw[field])) : '';
  const allowed = new Set(input.materials.map((material) => material.id)); const givenIds = Array.isArray(raw.sourceIds) ? raw.sourceIds.filter((id): id is string => typeof id === 'string') : [];
  const validIds = [...new Set(givenIds.filter((id) => allowed.has(id)))]; const invalidCount = givenIds.length - validIds.length;
  const result: AiReading = { originalAnalysis: text('originalAnalysis'), movingAnalysis: text('movingAnalysis'), changedAnalysis: text('changedAnalysis'), questionAnalysis: text('questionAnalysis'), summary: text('summary'), sourceIds: validIds, uncertainty: text('uncertainty') };
  if (![result.originalAnalysis,result.movingAnalysis,result.changedAnalysis,result.questionAnalysis,result.summary].some(Boolean)) throw new AiRequestError('incomplete', 'No usable analysis fields in model response', '本地 AI 返回内容不完整，请重新生成。');
  const positionNames = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'];
  const movingText = input.reading.movingPositions.length
    ? `共有 ${input.reading.movingPositions.length} 个动爻，位置为${input.reading.movingPositions.map((position) => positionNames[position - 1] ?? `第${position}爻`).join('、')}`
    : '六爻皆静';
  const changedText = input.reading.changed
    ? `之卦为${input.reading.changed.fullName}`
    : '本次无之卦';
  result.originalAnalysis = `本卦为${input.reading.original.fullName}，六爻按初爻至上爻排列；${movingText}；${changedText}。以上卦象与爻位由大衍演算程序确定。`;
  if (invalidCount) result.uncertainty = `${result.uncertainty}${result.uncertainty ? '；' : ''}模型返回的 ${invalidCount} 个未授权资料 ID 已被程序移除。`;
  return result;
}

export function parseAiResponse(content: string, input: AiInput): AiReading { return normalizeReading(extractJson(content), input); }

async function postCompletion(input: AiInput, signal: AbortSignal, strict: boolean): Promise<AiReading> {
  const lines = input.lines.map((line) => ({ position: line.position, value: line.value, name: line.name, yinYang: line.isYang ? '阳' : '阴', moving: line.isMoving }));
  const authoritative = { question: input.question, sessionId: input.sessionId, lineOrder: '初爻至上爻', lines, original: { id: input.reading.original.id, name: input.reading.original.fullName, code: input.reading.original.code }, movingPositions: input.reading.movingPositions, changed: input.reading.changed ? { id: input.reading.changed.id, name: input.reading.changed.fullName, code: input.reading.changed.code } : null, rule: input.reading.method, ruleVersion: input.ruleVersion, sourceMaterials: input.materials };
  const schema = { ...baseSchema, properties: { ...baseSchema.properties, sourceIds: { type: 'array', items: { type: 'string', enum: input.materials.map((material) => material.id) } } } };
  const timeout = new AbortController(); const timer = globalThis.setTimeout(() => timeout.abort(), 120_000); const abort = () => timeout.abort(); signal.addEventListener('abort', abort, { once: true });
  try {
    const body: Record<string, unknown> = { model: input.modelVersion, temperature: 0.35, top_p: 0.8, max_tokens: 1200, messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: `以下 JSON 是本次唯一权威数据。不得用记忆覆盖它，也不要从卦名编造字面故事。\n${JSON.stringify(authoritative)}` }] };
    body.response_format = strict ? { type: 'json_schema', json_schema: { name: 'dayan_reading', strict: true, schema } } : { type: 'json_object' };
    let response: Response;
    try { response = await fetch('http://127.0.0.1:19331/v1/chat/completions', { method: 'POST', signal: timeout.signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); }
    catch (error) {
      if (signal.aborted) throw new AiRequestError('cancelled', 'Request cancelled', '已取消本次本地 AI 解读。', false);
      if (timeout.signal.aborted) throw new AiRequestError('timeout', 'Generation timed out after 120 seconds', '本地 AI 生成超时，可稍后重新生成。');
      throw new AiRequestError('service-exited', String(error), '无法连接本地 AI 服务，请确认应用未被异常关闭。');
    }
    if (!response.ok) throw new AiRequestError('http', `HTTP ${response.status}: ${(await response.text()).slice(0, 500)}`, response.status === 503 ? '本地 AI 尚未准备完成，请稍后重新生成。' : `本地 AI 请求异常（${response.status}），可重新生成。`);
    const payload = await response.json();
    if (payload.choices?.[0]?.finish_reason === 'length') throw new AiRequestError('incomplete', 'Generation reached max_tokens', '本地 AI 回答未完整生成，请重新生成。');
    const content = payload.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || !content.trim()) throw new AiRequestError('empty', 'Model returned no content', '本地 AI 没有返回有效内容，请重新生成。');
    return parseAiResponse(content, input);
  } finally { globalThis.clearTimeout(timer); signal.removeEventListener('abort', abort); }
}

export async function requestAiReading(input: AiInput, signal: AbortSignal): Promise<AiReading> {
  await waitForService(signal);
  try { return await postCompletion(input, signal, true); }
  catch (error) {
    if (!(error instanceof AiRequestError) || !error.retryable || signal.aborted) throw error;
    console.warn(`[AI] strict request failed (${error.code}): ${error.message}; retrying once with compatible JSON mode.`);
    return postCompletion(input, signal, false);
  }
}
