# figma-flutter

根据 Figma 链接生成项目可用的 Flutter Widget 代码（Custom / Echo 体系）。

## 重要：立即执行以下步骤，不要做任何预检查

**不要查找 token、不要检查环境变量、不要询问用户凭证。** Token 由 CLI 内部处理。

---

## 两种模式

**A. 全量生成**：`/figma-flutter <figma-url> [dart-path]`
   走下面「步骤」段第一~八步，从 Figma 拉骨架重新翻译。

**B. 二次修正（--fix）**：`/figma-flutter --fix <dart-path>`
   不从 Figma 重拉，对照 **上次落盘的骨架** + **现有 Dart 文件** 做差异对账并修正。**只动有差异的 Widget，禁止整段重写**。详见下方「--fix 模式」段。

> **用户说"彻底重写 / 全部重做"但没附链接** → 不要立刻反问。先按以下顺序自动反查：
> 1. 当前会话历史 grep `https://www.figma.com/(file|design)/.*?node-id=`，命中就直接用
> 2. 从目标 Dart 文件 grep 第一条 `// FRAME  |  figma-node: <id>` 或 `INSTANCE figma-node: <id>` 注释提主 nodeId（`:` → `-`）
> 3. Read `.figma-to-code/skeleton-<sanitizedId>.dart` 头部三行元数据，取 `// figma-url:` 字段
> 4. 用反查到的 URL 走 A 模式（全量）
>
> 三步都失败（旧版本骨架无元数据 / 文件已删 / Dart 无 figma-node 锚点）才反问用户要链接。

---

## 前置：必须先有规范文件

本流程依赖项目级规范文件 `.claude/flutter-conventions.md`。若不存在，让用户先运行其中之一，再回来：

```bash
figma-to-code init --ui=custom-flutter                    # Product A默认模板
figma-to-code init --ui=custom-flutter --bind=<your.md>   # 绑定项目已有规范文件
```

---

## 步骤

**第零步：确认产品 token（首次使用时询问）**

如果用户没有指定 `--tokens`，询问：

> 请选择设计稿对应的产品 token：
> 1. Product A (product-a) - 默认
> 2. Product B (product-b)
> 3. Product C (product-c)
> 4. Product D (product-d)

用户选择后在命令里加 `--tokens=xxx`。

**第一步：立即运行命令生成骨架 + 参考截图**

将 `$URL` 替换为用户提供的 Figma 链接（**保留 `?node-id=`**），直接执行：

```bash
figma-to-code $URL --framework=flutter --image --tokens=product-a
```

- `--image` 会把该节点渲染图导出到 `.figma-to-code/<nodeId>.png`，供后面视觉对账用。
- 若 URL 没有 node-id，`--image` 会自动跳过 —— 提醒用户用带 `?node-id=` 的 dev 链接。
- 报错再告知用户，否则继续。

**第二步：读取项目规范（强制契约）**

Read `.claude/flutter-conventions.md`。翻译时严格遵守其中所有规则：颜色系统 / 排版系统 / 间距 / 图标系统 / 组件库 / 业务组件映射 / MVVM 页面结构 / 列表与滚动 / 骨架屏 / 国际化 / 注意事项。

**第三步：读取参考截图（第一步成功导出时）**

Read 骨架头部「设计稿参考截图」块里指向的 `.figma-to-code/<nodeId>.png`，建立整体视觉印象。

**第四步：按骨架头部的「翻译指南」翻译**

骨架文件开头自带完整翻译指南，**严格按它执行**。要点：

- 字面量按规范替换为项目命名空间：
  - 颜色 `Color(0xFF...)` → `context.appTheme.qd.*`（有 context）或 `AppColor.qd.*`（无 context）
  - 文字 `TextStyle(fontSize:...)` → `CustomTextStyles.generateStyle(typography: CustomTypography.nX, color: ...)`
  - 间距 `SizedBox(width/height: N)` → `AppSpacing.*`
  - 图标 `Icon(CustomImageIcons.xxx, size: N)` → `CustomImageIcon(CustomImageIcons.xxx, size: CustomIconSize.sizeN, color: ...)`
  - 网络图 `NetworkImage` / `DecorationImage` → `QDCachedNetworkImage(imageUrl, imageStyle: OSSImageStyle.*)`
