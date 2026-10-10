import { useEffect, useState, type ReactNode } from 'react';
import { ChevronDown, Check, Copy } from 'lucide-react';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import sql from 'highlight.js/lib/languages/sql';
import bash from 'highlight.js/lib/languages/bash';
import json from 'highlight.js/lib/languages/json';
import diff from 'highlight.js/lib/languages/diff';
import plaintext from 'highlight.js/lib/languages/plaintext';

let registered = false;
function ensureLanguages(): void {
  if (registered) {
    return;
  }
  hljs.registerLanguage('javascript', javascript);
  hljs.registerLanguage('typescript', typescript);
  hljs.registerLanguage('python', python);
  hljs.registerLanguage('sql', sql);
  hljs.registerLanguage('bash', bash);
  hljs.registerLanguage('shell', bash);
  hljs.registerLanguage('json', json);
  hljs.registerLanguage('diff', diff);
  hljs.registerLanguage('plaintext', plaintext);
  hljs.registerLanguage('text', plaintext);
  registered = true;
}

interface CodeBlockProps {
  code: string;
  language?: string;
  label?: string;
  lineNumbers?: boolean;
}

/** Syntax-highlighted code block with a language label and copy button. */
export function CodeBlock({ code, language = 'plaintext', label, lineNumbers = false }: CodeBlockProps) {
  ensureLanguages();
  const [copied, setCopied] = useState(false);

  let highlighted = code;
  let detected = language;
  try {
    if (language !== 'text' && language !== 'plaintext' && hljs.getLanguage(language)) {
      highlighted = hljs.highlight(code, { language }).value;
    } else {
      const result = hljs.highlightAuto(code);
      highlighted = result.value;
      detected = result.language ?? language;
    }
  } catch {
    highlighted = code;
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable (e.g. non-secure context) — fail silently.
    }
  };

  const lines = highlighted.split('\n');

  return (
    <figure className="codeblock" style={{ margin: 0 }}>
      <div className="codeblock-header">
        <span>{label ?? detected}</span>
        <button type="button" className="copy-btn" onClick={copy} aria-label="Copy code to clipboard">
          {copied ? <Check size={13} aria-hidden /> : <Copy size={13} aria-hidden />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre>
        <code>
          {lineNumbers
            ? lines.map((line, i) => (
                <span key={i}>
                  <span className="ln" aria-hidden>
                    {i + 1}
                  </span>
                  {line}
                  {'\n'}
                </span>
              ))
            : highlighted}
        </code>
      </pre>
    </figure>
  );
}

interface RevealProps {
  summary: string;
  children: ReactNode;
  variant?: 'default' | 'solution';
  defaultOpen?: boolean;
}

/** Accessible collapsible section (hints, solution). */
export function Reveal({ summary, children, variant = 'default', defaultOpen = false }: RevealProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`reveal${variant === 'solution' ? ' reveal-solution' : ''}`}>
      <button
        type="button"
        className="reveal-trigger"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {summary}
        <ChevronDown size={16} className="chev" aria-hidden />
      </button>
      {open ? <div className="reveal-body">{children}</div> : null}
    </div>
  );
}
