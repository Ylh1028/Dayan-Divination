# 大衍筮法 v2.2

作者：寒肄。基于传统大衍筮法的本地演算程序，提供本地网页版与 Windows 便携 EXE，支持自动演算、手动演算、直接成卦和本地 Qwen AI 解卦。

网页版与 EXE 构建所需源码已公开：[浏览源码](https://github.com/Ylh1028/Dayan-Divination)。网页版仅在本地运行，不部署在线网站。

## Windows EXE 完整离线版下载

**Windows EXE 尚未正式发布，当前没有可用的 v2.2 EXE 下载附件。源码已公开。**

计划发布位置：https://github.com/Ylh1028/Dayan-Divination/releases/tag/v2.2

计划附件名：`Dayan-Divination-v2.2-Windows-x64-Offline.exe`。该名称目前不是可用下载链接。
当前沿用第三方发布的 Qwen3.5-2B Q4_K_M 文件，发布来源和上游许可见下方说明。上一候选 EXE 已获作者正常 Windows 桌面运行成功反馈；本次新增来源链接后重新构建的文件需另行验收。Codex 受限环境中的旧启动失败没有在用户环境复现，根因尚未确认，不据此认定程序有代码缺陷。严格离线、干净系统及跨设备测试尚未完成。
发布后应在此补充实际附件地址、大小及 SHA-256，并核对正式附件与已测试产物一致。

便携 EXE 的既有使用方式：将文件放入可写文件夹，双击启动，模型由程序管理。
使用时应保留相邻 `data` 文件夹，它保存历史与日志。升级时仅替换程序，不覆盖历史。
完整包的目标是无需安装 Python、Node.js、Git 或在线 API；当前支持构建 Windows x64，不声称已经验证其他架构。

## 功能与使用

- 自动演算：系统依次演示十八变，可暂停、继续，也可点击“直接成卦”完成余下演算。
- 手动演算：按原有分二、挂一、揲四、归奇等步骤操作，每爻保留三变记录。
- 手动“跳过动画”：当前步骤开始后可用，只结算当前一爻。不会自动完成剩余爻，继续时点击“进入下一爻”。第六爻完成后正常成卦。
- 展示方式中的“直接成卦”：从开始即生成六爻，保持原演算逻辑。
- 上方与成卦后的下方“重新取卦”共用原有重置逻辑；会清空本轮问题与解读，保留历史。
- 本卦、之卦、动爻、卦辞、爻辞及 0–6 动爻取辞规则均由本地代码确定。
- 问题可不填；填写后调用本地 Qwen 解释已经确定的卦象。支持取消、原卦重新生成。
- 本地历史支持查询、还原、单条删除和 JSON 导出。
- 底部项目链接仅在用户点击时访问，不是启动或演算条件。

## 网页版：下载源码并本地运行

网页版不部署在线网站或 GitHub Pages。源码不包含模型权重、引擎、用户历史、日志与依赖安装目录。
网页和 EXE 使用相同 React 源码、算法、资料和 AI 调用模块。

开发需要 Node.js 与 npm；当前依赖含 Vite 5、TypeScript 5、React 18、Electron 33。建议使用受支持的 Node.js LTS，并以实际依赖安装结果为准。
首次安装依赖需要联网，安装后本地正常运行无需在线 API。

在解压后的源码根目录执行：

```powershell
$env:npm_config_cache = Join-Path (Get-Location) '.npm-cache'
$env:TEMP = Join-Path (Get-Location) 'temp'
$env:TMP = $env:TEMP
New-Item -ItemType Directory -Path $env:TEMP -Force | Out-Null
npm.cmd ci
```

按 [模型说明](docs/MODEL.md) 合法准备模型与兼容引擎。文件应放置为：

```text
models/qwen3.5-2b-Q4_K_M.gguf
tools/llama.cpp/llama-server.exe
tools/llama.cpp/（同版本运行所需 DLL 与许可证）
```

需要 AI 时先在 PowerShell 运行：

```powershell
.\scripts\ai\start-qwen.ps1
```

随后运行网页：

```powershell
npm.cmd run dev
```

访问 http://127.0.0.1:5173/ 。不使用 AI 时可只启动网页，仍可完整起卦、查阅原文。
AI 服务只绑定 `127.0.0.1:19331`。关闭网页服务用 Ctrl+C；检查与停止本项目模型服务：

```powershell
.\scripts\ai\check-qwen.ps1
.\scripts\ai\stop-qwen.ps1
```

上述管理脚本沿用 Windows CIM 进程查询；受限执行环境可能拒绝查询权限。
本轮受限环境下 CIM 查询仍拒绝访问；没有普通 Windows 环境故障证据，因此保留现有脚本不改。准确的普通 PowerShell 验证命令见 [Windows 验收说明](docs/WINDOWS-VALIDATION.md)，语法检查不替代启动通过。
不要为了停止本项目而批量结束其他模型进程。

## 算法、资料与 AI

六爻始终按初爻至上爻存储，只在展示时反转；6/8 为阴，7/9 为阳，6/9 为动爻。
`src/domain/dayan.ts` 完成传统三变演算，`interpret.ts` 按现有《易学启蒙》体系选取资料。
`src/data/hexagrams.json` 保存本地原文；模型不得补写原文或改变卦象。

当前模型为 Qwen3.5-2B Q4_K_M，CPU 4 线程、4096 上下文、非思考模式。
模型文件第三方发布来源：[gguf/Qwen3.5-2B-GGUF](https://huggingface.co/gguf/Qwen3.5-2B-GGUF)；原始模型项目：[Qwen/Qwen3.5-2B](https://huggingface.co/Qwen/Qwen3.5-2B)；上游许可：[Apache-2.0](https://huggingface.co/Qwen/Qwen3.5-2B/blob/main/LICENSE)。这是第三方量化文件，来源仓库未提供模型卡或转换过程，其具体转换链未独立核实；详见 [随包来源声明](licenses/Qwen-UPSTREAM-NOTICE.md)。项目的非商业许可不覆盖第三方已有权利。
启动、输出校验和解卦提示词沿用原实现。具体文件大小、哈希、来源与许可限制见 [模型说明](docs/MODEL.md)。
原本机测试参考为 Windows 10 x64、i5-10300H、16 GB 内存；这是参考环境，不是保证的最低硬件要求。
模型耗时受硬件、上下文长度与系统负载影响，不承诺固定性能。

## 目录

| 目录或文件 | 内容 |
|---|---|
| `src/` | 共用界面、演算、映射、取辞、AI、历史 |
| `desktop/main.cjs` | Electron、模型进程与默认浏览器外链 |
| `public/`、`build/` | 界面资源与图标 |
| `scripts/ai/` | 本地模型管理 |
| `tests/` | 算法与界面专项测试 |
| `docs/MODEL.md` | 固定模型来源、校验与许可状态 |
| `licenses/` | 已收集的第三方许可原文 |
| `package.json` | 依赖及实际构建配置 |

## 测试与自行构建 EXE

```powershell
npm.cmd run test
.\node_modules\.bin\tsc.cmd --noEmit
npm.cmd run build
.\node_modules\.bin\electron.cmd tests/ui.e2e.cjs
npm.cmd run desktop:dist
```

界面测试需先启动本地模型；测试配置与截图、测试历史均写入项目下 `temp/`，结果写入 `logs/`。
不要把测试历史当作用户历史发布。
默认界面测试使用 Electron 安全沙箱；仅在受限环境做诊断时可设置 `DAYAN_TEST_NO_SANDBOX=1`。
该诊断开关只作用于测试文件，不影响正式程序；此模式通过不代表正式 EXE 沙箱启动通过。

构建输出：`release-v2.2/Dayan-Divination-v2.2-Windows-x64-Offline.exe`。
构建需要现用模型、引擎及其依赖；不下载或更换模型。Electron 打包工具首次使用可能需要下载其构建工具。
开发构建时应把 `ELECTRON_CACHE`、`ELECTRON_BUILDER_CACHE`、npm 缓存、TEMP 和 TMP 指向项目内目录。
本地生成 EXE 不代表具备公开分发许可，公开前必须完成第三方审查。

## 常见问题

- 模型未就绪：检查文件、端口及健康接口，查看本地日志。传统演算和取辞不受影响。
- 端口已占用：先确认进程归属，不要结束其他用户的服务。桌面版保留已有端口检测逻辑。
- 无法写入历史或日志：程序须放在可写文件夹，避免放入只读介质。
- AI 失败：沿用错误提示，可在原卦上重试；不要用重取卦替代同一问题的请求重试。
- 历史位置不同：网页使用当前浏览器本地存储；EXE 使用相邻 `data/electron-profile`，两者不自动同步。
- 下载源码不能直接双击：源码需要开发环境与本地模型；它与未来正式完整离线 EXE 是两种交付形式。

## 版权与第三方

原创部分版权所有 © 2026 寒肄，按 [非商业源码公开许可](LICENSE) 提供。
允许非商业修改与二次发布，须保留署名、原始出处和版权声明，注明修改并继续遵守非商业限制。
商业销售、付费分发、商业服务集成及其他商业使用须取得明确许可。
该自定义许可不声称获得 OSI 认证；第三方代码、模型及资源仍按各自许可执行。

项目出处：https://github.com/Ylh1028/Dayan-Divination

请参阅 [第三方声明](THIRD_PARTY_NOTICES.md) 和 [更新记录](CHANGELOG.md)。
本轮补齐的固定版本与实际二进制许可来源见 [许可目录说明](licenses/README.md)。模型许可调查结论及仅供另行决定的替代方案见 [模型说明](docs/MODEL.md)；没有替换、重新量化或下载替代模型。
软件按现状提供；传统卦象及 AI 解读仅供学习与参考，不保证现实结果，不替代专业判断。
