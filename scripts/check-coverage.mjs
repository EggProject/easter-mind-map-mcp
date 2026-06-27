#!/usr/bin/env bun

import { existsSync, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { error, log } from 'node:console'
import process from 'node:process'

const coverageDir = 'coverage'
const lcovPath = `${coverageDir}/lcov.info`
const testArgs = [
  'test',
  './test',
  '--coverage',
  '--coverage-reporter=lcov',
  '--coverage-reporter=text',
  `--coverage-dir=${coverageDir}`,
]

const result = spawnSync('bun', testArgs, { stdio: 'inherit' })
if (result.status !== 0) process.exit(result.status ?? 1)
if (!existsSync(lcovPath)) {
  error(`Coverage failed: ${lcovPath} was not generated.`)
  process.exit(1)
}

const totals = parseLcov(readFileSync(lcovPath, 'utf8'))
if (totals.files === 0 || totals.lines.found === 0) {
  error('Coverage failed: no instrumented source lines were found.')
  process.exit(1)
}

const failures = []
for (const [label, metric] of Object.entries({
  lines: totals.lines,
  functions: totals.functions,
  branches: totals.branches,
})) {
  if (metric.found > 0 && metric.hit !== metric.found) {
    failures.push(`${label}: ${metric.hit}/${metric.found}`)
  }
}

if (failures.length > 0) {
  error(`Coverage failed: 100% required (${failures.join(', ')}).`)
  process.exit(1)
}

log(
  `Coverage gate passed: 100% across ${totals.files} source files (${totals.lines.hit}/${totals.lines.found} lines, ${totals.functions.hit}/${totals.functions.found} functions).`,
)

function parseLcov(lcov) {
  const totals = {
    files: 0,
    lines: { found: 0, hit: 0 },
    functions: { found: 0, hit: 0 },
    branches: { found: 0, hit: 0 },
  }

  for (const record of lcov.split('end_of_record')) {
    if (!record.includes('\nSF:')) continue
    totals.files += 1
    for (const line of record.trim().split('\n')) {
      addMetric(line, 'LF:', totals.lines, 'found')
      addMetric(line, 'LH:', totals.lines, 'hit')
      addMetric(line, 'FNF:', totals.functions, 'found')
      addMetric(line, 'FNH:', totals.functions, 'hit')
      addMetric(line, 'BRF:', totals.branches, 'found')
      addMetric(line, 'BRH:', totals.branches, 'hit')
    }
  }

  return totals
}

function addMetric(line, prefix, metric, field) {
  if (!line.startsWith(prefix)) return
  metric[field] += Number.parseInt(line.slice(prefix.length), 10)
}
