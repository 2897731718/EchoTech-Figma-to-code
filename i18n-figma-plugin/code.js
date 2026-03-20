var NAMESPACE = 'i18n_variable_exporter'
var KEY = 'variableMap'

var selection = figma.currentPage.selection
var roots = selection.length > 0 ? selection : [figma.currentPage]

var result = {}

function walk(node) {
  try {
    if (node.type === 'TEXT' && node.boundVariables && node.boundVariables.characters) {
      var variableId = node.boundVariables.characters.id
      if (!result[variableId]) {
        var variable = figma.variables.getVariableById(variableId)
        result[variableId] = variable ? variable.name : '(unknown)'
      }
    }
    if ('children' in node) {
      for (var i = 0; i < node.children.length; i++) {
        walk(node.children[i])
      }
    }
  } catch (e) {}
}

for (var i = 0; i < roots.length; i++) {
  walk(roots[i])
}

var count = Object.keys(result).length

// 读取已存储的映射，合并新结果
var existing = figma.root.getSharedPluginData(NAMESPACE, KEY)
var merged = existing ? JSON.parse(existing) : {}
var keys = Object.keys(result)
for (var j = 0; j < keys.length; j++) {
  merged[keys[j]] = result[keys[j]]
}
var totalCount = Object.keys(merged).length

// 写入文件级 sharedPluginData
figma.root.setSharedPluginData(NAMESPACE, KEY, JSON.stringify(merged))

console.log(JSON.stringify(merged, null, 2))

if (count === 0) {
  figma.notify('未找到新的 i18n 变量（已存储 ' + totalCount + ' 个）')
} else {
  figma.notify('新增 ' + count + ' 个，共 ' + totalCount + ' 个 i18n 变量已写入文件')
}

figma.closePlugin()
