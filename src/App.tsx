import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeRecord, YaoResult } from './domain/dayan';
import { castYao } from './domain/dayan';
import { interpret, positionName, type DivinationResult } from './domain/interpret';
import { AiRequestError, buildAiInput, requestAiReading, type AiReading } from './domain/ai';
import { exportHistory, loadHistory, makeRecord, removeRecord, saveRecord, type HistoryRecord } from './domain/history';
import { APP_VERSION } from './domain/versions';
import { HexagramView } from './components/HexagramView';
import { ProcessCard } from './components/ProcessCard';

type AnimationMode = 'full' | 'skip';
type OperationPhase = 0 | 1 | 2 | 3 | 4 | 5;
const wait = (ms: number) => new Promise<void>((resolve) => globalThis.setTimeout(resolve, ms));
const phaseNames = ['大衍用数', '分而为二', '挂一', '揲四', '归奇于扐', '完成一变'];
const visibleAiText = (value: string) => value
  .replace(/[（(]\s*卦码\s*[01]{6}\s*[）)]/g, '')
  .replace(/卦码\s*[01]{6}/g, '')
  .replace(/\b(?:gua|selected|rule):[^\s，。；、]+/gi, '')
  .replace(/\s{2,}/g, ' ')
  .trim();
const phaseDescriptions = [
  '大衍之数五十，先虚一不用，以四十九策行筮。',
  '将当前蓍草分为左右两组，以象两仪。',
  '从右组取出一策，悬置于旁，以象三才。',
  '左右分别以四策为一组，依次计数，以象四时。',
  '将挂一与左右余策移至扐区，记录本变所去之策。',
  '合并余策，核对本变结果，准备下一变。',
];

