# 本地模型与许可核对

当前沿用 Qwen3.5-2B，参数规模 2B，GGUF 格式，Q4_K_M 量化。

| 项目 | 当前记录 |
|---|---|
| 文件 | `models/qwen3.5-2b-Q4_K_M.gguf` |
| 大小 | 1,312,164,352 bytes |
| SHA-256 | `9a3d0aa6c920f096441139b6a254542da855223fdad06855ea00c6c087fd713d` |
| 来源 | https://huggingface.co/gguf/Qwen3.5-2B-GGUF |
| 来源 revision | `47f5192dcee31b32db0ba0acc04cccef89cb4b2c` |
| 文件 commit | `19bb3a8fe3d2976d563e3c61e69c75e61806f2bc` |
| 原始模型 | https://huggingface.co/Qwen/Qwen3.5-2B |
| 原始模型许可 | 官方 LICENSE 为 Apache-2.0，https://huggingface.co/Qwen/Qwen3.5-2B/blob/main/LICENSE |
| 当前量化文件许可 | 来源页未提供模型卡或明确许可，尚不能确认该具体文件的完整再分发授权链 |
| 来源标注 | 在界面、README、第三方声明和随包 NOTICE 中公开标明第三方文件发布地址与原始模型项目；标注不等于来源链已独立核实 |

不得用其他量化仓库的许可代替当前文件的许可。不得为了发布更换模型。
项目原创部分的非商业许可不限制第三方模型自身许可授予的权利。

现用引擎：llama.cpp b12314，commit `e1f7593c3`，Windows x64，CPU 运行。
将兼容引擎文件置于 `tools/llama.cpp/`，同目录须有运行所需 DLL。
当前项目不自动下载模型或引擎。开发者需自行合法准备上述文件；不可把只有源码的下载包当作完整离线版。
引擎固定版本主许可证、二进制内嵌许可集合、OpenMP、BoringSSL、llama-connect 及相关头文件声明已补入 `licenses/`；具体来源和核对边界见该目录的 README。

运行配置沿用：127.0.0.1:19331、4096 上下文、CPU 4 线程、非思考模式。
硬件参考为原有本机测试环境：i5-10300H、16 GB 内存、Windows 10 x64；这是测试参考，未经确认的最低配置不作保证。
完整断网、干净系统与其他 CPU 兼容性必须分别测试，不得由本机模型加载结果推定。

## 2026-11-26 补充调查

本轮只读解析当前 GGUF 的 37 个头部键：架构为 qwen35、大小标签为 2B，但 `general.name` 仅为 `Model 2b`，没有 general.license、作者、base_model 或来源 URL。内部元数据不能补足授权链。
原安装时保存的固定 revision 文件清单含本文件的 LFS SHA-256、大小和上传 commit，没有 README 或 LICENSE；本轮公开来源页仍未提供模型卡或许可。
固定 revision 的在线接口与文件页未能在当前环境完整取回，因此历史清单与本轮网页观察分别记录，不能声称已重新在线验证全部 revision 元数据。

原始 Qwen 官方许可证为 Apache-2.0，并标示 Copyright 2026 Alibaba Cloud。许可证标准文本和该原始来源声明已补入 licenses，但当前 GGUF 不能仅凭名称认定为原模型的未改动量化转换。
目前缺少原始权重的具体 revision、量化者的转换说明及对当前文件适用的许可声明。结论为**当前文件再分发权限尚未确认**，并非断言发布者禁止再分发。

如后续取得适用于当前 SHA-256 的许可、原始来源 revision、转换/修改说明或 NOTICE，可继续补充核对。本轮未向任何发布者发送消息，也未将“缺少模型卡”单独认定为禁止分发的证明。

## 当前第三方来源标注

- 文件发布来源：[gguf/Qwen3.5-2B-GGUF](https://huggingface.co/gguf/Qwen3.5-2B-GGUF)。
- 原始模型项目：[Qwen/Qwen3.5-2B](https://huggingface.co/Qwen/Qwen3.5-2B)。
- 上游官方许可：[Qwen3.5-2B/LICENSE](https://huggingface.co/Qwen/Qwen3.5-2B/blob/main/LICENSE)。
- 随包保留 Apache-2.0 标准全文、Qwen 上游版权、当前第三方文件名/revision/SHA-256 及来源说明，不冒称官方发布的 GGUF。
- 现有模型、推理参数和解卦提示词不变；项目非商业限制不覆盖第三方已有许可授予的权利。
- 当前转换链与第三方具体许可声明缺失的事实继续如实记录，不伪造量化者的修改声明或额外授权。

可供另行决定的替代方案：

| 方案 | 已有许可证据 | 代价与尚未验证事项 |
|---|---|---|
| SoAIHQ/Qwen3.5-2B-GGUF 的 Q4_K_M | https://huggingface.co/SoAIHQ/Qwen3.5-2B-GGUF 模型卡明确量化文件遵循原模型 Apache-2.0，说明基础 revision 与转换流程，并提供 SHA256SUMS | 同为 2B / Q4_K_M，约 1.3 GB，但哈希以 a8b50de0 开头，与当前文件不同；兼容性及解卦表现须重新实测，不能直接替换 |
| 从官方 Qwen3.5-2B 权重自行转换和量化 | 官方 Apache-2.0，转换过程由项目方完整记录 | 需额外下载较大原始权重并重新量化、验证，不属于当前授权操作 |

以上仅为候选路径，本轮未下载替代模型、重新量化、更改模型配置或 AI 提示词。其他仓库的许可不作为当前文件的许可证明。
