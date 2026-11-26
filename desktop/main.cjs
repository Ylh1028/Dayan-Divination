const { app, BrowserWindow, dialog, shell } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { spawn } = require('node:child_process');
const net = require('node:net');

app.setName('大衍筮法v2.2');
app.disableHardwareAcceleration();
const projectRoot = path.join(__dirname, '..');
const portableRoot = process.env.PORTABLE_EXECUTABLE_FILE ? path.dirname(process.env.PORTABLE_EXECUTABLE_FILE) : path.dirname(process.execPath);
const dataRoot = app.isPackaged ? path.join(portableRoot, 'data') : path.join(projectRoot, 'data');
const logDir = path.join(dataRoot, 'logs');
fs.mkdirSync(logDir, { recursive: true });
app.setPath('userData', path.join(dataRoot, 'electron-profile'));
let ownedModelProcess = null;

function log(message) {
  try { fs.appendFileSync(path.join(logDir, 'app-debug.log'), `${new Date().toISOString()} ${message}\n`, 'utf8'); } catch { /* logging must not stop the app */ }
}
function isListening(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: '127.0.0.1', port });
    socket.once('connect', () => { socket.destroy(); resolve(true); });
    socket.once('error', () => resolve(false));
    socket.setTimeout(500, () => { socket.destroy(); resolve(false); });
  });
}
async function healthStatus() {
  try { const response = await fetch('http://127.0.0.1:19331/health'); return response.status; } catch { return 0; }
}
async function startLocalModel() {
  if (await isListening(19331)) {
    const status = await healthStatus(); log(`AI port already in use; health status=${status}`); return;
  }
  const root = app.isPackaged ? process.resourcesPath : projectRoot;
  const server = path.join(root, 'tools', 'llama.cpp', 'llama-server.exe');
  const model = path.join(root, 'models', 'qwen3.5-2b-Q4_K_M.gguf');
  if (!fs.existsSync(server) || !fs.existsSync(model)) { log(`AI resources missing; server=${fs.existsSync(server)} model=${fs.existsSync(model)}`); return; }
  const cacheDir = path.join(dataRoot, 'cache'); const tempDir = path.join(dataRoot, 'temp');
  for (const directory of [cacheDir, tempDir]) fs.mkdirSync(directory, { recursive: true });
  const out = fs.openSync(path.join(logDir, 'qwen-server.stdout.log'), 'a'); const err = fs.openSync(path.join(logDir, 'qwen-server.stderr.log'), 'a');
  ownedModelProcess = spawn(server, ['--model', model, '--host', '127.0.0.1', '--port', '19331', '--ctx-size', '4096', '--threads', '4', '--device', 'none', '--reasoning-format', 'none', '--reasoning-budget', '0', '--no-webui'], { cwd: path.dirname(server), windowsHide: true, detached: false, stdio: ['ignore', out, err], env: { ...process.env, TEMP: tempDir, TMP: tempDir, LLAMA_CACHE: cacheDir } });
  log(`Started project AI process pid=${ownedModelProcess.pid}`);
  ownedModelProcess.once('error', (error) => log(`AI process error: ${error.stack || error}`));
  ownedModelProcess.once('exit', (code, signal) => { log(`AI process exited code=${code} signal=${signal}`); ownedModelProcess = null; });
}
function createWindow() {
  const window = new BrowserWindow({ width: 1180, height: 900, minWidth: 820, minHeight: 680, title: '大衍筮法v2.2', icon: path.join(__dirname, '..', 'dist', 'app-icon.png'), autoHideMenuBar: true, backgroundColor: '#f5f0e8', webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true } });
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (['https://github.com/Ylh1028/Dayan-Divination', 'https://huggingface.co/gguf/Qwen3.5-2B-GGUF', 'https://huggingface.co/Qwen/Qwen3.5-2B'].includes(url)) void shell.openExternal(url).catch((error) => log(`打开来源链接失败：${error.message}`));
    return { action: 'deny' };
  });
  window.webContents.on('will-navigate', (event, url) => { if (!url.startsWith('file://')) event.preventDefault(); });
  window.webContents.on('did-fail-load', (_event, code, description) => { if (code !== -3) { log(`Page load failed code=${code} description=${description}`); dialog.showErrorBox('大衍筮法启动失败', `页面加载失败：${description}`); } });
  window.webContents.on('console-message', (_event, level, message, line, sourceId) => { if (message.includes('[AI]')) log(`Renderer AI level=${level} ${message} (${sourceId}:${line})`); });
  window.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
}
app.whenReady().then(async () => { await startLocalModel(); createWindow(); }).catch((error) => { log(`App startup failed: ${error.stack || error}`); dialog.showErrorBox('大衍筮法启动失败', String(error)); app.quit(); });
app.on('window-all-closed', () => app.quit());
app.on('before-quit', () => { if (ownedModelProcess && !ownedModelProcess.killed) { log(`Stopping owned AI process pid=${ownedModelProcess.pid}`); ownedModelProcess.kill(); } });