function App() {
  const [lines, setLines] = useState<YaoResult[]>([]);
  const [initialLine, setInitialLine] = useState<YaoResult>(() => castYao(1));
  const [activeChange, setActiveChange] = useState<ChangeRecord | null>(null);
  const [activeLine, setActiveLine] = useState<YaoResult | null>(null);
  const [phase, setPhase] = useState<OperationPhase>(0);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [details, setDetails] = useState<number | null>(null);
  const [mode, setMode] = useState<'auto' | 'manual'>('auto');
  const [animationMode, setAnimationMode] = useState<AnimationMode>('full');
  const [questionOpen, setQuestionOpen] = useState(false);
  const [questionDraft, setQuestionDraft] = useState('');
  const [question, setQuestion] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [ai, setAi] = useState<AiReading | null>(null);
  const [aiStatus, setAiStatus] = useState<HistoryRecord['aiStatus']>('未请求');
  const [aiError, setAiError] = useState('');
  const [history, setHistory] = useState<HistoryRecord[]>(() => loadHistory());
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyQuery, setHistoryQuery] = useState('');
  const cancelled = useRef(false);
  const pausedRef = useRef(false);
  const animationRef = useRef<AnimationMode>('full');
  const lock = useRef(false);
  const runId = useRef(0);
  const manualActionId = useRef(0);
  const manualSkipPending = useRef(false);
  const aiAttempt = useRef(0);
  const aiController = useRef<AbortController | null>(null);
  const restoring = useRef(false);
  pausedRef.current = paused;
  animationRef.current = animationMode;

  const result = useMemo(() => lines.length === 6 ? interpret(lines) : null, [lines]);
  const progress = lines.length === 6 ? 18 : lines.length * 3 + (activeChange?.number ?? 0);
  const filteredHistory = history.filter((item) => `${item.createdAt.slice(0, 10)} ${item.question} ${item.result.original.fullName} ${item.result.changed?.fullName ?? ''}`.toLowerCase().includes(historyQuery.trim().toLowerCase()));
  const manualAction = getManualAction(activeChange, phase, lines.length);

  useEffect(() => {
    if (!result || !sessionId) return;
    if (restoring.current) { restoring.current = false; return; }
    const status: HistoryRecord['aiStatus'] = question ? '生成中' : '未请求';
    setHistory(saveRecord(makeRecord(sessionId, question, mode, lines, result, null, status)));
    if (!question) { setAiStatus('未请求'); return; }
    void generateAi(result, sessionId, question, lines, mode);
  }, [result, sessionId]);

  useEffect(() => {
    if (!result) return;
    const timer = globalThis.setTimeout(() => document.getElementById('result')?.scrollIntoView({ behavior: animationRef.current === 'full' ? 'smooth' : 'auto', block: 'start' }), 120);
    return () => globalThis.clearTimeout(timer);
  }, [result]);

  async function generateAi(reading: DivinationResult, id: string, asked: string, currentLines: YaoResult[], currentMode: 'auto' | 'manual') {
    aiController.current?.abort();
    const controller = new AbortController(); const attempt = ++aiAttempt.current;
    aiController.current = controller; setAiStatus('生成中'); setAiError(''); setAi(null);
    try {
      const generated = await requestAiReading(buildAiInput(id, asked, currentLines, reading), controller.signal);
      if (controller.signal.aborted || attempt !== aiAttempt.current) return;
      setAi(generated); setAiStatus('已完成');
      setHistory(saveRecord(makeRecord(id, asked, currentMode, currentLines, reading, generated, '已完成')));
    } catch (error) {
      if (attempt !== aiAttempt.current) return;
      const cancelledRequest = controller.signal.aborted || error instanceof AiRequestError && error.code === 'cancelled';
      const status: HistoryRecord['aiStatus'] = cancelledRequest ? '已取消' : '失败';
      const message = error instanceof AiRequestError ? error.userMessage : '本地 AI 发生未知异常，可重新生成。';
      console.error(`[AI] ${error instanceof AiRequestError ? error.code : 'unknown'}:`, error);
      setAiStatus(status); setAiError(message);
      setHistory(saveRecord(makeRecord(id, asked, currentMode, currentLines, reading, null, status)));
    }
  }

  async function waitWhilePaused(thisRun: number) { while (pausedRef.current && !cancelled.current && runId.current === thisRun) await wait(80); }
  async function waitForAnimation(ms: number, thisRun: number) {
    let elapsed = 0;
    while (elapsed < ms && !cancelled.current && runId.current === thisRun && animationRef.current === 'full') {
      await waitWhilePaused(thisRun); const slice = Math.min(40, ms - elapsed); await wait(slice); elapsed += slice;
    }
  }
  function clearRound() {
    manualActionId.current += 1; manualSkipPending.current = false;
    cancelled.current = true; runId.current += 1; aiAttempt.current += 1; aiController.current?.abort();
    pausedRef.current = false; lock.current = false; setPaused(false); setRunning(false); setLines([]); setInitialLine(castYao(1));
    setActiveLine(null); setActiveChange(null); setPhase(0); setDetails(null); setAi(null); setAiStatus('未请求'); setAiError(''); setQuestion(''); setSessionId('');
  }
  function requestNewRound() {
    clearRound(); setQuestionDraft('');
    globalThis.setTimeout(() => document.querySelector('.cast-toolbar')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80);
  }
  function begin(value: string) {
    const id = globalThis.crypto.randomUUID(); cancelled.current = false; setQuestion(value.trim()); setSessionId(id); setQuestionOpen(false); setLines([]); setDetails(null); setAi(null); setAiError('');
    if (mode === 'auto') void runAuto(initialLine);
    else if (animationRef.current === 'skip') {
      const completed = [initialLine];
      for (let position = 2; position <= 6; position += 1) completed.push(castYao(position));
      setLines(completed); setRunning(false); setActiveLine(null); setActiveChange(null); setPhase(0);
    } else { setRunning(true); setActiveLine(initialLine); setActiveChange(null); setPhase(0); }
  }
  async function runAuto(firstLine: YaoResult) {
    if (lock.current) return; lock.current = true; const thisRun = ++runId.current; setRunning(true); setPaused(false);
    try {
      for (let position = 1; position <= 6; position += 1) {
        if (cancelled.current || runId.current !== thisRun) return;
        const line = position === 1 ? firstLine : castYao(position); setActiveLine(line);
        for (const change of line.changes) {
          if (cancelled.current || runId.current !== thisRun) return;
          setActiveChange(change);
          for (let nextPhase = 0; nextPhase <= 5; nextPhase += 1) {
            if (cancelled.current || runId.current !== thisRun) return; setPhase(nextPhase as OperationPhase);
            await waitForAnimation(nextPhase === 3 ? 720 : nextPhase === 0 && change.number === 1 ? 540 : 420, thisRun);
          }
        }
        if (cancelled.current || runId.current !== thisRun) return;
        setLines((current) => [...current, line]); setActiveChange(null); setPhase(0); await waitForAnimation(360, thisRun);
      }
    } finally {
      if (runId.current === thisRun) { setRunning(false); setPaused(false); setActiveLine(null); lock.current = false; }
    }
  }
  function manualNext() {
    if (!running || mode !== 'manual' || !activeLine || lock.current) return;
    lock.current = true;
    const action = ++manualActionId.current;
    try {
      if (!activeChange) {
        manualSkipPending.current = false;
        setActiveChange(activeLine.changes[0]); setPhase(lines.length ? 0 : 1);
      } else if (phase < 5) {
        setPhase((phase + 1) as OperationPhase);
      } else if (activeChange.number < 3) {
        setActiveChange(activeLine.changes[activeChange.number]); setPhase(0);
      } else {
        const finished = activeLine; const nextPosition = finished.position + 1;
        setLines((current) => [...current, finished]); setActiveChange(null); setPhase(0);
        if (nextPosition <= 6) setActiveLine(castYao(nextPosition)); else { setActiveLine(null); setRunning(false); }
      }
    } finally { globalThis.setTimeout(() => { if (manualActionId.current === action) lock.current = false; }, animationRef.current === 'full' ? 520 : 70); }
  }
  function skipManualAnimation() {
    if (mode !== 'manual' || !running || !activeLine || !activeChange || manualSkipPending.current) return;
    manualSkipPending.current = true; lock.current = true;
    const action = ++manualActionId.current;
    // 当前爻的三变已由 castYao 计算完毕，直接复用，避免重新随机或重复提交。
    const finished = activeLine; const nextPosition = finished.position + 1;
    setLines((current) => [...current, finished]); setActiveChange(null); setPhase(0);
    if (nextPosition <= 6) setActiveLine(castYao(nextPosition));
    else { setActiveLine(null); setRunning(false); }
    globalThis.setTimeout(() => { if (manualActionId.current === action) lock.current = false; }, 520);
  }
  function skipAnimation() {
    animationRef.current = 'skip'; setAnimationMode('skip'); pausedRef.current = false; setPaused(false);
    if (mode === 'manual' && running && activeLine) {
      const completed = [...lines, activeLine];
      for (let position = activeLine.position + 1; position <= 6; position += 1) completed.push(castYao(position));
      lock.current = false; setLines(completed); setActiveLine(null); setActiveChange(null); setPhase(0); setRunning(false);
    }
  }
  function restoreHistory(item: HistoryRecord) { clearRound(); restoring.current = true; setMode(item.mode); setQuestion(item.question); setSessionId(item.id); setLines(item.lines); setAi(item.ai); setAiStatus(item.aiStatus); setHistoryOpen(false); }
  function deleteHistory(id: string) { if (globalThis.confirm('确定删除这条历史记录吗？删除后无法恢复。')) setHistory(removeRecord(id)); }

  return <main className="page-shell">
    <header className="hero"><div className="hero-ornament" aria-hidden="true"><span>大</span><i/><span>衍</span></div><div className="hero-copy"><div className="top-kicker"><span/>立天之道曰阴与阳，立地之道曰柔与刚，立人之道曰仁与义<span/></div><h1>大衍筮法</h1><p className="hero-subtitle">大衍之数五十，其用四十有九。</p></div><div className="hero-aside"><span className="seal">筮</span><span className="aside-label">周易古法<br/>蓍策占筮</span></div><div className="hero-rule"/></header>
    <nav className="utility-nav"><button onClick={() => setHistoryOpen(!historyOpen)}>历史卦象（{history.length}）</button><span>离线版 V{APP_VERSION}</span></nav>
    {historyOpen && <section className="history-panel"><div className="history-head"><div><span className="eyebrow">本地保存</span><h2>历史卦象</h2></div><div className="history-tools"><input value={historyQuery} onChange={(event) => setHistoryQuery(event.target.value)} placeholder="按日期、卦名或问题查询"/><button onClick={() => exportHistory(history)} disabled={!history.length}>导出 JSON</button></div></div>{filteredHistory.length ? <div className="history-list">{filteredHistory.map((item) => <article key={item.id}><button className="history-main" onClick={() => restoreHistory(item)}><time>{new Date(item.createdAt).toLocaleString('zh-CN')}</time><strong>{item.result.original.fullName}{item.result.changed ? ` → ${item.result.changed.fullName}` : ''}</strong><span>{item.question || '未填写问题'} · {item.mode === 'auto' ? '自动演算' : '手动演算'} · AI {item.aiStatus}</span></button><button className="history-delete" onClick={() => deleteHistory(item.id)}>删除</button></article>)}</div> : <p className="empty-copy">没有符合条件的历史记录。</p>}</section>}
    <section className="main-grid"><div className="casting-column"><div className="section-heading"><div><span className="eyebrow">揲著</span><h2>极数知来</h2></div></div>
      <div className="cast-toolbar"><div className="progress-copy"><strong>{running ? `当前：${positionName(Math.min(lines.length + 1, 6))}${activeChange ? ` · 第${activeChange.number}变 · ${phaseNames[phase]}` : ''}` : result ? '六爻已成' : '以四十九策，演三变而成一爻'}</strong><span>进度：第 {progress} / 18 变 <i/> 已成 {lines.length} / 6 爻</span></div><div className="actions">{!running && !result && <button className="button primary" onClick={() => setQuestionOpen(true)}>✦ 开始取卦</button>}{running && mode === 'auto' && animationMode === 'full' && <button className="button pause" onClick={() => setPaused(!paused)}>{paused ? '继续' : '暂停'}</button>}{running && mode === 'manual' && <button className="button primary manual-action" onClick={manualNext}>{manualAction.label}</button>}{running && mode === 'auto' && animationMode === 'full' && <button className="button skip" onClick={skipAnimation}>直接成卦</button>}{running && mode === 'manual' && animationMode === 'full' && <button className="button skip" onClick={skipManualAnimation} disabled={!activeChange}>跳过动画</button>}</div></div>
      <div className="round-controls"><button className="button reset" onClick={requestNewRound}>重新取卦</button></div><div className="mode-control"><span>演算方式</span><button className={mode === 'auto' ? 'selected' : ''} onClick={() => setMode('auto')} disabled={running || !!result}>自动演算</button><button className={mode === 'manual' ? 'selected' : ''} onClick={() => setMode('manual')} disabled={running || !!result}>手动演算</button><small>{mode === 'auto' ? '系统依序完成十八变' : '由你依传统术语逐步完成'}</small></div>
      <div className="mode-control animation-control"><span>展示方式</span><button className={animationMode === 'full' ? 'selected' : ''} onClick={() => setAnimationMode('full')} disabled={running || !!result}>完整动画</button><button className={animationMode === 'skip' ? 'selected' : ''} onClick={() => setAnimationMode('skip')} disabled={running || !!result}>直接成卦</button><small>一键完成余下演算，不改变起卦数据</small></div>
      {running && mode === 'manual' && <div className="manual-guide"><span>当前步骤</span><strong>{activeChange ? phaseNames[phase] : lines.length ? '进入下一爻' : '分而为二'}</strong><p>{manualAction.description}</p><small>当前为{positionName(Math.min(lines.length + 1, 6))}{activeChange ? ` · 第 ${activeChange.number} 变` : ''}</small></div>}
      <ProcessCard line={activeLine ?? lines[lines.length - 1] ?? initialLine} activeChange={activeChange ?? (!running && !result ? initialLine.changes[0] : null)} paused={paused} phase={running ? phase : !result ? 0 : 5} completed={!activeLine && lines.length > 0} animationMode={animationMode} started={running || !!result}/>
      <div className="live-reading"><div className="reading-head"><span className="eyebrow">六爻 · 自下而上</span><span>{lines.length ? `${lines.length} / 6` : '待成'}</span></div><div className="live-lines">{Array.from({ length: 6 }, (_, displayIndex) => { const index = 5 - displayIndex; const line = lines[index]; return <div className={`live-line${line ? ' revealed' : ''}${line?.isMoving ? ' moving' : ''}`} key={index}><span className="line-position">{positionName(index + 1)}</span><div className="yao-art">{line?.isYang ? <i className="solid-line"/> : line ? <><i/><i/></> : <span className="line-placeholder"/>}</div><span className={`line-info${line?.isMoving ? ' cinnabar' : ''}`}>{line ? `${line.name} · ${line.value} · ${line.isMoving ? '动爻' : '静爻'}` : '等待成爻'}</span>{line && <button className="detail-trigger" onClick={() => setDetails(details === index ? null : index)}>{details === index ? '收起' : '三变'}⌄</button>}</div>; })}</div></div>
      {details !== null && lines[details] && <div className="change-details"><div className="details-title">{positionName(details + 1)} · {lines[details].name} · 三次一挂二扐记录</div><div className="change-table-wrap"><table><thead><tr><th>变化</th><th>参与</th><th>左 / 右分策</th><th>挂一</th><th>左扐 / 右扐</th><th>归奇</th><th>余策</th></tr></thead><tbody>{lines[details].changes.map((change) => <tr key={change.number}><td>第 {change.number} 变</td><td>{change.participants}</td><td>{change.left} / {change.right}</td><td>{change.hung}</td><td>{change.leftRemainder} / {change.rightRemainder}</td><td>{change.removed}</td><td>{change.remaining}</td></tr>)}</tbody></table></div><p>三变共取 {lines[details].totalRemoved} 策，最终余 {lines[details].remaining} 策；除四得 {lines[details].value}，判为 {lines[details].name}。</p></div>}
    </div><aside className="knowledge-card"><div className="knowledge-top"><span className="eyebrow">筮仪小识</span><span className="knowledge-mark">策</span></div><h2>大衍筮法</h2><p className="knowledge-intro">四营而成易，十有八变而成卦</p><div className="ritual-list">{[['01','虚一','取五十策之一置而不用，余四十九策行筮。'],['02','分二','随机分为左右两部，以象两仪。'],['03','挂一','从右部取一策，象征三才之人。'],['04','揲四','左右各以四策为一组，象征四时。'],['05','归奇','将挂一与两侧余策归置，完成一变。'],['06','四营而成易','分二、挂一、揲四、归奇，合为四营。'],['07','三变成一爻','每爻依次完成三变，得到六、七、八、九。'],['08','十有八变而成卦','自初爻至上爻，共六爻十八变。']].map(([number,title,body]) => <div className="ritual-step" key={number}><span className="step-number">{number}</span><div><h3>{title}</h3><p>{body}</p></div></div>)}</div><div className="knowledge-note"><span>☯</span><p>七、九为阳；六、八为阴。九、六为动，七、八为静。</p></div><div className="card-colophon">《周易·系辞上传》《周易本义·筮仪》</div></aside></section>
    {running && <div className="progress-track"><span style={{ width: `${progress / 18 * 100}%` }}/></div>}
    {result && <section id="result" className="result-section"><div className="result-heading"><div><span className="eyebrow">分阴分阳，迭用柔刚，故易六位而成章</span><h2>本卦与之卦</h2>{question && <p className="recorded-question">所问：{question}</p>}</div><div className="moving-summary"><strong>{result.movingPositions.length}</strong><span>动爻</span><small>{result.movingPositions.length ? result.movingPositions.map(positionName).join(' · ') : '六爻皆静'}</small></div></div><div className={`result-pair${result.changed ? '' : ' single-result'}`}><HexagramView hexagram={result.original} bits={result.originalBits} lines={lines} title="本卦 · 所得之象"/>{result.changed && <><div className="transform-mark"><span>变</span><i>→</i></div><HexagramView hexagram={result.changed} bits={result.changedBits as (0 | 1)[]} title="之卦 · 变后之象"/></>}</div>
      <div className="judgment-card"><div className="judgment-heading"><span className="judgment-symbol">占</span><div><span className="eyebrow">占断依据</span><h3>《易学启蒙》占法</h3></div></div><p className="judgment-rule">{result.method}</p>{result.emphasis && <p className="judgment-emphasis">{result.emphasis}</p>}<div className="reference-list">{result.references.map((reference, index) => <div className="reference-item" key={index}><div className="reference-title">{reference.title}</div><p>{reference.text}</p></div>)}</div></div>
      {question && <section className="ai-card"><div className="ai-head"><div><h3>AI 解卦</h3></div><span className="ai-state">{aiStatus}</span></div>{aiStatus === '生成中' && <div className="ai-loading">正在检查本地模型并生成解读…… <button onClick={() => aiController.current?.abort()}>取消</button></div>}{aiError && <div className="ai-error"><p>{aiError} 传统卦象与取辞结果不受影响。</p>{(aiStatus === '失败' || aiStatus === '已取消') && <button className="button reset" onClick={() => void generateAi(result, sessionId, question, lines, mode)}>重新生成</button>}</div>}{ai && <div className="ai-report">{[['一、卦象概览',ai.originalAnalysis],['二、传统卦义分析',ai.movingAnalysis],['三、变化与发展',ai.changedAnalysis],['四、结合所问之事',ai.questionAnalysis],['五、综合解读',ai.summary]].filter(([,body]) => body).map(([title,body]) => <section key={title}><h4>{title}</h4><p>{visibleAiText(body)}</p></section>)}</div>}</section>}<div className="result-actions"><span>本次演算与取辞结果已保存到本地历史。</span><button className="button primary" onClick={requestNewRound}>重新取卦 ↺</button></div></section>}
    <footer className="site-footer">
      <img className="author-avatar" src="./profile-avatar.jpg" alt="作者寒肄头像" />
      <strong className="author-name">寒肄</strong>
      <p>大衍筮法 v{APP_VERSION}</p>
      <p className="copyright">© 2026 寒肄｜版权所有，保留所有未明确授予的权利。<br/>本项目源码公开，仅限非商业用途。<br/>转载、修改及二次发布须保留作者署名、注明原始出处，并继续遵守非商业使用限制。</p>
      <p className="project-link">GitHub 项目地址：<a href="https://github.com/Ylh1028/Dayan-Divination" target="_blank" rel="noopener noreferrer">https://github.com/Ylh1028/Dayan-Divination</a></p>
      <p className="author-contacts"><span>QQ：2819488370</span><span>微信：Wlx04797</span><span>邮箱：2819488370@qq.com</span></p>
      <p className="custom-note">如需定制可联系</p>
    </footer>
    {questionOpen && <div className="modal-backdrop" role="dialog" aria-modal="true"><div className="question-dialog"><span className="eyebrow">新一轮起卦</span><h2>心有所问，可先录之</h2><p>亦可不问，直接起卦。问题只保存在本机；不填写时不会调用本地 AI。</p><textarea autoFocus maxLength={1000} value={questionDraft} onChange={(event) => setQuestionDraft(event.target.value)} placeholder="心有所问，尽可写于此……"/><div className="dialog-actions"><button className="button reset" onClick={() => setQuestionOpen(false)}>取消</button><button className="button reset" onClick={() => begin('')}>直接起卦</button><button className="button primary" onClick={() => begin(questionDraft)} disabled={!questionDraft.trim()}>带着问题起卦</button></div></div></div>}
  </main>;
}

function getManualAction(change: ChangeRecord | null, phase: OperationPhase, completedLines: number) {
  if (!change) return completedLines ? { label: '进入下一爻', description: '上一爻已经形成。进入下一爻后，再从分而为二开始三变。' } : { label: '分而为二', description: phaseDescriptions[1] };
  if (phase === 0) return { label: '分而为二', description: phaseDescriptions[1] };
  if (phase === 1) return { label: '挂一', description: phaseDescriptions[2] };
  if (phase === 2) return { label: '揲四', description: phaseDescriptions[3] };
  if (phase === 3) return { label: '归奇于扐', description: phaseDescriptions[4] };
  if (phase === 4) return { label: '完成一变', description: phaseDescriptions[5] };
  return change.number < 3 ? { label: '进入下一变', description: '本变已经核对完成，保留余策并进入下一变。' } : { label: '成爻', description: '三变已经完成，合计余策并确定本爻的阴阳与动静。' };
}

export default App;
