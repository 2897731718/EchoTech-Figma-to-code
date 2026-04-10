# update-context

更新项目的 figma-context.md，将工具最新的基础规范合并进来，保留项目自定义内容。

## 步骤

**第一步：获取最新模板**

```bash
npx figma-to-code@latest show-template --ui=custom-flutter
```

如果上述命令不可用，直接读取工具包中的模板文件：

```bash
node -e "const p=require('path'),f=require('fs');const r=p.dirname(require.resolve('figma-to-code/package.json'));console.log(f.readFileSync(p.join(r,'template/figma-context-custom-flutter.md'),'utf-8'))"
```

将输出保存为「最新模板」。

**第二步：读取当前项目配置**

读取 `.claude/figma-context.md`，记为「当前配置」。

**第三步：识别差异**

对比「最新模板」和「当前配置」，分为两类内容：

**基础规范**（跟随工具更新）：
- 颜色系统（Token 定义、使用规范）
- 排版系统（Typography 枚举、文本样式用法）
- 间距规范（AppSpacing 用法）
- 图标系统（CustomImageIcon 用法）
- 组件库用法（Button、EchoDialog、QDCachedNetworkImage 等基础组件的参数和示例）
- MVVM 页面结构（基类说明、代码模板）
- 列表与滚动（页面基类选择）
- 骨架屏（CustomSkeletonWidget 用法）
- 国际化用法
- 注意事项

**项目自定义**（保留不动）：
- 业务组件映射表中用户手动添加的行
- 用户自定义的注意事项补充
- 项目特有的 Token 映射

**第四步：智能合并**

- 基础规范章节：用最新模板**替换**当前内容
- 业务组件映射表：**保留**用户手动添加的行（备注列不是「基础组件」的行），合并模板中新增的基础组件行
- 用户自定义内容：**保留**

**第五步：展示变更并确认**

向用户展示：
1. 新增了哪些内容（如新组件用法、新 Token）
2. 更新了哪些内容（如组件参数变更）
3. 保留了哪些自定义内容

用户确认后写入 `.claude/figma-context.md`。

## 注意事项

- 不要删除用户手动添加的任何内容
- 如果无法判断某行是用户添加的还是模板自带的，保留它
- 合并后确保 markdown 格式正确
