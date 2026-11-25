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
| 完整离线包公开分发 | 暂停；本地构建不代表许可审查已经通过 |

不得用其他量化仓库的许可代替当前文件的许可。不得为了发布更换模型。
项目原创部分的非商业许可不限制第三方模型自身许可授予的权利。

现用引擎：llama.cpp b12314，commit `e1f7593c3`，Windows x64，CPU 运行。
将兼容引擎文件置于 `tools/llama.cpp/`，同目录须有运行所需 DLL。
当前项目不自动下载模型或引擎。开发者需自行合法准备上述文件；不可把只有源码的下载包当作完整离线版。
正式分发前还需核对引擎固定版本的 LICENSE、Vulkan 组件、OpenMP 及其他随包依赖声明。

运行配置沿用：127.0.0.1:19331、4096 上下文、CPU 4 线程、非思考模式。
硬件参考为原有本机测试环境：i5-10300H、16 GB 内存、Windows 10 x64；这是测试参考，未经确认的最低配置不作保证。
完整断网、干净系统与其他 CPU 兼容性必须分别测试，不得由本机模型加载结果推定。
