import { Plugin, MarkdownView } from 'obsidian';
import { Extension, Prec, RangeSetBuilder, StateField, Transaction } from '@codemirror/state';
import { EditorView, Decoration, DecorationSet } from '@codemirror/view';
import { SPL_COMMANDS, SPL_FUNCTIONS, SPL_KEYWORDS } from './spl-tokens';

interface Token {
  start: number;
  end: number;
  type: string;
}

// Pre-create decoration marks for each token type
const decorations = {
  keyword: Decoration.mark({ class: 'spl-keyword' }),
  builtin: Decoration.mark({ class: 'spl-builtin' }),
  atom: Decoration.mark({ class: 'spl-atom' }),
  operator: Decoration.mark({ class: 'spl-operator' }),
  punctuation: Decoration.mark({ class: 'spl-punctuation' }),
  string: Decoration.mark({ class: 'spl-string' }),
  number: Decoration.mark({ class: 'spl-number' }),
  variable: Decoration.mark({ class: 'spl-variable' }),
  meta: Decoration.mark({ class: 'spl-meta' }),
  comment: Decoration.mark({ class: 'spl-comment' }),
  bracket: Decoration.mark({ class: 'spl-bracket' }),
};

// Commands that take aggregation functions as arguments
const STATS_COMMANDS = new Set([
  'stats', 'eventstats', 'streamstats', 'sistats', 'mstats', 'tstats',
  'chart', 'timechart', 'sichart', 'sitimechart', 'geostats',
  'top', 'rare',
]);

/**
 * Tokenize SPL code with context-aware command and function detection
 * - Commands (blue) only appear after a pipe | or at the very start
 * - Functions (pink) only when followed by ( or in stats-like commands
 */
