import { FigmaAPIClient } from '../src/api/client'
import { readFigmaPAT } from '../src/pat/reader'

async function main() {
  const pat = await readFigmaPAT()
  const client = new FigmaAPIClient(pat)
  const file = await client.getFile('7Q64TkVLHt9a3ULdRJhdPv', { ids: ['69:12201'] })

  function inspect(node: any, depth = 0) {
    if (depth > 4) return
    const indent = '  '.repeat(depth)

    // layoutGrow (flex-1)
    if (node.layoutGrow !== undefined && node.layoutGrow > 0) {
      console.log(`${indent}[flex-1] ${node.name} (${node.type}) layoutGrow=${node.layoutGrow}`)
    }

    // boundVariables on fills
    if (node.boundVariables) {
      const bv = node.boundVariables as Record<string, any>
      for (const [key, val] of Object.entries(bv)) {
        if (key !== 'itemSpacing' && key !== 'cornerRadius') {
          console.log(`${indent}[var] ${node.name}.${key} = ${JSON.stringify(val)}`)
        }
      }
    }

    // fills with variable bindings
    if (node.fills) {
      for (const fill of node.fills) {
        if (fill.boundVariables) {
          console.log(`${indent}[fill-var] ${node.name} fill.boundVariables = ${JSON.stringify(fill.boundVariables)}`)
        }
      }
    }

    for (const c of node.children ?? []) inspect(c, depth + 1)
  }

  const pages = file.document.children ?? []
  for (const page of pages) {
    for (const child of (page as any).children ?? []) {
      inspect(child)
    }
  }
}

main().catch(console.error)