- `EchoXxx()` / `CustomWidget()` 是空构造占位：Read 每个 INSTANCE 上方注释里 `doc:` 指向的源文件拿构造签名，按 `{Key: Value}` 变体注释映射 props（典型：`Size: Mini(24)` → `size: ButtonSize.mini`），Figma 的 `Text(...)` 通常对应组件的 text/label/title 等字符串参数。**空构造严禁直接保留**。
- 行内带 `⚠ 未映射` 的 INSTANCE → 按规范 §6 业务组件映射表查项目封装。
- 容器宽度不写死像素；动态内容用变量占位；交互元素加 `onTap` / 回调占位。
- 页面级产物按规范 §7 的 `CustomBasePage` / MVVM 组织；用户可见中文走规范 §10 的 i18n。

**第五步：输出**

- 指定了目标路径 → 写入文件
- 未指定 → 输出到对话，由用户确认后保存

**第六步：翻译完成后自检（Review & Calibrate，必做）**

骨架头部「翻译完成后自检」清单逐项核对，任一项不过就改到过为止：

- 视觉对账：Read `.figma-to-code/<nodeId>.png`，逐块比对布局 / 间距 / 字号 / 字重 / 颜色 / 对齐 / 圆角 / 留白，差异全部修正
- 颜色：全文无残留 `Color(0xFF...)` / `Colors.*` / `AppColors.*`
- 文字 / 间距 / 图标 / 图片：无残留裸 API（见第四步映射表）
- 组件：无空构造 `EchoXxx()/CustomWidget()` 残留
- 文案：用户可见中文走 i18n（规范 §10）
- 结构：页面级产物按规范 §7 的 `CustomBasePage` / MVVM
- 编译：依赖与引用补齐、无未定义符号；能跑就跑 `flutter analyze`（否则提醒用户跑），有 error 必须清掉

> **改老页面时**：以参考截图 + 现有代码为双重基准。先用骨架里的文案 / 组件名 / `figma-node` 注释 grep 定位到现有代码里对应的 Widget，只动该动的部分，**禁止整段重写**。

**第七步：处理未识别的子组件（递归生成，可选）**

骨架头部「未映射组件」列出的 tag、以及行内带 `⚠ 未映射` 的 INSTANCE，逐个询问用户是否生成对应 Dart 文件：

1. 询问：

   > 发现未识别的子组件 `<ComponentName>`（figma-node: xxx），是否需要生成对应文件？如需要，请告知保存路径。

2. 用户给路径后：用该 INSTANCE 的 `figma-node` id 重跑
   ```bash
   figma-to-code "<原始链接&node-id=<componentId>>" --framework=flutter --image --tokens=xxx
   ```
   对新骨架重复第二~六步，结果写入指定路径，并在规范 §6 业务组件映射表补一条记录。回到主组件，把对应标签替换为真实组件并补 import。

3. 用户跳过 → 保留占位标签。

4. 全部处理完后，输出最终完整的主组件代码（含所有 import）。

**第八步：清理中间产物（防误删）**

主组件 + 所有递归子组件全部翻译并自检通过后，逐个删掉本次用到的参考截图（PNG）。**`skeleton-<nodeId>.dart` 骨架文件不要删，留给 `/figma-flutter --fix` 二次修正用。**

**每个 PNG 单独走下面四步，绝不批量删、绝不带通配符。**

对本次涉及的每个 `<nodeId>`（主组件 + 第七步每个子组件）：

```bash
# 1. 列出删除前的内容，记下基线
ls .figma-to-code/

# 2. 校验：目标必须存在且是 PNG
test -f .figma-to-code/<nodeId>.png || { echo "跳过：文件不存在"; }
file .figma-to-code/<nodeId>.png       # 输出必须含 "PNG image"

# 3. 精准删除（-- 隔断，防止 nodeId 被解析成 flag）
rm -f -- .figma-to-code/<nodeId>.png

# 4. 再次列出，对比基线 —— 必须只有目标 PNG 消失,skeleton-<nodeId>.dart 必须仍在
ls .figma-to-code/
```

任一步发现实际删除范围超出目标 PNG（多文件 / 不同文件名 / 骨架 .dart 消失 / 目录消失）→ **立即停止后续清理，把异常输出贴给用户**。

> 严禁 `rm -rf .figma-to-code/*` 或 `rm .figma-to-code/*` —— 会把骨架文件一起干掉，导致 `/figma-flutter --fix` 失去对账依据；也可能误伤并行跑的其他 figma-flutter 流程产物。
>
> 不要 `rmdir .figma-to-code`：骨架文件保留意味着目录会持续非空，目录本身已被加入 `.gitignore`，留着无害。

