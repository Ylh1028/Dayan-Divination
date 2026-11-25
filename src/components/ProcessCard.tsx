import type { CSSProperties } from 'react';
import type { ChangeRecord, YaoResult } from '../domain/dayan';
import { positionName } from '../domain/interpret';

type Props = { line: YaoResult | null; activeChange: ChangeRecord | null; paused: boolean; phase: number; completed: boolean; animationMode: 'full' | 'skip'; started: boolean };
const labels = ['大衍用数', '分而为二', '挂一', '揲四', '归奇于扐', '完成一变'];
const stalkStyle = (index: number, count: number) => ({ '--stalk': index, '--offset': index - (count - 1) / 2 } as CSSProperties);

export function ProcessCard({ line, activeChange, paused, phase, completed, animationMode, started }: Props) {
  const shownChange = activeChange ?? line?.changes[2] ?? null;
  const participants = shownChange?.participants ?? 49;
  const left = shownChange?.left ?? 24;
  const originalRight = shownChange?.right ?? participants - left;
  const right = phase >= 2 ? originalRight - 1 : originalRight;
  const leftGroups = Math.floor(left / 4); const rightGroups = Math.floor(Math.max(0, originalRight - 1) / 4);
  const firstOperation = (shownChange?.number ?? 1) === 1;
  const showInitial = phase === 0 && firstOperation;
  const count = (value: number) => `${value} 策`;
  const status = paused ? '暂止' : shownChange ? `第 ${shownChange.number} 变 · ${labels[phase]}` : line ? `${positionName(line.position)} · 待演` : '大衍用数';
  return <section className={`process-card phase-${phase}${animationMode === 'skip' ? ' no-animation' : ''}${started ? ' started' : ''}`} aria-live="polite">
    <div className="process-topline"><span className="eyebrow">蓍草演算</span><span className="process-status"><i/>{status}</span></div>
    {showInitial ? <div className="initial-stalk-stage" aria-label="大衍之数五十，虚一不用，以四十九策行筮">
      <div className="stalk-bundle initial-bundle" aria-hidden="true">{Array.from({ length: 50 }, (_, index) => <i key={index} style={stalkStyle(index, 50)}/>)}</div>
      <div className="unused-one"><span/><small>虚一不用</small></div>
      <div className="initial-count"><strong>50</strong><span>虚一后用 49 策</span></div>
    </div> : <div className="stalk-stage" aria-label={`左侧${left}策，右侧${right}策`}>
      <div className="hand-count left-count"><small>左分</small><strong>{count(phase >= 5 ? shownChange?.remaining ?? left : left)}</strong></div>
      {phase >= 5 ? <div className="stalk-bundle remaining-bundle" aria-hidden="true">{Array.from({ length: shownChange?.remaining ?? participants }, (_, index) => <i key={index} style={stalkStyle(index, shownChange?.remaining ?? participants)}/>)}</div> : <div className={`stalk-bundle bundle-left${phase === 1 ? ' splitting' : ''}${phase === 3 ? ' counting' : ''}`} aria-hidden="true">{Array.from({ length: left }, (_, index) => <i key={index} style={stalkStyle(index, left)}/>)}</div>}
      <div className={`hung-one${phase >= 2 && phase < 5 ? ' visible' : ''}`}><span/><small>挂一</small></div>
      {phase >= 5 ? <div className="change-complete"><strong>{shownChange?.remaining}</strong><small>本变余策</small></div> : <div className={`stalk-bundle bundle-right${phase === 1 ? ' splitting' : ''}${phase === 2 ? ' hanging' : ''}${phase === 3 ? ' counting' : ''}`} aria-hidden="true">{Array.from({ length: Math.max(0, right) }, (_, index) => <i key={index} style={stalkStyle(index, Math.max(0, right))}/>)}</div>}
      <div className="hand-count right-count"><small>{phase >= 5 ? '本变' : '右分'}</small><strong>{phase >= 5 ? `去 ${shownChange?.removed ?? '—'} 策` : count(right)}</strong></div>
      {phase === 3 && <div className="grouping-layer" aria-hidden="true"><div>{Array.from({ length: leftGroups }, (_, index) => <i key={index} style={{ '--group': index } as CSSProperties}>四</i>)}</div><span>揲四计数</span><div>{Array.from({ length: rightGroups }, (_, index) => <i key={index} style={{ '--group': index } as CSSProperties}>四</i>)}</div></div>}
      {phase === 4 && <div className="remainder-tray" aria-label={`左扐${shownChange?.leftRemainder}策，右扐${shownChange?.rightRemainder}策，连同挂一共归奇${shownChange?.removed}策`}><div><small>左扐</small>{Array.from({ length: shownChange?.leftRemainder ?? 0 }, (_, index) => <i key={index}/>)}</div><span>归奇 {shownChange?.removed} 策</span><div><small>右扐</small>{Array.from({ length: shownChange?.rightRemainder ?? 0 }, (_, index) => <i key={index}/>)}</div></div>}
    </div>}
    <div className="process-metrics"><span>挂一 <b>{phase >= 2 ? shownChange?.hung ?? '—' : '—'}</b></span><span>左扐 <b>{phase >= 3 ? shownChange?.leftRemainder ?? '—' : '—'}</b></span><span>右扐 <b>{phase >= 3 ? shownChange?.rightRemainder ?? '—' : '—'}</b></span><span>归奇 <b>{phase >= 4 ? shownChange?.removed ?? '—' : '—'}</b></span><span>余策 <b>{phase >= 5 ? shownChange?.remaining ?? participants : '—'}</b></span></div>
    <div className="process-foot"><span>{showInitial ? '大衍之数五十，其用四十有九' : shownChange ? `${positionName(line?.position ?? 1)} · 第 ${shownChange.number} 变 · 参与 ${shownChange.participants} 策${phase >= 4 ? ` · 归奇 ${shownChange.removed} 策` : ''}` : '分而为二，挂一，揲四，归奇于扐'}</span>{line && (completed || activeChange?.number === 3 && phase >= 5) && <strong>{line.name} · {line.value}</strong>}</div>
  </section>;
}
