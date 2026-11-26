# 第三方声明与分发状态

本项目非商业许可仅作用于寒肄有权授权的原创内容；不覆盖或限制以下第三方内容各自许可授予的权利。

| 组件 | 当前版本或来源 | 许可与核对状态 |
|---|---|---|
| React / React DOM | 本地 package-lock 对应版本 | MIT，原文位于 `licenses/React-LICENSE` 与 `React-DOM-LICENSE` |
| Electron | 本地安装 33.4.11 | MIT，`licenses/Electron-LICENSE` |
| Chromium / Node.js 等 Electron 依赖 | 随 Electron 提供 | `licenses/LICENSES.chromium.html` 及 Electron 发行包声明须保留 |
| LLVM OpenMP | 随当前引擎提供 | 保留 `licenses/LICENSE-LLVM-OpenMP`，不替换其条款 |
| llama.cpp | b12314，commit e1f7593c32e8dd782fc7addb908d0911260511ae | 官方固定提交主许可证已补入 `licenses/llama.cpp-LICENSE`；与现用二进制内嵌文本一致 |
| BoringSSL、cpp-httplib、jsonhpp | 现用 llama.exe 内嵌许可集合 | 原文保存在 `licenses/llama-binary-LICENSES.txt`，另保留各项文本；BoringSSL 官方 0.20261105.0 LICENSE 已核对 |
| llama-connect | 现用工具包附带 0.0.1 | `licenses/llama-connect-LICENSES.txt` 由现有程序 `--license` 原样导出，含其完整第三方声明；应用正常起卦和 AI 流程不启用远程连接 |
| stb_image、miniaudio、subprocess、哈希组件 | llama.cpp 固定提交所含源码 | 保留对应许可段落；这是随包辅助工具可能使用的组件，未替换任何引擎二进制 |
| Vulkan / SPIR-V 头文件 | b12314 上游 Windows 工作流使用 Vulkan SDK 1.4.357.0 | `licenses/Vulkan-Headers-LICENSE`、`Vulkan-Headers-MIT-LICENSE`、`SPIRV-Headers-LICENSE` 及 `Apache-2.0.txt`；系统驱动不在本项目内替换或分发 |
| Qwen3.5-2B 原始模型 | https://huggingface.co/Qwen/Qwen3.5-2B/blob/main/LICENSE | 官方为 Apache-2.0，Copyright 2026 Alibaba Cloud；完整标准条款见 `licenses/Apache-2.0.txt`，来源及范围见 `licenses/Qwen-UPSTREAM-NOTICE.md`；不据此推定当前量化文件获准分发 |
| 当前 gguf/Qwen3.5-2B-GGUF Q4_K_M | [第三方文件发布来源](https://huggingface.co/gguf/Qwen3.5-2B-GGUF)，固定文件与哈希见 `docs/MODEL.md` | 来源仓库未提供模型卡、独立许可或转换过程；已附上游 Apache-2.0 与完整来源声明，不将未核实的转换链写为已确认 |
| 开发依赖 | Vite、TypeScript、electron-builder 及其传递依赖 | 依赖通过各自包管理源获取并遵守各包许可；不将 node_modules 提交到公开仓库 |

六十四卦经典原文沿用现有项目数据，没有生成或添加现代注释。作者头像与界面资源为既有项目内容；发布前检查额外个人元数据。

许可文件的来源、固定提交和提取方式见 `licenses/SOURCES.json` 与 `licenses/README.md`。本轮仅补充许可和来源声明，未修改第三方二进制或模型。

用户已反馈上一候选 EXE 在正常 Windows 桌面运行成功；受限执行环境失败的底层根因尚未确认，不据此判定代码缺陷。补入许可后重新构建的产物须另行验收。
第三方量化文件来源、原始模型项目及上游许可已在页脚、README 和 `licenses/Qwen-UPSTREAM-NOTICE.md` 标注；来源声明与模型版权许可分别说明。来源页缺少转换说明的事实予以保留，不声称已获量化发布者额外授权。
