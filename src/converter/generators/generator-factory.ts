import type { Framework, CodeGenerator } from './types'
import { HTMLGenerator } from './html-generator'
import { VueGenerator } from './vue-generator'
import { ReactGenerator } from './react-generator'
import { FlutterGenerator, type FlutterGeneratorOptions } from './flutter-generator'

export interface CreateGeneratorOptions {
  flutter?: FlutterGeneratorOptions
}

export function createGenerator(framework: Framework, options: CreateGeneratorOptions = {}): CodeGenerator {
  switch (framework) {
    case 'html':
      return new HTMLGenerator()
    case 'vue':
      return new VueGenerator()
    case 'react':
      return new ReactGenerator()
    case 'flutter':
      return new FlutterGenerator(options.flutter)
    default:
      return new HTMLGenerator()
  }
}
