import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

describe('LLM provider config', () => {
  it('keeps existing providers and adds MiniMax to the supported provider set', () => {
    const configSource = readServerSource('src/config.ts')
    const providerSource = readServerSource('src/llm/provider.ts')

    expect(configSource).toContain("'openai' | 'anthropic' | 'deepseek' | 'moonshot' | 'minimax'")
    expect(providerSource).toContain("['openai', 'anthropic', 'deepseek', 'moonshot', 'minimax']")
  })

  it('resolves MiniMax from env with OpenAI-compatible defaults', () => {
    const configSource = readServerSource('src/config.ts')

    expect(configSource).toContain('MINIMAX_API_KEY')
    expect(configSource).toContain('MINIMAX_BASE_URL')
    expect(configSource).toContain('https://api.minimax.io/v1')
    expect(configSource).toContain('MINIMAX_MODEL')
    expect(configSource).toContain('MiniMax-M3')
  })

  it('creates the MiniMax chat model through the OpenAI-compatible chat path', () => {
    const providerSource = readServerSource('src/llm/provider.ts')
    const minimaxBranch =
      /case 'minimax':\s*return createOpenAI\(\{ apiKey: cfg\.apiKey, baseURL: cfg\.baseURL \}\)\.chat\(cfg\.model\)/u

    expect(providerSource).toMatch(minimaxBranch)
  })
})

function readServerSource(relativePath: string): string {
  return readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '..', relativePath), 'utf8')
}
