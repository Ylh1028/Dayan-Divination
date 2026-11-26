# 普通 Windows 环境验收

用户已反馈上一候选 v2.2 EXE 在正常 Windows 桌面能运行。该反馈仅记为用户报告的启动成功，不扩大为严格断网、全部功能或重新构建产物已通过。
Codex 受限环境原启动失败证据保留，具体环境差异和底层根因未确认。没有据此修改硬件加速、沙箱、Electron、系统 DLL、驱动或 Qwen 流程。

## 网页模型脚本

请先正常关闭大衍筮法 EXE；如端口已有其他模型服务，不要强制终止。
在普通 PowerShell 逐条执行：

```powershell
# 在解压后的项目根目录执行
powershell.exe -NoProfile -File .\scripts\ai\start-qwen.ps1
Invoke-RestMethod http://127.0.0.1:19331/health
powershell.exe -NoProfile -File .\scripts\ai\check-qwen.ps1
powershell.exe -NoProfile -File .\scripts\ai\stop-qwen.ps1
```

预期：启动返回 PID 和健康状态，health 正常，检查列出当前项目模型，停止只针对该项目模型路径匹配的进程。
如 CIM 查询拒绝访问或任何命令报错，请保留原输出；不能把拒绝访问后脚本显示“无进程”当作验证通过。本轮只做语法和只读审查，没有改写脚本。
要验证网页交互，可在模型已启动时另开终端运行 npm.cmd run dev，并访问 http://127.0.0.1:5173/；停止网页用 Ctrl+C，之后再停止本项目模型。

## 新构建 EXE

按照本轮报告中的新文件路径、大小及 SHA-256 选择文件。旧候选的用户运行成功不能替代新文件验收。
确认能正常启动、手动单爻跳过不多生成爻、直接成卦及本地 AI 正常；关闭后确认程序自启模型正常退出，保留历史。
严格离线和跨设备测试如未执行，继续标为 NOT TESTED，不修改系统设置来迎合受限执行环境。