function tokenizeSPL(code: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;
  let expectCommand = true; // Start of code expects a command
  let inStatsCommand = false; // Track if we're in a stats-like command

  while (pos < code.length) {
    // Skip whitespace (but don't change expectCommand state)
    const wsMatch = code.slice(pos).match(/^\s+/);
    if (wsMatch) {
      pos += wsMatch[0].length;
      continue;
    }

    // Comment (triple-backtick wrapped) - ```comment text```
    if (code[pos] === '`' && code[pos + 1] === '`' && code[pos + 2] === '`') {
      const closeIdx = code.indexOf('```', pos + 3);
      if (closeIdx !== -1) {
        const end = closeIdx + 3;
        tokens.push({ start: pos, end, type: 'comment' });
        pos = end;
        continue;
      }
    }

    // Macro (backtick-wrapped) - but not triple backticks
    if (code[pos] === '`' && code[pos + 1] !== '`') {
      const macroMatch = code.slice(pos).match(/^`[^`\n]*`/);
      if (macroMatch) {
        tokens.push({ start: pos, end: pos + macroMatch[0].length, type: 'meta' });
        pos += macroMatch[0].length;
        expectCommand = false;
        continue;
      }
    }

    // Pipe operator - next word should be a command, reset stats context
    if (code[pos] === '|') {
      tokens.push({ start: pos, end: pos + 1, type: 'punctuation' });
      pos++;
      expectCommand = true;
      inStatsCommand = false;
      continue;
    }

    // Double-quoted string
    if (code[pos] === '"') {
      let end = pos + 1;
      while (end < code.length && code[end] !== '"' && code[end] !== '\n') {
        if (code[end] === '\\' && end + 1 < code.length) end++;
        end++;
      }
      if (end < code.length && code[end] === '"') end++;
      tokens.push({ start: pos, end, type: 'string' });
      pos = end;
      expectCommand = false;
      continue;
    }

    // Single-quoted string
    if (code[pos] === "'") {
      let end = pos + 1;
      while (end < code.length && code[end] !== "'" && code[end] !== '\n') {
        if (code[end] === '\\' && end + 1 < code.length) end++;
        end++;
      }
      if (end < code.length && code[end] === "'") end++;
      tokens.push({ start: pos, end, type: 'string' });
      pos = end;
      expectCommand = false;
      continue;
    }

    // Numbers - but not if followed by word characters (e.g., 15_day_review is a field)
    const numMatch = code.slice(pos).match(/^-?\d+(\.\d+)?([eE][+-]?\d+)?/);
    if (numMatch) {
      // Check if this number is part of a field name (followed by _ or letter)
      const afterNum = code[pos + numMatch[0].length];
      if (afterNum && /[a-zA-Z_]/.test(afterNum)) {
        // This is a field starting with numbers, match as word
        const fieldMatch = code.slice(pos).match(/^[\w._]+/);
        if (fieldMatch) {
          tokens.push({ start: pos, end: pos + fieldMatch[0].length, type: 'variable' });
          pos += fieldMatch[0].length;
          expectCommand = false;
          continue;
        }
      }
      tokens.push({ start: pos, end: pos + numMatch[0].length, type: 'number' });
      pos += numMatch[0].length;
      expectCommand = false;
      continue;
    }

    // Multi-char comparison operators
    if (code.slice(pos, pos + 2).match(/^(==|!=|<=|>=|<>)/)) {
      tokens.push({ start: pos, end: pos + 2, type: 'operator' });
      pos += 2;
      expectCommand = false;
      continue;
    }

    // Single-char operators
    if ('<>=!+-*/%'.includes(code[pos])) {
      tokens.push({ start: pos, end: pos + 1, type: 'operator' });
      pos++;
      expectCommand = false;
      continue;
    }

    // Brackets - opening subsearch bracket expects command
    if (code[pos] === '[') {
      tokens.push({ start: pos, end: pos + 1, type: 'bracket' });
      pos++;
      expectCommand = true;
      inStatsCommand = false;
      continue;
    }
    if ('](){}'.includes(code[pos])) {
      tokens.push({ start: pos, end: pos + 1, type: 'bracket' });
      pos++;
      expectCommand = false;
      continue;
    }

    // Comma
    if (code[pos] === ',') {
      tokens.push({ start: pos, end: pos + 1, type: 'punctuation' });
      pos++;
      expectCommand = false;
      continue;
    }

    // Words - context-aware command and function detection
    const wordMatch = code.slice(pos).match(/^[a-zA-Z_][\w._]*/);
    if (wordMatch) {
      const word = wordMatch[0].toLowerCase();
      let type = 'variable';

      // Check what follows the word (skip whitespace)
      const afterWord = code.slice(pos + wordMatch[0].length).match(/^\s*(.)/);
      const nextChar = afterWord ? afterWord[1] : '';

      // Commands only highlighted in command position (after | or at start or after [)
      if (expectCommand && SPL_COMMANDS.has(word)) {
        type = 'keyword';
        // Track if this is a stats-like command
        if (STATS_COMMANDS.has(word)) {
          inStatsCommand = true;
        }
      } else if (SPL_FUNCTIONS.has(word)) {
        // Functions only pink if:
        // 1. Followed by ( (function call), OR
        // 2. We're in a stats-like command context
        if (nextChar === '(' || inStatsCommand) {
          type = 'builtin';
        }
        // Otherwise stays as 'variable' (field)
      } else if (SPL_KEYWORDS.has(word)) {
        type = 'atom';
        // 'by' keyword ends the function-argument part of stats
        if (word === 'by') {
          inStatsCommand = false;
        }
      }

      tokens.push({ start: pos, end: pos + wordMatch[0].length, type });
      pos += wordMatch[0].length;
      expectCommand = false;
      continue;
    }

    // Wildcard
    if (code[pos] === '*') {
      tokens.push({ start: pos, end: pos + 1, type: 'operator' });
      pos++;
      expectCommand = false;
      continue;
    }

    pos++;
  }

  return tokens;
}

/**
 * Find SPL code blocks and return their ranges with content
 */
function findSPLCodeBlocks(text: string): Array<{ contentStart: number; contentEnd: number; content: string }> {
  const blocks: Array<{ contentStart: number; contentEnd: number; content: string }> = [];

  // Match ```spl or ```SPL or ```splunk (case insensitive)
  // Supports 3+ backtick fences (4+ needed if SPL contains triple-backtick comments)
  const regex = /(`{3,})(?:spl|splunk)\s*\n([\s\S]*?)\1/gi;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const fullMatch = match[0];
    const codeContent = match[2];

    // Calculate where the code content starts in the document
    // match.index is start of ```, then we need to skip past ```spl\n
    const headerEnd = match[0].indexOf('\n') + 1;
    const contentStart = match.index + headerEnd;
    const contentEnd = contentStart + codeContent.length;

    blocks.push({
      contentStart,
      contentEnd,
      content: codeContent
    });
  }

  return blocks;
}

/**
 * Build decorations for all SPL code blocks in the document
 */
function buildSPLDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const text = view.state.doc.toString();
  const blocks = findSPLCodeBlocks(text);

  for (const block of blocks) {
    const tokens = tokenizeSPL(block.content);

    for (const token of tokens) {
      const from = block.contentStart + token.start;
      const to = block.contentStart + token.end;
      const deco = decorations[token.type as keyof typeof decorations];

      if (deco && from >= 0 && to <= view.state.doc.length && from < to) {
        builder.add(from, to, deco);
      }
    }
  }

  return builder.finish();
}

// StateField to manage decorations
const splDecorationField = StateField.define<DecorationSet>({
  create(state) {
    // Create a minimal EditorView-like object for initial creation
    return Decoration.none;
  },
  update(decorations, tr) {
    // We'll rebuild on any doc change via the extension
    return decorations;
  },
  provide(field) {
    return EditorView.decorations.from(field);
  }
});

// Extension that rebuilds decorations when document changes
const splHighlightExtension = EditorView.updateListener.of((update) => {
  if (update.docChanged || update.viewportChanged) {
    const decorations = buildSPLDecorations(update.view);
    // Apply decorations through a transaction effect would be complex,
    // so we use the plugin approach below instead
  }
});

// Use ViewPlugin for simpler decoration management
import { ViewPlugin, ViewUpdate, PluginValue } from '@codemirror/view';

class SPLHighlightPluginValue implements PluginValue {
  decorations: DecorationSet;

  constructor(view: EditorView) {
    this.decorations = buildSPLDecorations(view);
  }

  update(update: ViewUpdate) {
    if (update.docChanged || update.viewportChanged || update.startState.doc !== update.state.doc) {
      this.decorations = buildSPLDecorations(update.view);
    }
  }

  destroy() {}
}

const splViewPlugin = ViewPlugin.fromClass(SPLHighlightPluginValue, {
  decorations: v => v.decorations
});

export default class SPLSyntaxPlugin extends Plugin {
  async onload() {
    // Register the editor extension for Live Preview / Source mode
    this.registerEditorExtension([Prec.lowest(splViewPlugin)]);

    // Helper function to render SPL code block
    const renderSPLBlock = (source: string, el: HTMLElement) => {
      const pre = el.createEl('pre', { cls: 'spl-codeblock' });
      const code = pre.createEl('code');

      const tokens = tokenizeSPL(source);

      let result = '';
      let lastEnd = 0;

      for (const token of tokens) {
        if (token.start > lastEnd) {
          result += escapeHtml(source.slice(lastEnd, token.start));
        }
        result += `<span class="spl-${token.type}">${escapeHtml(source.slice(token.start, token.end))}</span>`;
        lastEnd = token.end;
      }

      if (lastEnd < source.length) {
        result += escapeHtml(source.slice(lastEnd));
      }

      code.innerHTML = result;
    };

    // Register code block processor for Reading view - handles ```spl blocks
    // Register all case variations since Obsidian is case-sensitive
    this.registerMarkdownCodeBlockProcessor('spl', (source, el, ctx) => renderSPLBlock(source, el));
    this.registerMarkdownCodeBlockProcessor('SPL', (source, el, ctx) => renderSPLBlock(source, el));
    this.registerMarkdownCodeBlockProcessor('Spl', (source, el, ctx) => renderSPLBlock(source, el));
    this.registerMarkdownCodeBlockProcessor('splunk', (source, el, ctx) => renderSPLBlock(source, el));
    this.registerMarkdownCodeBlockProcessor('SPLUNK', (source, el, ctx) => renderSPLBlock(source, el));
    this.registerMarkdownCodeBlockProcessor('Splunk', (source, el, ctx) => renderSPLBlock(source, el));
  }

  onunload() {}
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
