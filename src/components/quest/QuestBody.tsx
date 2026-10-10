import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check, Link2, Lightbulb, ChevronDown } from 'lucide-react';

import type { Quest, QuestIndexEntry } from '../../../shared/types.js';
import { CodeBlock, Reveal } from '../ui/CodeBlock.js';
import { MarkdownLite } from './MarkdownLite.js';
import { padQuestNumber } from '../../lib/format.js';
import { challengeTypeLabel } from '../../lib/labels.js';

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

/** The challenge itself: prompt, options, examples, starter code, tests. */
export function QuestBody({ quest }: { quest: Quest }) {
  return (
    <>
      <section className="quest-section">
        <h2>
          {quest.challengeType === 'output_prediction'
            ? 'The Snippet'
            : challengeTypeLabel(quest.challengeType)}
        </h2>
        <MarkdownLite text={quest.prompt} />
      </section>

      {quest.options && quest.correctOptionIndex !== undefined ? (
        <section className="quest-section">
          <h2>Options</h2>
          <div className="mcq-options">
            {quest.options.map((option, index) => (
              <div
                key={index}
                className={`mcq-option${index === quest.correctOptionIndex ? ' correct' : ''}`}
                aria-current={index === quest.correctOptionIndex ? 'true' : undefined}
              >
                <span className="letter">{LETTERS[index] ?? '?'}</span>
                {option}
                {index === quest.correctOptionIndex ? (
                  <span className="verdict">
                    <Check size={11} style={{ display: 'inline', verticalAlign: '-1px' }} />{' '}
                    solution marks this correct
                  </span>
                ) : null}
              </div>
            ))}
          </div>
          <p
            style={{
              marginTop: '0.75rem',
              color: 'var(--foreground-muted)',
              fontSize: 'var(--text-sm)',
            }}
          >
            Decide before you scroll on — the solution section explains why the marked option wins.
          </p>
        </section>
      ) : null}

      {quest.instructions.length > 0 ? (
        <section className="quest-section">
          <h2>Instructions</h2>
          <MarkdownLite text={quest.instructions.map((i) => `- ${i}`).join('\n')} />
        </section>
      ) : null}

      {quest.examples.length > 0 ? (
        <section className="quest-section">
          <h2>Examples</h2>
          <div className="stack">
            {quest.examples.map((example) => (
              <div key={example.title} className="example-block">
                <div className="example-header">
                  <span>{example.title}</span>
                </div>
                <div className="example-io">
                  {example.input !== undefined ? (
                    <div className="example-pane">
                      <div className="label">Input</div>
                      <pre>{example.input}</pre>
                    </div>
                  ) : null}
                  <div className="example-pane">
                    <div className="label">Output</div>
                    <pre>{example.output}</pre>
                  </div>
                </div>
                {example.explanation ? (
                  <div className="example-note">{example.explanation}</div>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {quest.starterCode ? (
        <section className="quest-section">
          <h2>Starter Code</h2>
          <CodeBlock
            code={quest.starterCode.code}
            language={quest.starterCode.language}
            label="starter"
          />
        </section>
      ) : null}

      {quest.constraints.length > 0 ? (
        <section className="quest-section">
          <h2>Constraints</h2>
          <MarkdownLite text={quest.constraints.map((c) => `- ${c}`).join('\n')} />
        </section>
      ) : null}

      {quest.testCases && quest.testCases.length > 0 ? (
        <section className="quest-section">
          <h2>Sample Tests</h2>
          <div className="stack">
            {quest.testCases.slice(0, 4).map((testCase) => (
              <div key={testCase.name} className="example-block">
                <div className="example-header">
                  <span>{testCase.name}</span>
                </div>
                <div className="example-io">
                  <div className="example-pane">
                    <div className="label">Input</div>
                    <pre>{testCase.input}</pre>
                  </div>
                  <div className="example-pane">
                    <div className="label">Expected</div>
                    <pre>{testCase.expected}</pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p
            style={{
              marginTop: '0.75rem',
              color: 'var(--foreground-muted)',
              fontSize: 'var(--text-sm)',
            }}
          >
            All expected outputs were computed by executing the reference solution at generation
            time — {quest.testCases.length} test{quest.testCases.length === 1 ? '' : 's'} in total.
          </p>
        </section>
      ) : null}
    </>
  );
}

/** Hints reveal sequentially; each button opens only its own hint. */
export function HintList({ hints }: { hints: string[] }) {
  const [revealed, setRevealed] = useState(0);
  if (hints.length === 0) {
    return null;
  }
  return (
    <section className="quest-section">
      <h2>Hints</h2>
      <div className="stack">
        {hints.map((hint, index) => {
          const isOpen = index < revealed;
          return (
            <div key={index} className="reveal">
              <button
                type="button"
                className="reveal-trigger"
                aria-expanded={isOpen}
                onClick={() => setRevealed((v) => (isOpen ? index : Math.max(v, index + 1)))}
              >
                <Lightbulb size={15} aria-hidden />
                Hint {index + 1} of {hints.length}
                <ChevronDown size={16} className="chev" aria-hidden />
              </button>
              {isOpen ? (
                <div className="reveal-body">
                  <MarkdownLite text={hint} />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function SolutionPanel({ quest }: { quest: Quest }) {
  const { solution } = quest;
  return (
    <section className="quest-section">
      <h2>Solution</h2>
      <Reveal variant="solution" summary="Reveal Solution">
        <p className="solution-warning">
          Try the quest first — the reasoning below is worth more after an attempt.
        </p>
        <MarkdownLite text={solution.summary} />

        {solution.approach && solution.approach.length > 0 ? (
          <>
            <h3 style={{ margin: '1rem 0 0.5rem', fontSize: 'var(--text-md)' }}>Approach</h3>
            <MarkdownLite text={solution.approach.map((a) => `- ${a}`).join('\n')} />
          </>
        ) : null}

        {solution.reasoning && solution.reasoning.length > 0 ? (
          <>
            <h3 style={{ margin: '1rem 0 0.5rem', fontSize: 'var(--text-md)' }}>Reasoning</h3>
            <MarkdownLite text={solution.reasoning.join('\n\n')} />
          </>
        ) : null}

        {solution.answer ? (
          <>
            <h3 style={{ margin: '1rem 0 0.5rem', fontSize: 'var(--text-md)' }}>Answer</h3>
            <MarkdownLite text={solution.answer} />
          </>
        ) : null}

        {solution.code ? (
          <div style={{ margin: '1rem 0' }}>
            <CodeBlock
              code={solution.code.code}
              language={solution.code.language}
              label={solution.code.label ?? 'solution'}
              lineNumbers
            />
          </div>
        ) : null}

        {solution.whyNot && solution.whyNot.length > 0 ? (
          <>
            <h3 style={{ margin: '1rem 0 0.5rem', fontSize: 'var(--text-md)' }}>
              Why the other options fail
            </h3>
            <MarkdownLite text={solution.whyNot.map((w) => `- ${w}`).join('\n')} />
          </>
        ) : null}

        {solution.complexity ? (
          <>
            <h3 style={{ margin: '1rem 0 0.5rem', fontSize: 'var(--text-md)' }}>Complexity</h3>
            <MarkdownLite text={solution.complexity} />
          </>
        ) : null}

        {solution.alternatives && solution.alternatives.length > 0 ? (
          <>
            <h3 style={{ margin: '1rem 0 0.5rem', fontSize: 'var(--text-md)' }}>Alternatives</h3>
            <MarkdownLite text={solution.alternatives.map((a) => `- ${a}`).join('\n')} />
          </>
        ) : null}

        {solution.commonMistakes && solution.commonMistakes.length > 0 ? (
          <>
            <h3 style={{ margin: '1rem 0 0.5rem', fontSize: 'var(--text-md)' }}>Common mistakes</h3>
            <MarkdownLite text={solution.commonMistakes.map((m) => `- ${m}`).join('\n')} />
          </>
        ) : null}
      </Reveal>
    </section>
  );
}

export function LearningObjectives({ quest }: { quest: Quest }) {
  return (
    <section className="quest-section">
      <h2>Learning Objectives</h2>
      <MarkdownLite text={quest.learningObjectives.map((o) => `- ${o}`).join('\n')} />
      {quest.discussionPoints && quest.discussionPoints.length > 0 ? (
        <>
          <h3 style={{ margin: '1rem 0 0.5rem', fontSize: 'var(--text-md)' }}>Discuss further</h3>
          <MarkdownLite text={quest.discussionPoints.map((d) => `- ${d}`).join('\n')} />
        </>
      ) : null}
    </section>
  );
}

export function QuestNav({
  previous,
  next,
}: {
  previous: QuestIndexEntry | null;
  next: QuestIndexEntry | null;
}) {
  return (
    <nav className="quest-nav" aria-label="Quest navigation">
      {previous ? (
        <Link to={`/quest/${previous.slug}`}>
          <div className="direction">
            <ChevronLeft size={12} style={{ display: 'inline', verticalAlign: '-2px' }} /> Previous
            Quest
          </div>
          <div className="nav-title">
            #{padQuestNumber(previous.sequenceNumber)} {previous.title}
          </div>
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link to={`/quest/${next.slug}`} className="next">
          <div className="direction">
            Next Quest{' '}
            <ChevronRight size={12} style={{ display: 'inline', verticalAlign: '-2px' }} />
          </div>
          <div className="nav-title">
            #{padQuestNumber(next.sequenceNumber)} {next.title}
          </div>
        </Link>
      ) : (
        <div />
      )}
    </nav>
  );
}

export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = window.location.href;
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // User dismissed the share sheet — fall through to copy.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable — nothing else to do.
    }
  };

  return (
    <button type="button" className="btn btn-ghost btn-sm" onClick={share}>
      <Link2 size={14} aria-hidden />
      {copied ? 'Link copied' : 'Share'}
    </button>
  );
}
