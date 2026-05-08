<!-- figma-to-code: flutter-conventions v1 -->
# 项目 Figma 规范 — Flutter (Custom/Echo)

> 复制此文件到项目 `.claude/figma-context.md`，按注释填写项目信息。
> `/figma-flutter` skill 生成代码时会读取此文件。

---

## 1. 颜色系统

### 使用规范

**优先级**: `context.appTheme.qd.xxx` > `AppColor.qd.xxx`

```dart
// ✅ 有 context 时 (推荐)
Container(color: context.appTheme.qd.bg_1)

// ✅ 无 context 时 (如 ViewModel、静态方法)
final color = AppColor.qd.text_1;
```

> **警告**: `AppColors.xxx` 已废弃，禁止在新代码中使用

### 文本颜色

| Token | 用途 |
|-------|------|
| `text_1` | 主要文字 |
| `text_2` | 次要文字 |
| `text_3` | 辅助文字 |
| `text_disabled` | 禁用文字 |

### 背景颜色

| Token | 用途 |
|-------|------|
| `bg_1` | 主背景 |
| `bg_2` | 次级背景 |
| `bg_3` | 三级背景 |
| `bg_third` | 第三层背景 |

### 边框 / 图标 / 按钮

| Token | 用途 |
|-------|------|
| `border_primary` | 主边框 |
| `icon_primary` | 主图标 |
| `icon_secondary` | 次级图标 |
| `icon_unselected` | 未选中图标 |
| `button_primary` | 主按钮 |
| `button_disableddefult_secondary` | 禁用次级按钮 |

### Figma → Flutter 颜色映射

| Figma 颜色名 | Flutter Token |
|-------------|---------------|
| Text/Primary | `context.appTheme.qd.text_1` |
| Text/Secondary | `context.appTheme.qd.text_2` |
| Text/Tertiary | `context.appTheme.qd.text_3` |
| Background/Primary | `context.appTheme.qd.bg_1` |
| Background/Secondary | `context.appTheme.qd.bg_2` |
| Border/Primary | `context.appTheme.qd.border_primary` |
| Button/Primary | `context.appTheme.qd.button_primary` |
| Icon/Primary | `context.appTheme.qd.icon_primary` |
| Icon/Secondary | `context.appTheme.qd.icon_secondary` |

---

## 2. 排版系统

### 文本样式

```dart
Text(
  '文本内容',
  style: CustomTextStyles.generateStyle(
    typography: CustomTypography.n5,
    color: context.appTheme.qd.text_1,
  ),
)
```

> **警告**: `TextStyles.xxx` 已废弃，禁止在新代码中使用

### CustomTypography 枚举

| 枚举值 | 用途 |
|--------|------|
| `CustomTypography.h1` | 大标题 |
| `CustomTypography.h2` | 页面标题 |
| `CustomTypography.h3` | 区块标题 |
| `CustomTypography.n1` ~ `n7` | 正文层级 |

### Figma → Flutter 文字映射

| Figma 样式 | CustomTypography |
|-----------|-----------------|
| H1 / Large Title | `CustomTypography.h1` |
| H2 / Title | `CustomTypography.h2` |
| H6 / Medium 12px | `CustomTypography.h6` |
| Body / Regular 14px | `CustomTypography.n5` |
| Label / Regular 12px | `CustomTypography.n6` |
| Caption | `CustomTypography.n7` |

### 字体系统

| 字体家族 | 用途 | 字重 |
|---------|------|------|
| PingFang SC | 中文默认 | 系统字体 |
| Roboto | 英文/数字 | 400/500/700 |
| RobotoCondensed | 紧凑英文 | Bold Italic |
| AlibabaPuHuiTi | 中文备选 | Regular |

---

## 3. 间距

```dart
// ✅ 正确
AppSpacing(height: AppSpacingSize.normal);   // 8
AppSpacing.h4();                               // 水平 4px

// ❌ 错误 (避免使用)
SizedBox(height: 8)
```

