import { spawn } from 'node:child_process'

export const DEFAULT_CLAUDE_TMUX_TIMEOUT_MS = 30_000

export interface TmuxCommandResult {
  stdout: string
  stderr: string
  exitCode: number
}

export interface TmuxCommandOptions {
  cwd?: string
  env?: NodeJS.ProcessEnv
  timeoutMs?: number
  tmuxCommand?: string
}

export type TmuxCommandRunner = (
  args: readonly string[],
  options?: TmuxCommandOptions
) => Promise<TmuxCommandResult>

export interface ClaudeTmuxSession {
  sessionName: string
  targetPane: string
}

export interface ClaudeTmuxOptions {
  sessionName: string
  workingDirectory?: string
  claudeCommand?: string
  runner?: TmuxCommandRunner
  timeoutMs?: number
}

export interface ClaudePaneSnapshot {
  raw: string
  text: string
  lines: string[]
  lastNonEmptyLine: string | null
}

const SESSION_NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/
const CLAUDE_COMMAND_PATTERN = /^[^\s\0]+$/

export function toClaudeTmuxSessionName(id: string): string {
  const suffix = id
    .trim()
    .replace(/[^A-Za-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)

  return `mindgenius-claude-${suffix || 'session'}`
}

export async function runTmuxCommand(
  args: readonly string[],
  options: TmuxCommandOptions = {},
): Promise<TmuxCommandResult> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_CLAUDE_TMUX_TIMEOUT_MS

  return await new Promise((resolve, reject) => {
    const child = spawn(options.tmuxCommand ?? 'tmux', [...args], {
      cwd: options.cwd,
      env: options.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    let stdout = ''
    let stderr = ''
    let settled = false

    const timer = setTimeout(() => {
      if (settled)
        return
      settled = true
      child.kill('SIGTERM')
      reject(new Error(`tmux command timed out after ${timeoutMs}ms: ${args.join(' ')}`))
    }, timeoutMs)

    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', chunk => stdout += chunk)
    child.stderr.on('data', chunk => stderr += chunk)
    child.on('error', (error) => {
      if (settled)
        return
      settled = true
      clearTimeout(timer)
      reject(error)
    })
    child.on('close', (exitCode) => {
      if (settled)
        return
      settled = true
      clearTimeout(timer)
      const result = { stdout, stderr, exitCode: exitCode ?? 1 }
      if (result.exitCode === 0)
        resolve(result)
      else
        reject(new Error(`tmux exited ${result.exitCode}: ${stderr || stdout}`))
    })
  })
}

export async function startClaudeTmuxSession(options: ClaudeTmuxOptions): Promise<ClaudeTmuxSession> {
  assertSessionName(options.sessionName)
  const claudeCommand = options.claudeCommand ?? 'claude'
  assertClaudeCommand(claudeCommand)

  const args = ['new-session', '-d', '-s', options.sessionName]
  if (options.workingDirectory)
    args.push('-c', options.workingDirectory)
  args.push(claudeCommand)

  await run(options, args)
  return {
    sessionName: options.sessionName,
    targetPane: targetPane(options.sessionName),
  }
}

export async function sendClaudeTmuxInput(
  session: ClaudeTmuxSession,
  input: string,
  options: Pick<ClaudeTmuxOptions, 'runner' | 'timeoutMs'> = {},
): Promise<void> {
  assertSessionName(session.sessionName)
  await run(options, ['send-keys', '-t', session.targetPane, '-l', input])
  await run(options, ['send-keys', '-t', session.targetPane, 'Enter'])
}

export async function captureClaudeTmuxPane(
  session: ClaudeTmuxSession,
  options: Pick<ClaudeTmuxOptions, 'runner' | 'timeoutMs'> = {},
): Promise<ClaudePaneSnapshot> {
  assertSessionName(session.sessionName)
  const result = await run(options, ['capture-pane', '-p', '-J', '-t', session.targetPane])
  return parseClaudePane(result.stdout)
}

export async function stopClaudeTmuxSession(
  session: ClaudeTmuxSession,
  options: Pick<ClaudeTmuxOptions, 'runner' | 'timeoutMs'> = {},
): Promise<void> {
  assertSessionName(session.sessionName)
  await run(options, ['kill-session', '-t', session.sessionName])
}

export function parseClaudePane(raw: string): ClaudePaneSnapshot {
  const text = stripAnsi(raw).replace(/\s+$/u, '')
  const lines = text.split(/\r?\n/u).map(line => line.trimEnd())
  const lastNonEmptyLine = [...lines].reverse().find(line => line.trim().length > 0) ?? null

  return {
    raw,
    text,
    lines,
    lastNonEmptyLine,
  }
}

function targetPane(sessionName: string): string {
  return `${sessionName}:0.0`
}

function assertSessionName(sessionName: string): void {
  if (!SESSION_NAME_PATTERN.test(sessionName))
    throw new Error(`Invalid tmux session name: ${sessionName}`)
}

function assertClaudeCommand(command: string): void {
  if (!CLAUDE_COMMAND_PATTERN.test(command))
    throw new Error('Claude command must be a single executable path without arguments')
}

async function run(
  options: Pick<ClaudeTmuxOptions, 'runner' | 'timeoutMs'>,
  args: readonly string[],
): Promise<TmuxCommandResult> {
  return await (options.runner ?? runTmuxCommand)(args, { timeoutMs: options.timeoutMs })
}

function stripAnsi(value: string): string {
  return value.replace(new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'gu'), '')
}
