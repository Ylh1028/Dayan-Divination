const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { app, BrowserWindow, session } = require('electron');
const root = path.join(__dirname, '..');
app.setPath('userData', path.join(root, 'temp', 'v22-ui-profile'));
app.disableHardwareAcceleration();
if (process.env.DAYAN_TEST_NO_SANDBOX === '1') app.commandLine.appendSwitch('no-sandbox');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const checks = []; let window;
const evaluate = script => window.webContents.executeJavaScript(script, true);
async function waitFor(script, timeout = 6000) {
  const start = Date.now();
  while (Date.now() - start < timeout) { if (await evaluate(script)) return; await sleep(30); }
  throw new Error(`等待超时：${script}`);
}
async function click(label) {
  const clicked = await evaluate(`(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(label)});if(!b||b.disabled)return false;b.click();return true})()`);
  assert.equal(clicked, true, `按钮不可用：${label}`); await sleep(35);
}
const count = () => evaluate("document.querySelectorAll('.live-line.revealed').length");
const mark = name => { checks.push({ name, result: 'PASS' }); console.log(`PASS：${name}`); };
async function begin(mode, display = '完整动画') {
  await click('重新取卦'); await click(mode); await click(display); await click('✦ 开始取卦'); await click('直接起卦');
}
async function advance() {
  await sleep(540); const label = await evaluate("document.querySelector('.manual-action').textContent.trim()"); await click(label);
}
const recordLines = () => evaluate("(()=>{for(let i=0;i<localStorage.length;i++){try{const a=JSON.parse(localStorage.getItem(localStorage.key(i)));if(Array.isArray(a)&&a[0]?.lines)return a[0].lines}catch{}}return null})()");
app.whenReady().then(async () => {
  try {
    session.defaultSession.webRequest.onBeforeRequest({ urls: ['http://*/*', 'https://*/*'] }, (details, callback) => callback({ cancel: new URL(details.url).hostname !== '127.0.0.1' }));
    window = new BrowserWindow({ show: false, width: 1180, height: 900, webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true } });
    await window.loadFile(path.join(root, 'dist', 'index.html'));
    await evaluate("localStorage.clear(); crypto.getRandomValues=(array)=>{array.fill(0);return array}; true");
    await begin('自动演算', '直接成卦'); await waitFor("!!document.querySelector('#result')");
    assert.equal(await count(), 6); const direct = await recordLines(); assert.equal(direct.length, 6);
    mark('直接成卦生成六爻及本卦之卦');
    assert.equal(await evaluate("document.querySelector('.project-link a').href"), 'https://github.com/Ylh1028/Dayan-Divination');
    assert.equal(await evaluate("document.querySelector('.author-avatar').naturalWidth>0"), true);
    assert.equal(await evaluate("document.querySelector('.site-footer').innerText.includes('仅限非商业用途')"), true);
    assert.equal(await evaluate("document.title"), '大衍筮法v2.2'); mark('v2.2、版权、头像及项目链接');
    await click('重新取卦 ↺'); assert.equal(await count(), 0); await begin('手动演算');
    assert.equal(await evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent==='跳过动画').disabled"), true);
    await advance();
    await evaluate("(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent==='跳过动画');for(let i=0;i<10;i++)b.click()})()");
    await sleep(100); assert.equal(await count(), 1); assert.equal(await evaluate("!!document.querySelector('#result')"), false);
    await sleep(650); assert.equal(await count(), 1); mark('第一爻跳过、连续点击只提交一爻、等待不自动成爻');
    await advance(); await click('跳过动画'); await sleep(550); assert.equal(await count(), 2);
    while (await count() === 2) await advance();
    assert.equal(await count(), 3); mark('正常手动三变与跳过交替');
    for (let n = 4; n <= 6; n++) { await advance(); await click('跳过动画'); await sleep(550); assert.equal(await count(), n); }
    await waitFor("!!document.querySelector('#result')"); assert.deepEqual(await recordLines(), direct);
    mark('中间爻、第六爻及固定随机输入与直接成卦一致');
    await begin('手动演算');
    while (await evaluate("document.querySelector('.manual-action').textContent.trim()") !== '成爻') await advance();
    await click('跳过动画'); assert.equal(await count(), 1); await sleep(600); assert.equal(await count(), 1); mark('第三变末尾跳过不会重复成爻');
    await begin('自动演算'); await sleep(100);
    assert.equal(await evaluate("[...document.querySelectorAll('button')].some(b=>b.textContent==='跳过动画')"), false);
    await click('暂停'); await sleep(100); await click('重新取卦');
    await click('✦ 开始取卦'); await click('直接起卦'); await sleep(700); assert.equal(await count(), 0);
    await click('直接成卦'); await waitFor("!!document.querySelector('#result')"); assert.equal(await count(), 6);
    mark('自动模式直接成卦及暂停后重取无旧回调污染');
    await begin('自动演算'); await waitFor("!!document.querySelector('#result')", 75000);
    assert.deepEqual(await recordLines(), direct); mark('完整自动动画与固定随机直接成卦结果一致');
    await begin('手动演算'); await advance(); await click('重新取卦'); await sleep(700); assert.equal(await count(), 0); mark('手动操作锁定期间重取后状态清空');
    for (const width of [1180, 820, 390]) {
      window.setContentSize(width, 900); await sleep(100); await begin('手动演算');
      assert.equal(await evaluate("document.documentElement.scrollWidth<=innerWidth"), true, `横向溢出：${width}`);
      const overlaps = await evaluate("(()=>{const b=[...document.querySelectorAll('.cast-toolbar button,.round-controls button,.mode-control button')].filter(b=>b.getBoundingClientRect().width);return b.some((a,i)=>b.slice(i+1).some(c=>{const x=a.getBoundingClientRect(),y=c.getBoundingClientRect();return Math.min(x.right,y.right)>Math.max(x.left,y.left)&&Math.min(x.bottom,y.bottom)>Math.max(x.top,y.top)}))})()");
      assert.equal(overlaps, false, `按钮重叠：${width}`);
      fs.writeFileSync(path.join(root, 'temp', `v22-ui-${width}.png`), (await window.webContents.capturePage()).toPNG());
    }
    mark('1180、820、390 宽度无横向溢出及操作按钮重叠');
    window.setContentSize(1180, 900); await click('重新取卦'); await click('直接成卦'); await click('✦ 开始取卦');
    await evaluate("(()=>{const e=document.querySelector('textarea');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(e,'学习计划中应该先巩固基础还是开始新项目？');e.dispatchEvent(new Event('input',{bubbles:true}))})()");
    await sleep(60); await click('带着问题起卦'); await waitFor("document.querySelector('.ai-state')?.textContent==='已完成'", 180000);
    assert.match(await evaluate("document.querySelector('.ai-report').innerText"), /基础|项目/); mark('禁止外部网页请求时真实 Qwen 解卦');
  } catch (error) { checks.push({ name: error.stack, result: 'FAIL' }); console.error(error); process.exitCode = 1; }
  finally { fs.writeFileSync(path.join(root, 'logs', 'v22-ui-results.json'), JSON.stringify(checks, null, 2)); window?.destroy(); app.exit(process.exitCode || 0); }
});
