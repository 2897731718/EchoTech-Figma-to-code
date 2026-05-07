<!-- figma-to-code: flutter-conventions v1 -->

# Flutter UI 代码规范（Product A基准）

> 本文件由 `figma-to-code` 创建，作为 Figma 骨架翻译为 Flutter 代码时的**强制契约**。
> AI 在翻译生成的骨架时必须严格遵守本文档；任何与本文档冲突的写法不得提交。
>
> 标记 `<!-- TODO: 校准 -->` 的字段表示需要根据当前项目实际情况补全。
> 用 `figma-to-code calibrate` 自动扫描补全；扫不到的请手动填写后保存。
> **AI 不得擅自修改本文件**——校准必须由用户主动通过 CLI 触发。

## 组件库

- **公共组件包**：`package:custom_components/custom_components.dart`
- 所有 `EchoXxx()` / `CustomWidget()` 形态的 Widget 均来自该包
- **导入语句**：`import 'package:custom_components/custom_components.dart';`

骨架中识别为团队组件的 INSTANCE 已经是正确的 Dart 类名，但**构造函数参数为空**——
AI 翻译时必须按以下步骤补齐：

1. 读骨架中 INSTANCE 上方注释的 `doc: <path>` 拿到该组件的源文件，确认构造函数签名
2. 按注释里的 `{Key: Value}` 变体映射构造参数。常见映射：
   - `Type: Input` → `type: FormItemType.input`
   - `Size: Mini(24)` → `size: ButtonSize.mini`
   - `Disable: False` → 可省略
3. 文本节点（骨架里的 `Text(...)`）通常对应组件的 `text` / `label` / `title` 字符串参数
4. **空构造严禁直接保留**——必须填出每个组件实际需要的参数
5. 优先复用项目里已有的同类封装

## 颜色

> 团队规范：所有颜色必须使用统一命名空间，不允许出现裸 RGB / Hex。
>
> （工具层自动替换功能待团队 token CDN 上线后启用，目前由 AI 在翻译时手动替换。）

- **命名空间**：`AppColors.<语义>`（来自 `custom_components`）
- **翻译指引**：骨架中所有 `Color(0xFFxxxxxx)` 在翻译为最终代码时**必须**替换为对应的 `AppColors` 语义命名
- 如果无法把握具体语义映射，**停下来与用户确认**，不要保留裸 RGB
- 渐变（gradient）按Product A已有的 gradient widget 处理，不允许内联 `LinearGradient(...)`

## 文字样式

- **命名空间**：`EchoTextStyles.<语义>`（来自 `custom_components`）
- **翻译指引**：骨架中所有 `TextStyle(fontSize: ..., fontWeight: ..., color: ...)` 必须替换为 `EchoTextStyles` 中对应的语义样式
- 单独覆盖某一项（如仅改颜色）时使用 `EchoTextStyles.bodyMedium.copyWith(color: AppColors.xxx)`
- 不允许内联裸数字（`fontSize: 14`）

## 图标

- **命名空间**：`IconName.<驼峰命名>`（来自 `custom_components`）
- 骨架已自动输出 `Icon(IconName.xxx, size: <size>)`，翻译时保留即可
- 如果骨架里出现的 `IconName.xxx` 在 `custom_components` 中不存在，**停下来与用户确认**

## 国际化（i18n）

- **manager**：`CustomLocalizationsManager.current(context).<key>` <!-- TODO: 校准 -->
- **key 命名风格**：echo_theme（按 `.` 切段，剥离非字母数字，首段首字母小写后段保持，拼接） <!-- TODO: 校准 -->
- 骨架中已识别的 i18n 节点已用上面的形态生成；如果项目实际使用 `AppLocalizations.of(context)` 或其他 manager，请在 calibrate 时替换

## Widget 外壳

骨架本身只输出 Widget 树片段，AI 翻译时必须套上正确的外壳：

- **默认基类**：`StatelessWidget` <!-- TODO: 校准 -->
- **自定义基类**：无 <!-- TODO: 校准 -->（如项目有 `BasePage` / `BaseStatelessWidget`，在此声明）
- **构造**：`const XxxPage({super.key});`
- **build 方法**：`@override Widget build(BuildContext context) { return ...; }`
- 优先 `const`：所有可 `const` 化的 Widget 必须加 `const`

## 文件与目录约定

- **页面/Widget 落地路径**：`lib/` 下，具体子目录待校准 <!-- TODO: 校准 -->
- **文件命名**：snake_case，类名与文件名对应（`OrderDetailPage` → `order_detail_page.dart`）
- **import 风格**：相对路径优先用于本模块内，跨模块用 `package:` <!-- TODO: 校准 -->

## 状态管理

- **方案**：待校准 <!-- TODO: 校准 -->（如 Provider / Riverpod / Bloc / 自研 ViewModel）
- 骨架中 `ListView.builder` / `PageView` 等留下的 `// TODO` 注释，AI 翻译时必须按本节方案落地数据源/控制器

## 本规范的修改

- **AI 不得修改本文件**——任何字段变更必须由用户主动发起：
  - 重新跑 `figma-to-code calibrate` 自动补全 TODO
  - 或手动编辑后保存
- 工具升级（Product A模板新增字段）时，可用 `figma-to-code init --ui=custom-flutter --force-merge` 触发字段对齐（待实现）

---

<!-- 本节由 calibrate 自动维护，请勿手动编辑 -->
## Calibration Log

（首次校准前为空。每次 `figma-to-code calibrate` 会在此追加一条记录。）
