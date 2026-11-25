export type YaoName = '老阴' | '少阳' | '少阴' | '老阳';
export interface ChangeRecord {
  number: number; participants: number; left: number; right: number; hung: number;
  leftRemainder: number; rightRemainder: number; removed: number; remaining: number;
}
export interface YaoResult {
  position: number; value: 6 | 7 | 8 | 9; name: YaoName; isYang: boolean; isMoving: boolean;
  changes: [ChangeRecord, ChangeRecord, ChangeRecord]; totalRemoved: number; remaining: number;
}
export function secureInt(min: number, max: number): number {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.getRandomValues) throw new Error('当前浏览器不支持安全随机数，无法开始起卦。');
  const span = max - min + 1;
  const ceiling = Math.floor(0x1_0000_0000 / span) * span;
  const sample = new Uint32Array(1);
  do { cryptoApi.getRandomValues(sample); } while (sample[0] >= ceiling);
  return min + (sample[0] % span);
}
function remainderInFour(value: number): number { const remainder = value % 4; return remainder === 0 ? 4 : remainder; }
export function performChange(participants: number, number: number): ChangeRecord {
  const left = secureInt(participants === 49 && number === 1 ? 2 : 1, participants - 2);
  const right = participants - left;
  const hung = 1;
  const leftRemainder = remainderInFour(left);
  const rightRemainder = remainderInFour(right - hung);
  const removed = hung + leftRemainder + rightRemainder;
  const remaining = participants - removed;
  const allowed = number === 1 ? [5, 9] : [4, 8];
  if (!allowed.includes(removed) || remaining <= 0 || remaining % 4 !== 0) throw new Error('分蓍计算结果超出筮法范围。');
  return { number, participants, left, right, hung, leftRemainder, rightRemainder, removed, remaining };
}
const names: Record<number, YaoName> = { 6: '老阴', 7: '少阳', 8: '少阴', 9: '老阳' };
export function castYao(position: number): YaoResult {
  let participants = 49;
  const changes = [1, 2, 3].map((n) => {
    const result = performChange(participants, n);
    participants = result.remaining;
    return result;
  }) as [ChangeRecord, ChangeRecord, ChangeRecord];
  const totalRemoved = changes.reduce((sum, change) => sum + change.removed, 0);
  const value = (participants / 4) as 6 | 7 | 8 | 9;
  if (![6, 7, 8, 9].includes(value)) throw new Error('三变后所得爻数无效。');
  return { position, value, name: names[value], isYang: value === 7 || value === 9, isMoving: value === 6 || value === 9, changes, totalRemoved, remaining: participants };
}
export function castHexagram(): YaoResult[] { return Array.from({ length: 6 }, (_, index) => castYao(index + 1)); }
