# 第三方许可来源与核对范围

本目录保留第三方许可原文或原文件内完整许可段落，适用于相应第三方内容。项目原创部分的非商业许可不覆盖它们。

- llama.cpp 固定提交：e1f7593c32e8dd782fc7addb908d0911260511ae，对应 b12314 官方 Release。
- llama.cpp、jsonhpp、cpp-httplib 主许可从该提交原样取回；stb_image、miniaudio、subprocess 许可取自该提交相应头文件的完整许可注释。
- rotate-bits、sha256、xxhash 许可来自同一提交的 vendor/hash。
- llama-binary-LICENSES.txt 从现有 tools/llama.cpp/llama.exe 的内嵌许可字符串提取，含 LLVM OpenMP、llama.cpp、jsonhpp、BoringSSL、cpp-httplib。前四个可独立取得的原文件与内嵌正文逐项一致；BoringSSL 与官方 0.20261105.0 LICENSE 核对。
- llama-connect-LICENSES.txt 由现有 0.0.1 工具执行 --license 原样导出，保留其软件及依赖的声明。没有启动远程分享服务。
- Vulkan / SPIR-V 声明取自 vulkan-sdk-1.4.357.0，版本依据固定 llama.cpp 提交的 Windows Vulkan 构建工作流。当前二进制导入表包含 vulkan-1.dll；没有分发或替换系统显卡驱动。SDK 头文件以外未随包分发的编译器不推定为运行依赖。
- LLVM OpenMP 原文本原已随引擎提供，本轮没有改写。
- Electron、Chromium、React / React DOM 许可证沿用上一轮的原始副本。
- Apache-2.0.txt 是 Apache 官方 .github 仓库提供的标准全文；Qwen-UPSTREAM-NOTICE.md 另记录原始模型实际版权与许可链接，不将标准许可文件冒充量化发布者的授权。

SOURCES.json 记录来源 URL、Git blob SHA 或现有二进制提取方式。提取文件附加的标题与分隔符只用于呈现，不修改许可条款。
本目录中的证据覆盖已识别的当前随包组件；PE 导入表不能独自证明所有静态链接代码的来源，所以同时保留上游组件声明与二进制导出的依赖许可。

当前具体 Qwen GGUF 的转换链仍未独立核实；来源、固定文件哈希、上游许可及证据边界见 Qwen-UPSTREAM-NOTICE.md。来源标注不是对缺失信息的认证，也不将项目非商业许可覆盖到模型自身权利。
