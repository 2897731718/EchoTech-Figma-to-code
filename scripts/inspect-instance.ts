import { FigmaAPIClient } from '../src/api/client'
import { readFigmaPAT } from '../src/pat/reader'

async function main() {
  const pat = await readFigmaPAT()
  const client = new FigmaAPIClient(pat)
  const file = await client.getFile('7Q64TkVLHt9a3ULdRJhdPv', { ids: ['69:12201'] })

  function findInstances(node: any, depth = 0) {
    if (depth > 6) return
    if (node.type === 'INSTANCE') {
      console.log(`=== ${node.name} (id:${node.id}) ===`)
      if (node.componentProperties) {
        console.log('componentProperties:', JSON.stringify(node.componentProperties, null, 2).slice(0, 1000))
      }
      // 找直接子 TEXT 节点
      function findText(n: any, d = 0) {
        if (d > 3) return
        if (n.type === 'TEXT') console.log(`  TEXT: "${n.characters}"`)
        for (const c of n.children ?? []) findText(c, d + 1)
      }
      for (const c of node.children ?? []) findText(c)
      console.log('')
    }
    for (const c of node.children ?? []) findInstances(c, depth + 1)
  }

  const pages = file.document.children ?? []
  for (const page of pages) {
    for (const child of (page as any).children ?? []) {
      findInstances(child)
    }
  }
}

main().catch(console.error)