---

## 4. 图标系统

```dart
CustomImageIcon(
  CustomImageIcons.arrow_right,
  size: CustomIconSize.size20,
  color: context.appTheme.qd.icon_primary,
)
```

- 尺寸使用 `CustomIconSize` 枚举，最大 32pt
- 超过 32pt 用图片加载
- 图标名称对照 `CustomImageIcons` 枚举

常用：`close`, `arrow_up`, `arrow_down`, `arrow_right`, `plus`, `minus`, `sort`, `liked`, `verify`, `shareWechat`, `sharePyq`, `alipay`, `wepay`, `stepper_remove`, `stepper_add`, `shareEdit` 等

---

## 5. 组件库

### 导入

```dart
// 通用组件集合导入
import 'package:kuril_flutter/Common/Utility/CommonWidgets/qd_widgets.dart';
import 'package:custom_components/custom_components.dart';
```

**重要**：必须使用 `package:` 路径导入，禁止相对路径。

### 按钮

```dart
// Button - 高级按钮（支持主题/登录检查）
Button(
  title: '提交',
  buttonStyle: DumplingButtonStyle.primary,
  onTap: () {},
  isNeedLogin: true,  // 可选：登录拦截
)

// EchoIconButton - 图标按钮
EchoIconButton(icon: CustomImageIcons.xxx, onTap: fn)
```

### 导航栏

```dart
EchoAppBar(
  leading: EchoAppBarLeadingIconButton(icon: CustomImageIcons.arrow_left),
  center: EchoAppBarCenterText(title: '页面标题'),
  trailing: EchoAppBarTrailingIcon(icon: CustomImageIcons.xxx, onTap: fn),
)
```

### 表单

| Figma 节点名含 | 使用组件 | 典型用法 |
|---|---|---|
| `Input` / `FormItem` | `CustomFormField` | `CustomFormField(value: val, placeholderText: '请输入', isPrice: true)` |
| `TextArea` | `CustomFormTextAreaWidget` | `CustomFormTextAreaWidget(value: val, placeholderText: '请输入')` |
| `Dropdown` / `Select` | `CustomDropdownWidget` | `CustomDropdownWidget(text: val, placeholderText: '请选择')` |
| `Stepper` | `NumStepper` | 数量步进器（-/数字/+） |

### 网络图片

```dart
QDCachedNetworkImage(
  imageUrl: url,
  imageStyle: OSSImageStyle.lfit_w240_jpg,  // 显示宽度 80 × 3 = 240
  width: 80,
  height: 80,
  fit: BoxFit.cover,
)
```

**imageStyle 选择规则**：显示宽度 × 3（3 倍屏清晰度）向上兼容选择 OSS 样式。

| 显示宽度 | 计算 | imageStyle |
|---------|------|-----------|
| ~74px | 74×3=222 → 240 | `OSSImageStyle.lfit_w240_jpg` |
| ~96px | 96×3=288 → 360 | `OSSImageStyle.lfit_w360_jpg` |
| ~120px | 120×3=360 → 360 | `OSSImageStyle.lfit_w360_jpg` |
| ~180px | 180×3=540 → 540 | `OSSImageStyle.lfit_w540_jpg` |
| 全屏宽 | 375×3=1125 → 1080 | `OSSImageStyle.lfit_w1080_jpg` |

### 弹窗

通过 `EchoDialogManager.showEchoDialog()` 调用：

