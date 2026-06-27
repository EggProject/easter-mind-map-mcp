import { readFileSync, readdirSync } from 'node:fs'
import { dirname, extname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  captureClaudeTmuxPane,
  parseClaudePane,
  sendClaudeTmuxInput,
  startClaudeTmuxSession,
  stopClaudeTmuxSession,
  toClaudeTmuxSessionName,
} from '../src/claude-code/tmux'
import type { TmuxCommandRunner } from '../src/claude-code/tmux'

describe('Claude Code tmux integration', () => {
  it('builds a deterministic tmux lifecycle', async () => {
    const calls: string[][] = []
    const runner: TmuxCommandRunner = async (args) => {
      calls.push([...args])
      return {
        stdout: args[0] === 'capture-pane' ? '\u001B[32mready\u001B[0m\nlast line\n' : '',
        stderr: '',
        exitCode: 0,
      }
    }

    const sessionName = toClaudeTmuxSessionName('plan 123/main')
    const session = await startClaudeTmuxSession({
      sessionName,
      workingDirectory: '/tmp/mindgenius',
      runner,
    })
    await sendClaudeTmuxInput(session, 'create a mind map', { runner })
    const snapshot = await captureClaudeTmuxPane(session, { runner })
    await stopClaudeTmuxSession(session, { runner })

    expect(session).toEqual({
      sessionName: 'mindgenius-claude-plan-123-main',
      targetPane: 'mindgenius-claude-plan-123-main:0.0',
    })
    expect(calls).toEqual([
      ['new-session', '-d', '-s', 'mindgenius-claude-plan-123-main', '-c', '/tmp/mindgenius', 'claude'],
      ['send-keys', '-t', 'mindgenius-claude-plan-123-main:0.0', '-l', 'create a mind map'],
      ['send-keys', '-t', 'mindgenius-claude-plan-123-main:0.0', 'Enter'],
      ['capture-pane', '-p', '-J', '-t', 'mindgenius-claude-plan-123-main:0.0'],
      ['kill-session', '-t', 'mindgenius-claude-plan-123-main'],
    ])
    expect(snapshot).toMatchObject({
      text: 'ready\nlast line',
      lines: ['ready', 'last line'],
      lastNonEmptyLine: 'last line',
    })
  })

  it('rejects session names and Claude commands that cannot be deterministic', async () => {
    const runner: TmuxCommandRunner = async () => ({ stdout: '', stderr: '', exitCode: 0 })

    await expect(startClaudeTmuxSession({
      sessionName: 'bad name',
      runner,
    })).rejects.toThrow('Invalid tmux session name')

    await expect(startClaudeTmuxSession({
      sessionName: 'mindgenius-claude-valid',
      claudeCommand: ['claude', '-p'].join(' '),
      runner,
    })).rejects.toThrow('single executable path')
  })

  it('extracts a structured pane snapshot from raw tmux output', () => {
    expect(parseClaudePane('first\n\nsecond  \n')).toEqual({
      raw: 'first\n\nsecond  \n',
      text: 'first\n\nsecond',
      lines: ['first', '', 'second'],
      lastNonEmptyLine: 'second',
    })
  })
})

describe('Claude Code static safety checks', () => {
  it('keeps the server source tmux-only and free of banned Claude Code integrations', () => {
    const source = readServerCode()
    const cliName = 'claude'
    const shortPrintMode = new RegExp(`\\b${cliName}\\s+-p\\b`, 'u')
    const longPrintMode = new RegExp(`\\b${cliName}\\s+--print\\b`, 'u')
    const agentSdkPackage = ['@anthropic-ai', 'claude-code'].join('/')

    expect(source).toContain('tmux')
    expect(source).not.toMatch(shortPrintMode)
    expect(source).not.toMatch(longPrintMode)
    expect(source).not.toContain(agentSdkPackage)
  })
})

function readServerCode(): string {
  const serverRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const files = [
    ...listFiles(resolve(serverRoot, 'src')),
    resolve(serverRoot, 'package.json'),
  ]

  return files
    .filter(file => ['.ts', '.tsx', '.js', '.mjs', '.json'].includes(extname(file)))
    .map(file => readFileSync(file, 'utf8'))
    .join('\n')
}

function listFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = resolve(directory, entry.name)
    return entry.isDirectory() ? listFiles(fullPath) : [fullPath]
  })
}
