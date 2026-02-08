import { StreamLanguage, StringStream, LanguageDescription } from '@codemirror/language';
import { SPL_COMMANDS, SPL_FUNCTIONS, SPL_KEYWORDS } from './spl-tokens';

interface SPLState {
  inString: string | null;
  inComment: boolean;
  inSubsearch: number;
}

const splStreamParser = {
  name: 'spl',

  startState(): SPLState {
    return {
      inString: null,
      inComment: false,
      inSubsearch: 0,
    };
  },

  token(stream: StringStream, state: SPLState): string | null {
    // Handle string continuation
    if (state.inString) {
      const quote = state.inString;
      while (!stream.eol()) {
        const ch = stream.next();
        if (ch === quote) {
          state.inString = null;
          return 'string';
        }
        if (ch === '\\') {
          stream.next(); // Skip escaped character
        }
      }
      return 'string';
    }

    // Skip whitespace
    if (stream.eatSpace()) return null;

    // Check for comments (``` style in SPL2 or backtick comments)
    if (stream.match('```')) {
      stream.skipToEnd();
      return 'comment';
    }

    // Single-line comment starting with ```
    if (stream.match(/`[^`]*`/)) {
      return 'meta'; // Macros are wrapped in backticks
    }

    // Pipe operator - important in SPL
    if (stream.eat('|')) {
      return 'punctuation';
    }

    // Subsearch brackets
    if (stream.eat('[')) {
      state.inSubsearch++;
      return 'bracket';
    }
    if (stream.eat(']')) {
      state.inSubsearch = Math.max(0, state.inSubsearch - 1);
      return 'bracket';
    }

    // Parentheses
    if (stream.match(/[()]/)) {
      return 'bracket';
    }

    // Strings (double or single quoted)
    if (stream.eat('"')) {
      state.inString = '"';
      while (!stream.eol()) {
        const ch = stream.next();
        if (ch === '"') {
          state.inString = null;
          return 'string';
        }
        if (ch === '\\') {
          stream.next();
        }
      }
      return 'string';
    }

    if (stream.eat("'")) {
      state.inString = "'";
      while (!stream.eol()) {
        const ch = stream.next();
        if (ch === "'") {
          state.inString = null;
          return 'string';
        }
        if (ch === '\\') {
          stream.next();
        }
      }
      return 'string';
    }

    // Numbers (including decimals and negative)
    if (stream.match(/-?\d+(\.\d+)?([eE][+-]?\d+)?/)) {
      return 'number';
    }

    // Comparison and assignment operators
    if (stream.match(/[<>=!]=?/)) {
      return 'operator';
    }

    // Arithmetic operators
    if (stream.match(/[+\-*/%]/)) {
      return 'operator';
    }

    // Comma
    if (stream.eat(',')) {
      return 'punctuation';
    }

    // Field=value pattern - match the equals sign
    if (stream.eat('=')) {
      return 'operator';
    }

    // Words: commands, functions, keywords, or field names
    if (stream.match(/[a-zA-Z_][\w._]*/)) {
      const word = stream.current().toLowerCase();

      // Check if it's a command (appears after | or at start)
      if (SPL_COMMANDS.has(word)) {
        return 'keyword';
      }

      // Check if it's a function (usually followed by parenthesis)
      if (SPL_FUNCTIONS.has(word)) {
        return 'builtin';
      }

      // Check if it's a keyword (AS, BY, WHERE, etc.)
      if (SPL_KEYWORDS.has(word)) {
        return 'atom';
      }

      // Otherwise it's a field name
      return 'variable';
    }

    // Wildcard
    if (stream.eat('*')) {
      return 'operator';
    }

    // Skip any other character
    stream.next();
    return null;
  },
};

// Create the SPL StreamLanguage
const splStreamLanguage = StreamLanguage.define(splStreamParser);

// Create a LanguageDescription for registration with markdown code blocks
const splLanguageDescription = LanguageDescription.of({
  name: 'spl',
  alias: ['SPL', 'splunk'],
  load() {
    return splStreamLanguage;
  },
});

export { splStreamLanguage, splLanguageDescription };