```dart
// 标准双按钮弹窗
EchoDialogManager.showEchoDialog(
  context,
  dialog: EchoDialog(
    title: '确认删除？',
    desc: '此操作不可撤销',
    radius: 16,
    showClose: false,
    closeOnTap: true,
    bottomType: EchoDialogBottomType.multipleButtons,
    buttons: EchoDialogButtons(
      buttonList: [
        Button(
          title: '取消',
          buttonStyle: DumplingButtonStyle(
            type: DumplingButtonType.Outline,
            size: DumplingButtonSize.large,
            colorType: DumplingColorType.Default,
          ),
        ),
        Button(
          title: '确定删除',
          onTap: () { /* 业务逻辑 */ },
          buttonStyle: DumplingButtonStyle(
            type: DumplingButtonType.Solid,
            size: DumplingButtonSize.large,
            colorType: DumplingColorType.Error, // 红色危险
          ),
        ),
      ],
    ),
  ),
);

// 自定义内容弹窗
EchoDialogManager.showEchoDialog(
  context,
  dialog: EchoDialog.withMultipleButtons(
    title: '标题',
    customBody: Column(children: [...]), // 自定义内容区
    buttons: EchoDialogButtons(buttonList: [...]),
  ),
);
```

**按钮样式组合**：

| 场景 | type | colorType |
|---|---|---|
| 取消/次要 | `DumplingButtonType.Outline` | `DumplingColorType.Default` |
| 确认/主要 | `DumplingButtonType.Solid` | `DumplingColorType.Primary` |
| 危险/删除 | `DumplingButtonType.Solid` | `DumplingColorType.Error` |

### 展示组件

| Figma 节点名含 | 使用组件 |
|---|---|
| `Tag` | `CustomTagWidget` / `EchoTag` |
| `Image` / `Cover` | `QDCachedNetworkImage` |
| `TabBar` / `Tabs` | `EchoTabBar` |
| `Dialog` | `EchoDialog` |
| `Filter` | `CustomFilterMenuWidget` |
| `Sort` | `CustomSortWidget` |
| `Toast` | `CustomToastManager.share.toast(msg, context)` |

---

## 6. 业务组件映射

<!--
骨架中未识别的 INSTANCE 节点会附带 // INSTANCE figma-node: xxx 注释。
翻译时按本表决策：
  1. 文件路径为 "-"  → 已知基础组件，直接使用
  2. 文件路径有值    → 已生成的业务组件，直接 import
  3. 未匹配          → 询问用户是否生成
-->

| Figma 组件名（模糊匹配） | 项目组件 | 文件路径 | 备注 |
|---|---|---|---|
| Icon* / Arrow* | `CustomImageIcon` | - | 基础组件 |
| Button* | `Button` | - | 基础组件 |
| IconButton* | `EchoIconButton` | - | 基础组件 |
| AppBar* / NavigationBar* | `EchoAppBar` | - | 基础组件 |
| Input* / FormItem* / FormField* | `CustomFormField` | - | 基础组件 |
| TextArea* | `CustomFormTextAreaWidget` | - | 基础组件 |
| Dropdown* / Select* | `CustomDropdownWidget` | - | 基础组件 |
| Stepper* | `NumStepper` | - | 步进器 |
| Tag* | `CustomTagWidget` / `EchoTag` | - | 基础组件 |
| Image* / Cover* | `QDCachedNetworkImage` | - | 网络图片加载 |
| Spacer* / Gap* / Space* | `AppSpacing` | - | 间距组件 |
| Dialog* / Alert* / Confirm* | `EchoDialog` | - | 弹窗组件 |
| Divider* | `Divider` | - | Flutter 原生 |
| TabBar* / Tabs* | `EchoTabBar` | - | 基础组件 |

<!-- 每次递归生成新组件后，在此补充一行 -->

---

## 7. MVVM 页面结构

### 标准页面（CustomBasePage）

