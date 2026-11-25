import type { YaoResult } from './dayan';
import type { DivinationResult } from './interpret';
import type { AiReading } from './ai';
import { DATA_VERSION, KNOWLEDGE_VERSION, MODEL_VERSION, PROMPT_VERSION, RULE_VERSION } from './versions';

export interface HistoryRecord { id: string; createdAt: string; question: string; mode: 'auto' | 'manual'; lines: YaoResult[]; result: DivinationResult; ai: AiReading | null; aiStatus: '未请求' | '生成中' | '已完成' | '失败' | '已取消'; modelVersion: string; ruleVersion: string; knowledgeVersion: string; promptVersion: string; dataVersion: string; }
const KEY = 'dayan-history-v2';
export function loadHistory(): HistoryRecord[] { try { const value = JSON.parse(localStorage.getItem(KEY) ?? '[]'); return Array.isArray(value) ? value : []; } catch { return []; } }
export function saveRecord(record: HistoryRecord): HistoryRecord[] { const next = [record, ...loadHistory().filter((item) => item.id !== record.id)]; localStorage.setItem(KEY, JSON.stringify(next)); return next; }
export function removeRecord(id: string): HistoryRecord[] { const next = loadHistory().filter((item) => item.id !== id); localStorage.setItem(KEY, JSON.stringify(next)); return next; }
export function makeRecord(id: string, question: string, mode: 'auto'|'manual', lines: YaoResult[], result: DivinationResult, ai: AiReading | null, aiStatus: HistoryRecord['aiStatus']): HistoryRecord { return { id, createdAt: new Date().toISOString(), question, mode, lines, result, ai, aiStatus, modelVersion: MODEL_VERSION, ruleVersion: RULE_VERSION, knowledgeVersion: KNOWLEDGE_VERSION, promptVersion: PROMPT_VERSION, dataVersion: DATA_VERSION }; }
export function exportHistory(records: HistoryRecord[]) { const blob = new Blob([JSON.stringify(records, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `大衍筮法历史-${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(url); }
