import { build } from 'esbuild';
import assert from 'node:assert/strict';
import { rm } from 'node:fs/promises';

await build({ entryPoints: ['src/domain/dayan.ts', 'src/domain/hexagram-data.ts', 'src/domain/interpret.ts', 'src/domain/ai.ts'], outdir: '.check', bundle: true, platform: 'node', format: 'esm', target: 'node20', loader: { '.json': 'json' } });
try {
  const { castYao } = await import('../.check/dayan.js');
  const { hexagrams, findHexagram, getChangedBits } = await import('../.check/hexagram-data.js');
  const { interpret } = await import('../.check/interpret.js');
  const { buildAiInput, parseAiResponse } = await import('../.check/ai.js');
  for (let run = 0; run < 300; run += 1) {
    const line = castYao(run % 6 + 1);
    assert.ok([6, 7, 8, 9].includes(line.value)); assert.equal(line.changes.length, 3); assert.equal(line.remaining, line.value * 4);
    assert.ok([5, 9].includes(line.changes[0].removed));
    for (const change of line.changes.slice(1)) assert.ok([4, 8].includes(change.removed));
    for (const change of line.changes) assert.equal(change.participants - change.removed, change.remaining);
    assert.ok(line.changes[0].left >= 2 && line.changes[0].left <= 47); assert.equal(line.changes[0].left + line.changes[0].right, 49);
  }
  const cryptoDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
  Object.defineProperty(globalThis, 'crypto', { configurable: true, value: { getRandomValues(array) { array[0] = 0; return array; } } });
  const fixedLine = castYao(1);
  assert.equal(fixedLine.value, 9); assert.deepEqual(fixedLine.changes.map((change) => change.left), [2, 1, 1]); assert.deepEqual(fixedLine.changes.map((change) => change.remaining), [44, 40, 36]);
  if (cryptoDescriptor) Object.defineProperty(globalThis, 'crypto', cryptoDescriptor); else delete globalThis.crypto;
  assert.equal(hexagrams.length, 64); assert.equal(new Set(hexagrams.map((gua) => gua.code)).size, 64);
  for (let n = 0; n < 64; n += 1) findHexagram(n.toString(2).padStart(6, '0').split('').map(Number));
  assert.equal(getChangedBits([9, 7, 8, 6, 7, 8]).join(''), '010110');
  const allYang = Array.from({ length: 6 }, (_, i) => ({ position: i + 1, value: 9, isYang: true, isMoving: true }));
  assert.equal(interpret(allYang).references[0].title, '乾 · 用九');
  const allYin = Array.from({ length: 6 }, (_, i) => ({ position: i + 1, value: 6, isYang: false, isMoving: true }));
  assert.equal(interpret(allYin).references[0].title, '坤 · 用六');
  const family = hexagrams.find((gua) => gua.id === 37);
  assert.equal(family.code, '101011'); assert.ok(family.yaoTexts[3].startsWith('六四'));
  for (let movingCount = 0; movingCount <= 6; movingCount += 1) {
    const lines = Array.from({ length: 6 }, (_, i) => {
      const isMoving = i < movingCount; const isYang = i % 2 === 0;
      return { position: i + 1, value: isMoving ? (isYang ? 9 : 6) : (isYang ? 7 : 8), isYang, isMoving };
    });
    const reading = interpret(lines);
    assert.equal(reading.movingPositions.length, movingCount);
    assert.equal(reading.references.length, movingCount === 0 || movingCount === 3 ? (movingCount === 0 ? 1 : 2) : movingCount === 2 || movingCount === 4 ? 2 : 1);
  }
  const aiLines = [8,7,8,9,8,7].map((value, index) => ({ position:index+1,value,isYang:value===7||value===9,isMoving:value===6||value===9,name:value===9?'老阳':value===7?'少阳':value===8?'少阴':'老阴',changes:[],totalRemoved:49-value*4,remaining:value*4 }));
  const aiReading = interpret(aiLines); const aiInput = buildAiInput('test','应该先巩固基础还是开始新项目？',aiLines,aiReading);
  const tolerant = parseAiResponse(`<think>内部过程</think>\n\`\`\`json\n${JSON.stringify({ originalAnalysis:'概览（卦码 010101）', movingAnalysis:'动爻 gua:010101:judgment', changedAnalysis:'变化', questionAnalysis:'结合问题进行比较并说明依据。', summary:'综合方向', sourceIds:[aiInput.materials[0].id,'invalid:id'], uncertainty:'' })}\n\`\`\``, aiInput);
  assert.deepEqual(tolerant.sourceIds,[aiInput.materials[0].id]); assert.match(tolerant.uncertainty,/未授权资料 ID/);
  assert.doesNotMatch(`${tolerant.originalAnalysis}${tolerant.movingAnalysis}`,/卦码|gua:/i);
  const plain = parseAiResponse('这是未结构化正文（卦码 010101），引用 rule:test。', aiInput); assert.doesNotMatch(plain.summary,/卦码|rule:/i); assert.equal(plain.sourceIds.length,0);
  console.log('通过：300 次成爻、固定随机三变、64 卦穷举、之卦映射、0–6 动爻占断、AI 容错解析及引用过滤。');
} finally {
  await rm(new URL('../.check/', import.meta.url), { recursive: true, force: true });
}
