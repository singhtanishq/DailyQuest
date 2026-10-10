import type { ReactNode } from 'react';

import { CodeBlock } from './CodeBlock.js';

/**
 * Markdown-lite renderer for quest prose.
 *
 * The generator emits a small, known subset of markdown: paragraphs, fenced
 * code blocks, `-` bullet lists, and inline **bold** / `code`. Rendering is
 * structural React (no HTML injection), so quest content can never inject
 * markup into the page.
 */

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**')) {
      nodes.push(<strong key={`${keyPrefix}-b${i}`}>{token.slice(2, -2)}</strong>);
    } else {
      nodes.push(<code key={`${keyPrefix}-c${i}`}>{token.slice(1, -1)}</code>);
    }
    lastIndex = match.index + token.length;
    i++;
  }
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return nodes;
}

export function MarkdownLite({ text }: { text: string }) {
  const segments = text.split(/^```/m);
  const blocks: ReactNode[] = [];

  segments.forEach((segment, index) => {
    if (index % 2 === 1) {
      // Fenced code: first line is the language tag.
      const newline = segment.indexOf('\n');
      const lang = (newline === -1 ? segment : segment.slice(0, newline)).trim();
      const code = newline === -1 ? '' : segment.slice(newline + 1).replace(/\n$/, '');
      blocks.push(
        <div key={`code-${index}`} style={{ margin: '0.9rem 0' }}>
          <CodeBlock code={code} language={lang || 'text'} />
        </div>
      );
      return;
    }

    const lines = segment.split('\n');
    let bullets: string[] = [];
    const flushBullets = (key: string) => {
      if (bullets.length === 0) {
        return;
      }
      blocks.push(
        <ul key={`ul-${key}`}>
          {bullets.map((item, i) => (
            <li key={i}>{renderInline(item, `${key}-${i}`)}</li>
          ))}
        </ul>
      );
      bullets = [];
    };

    let paragraph: string[] = [];
    const flushParagraph = (key: string) => {
      if (paragraph.length === 0) {
        return;
      }
      blocks.push(<p key={`p-${key}`}>{renderInline(paragraph.join(' '), key)}</p>);
      paragraph = [];
    };

    lines.forEach((line, lineIndex) => {
      const trimmed = line.trim();
      const key = `${index}-${lineIndex}`;
      if (trimmed.startsWith('- ')) {
        flushParagraph(`${key}-p`);
        bullets.push(trimmed.slice(2));
      } else if (trimmed === '') {
        flushBullets(`${key}-ul`);
        flushParagraph(`${key}-p`);
      } else {
        flushBullets(`${key}-ul`);
        paragraph.push(trimmed);
      }
    });
    flushBullets(`${index}-ul-end`);
    flushParagraph(`${index}-p-end`);
  });

  return <div className="quest-body-text">{blocks}</div>;
}
