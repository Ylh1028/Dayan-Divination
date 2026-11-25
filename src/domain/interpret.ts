import type { Hexagram, YaoBit } from './hexagram';
import type { YaoResult } from './dayan';
import { findHexagram } from './hexagram-data';
export interface DivinationResult { original: Hexagram; changed: Hexagram | null; originalBits: YaoBit[]; changedBits: YaoBit[] | null; movingPositions: number[]; method: string; emphasis: string; references: Array<{ title: string; text: string; role?: string }>; }
export function interpret(lines: readonly YaoResult[]): DivinationResult {
  const originalBits = lines.map((line) => (line.isYang ? 1 : 0) as YaoBit);
  const changedBits = lines.map((line) => (line.isMoving ? (line.isYang ? 0 : 1) : line.isYang ? 1 : 0) as YaoBit);
  const original = findHexagram(originalBits); const movingPositions = lines.filter((line) => line.isMoving).map((line) => line.position);
  const changed = movingPositions.length ? findHexagram(changedBits) : null; const refs: DivinationResult['references'] = [];
  const originalText = (position: number) => ({ title: `本卦 · ${positionName(position)}`, text: original.yaoTexts[position - 1] });
  const changedText = (position: number) => ({ title: `之卦 · ${positionName(position)}`, text: (changed as Hexagram).yaoTexts[position - 1] });
  let method = ''; let emphasis = '';
  switch (movingPositions.length) {
    case 0: method = '六爻皆静，以本卦卦辞为占。'; refs.push({ title: '本卦卦辞', text: original.guaCi }); break;
    case 1: method = '一爻变，以本卦对应动爻的爻辞为占。'; refs.push(originalText(movingPositions[0])); break;
    case 2: method = '两爻变，占本卦两个动爻爻辞，以居上的一爻为主。'; emphasis = `以${positionName(Math.max(...movingPositions))}为主`; refs.push(...movingPositions.sort((a,b)=>a-b).map(originalText)); break;
    case 3: method = '三爻变，占本卦与之卦卦辞，以本卦为主、之卦为辅。'; emphasis = '本卦为主，之卦为辅'; refs.push({ title: '本卦卦辞 · 主', text: original.guaCi, role: '主' }, { title: '之卦卦辞 · 辅', text: (changed as Hexagram).guaCi, role: '辅' }); break;
    case 4: { const still = lines.filter((line) => !line.isMoving).map((line) => line.position).sort((a,b)=>a-b); method = '四爻变，占之卦两个不变爻的爻辞，以居下的一爻为主。'; emphasis = `以${positionName(still[0])}为主`; refs.push(...still.map(changedText)); break; }
    case 5: { const still = lines.find((line) => !line.isMoving); method = '五爻变，占之卦唯一不变爻的爻辞。'; refs.push(changedText((still as YaoResult).position)); break; }
    default: {
      if (original.code === '111111' && lines.every((line) => line.value === 9)) { method = '六爻皆变，纯老阳成乾，采用用九。'; refs.push({ title: '乾 · 用九', text: original.yongText ?? '数据未提供用九。' }); }
      else if (original.code === '000000' && lines.every((line) => line.value === 6)) { method = '六爻皆变，纯老阴成坤，采用用六。'; refs.push({ title: '坤 · 用六', text: original.yongText ?? '数据未提供用六。' }); }
      else { method = '六爻皆变（非纯老阳乾或纯老阴坤），采用之卦卦辞。'; refs.push({ title: '之卦卦辞', text: (changed as Hexagram).guaCi }); }
    }
  }
  return { original, changed, originalBits, changedBits: changed ? changedBits : null, movingPositions, method, emphasis, references: refs };
}
export function positionName(position: number): string { return ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'][position - 1]; }
export function yaoTitle(text: string): string { const match = text.match(/^(初|二|三|四|五|上)(九|六)/); return match ? `${match[1]}${match[2]}` : text.split(/[，。；：]/)[0]; }
