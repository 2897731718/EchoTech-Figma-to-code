import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { FigmaAPIClient } from '../src/api/client'
import type { FileResponse, MeResponse } from '../src/api/types'

let mockFetch: ReturnType<typeof vi.fn>

describe('FigmaAPIClient', () => {
  beforeEach(() => {
    mockFetch = vi.fn()
    vi.spyOn(globalThis, 'fetch').mockImplementation(mockFetch)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('constructor', () => {
    it('should create client with valid PAT', () => {
      const client = new FigmaAPIClient('test-token')
      expect(client).toBeInstanceOf(FigmaAPIClient)
    })

    it('should throw error with empty PAT', () => {
      expect(() => new FigmaAPIClient('')).toThrow('Figma PAT is required')
    })
  })

  describe('validateToken', () => {
    it('should return true for valid token', async () => {
      const mockResponse: MeResponse = {
        id: '123',
        email: 'test@example.com',
        username: 'testuser',
        img_url: 'https://example.com/img.png',
        handle: 'testuser'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      })

      const client = new FigmaAPIClient('test-token')
      const result = await client.validateToken()

      expect(result).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.figma.com/v1/me',
        expect.objectContaining({
          headers: expect.objectContaining({
            get: expect.any(Function)
          })
        })
      )
    })

    it('should return false for invalid token', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized'
      })

      const client = new FigmaAPIClient('invalid-token')
      const result = await client.validateToken()

      expect(result).toBe(false)
    })
  })

  describe('getFile', () => {
    it('should fetch file data', async () => {
      const mockFileResponse: FileResponse = {
        name: 'Test File',
        role: 'owner',
        lastModified: '2024-01-01T00:00:00Z',
        editorType: 'figma',
        thumbnailUrl: '',
        version: '1',
        document: {
          id: '0:0',
          name: 'Document',
          type: 'DOCUMENT',
          children: []
        },
        components: {},
        componentSets: {},
        schemaVersion: 0,
        styles: {}
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockFileResponse
      })

      const client = new FigmaAPIClient('test-token')
      const result = await client.getFile('test-file-key')

      expect(result).toEqual(mockFileResponse)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.figma.com/v1/files/test-file-key',
        expect.any(Object)
      )
      console.log(result)
      console.log(mockFetch.mock.calls)
    })

    it('should handle query parameters', async () => {
      const mockFileResponse: FileResponse = {
        name: 'Test File',
        role: 'owner',
        lastModified: '2024-01-01T00:00:00Z',
        editorType: 'figma',
        thumbnailUrl: '',
        version: '1',
        document: {
          id: '0:0',
          name: 'Document',
          type: 'DOCUMENT',
          children: []
        },
        components: {},
        componentSets: {},
        schemaVersion: 0,
        styles: {}
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockFileResponse
      })

      const client = new FigmaAPIClient('test-token')
      await client.getFile('test-file-key', { ids: ['1:2'], depth: 2 })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.figma.com/v1/files/test-file-key?ids=1%3A2&depth=2',
        expect.any(Object)
      )
    })
  })

  describe('rate limiting', () => {
    it('should retry on 429 status', async () => {
      const mockResponse: MeResponse = {
        id: '123',
        email: 'test@example.com',
        username: 'testuser',
        img_url: '',
        handle: 'testuser'
      }

      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          headers: {
            get: () => '1'
          }
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockResponse
        })

      const client = new FigmaAPIClient('test-token')
      const result = await client.validateToken()

      expect(result).toBe(true)
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('error handling', () => {
    it('should throw error on API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'File not found'
      })

      const client = new FigmaAPIClient('test-token')

      await expect(client.getFile('invalid-key')).rejects.toThrow(
        'Figma API error (404)'
      )
    })
  })
})
