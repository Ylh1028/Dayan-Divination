export type YaoBit = 0 | 1;
export type HexagramBits = [YaoBit, YaoBit, YaoBit, YaoBit, YaoBit, YaoBit];
export interface Hexagram {
  id: number; name: string; fullName: string; symbol: string; code: string;
  guaCi: string; yaoTexts: [string, string, string, string, string, string]; yongText: string | null;
}
