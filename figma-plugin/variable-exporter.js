/**
 * Figma Variable Exporter 插件
 *
 * 导出所有节点上绑定的 Variable 名称到 sharedPluginData，
 * 绕过 Enterprise API 限制（插件 API 无权限限制）。
 *
 * 导出内容：
 * - i18n: TEXT 节点的 characters 变量（i18n key）
 * - colors: fills/strokes 上绑定的颜色变量（Design Token）
 * - spacing: itemSpacing/padding 上绑定的间距变量
 * - radius: cornerRadius 上绑定的圆角变量
 *
 * REST API 通过 plugin_data=shared 参数读取。
 *
 * 使用方式：选中 Frame → 运行插件（或不选默认整页）
 */

var NAMESPACE = 'variable_exporter'

var selection = figma.currentPage.selection
var roots = selection.length > 0 ? selection : [figma.currentPage]

// variableId → variableName 映射
var variableMap = {}

function resolveVariable(variableId) {
  if (!variableId) return null
  if (variableMap[variableId]) return variableMap[variableId]

  try {
    var variable = figma.variables.getVariableById(variableId)
    if (variable) {
      variableMap[variableId] = variable.name
      return variable.name
    }
  } catch (e) {}

  return null
}

function walk(node) {
  try {
    var bv = node.boundVariables
    if (!bv) {
      if ('children' in node) {
        for (var i = 0; i < node.children.length; i++) {
          walk(node.children[i])
        }
      }
      return
    }

    // TEXT 节点的 characters（i18n）
    if (node.type === 'TEXT' && bv.characters) {
      resolveVariable(bv.characters.id)
    }

    // fills 颜色变量
    if (bv.fills && Array.isArray(bv.fills)) {
      for (var f = 0; f < bv.fills.length; f++) {
        var fill = bv.fills[f]
        if (fill && fill.id) resolveVariable(fill.id)
      }
    }

    // 单个 fill 颜色（某些节点的 boundVariables 格式不同）
    if (bv.fill && bv.fill.id) {
      resolveVariable(bv.fill.id)
    }

    // strokes 颜色变量
    if (bv.strokes && Array.isArray(bv.strokes)) {
      for (var s = 0; s < bv.strokes.length; s++) {
        var stroke = bv.strokes[s]
        if (stroke && stroke.id) resolveVariable(stroke.id)
      }
    }

    // 间距变量
    if (bv.itemSpacing && bv.itemSpacing.id) resolveVariable(bv.itemSpacing.id)
    if (bv.paddingTop && bv.paddingTop.id) resolveVariable(bv.paddingTop.id)
    if (bv.paddingRight && bv.paddingRight.id) resolveVariable(bv.paddingRight.id)
    if (bv.paddingBottom && bv.paddingBottom.id) resolveVariable(bv.paddingBottom.id)
    if (bv.paddingLeft && bv.paddingLeft.id) resolveVariable(bv.paddingLeft.id)

    // 圆角变量
    if (bv.cornerRadius && bv.cornerRadius.id) resolveVariable(bv.cornerRadius.id)
    if (bv.rectangleCornerRadii) {
      var keys = ['RECTANGLE_TOP_LEFT_CORNER_RADIUS', 'RECTANGLE_TOP_RIGHT_CORNER_RADIUS',
                  'RECTANGLE_BOTTOM_LEFT_CORNER_RADIUS', 'RECTANGLE_BOTTOM_RIGHT_CORNER_RADIUS']
      for (var k = 0; k < keys.length; k++) {
        var rv = bv.rectangleCornerRadii[keys[k]]
        if (rv && rv.id) resolveVariable(rv.id)
      }
    }

    // opacity 变量
    if (bv.opacity && bv.opacity.id) resolveVariable(bv.opacity.id)

    // 同时遍历 Paint 级别的 boundVariables（fills 数组里每个 Paint 可能有自己的 boundVariables）
    if (node.fills && Array.isArray(node.fills)) {
      for (var fi = 0; fi < node.fills.length; fi++) {
        var paint = node.fills[fi]
        if (paint.boundVariables && paint.boundVariables.color && paint.boundVariables.color.id) {
          resolveVariable(paint.boundVariables.color.id)
        }
      }
    }

    if (node.strokes && Array.isArray(node.strokes)) {
      for (var si = 0; si < node.strokes.length; si++) {
        var strokePaint = node.strokes[si]
        if (strokePaint.boundVariables && strokePaint.boundVariables.color && strokePaint.boundVariables.color.id) {
          resolveVariable(strokePaint.boundVariables.color.id)
        }
      }
    }

    // 递归子节点
    if ('children' in node) {
      for (var c = 0; c < node.children.length; c++) {
        walk(node.children[c])
      }
    }
  } catch (e) {}
}

// 遍历所有选中节点
for (var r = 0; r < roots.length; r++) {
  walk(roots[r])
}

var count = Object.keys(variableMap).length

// 读取已存储的映射，合并新结果
var existing = figma.root.getSharedPluginData(NAMESPACE, 'variableMap')
var merged = existing ? JSON.parse(existing) : {}
var ids = Object.keys(variableMap)
for (var j = 0; j < ids.length; j++) {
  merged[ids[j]] = variableMap[ids[j]]
}
var totalCount = Object.keys(merged).length

// 写入文件级 sharedPluginData
figma.root.setSharedPluginData(NAMESPACE, 'variableMap', JSON.stringify(merged))

console.log(JSON.stringify(merged, null, 2))

if (count === 0) {
  figma.notify('未找到新变量（已存储 ' + totalCount + ' 个）')
} else {
  figma.notify('新增 ' + count + ' 个，共 ' + totalCount + ' 个变量已写入文件')
}

figma.closePlugin()
