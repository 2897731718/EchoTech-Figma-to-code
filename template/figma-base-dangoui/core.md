# CustomUI 核心规则

## 核心翻译原则

**骨架即真相，1:1 还原**：骨架输出什么，翻译结果就对应什么。禁止任何形式的"优化"、"简化"、"抽象"、"省略"。

禁止行为：
1. **禁止修改值**：骨架中的数值、尺寸、颜色等，直接使用，不得推算、合并、编公式
2. **禁止省略元素**：骨架中的每个元素都必须翻译，不得因为"看起来是装饰"而跳过
3. **禁止丢失属性**：元素上的 class、style、尺寸等属性，抽组件时必须透传为 props

判断标准：翻译完成后，骨架中的每个节点、每个属性、每个数值，都能在翻译结果中找到对应。找不到 = 翻译错误。

**不确定时问用户**，不要自己猜。

---

## 组件库

**包名**：`your-ui-lib`
**前缀**：`Du`（`<Button>` 和 `<Button>` 均可，统一用 `Du` 前缀）

### 组件引入

按需引入，在 `<script setup>` 顶部添加 import，**只引入当前文件实际用到的组件**：

```ts
// 示例：按需引入，不要全量引入
import { Button, DuInput, Icon, DuSelect, DuDivider } from 'your-ui-lib'
import { Form, FormItem, DuPopup, DuTag, DuSwitch, DuTextarea, DuUpload } from 'your-ui-lib'
```

---

## 生成规则

1. **宽度不写死**：容器统一用 `w-full`，只有图标、头像等固定尺寸元素保留 `w-[Npx]`
2. **颜色用 token**：优先用项目 token 表；找不到对应 token 时，用 UnoCSS hex 短语法替代（`text-[#f96464]` → `c-hex-f96464`，`bg-[#f96464]` → `bg-hex-f96464`，`border-[#f96464]` → `b-hex-f96464`），不要保留 `text-[#xxxxxx]` 写法
3. **动态内容**：静态文字改为 `{{ variable }}`，在 script 中声明对应 `ref`
4. **交互占位**：所有 `@click`、`@change` 加 `// TODO: 实现` 注释的方法
5. **图标名称**：从骨架 INSTANCE 名中提取，转为 kebab-case（`IconArrowRight` → `arrow-right`）
6. **extClass**：需要额外样式时用 `extClass` prop 而不是直接加 class
7. **单输入框禁止套 Form**：只有单个输入框或无 label 的输入框直接用 `DuInput`，不要包裹 `Form`
8. **Form 无 border prop**：行间分割线通过 `FormItem` 的 `showBorder` 控制，不要在 `Form` 上加 `border`
