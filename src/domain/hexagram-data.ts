import raw from '../data/hexagrams.json';
import type { Hexagram, HexagramBits, YaoBit } from './hexagram';

export const hexagrams = raw as Hexagram[];
export const hexagramByCode = new Map<string, Hexagram>(hexagrams.map((gua) => [gua.code, gua]));

export function codeToBits(code: string): HexagramBits {
  if (!/^[01]{6}$/.test(code)) throw new Error(`无效的六位卦码：${code}`);
  return [...code].map((bit) => Number(bit) as YaoBit) as HexagramBits;
}
export function bitsToCode(bits: readonly YaoBit[]): string {
  if (bits.length !== 6) throw new Error('六爻必须按初爻至上爻排列。');
  return bits.join('');
}
export function findHexagram(bits: readonly YaoBit[]): Hexagram {
  const gua = hexagramByCode.get(bitsToCode(bits));
  if (!gua) throw new Error(`六十四卦数据中不存在卦码 ${bitsToCode(bits)}`);
  return gua;
}
export function getChangingBits(values: readonly number[]): HexagramBits {
  return values.map((value) => (value === 7 || value === 9 ? 1 : 0)) as HexagramBits;
}
export function getChangedBits(values: readonly number[]): HexagramBits {
  return values.map((value) => (value === 6 || value === 7 ? 1 : 0)) as HexagramBits;
}
export function displayBits(bits: readonly YaoBit[]): YaoBit[] { return [...bits].reverse(); }