---

## --fix 模式

触发条件：用户输入 `/figma-flutter --fix <dart-path>`（无 URL）。

**与全量模式的核心差异**：不重新拉 Figma，对照 **上次落盘的骨架** + **现有 Dart** 做差异对账。骨架在前一次 `/figma-flutter <url>` 跑完时已落盘到 `.figma-to-code/skeleton-<nodeId>.dart`（CLI 自动产生，第八步不会清理）。

**步骤**：

1. **Read 目标 Dart 文件** `<dart-path>`。

2. **提取主 nodeId**：从文件里 grep 第一条 `// FRAME  |  figma-node: <id>` 或 `// ... INSTANCE figma-node: <id>` 注释（通常对应最外层 Widget）。把 `:` 替换为 `-` 得到 sanitized id（与 CLI 落盘命名一致）。
   - 找不到任何 `figma-node:` 注释 → 报告"无法对账，文件里没有 figma-node 锚点"，请用户改用 `/figma-flutter <原url> <dart-path>` 走全量。

3. **Read 上次骨架** `.figma-to-code/skeleton-<sanitizedId>.dart`。
   - 不存在 → 报告"未找到上次骨架，请先跑 `/figma-flutter <原url> <dart-path>` 生成基线产物"。
   - 文件头部三行元数据可用：
     ```dart
     // figma-url: https://www.figma.com/design/<fileKey>/<name>?node-id=<id>
     // figma-node-id: <冒号格式 id>
     // generated-at: <ISO 时间戳>
     ```
     - `figma-url` —— 用户切到"彻底重写"分支时反查原链接走全量用，**`--fix` 本身不重拉 Figma**
     - `generated-at` —— 判断骨架是否过期；若用户说"Figma 改过了"，应建议走全量重新落盘，不要在过期骨架上 `--fix`
     - 旧版本骨架可能没这三行元数据（升级前生成的）—— 没有就直接对账，不要因此失败

4. **Read 上次截图**（可选）`.figma-to-code/<sanitizedId>.png`。第八步清理后默认不在；不在就跳过视觉对账，靠骨架对账。

5. **Read 规范** `.claude/flutter-conventions.md`（同全量模式第二步）。

6. **差异对账（核心）**：以**骨架的每个节点**为最小单元，逐项核对现有 Dart：

   - **逐 FRAME 容器**：搜骨架里所有 `// FRAME  |  figma-node: <子id>  |  stroke=... | radius=... | spacing=...` 注释，在现有 Dart 里 grep `figma-node: <子id>`（或对应 Widget），核到 `border / borderRadius / spacing` 三项**实际落地**到产物里（按规范替换成 `AppColor.qd.*` / `AppSpacing.*` 也算落地）。漏的、值不对的、被简化掉的，全部修正。
   - **逐 INSTANCE**：搜骨架里所有 `// ... INSTANCE figma-node: <id>  |  {props}` 注释，核到现有 Dart 里对应组件调用的构造参数齐了，没有空构造残留、props 都按变体注释映射对了。
   - **TEXT 节点**：核到文案对、i18n key 对（`CustomLocalizationsManager.current(context).xxx`）。
   - **Container 装饰**：颜色/圆角/边框对应规范 token（`AppColor.qd.*` 等），无 `Color(0xFF...)` / 裸 `TextStyle(fontSize: ...)` / 裸 `SizedBox(width/height: N)` 残留（参考全量第六步自检清单）。
   - **结构**：Stack/Row/Column 嵌套层级与骨架一致；不要因为"看着差不多"就合并/拍平。

7. **只动有差异的 Widget**：修正时就地编辑，**严禁整段重写文件**。每一处改动必须能对应到骨架/截图里的一个具体差异点。

8. **跑一次自检清单**（同全量模式第六步）+ 报告给用户："已修正 N 处差异：① stroke 漏了 / ② spacing 错值 / ③ ..."，列出具体差异点而非笼统说"已对照修复"。

**--fix 模式不做的事**：不重跑 CLI、不重新拉 Figma、不重新生成骨架、不重新导截图。如果用户怀疑 Figma 本身有更新，应该走全量模式 `/figma-flutter <url> <dart-path>` 重新落基线，再视情况 `--fix`。
