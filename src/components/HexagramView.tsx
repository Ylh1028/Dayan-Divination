import type { Hexagram, YaoBit } from '../domain/hexagram';
import type { YaoResult } from '../domain/dayan';
import { displayBits } from '../domain/hexagram-data';
import { positionName, yaoTitle } from '../domain/interpret';

export function HexagramView({ hexagram, bits, lines, title, compact = false }: { hexagram: Hexagram; bits: readonly YaoBit[]; lines?: readonly YaoResult[]; title: string; compact?: boolean }) {
  const display = displayBits(bits);
  return <article className={`hex-card${compact ? ' compact' : ''}`}>
    <div className="hex-card-head"><div><span className="eyebrow">{title}</span><h3>{hexagram.fullName}</h3><p className="hex-id">第 {String(hexagram.id).padStart(2, '0')} 卦 <span>{hexagram.symbol}</span></p></div><span className="trigram-mark" aria-hidden="true">{hexagram.symbol}</span></div>
    <div className="hex-layout"><div className="hex-diagram" role="img" aria-label={`${hexagram.fullName}卦象`}>
      {display.map((bit, displayIndex) => { const position = 6 - displayIndex; const line = lines?.[position - 1]; return <div className={`diagram-row${line?.isMoving ? ' moving' : ''}`} key={position}><span className="diagram-label">{line ? yaoTitle(hexagram.yaoTexts[position - 1]) : positionName(position)}</span><div className="yao-art">{bit ? <i className="solid-line" /> : <><i /><i /></>}</div>{line?.isMoving && <span className="moving-dot">动</span>}</div>; })}
    </div><div className="gua-text"><span className="text-label">卦辞</span><p>{hexagram.guaCi}</p></div></div>
    {!compact && <details className="yao-list"><summary>展开六爻爻辞</summary><div className="yao-entries">{hexagram.yaoTexts.map((text, index) => { const line = lines?.[index]; return <div className={`yao-entry${line?.isMoving ? ' entry-moving' : ''}`} key={index}><div className="yao-entry-title">{yaoTitle(text)}{line?.isMoving && <small>动爻</small>}</div><p>{text}</p></div>; })}</div></details>}
  </article>;
}