```dart
// ─── Page ─────────────────────────────────────────
class XxxPage extends CustomBasePage {
  XxxPage({super.key, super.params});
  @override
  State<StatefulWidget> createState() => _XxxPageState();
}

class _XxxPageState extends CustomBasePageState<XxxPage, XxxViewModel> {
  @override
  XxxViewModel generateViewModel(dynamic arg) => XxxViewModel();

  @override
  String? get titleName => '页面标题';

  @override
  CustomSkeletonWidget? skeletonWidget() =>
    XxxSkeletonWidget(shownSkeleton: true, child: Container());

  @override
  Widget buildContent(BuildContext context) {
    return SingleChildScrollView(
      child: Column(children: [ /* 页面内容 */ ]),
    );
  }

  @override
  PreferredSizeWidget? buildAppBar() => EchoAppBar(
    center: EchoAppBarCenterText(title: '页面标题'),
  );

  @override
  Widget? buildCustomBottomBar() => /* 底部按钮区 */;
}

// ─── ViewModel ────────────────────────────────────
class XxxViewModel extends CustomBasePageViewModel {
  @override
  Future<void> loadPageData() async {
    // showSkeleton 自动管理
  }
}
```

### 分页列表页（CustomBaseListPage）

```dart
class _XxxListPageState extends CustomBaseListPageState<XxxListPage, XxxListVM> {
  @override
  Widget buildItem(BuildContext context, int index) {
    return XxxItemWidget(item: viewModel.dataList[index]);
  }
}

class XxxListVM extends CustomBasePageRefreshListViewModel<XxxModel, List<XxxModel>> {
  @override
  Future<HttpResponse<List<XxxModel>>> obtainResponse(int offset) =>
    api.getList(offset: offset, limit: limit);

  @override
  List<XxxModel> responseToList(List<XxxModel>? e) => e ?? [];
}
```

### 模块目录结构

```
lib/Modules/xxx/
├── pages/        # CustomBasePage 子类
├── widgets/      # 子组件 Widget
├── view_models/  # ViewModel
├── models/       # 数据模型
└── track/        # 埋点（可选）
```

---

## 8. 列表与滚动

| 场景 | 组件 |
|---|---|
| 简单滚动 | `SingleChildScrollView` + `Column` |
| 分页列表 | `CustomBaseListPage`（内部 `CustomScrollView + SliverList.separated`） |
| 横向列表 | `ListView.builder(scrollDirection: Axis.horizontal)` |
| 网格 | `GridView.count` / `SliverGrid.count` |
| Tab + 列表 | `NestedScrollView` + `SliverAppBar` + `TabBar` |

---

## 9. 骨架屏

继承 `CustomSkeletonWidget`（来自 `custom_components`）：

```dart
class XxxSkeletonWidget extends CustomSkeletonWidget {
  XxxSkeletonWidget({required super.shownSkeleton, required super.child});

  @override
  Widget obtainSkeletonWidget(BuildContext context) {
    return Column(children: [
      SkeletonDefaultWidget(),
      const SizedBox(height: 8),
      SkeletonDefaultWidget(),
    ]);
  }
}
```

预制组件：`SkeletonDefaultWidget`、`SkeletonParagraphWidget`、`SkeletonProfileDarkWidget`、`SkeletonSlidesSqauresWidget`

文件放在 `lib/Common/skeleton/`，命名 `xxx_skeleton_widget.dart`。

---

## 10. 国际化

```dart
CustomLocalizationsManager.current(context).xxx
```

---

## 11. 注意事项

- 宽度优先用 `double.infinity` 或父级约束，不写死像素值
- 图标尺寸映射为 `CustomIconSize.sizeN`；超过 32pt 用图片
- 动态数据加 `// TODO: 接口` 注释
- **颜色禁止 `AppColors`**，必须用 `context.appTheme.qd.xxx` 或 `AppColor.qd.xxx`
- **文本样式禁止 `TextStyles`**，必须用 `CustomTextStyles.generateStyle()`
- 间距使用 `AppSpacing`
- 避免不必要的 `Container`，使用 `SizedBox` 替代纯空间占位
- 必须使用 `package:kuril_flutter/...` 路径导入
- 禁止 `print`，使用 `debugPrint`
- 禁止 `async void`，async 函数应返回 `Future`
- 文本不随系统缩放（`TextScaler.linear(1.0)`）
- 多语言：中文（zh）、英文（en）、泰语（th）
- 图片资源仅提供 3.0x 分辨率
