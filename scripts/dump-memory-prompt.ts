#!/usr/bin/env bun
/**
 * Dump the memory section that goes into the system prompt.
 *
 * "满血" defaults (combined private + team):
 *   - buildCombinedMemoryPrompt (TEAMMEM combined mode)
 *   - MEMORY.md two-step index (skipIndex = false, moth_copse off)
 *   - "## Searching past context" (tengu_coral_fern on)
 *
 * Usage:
 *   bun run scripts/dump-memory-prompt.ts
 *   bun run scripts/dump-memory-prompt.ts -o /tmp/memory-prompt.txt
 *   bun run scripts/dump-memory-prompt.ts --variant auto-only
 *   bun run scripts/dump-memory-prompt.ts --skip-index
 *   bun run scripts/dump-memory-prompt.ts --no-past-context
 *   bun --feature TEAMMEM scripts/dump-memory-prompt.ts --via-load-memory-prompt
 */
import { join } from 'node:path'
import { mock } from 'bun:test'

const PROJECT_ROOT = join(import.meta.dir, '..')
const MOCK_CWD = PROJECT_ROOT
const MOCK_GIT_ROOT = PROJECT_ROOT

type Variant = 'combined' | 'auto-only' | 'kairos'

function parseArgs(): {
  outPath: string
  variant: Variant
  skipIndex: boolean
  pastContextSearch: boolean
  viaLoadMemoryPrompt: boolean
} {
  const args = process.argv.slice(2)
  let outPath = join(import.meta.dir, 'memory-prompt-dump.md')
  let variant: Variant = 'combined'
  let skipIndex = false
  let pastContextSearch = true
  let viaLoadMemoryPrompt = false

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '-o' || arg === '--out') {
      outPath = args[++i] ?? outPath
    } else if (arg === '--variant') {
      const v = args[++i]
      if (v === 'combined' || v === 'auto-only' || v === 'kairos') {
        variant = v
      } else {
        throw new Error(`Unknown --variant: ${v}`)
      }
    } else if (arg === '--skip-index') {
      skipIndex = true
    } else if (arg === '--no-past-context') {
      pastContextSearch = false
    } else if (arg === '--via-load-memory-prompt') {
      viaLoadMemoryPrompt = true
    } else if (arg === '-h' || arg === '--help') {
      console.log('See scripts/dump-memory-prompt.ts file header for usage.')
      process.exit(0)
    } else {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }

  return { outPath, variant, skipIndex, pastContextSearch, viaLoadMemoryPrompt }
}

const { stateMock } = await import('../tests/mocks/state.ts')

function installMocks(opts: {
  skipIndex: boolean
  pastContextSearch: boolean
  kairosActive: boolean
  teamMemoryEnabled: boolean
}): void {
  mock.module('src/bootstrap/state.js', () => ({
    ...stateMock(),
    getProjectRoot: () => MOCK_CWD,
    getOriginalCwd: () => MOCK_CWD,
    getCwdState: () => MOCK_CWD,
    getKairosActive: () => opts.kairosActive,
  }))
  mock.module('src/utils/git.js', () => ({
    findCanonicalGitRoot: () => MOCK_GIT_ROOT,
    getIsGit: async () => true,
  }))
  mock.module('src/utils/envUtils.js', () => ({
    getClaudeConfigHomeDir: () => join(process.env.HOME ?? '/tmp', '.claude'),
    isEnvTruthy: (v: string | undefined) => v === '1' || v === 'true',
    isEnvDefinedFalsy: () => false,
  }))
  mock.module('src/utils/settings/settings.js', () => ({
    getInitialSettings: () => ({ autoMemoryEnabled: true }),
    getSettingsForSource: () => ({}),
  }))
  mock.module('src/utils/debug.js', () => ({
    logForDebugging: () => {},
  }))
  mock.module('src/services/analytics/index.js', () => ({
    logEvent: () => {},
  }))
  mock.module('src/services/analytics/growthbook.js', () => ({
    getFeatureValue_CACHED_MAY_BE_STALE: (
      key: string,
      defaultValue: boolean,
    ) => {
      if (key === 'tengu_herring_clock') return opts.teamMemoryEnabled
      if (key === 'tengu_moth_copse') return opts.skipIndex
      if (key === 'tengu_coral_fern') return opts.pastContextSearch
      return defaultValue
    },
  }))
  mock.module('src/utils/embeddedTools.js', () => ({
    hasEmbeddedSearchTools: () => false,
  }))
  mock.module(
    '@claude-code-best/builtin-tools/tools/REPLTool/constants.js',
    () => ({ isReplModeEnabled: () => false }),
  )
  mock.module(
    '@claude-code-best/builtin-tools/tools/GrepTool/prompt.js',
    () => ({ GREP_TOOL_NAME: 'Grep' }),
  )
  mock.module('src/utils/sessionStorage.js', () => ({
    getProjectDir: (cwd: string) =>
      join(cwd, '.claude', 'projects', 'mock-slug'),
  }))
  mock.module('src/utils/FsOperations.js', () => ({
    getFsImplementation: () => ({
      mkdir: async () => {},
      readFileSync: () => '',
      readdir: async () => [],
    }),
  }))
}

