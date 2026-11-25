const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const { EventEmitter } = require('node:events');
async function scenario(portInUse) {
  const events = {}; const spawned = []; const opened = []; let window;
  const app = { isPackaged: true, setName() {}, disableHardwareAcceleration() {}, setPath() {}, quit() {}, whenReady: () => Promise.resolve(), on(name, fn) { events[name] = fn; } };
  class BrowserWindow {
    constructor(options) { this.options = options; this.handlers = {}; this.webContents = { on: (name, fn) => this.handlers[name] = fn, setWindowOpenHandler: fn => this.open = fn }; window = this; }
    loadFile(file) { this.file = file; }
  }
  const electron = { app, BrowserWindow, dialog: { showErrorBox() { throw Error('未预期启动错误'); } }, shell: { openExternal: async url => { opened.push(url); } } };
  const fakeFs = { mkdirSync() {}, appendFileSync() {}, existsSync: () => true, openSync: () => 1 };
  const net = { createConnection() { const socket = new EventEmitter(); socket.destroy = () => {}; socket.setTimeout = () => {}; queueMicrotask(() => socket.emit(portInUse ? 'connect' : 'error')); return socket; } };
  const spawn = (exe, args, options) => { const child = new EventEmitter(); child.pid = 1234; child.killed = false; child.kill = () => { child.killed = true; }; spawned.push({ exe, args, options, child }); return child; };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../desktop/main.cjs'), 'utf8'), {
    require(name) { return name === 'electron' ? electron : name === 'node:fs' ? fakeFs : name === 'node:net' ? net : name === 'node:child_process' ? { spawn } : require(name); },
    __dirname: path.join(__dirname, '../release-v2.2/win-unpacked/resources/app.asar/desktop'),
    process: { env: {}, execPath: path.join(__dirname, '../temp/independent/app.exe'), resourcesPath: path.join(__dirname, '../temp/independent/resources') },
    fetch: async () => ({ status: 200 }), console,
  });
  await new Promise(resolve => setTimeout(resolve, 20)); assert.ok(window);
  assert.equal(window.options.webPreferences.sandbox, true);
  assert.equal(window.open({ url: 'https://github.com/Ylh1028/Dayan-Divination' }).action, 'deny');
  assert.equal(window.open({ url: 'https://example.invalid' }).action, 'deny');
  await Promise.resolve(); assert.deepEqual(opened, ['https://github.com/Ylh1028/Dayan-Divination']);
  let blocked = false; window.handlers['will-navigate']({ preventDefault() { blocked = true; } }, 'https://example.invalid'); assert.ok(blocked);
  events['before-quit']();
  assert.equal(spawned.length, portInUse ? 0 : 1);
  if (!portInUse) {
    assert.equal(spawned[0].child.killed, true);
    assert.ok(spawned[0].exe.includes(path.join('independent', 'resources', 'tools', 'llama.cpp')));
    assert.equal(spawned[0].options.windowsHide, true);
  }
}
(async () => { await scenario(false); await scenario(true); console.log('PASS：桌面外链白名单、保留沙箱、资源相对路径、仅清理自有模型进程（模拟单元测试）'); })().catch(error => { console.error(error); process.exitCode = 1; });
