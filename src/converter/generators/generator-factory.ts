import type { Framework, CodeGenerator } from './types'
import { HTMLGenerator } from './html-generator'
import { VueGenerator } from './vue-generator'
import { ReactGenerator } from './react-generator'

export function createGenerator(framework: Framework): CodeGenerator {
  switch (framework) {
    case 'html':
      return new HTMLGenerator()
    case 'vue':
      return new VueGenerator()
    case 'react':
      return new ReactGenerator()
    default:
      return new HTMLGenerator()
  }
}