const opts = parseArgs()
installMocks({
  skipIndex: opts.skipIndex,
  pastContextSearch: opts.pastContextSearch,
  kairosActive: opts.variant === 'kairos',
  teamMemoryEnabled: opts.variant === 'combined',
})

let prompt: string | null = null
let label: string

if (opts.viaLoadMemoryPrompt) {
  const { loadMemoryPrompt } = await import('../src/memdir/memdir.js')
  prompt = await loadMemoryPrompt()
  label = `loadMemoryPrompt() [TEAMMEM compile=${typeof Bun !== 'undefined'}]`
} else if (opts.variant === 'combined') {
  const { buildCombinedMemoryPrompt } = await import(
    '../src/memdir/teamMemPrompts.js'
  )
  prompt = buildCombinedMemoryPrompt(undefined, opts.skipIndex)
  label = 'buildCombinedMemoryPrompt()'
} else if (opts.variant === 'auto-only') {
  const { buildMemoryLines, ENTRYPOINT_NAME } = await import(
    '../src/memdir/memdir.js'
  )
  const { getAutoMemPath } = await import('../src/memdir/paths.js')
  const autoDir = getAutoMemPath()
  prompt = buildMemoryLines('Memory', autoDir, undefined, opts.skipIndex).join(
    '\n',
  )
  label = `buildMemoryLines() [entrypoint=${ENTRYPOINT_NAME}]`
} else {
  const { buildAssistantDailyLogPrompt } = await import(
    '../src/memdir/memdir.js'
  )
  prompt = buildAssistantDailyLogPrompt(opts.skipIndex)
  label = 'buildAssistantDailyLogPrompt() [KAIROS]'
}

if (!prompt) {
  console.error('Prompt builder returned null (memory disabled or gated off).')
  process.exit(1)
}

const header = [
  '---',
  `generated: ${new Date().toISOString()}`,
  `source: ${label}`,
  `variant: ${opts.variant}`,
  `skip_index_moth_copse: ${opts.skipIndex}`,
  `past_context_search_coral_fern: ${opts.pastContextSearch}`,
  '---',
  '',
  '> Claude Code system prompt section: `systemPromptSection("memory")` → `loadMemoryPrompt()` → `buildCombinedMemoryPrompt()` when TEAMMEM + team GB are on.',
  '',
  '---',
  '',
].join('\n')

const full = `${header}${prompt}\n`
await Bun.write(opts.outPath, full)

console.log(`Written to ${opts.outPath}`)
console.log(
  `Chars: ${prompt.length} | Lines: ${prompt.split('\n').length} | ${label}`,
)
