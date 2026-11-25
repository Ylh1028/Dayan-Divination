# 第三方声明与分发状态

本项目非商业许可仅作用于寒肄有权授权的原创内容；不覆盖或限制以下第三方内容各自许可授予的权利。

| 组件 | 当前版本或来源 | 许可与核对状态 |
|---|---|---|
| React / React DOM | 本地 package-lock 对应版本 | MIT，原文位于 `licenses/React-LICENSE` 与 `React-DOM-LICENSE` |
| Electron | 本地安装 33.4.11 | MIT，`licenses/Electron-LICENSE` |
| Chromium / Node.js 等 Electron 依赖 | 随 Electron 提供 | `licenses/LICENSES.chromium.html` 及 Electron 发行包声明须保留 |
| LLVM OpenMP | 随当前引擎提供 | 保留 `licenses/LICENSE-LLVM-OpenMP`，不替换其条款 |
| llama.cpp | b12314，commit e1f7593c3 | 上游为 MIT；当前本地引擎缺少主 LICENSE，需补齐固定版本许可和随包二进制依赖声明，公开二进制暂停 |
| Qwen3.5-2B 原始模型 | https://huggingface.co/Qwen/Qwen3.5-2B/blob/main/LICENSE | 官方为 Apache-2.0；原始许可不能自动代替当前第三方量化文件的授权链 |
| 当前 gguf/Qwen3.5-2B-GGUF Q4_K_M | 固定来源、大小和 SHA-256 见 `docs/MODEL.md` | 当前来源页没有模型卡或明确许可；再分发结论未确认，禁止上传该文件 |
| 开发依赖 | Vite、TypeScript、electron-builder 及其传递依赖 | 依赖通过各自包管理源获取并遵守各包许可；不将 node_modules 提交到公开仓库 |

六十四卦经典原文沿用现有项目数据，没有生成或添加现代注释。作者头像与界面资源为既有项目内容；发布前检查额外个人元数据。

当前离线包仅可作为本地构建候选，不得因包含模型而宣称模型分发许可已经通过。
项目正式发布需要满足所有必要组件的许可条件；许可证缺失不得用项目非商业许可代替。
