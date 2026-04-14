import type {
  ComponentsResponse,
  FileResponse,
  MeResponse,
  StylesResponse,
  VariablesResponse
} from './types'

const FIGMA_API_BASE = 'https://api.figma.com/v1'
const RATE_LIMIT_RETRY_DELAY = 1000
const MAX_RETRIES = 3

export class FigmaAPIClient {
  private readonly pat: string
  private readonly baseUrl: string

  constructor(pat: string) {
    if (!pat || pat.trim().length === 0) {
      throw new Error('Figma PAT is required')
    }
    this.pat = pat.trim()
    this.baseUrl = FIGMA_API_BASE
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const headers = new Headers(options.headers)
    headers.set('X-Figma-Token', this.pat)

    let retries = 0
    while (retries <= MAX_RETRIES) {
      try {
        const response = await fetch(url, {
          ...options,
          headers
        })

        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After')
          const delay = retryAfter
            ? parseInt(retryAfter, 10) * 1000
            : RATE_LIMIT_RETRY_DELAY * (retries + 1)

          if (retries < MAX_RETRIES) {
            await new Promise((resolve) => setTimeout(resolve, delay))
            retries++
            continue
          }

          throw new Error(
            'Rate limit exceeded. Please wait before making more requests.'
          )
        }

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error')
          throw new Error(
            `Figma API error (${response.status}): ${errorText}`
          )
        }

        return await response.json()
      } catch (error) {
        // Rate limit 和 HTTP 错误（4xx/5xx）不重试
        if (error instanceof Error && (
          error.message.includes('Rate limit') ||
          error.message.startsWith('Figma API error')
        )) {
          throw error
        }

        if (retries < MAX_RETRIES) {
          retries++
          await new Promise((resolve) =>
            setTimeout(resolve, RATE_LIMIT_RETRY_DELAY * retries)
          )
          continue
        }

        throw error
      }
    }

    throw new Error('Request failed after maximum retries')
  }

  async validateToken(): Promise<boolean> {
    try {
      await this.request<MeResponse>('/me')
      return true
    } catch {
      return false
    }
  }

  async getFile(fileKey: string, options?: { ids?: string[]; depth?: number; pluginData?: string }): Promise<FileResponse> {
    const params = new URLSearchParams()
    if (options?.ids) {
      params.append('ids', options.ids.join(','))
    }
    if (options?.depth !== undefined) {
      params.append('depth', options.depth.toString())
    }
    if (options?.pluginData) {
      params.append('plugin_data', options.pluginData)
    }

    const query = params.toString()
    const endpoint = `/files/${fileKey}${query ? `?${query}` : ''}`

    return this.request<FileResponse>(endpoint)
  }

  async getComponents(fileKey: string): Promise<ComponentsResponse> {
    return this.request<ComponentsResponse>(`/files/${fileKey}/components`)
  }

  async getStyles(fileKey: string): Promise<StylesResponse> {
    return this.request<StylesResponse>(`/files/${fileKey}/styles`)
  }

  async getVariables(fileKey: string): Promise<VariablesResponse> {
    return this.request<VariablesResponse>(`/files/${fileKey}/variables/local`)
  }

  async getMe(): Promise<MeResponse> {
    return this.request<MeResponse>('/me')
  }
}
