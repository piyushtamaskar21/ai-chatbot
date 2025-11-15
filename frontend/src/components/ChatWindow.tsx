import React, { useEffect, useRef, useState } from 'react';
import '../styles/ChatWindow.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

interface ChatWindowProps {
  messages: Message[];
  loading: boolean;
  onPromptClick?: (prompt: string) => void;
  isNewChat?: boolean;
}

// Copy to clipboard utility
const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text).then(() => {
    console.log('Copied to clipboard!');
  });
};

// Detect programming language from code block
const detectLanguage = (code: string, specifiedLang: string): string => {
  if (specifiedLang && specifiedLang.trim()) {
    return specifiedLang.toLowerCase();
  }

  const patterns: { [key: string]: RegExp } = {
    python: /^(import|from|def|class|if __name__|print)/m,
    javascript: /^(function|const|let|var|async|await|console\.log)/m,
    typescript: /^(interface|type|enum|abstract|declare)/m,
    java: /^(public|private|class|import java)/m,
    sql: /^(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)/i,
    php: /^(<\?php|function|class|\$)/m,
    cpp: /^(#include|using namespace|int main|void)/m,
    csharp: /^(using|namespace|class|public|static)/m,
    go: /^(package|import|func|type)/m,
    rust: /^(fn|pub|impl|use|mod|struct)/m,
    ruby: /^(def|class|require|puts)/m,
    bash: /^(echo|if|for|while|do|case|test)/m,
    html: /^(<html|<!DOCTYPE|<head|<body|<div)/i,
    css: /^(body|\.|#id|@media)/m,
    json: /^\{|\[/m,
    xml: /^(<\?xml|<[a-zA-Z])/m,
  };

  for (const [lang, pattern] of Object.entries(patterns)) {
    if (pattern.test(code)) {
      return lang;
    }
  }

  return 'xml';
};

// Copy button component for code blocks
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button className="copy-button" onClick={handleCopy} title="Copy code">
      {copied ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
        </svg>
      )}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

// Copy button component for tables
function CopyTableButton({ tableData }: { tableData: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    copyToClipboard(tableData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button className="copy-table-button" onClick={handleCopy} title="Copy table">
      {copied ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
        </svg>
      )}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

// Parse and render markdown
function MarkdownRenderer({ text }: { text: string }) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      elements.push(<div key={`empty-${i}`} style={{ height: '8px' }} />);
      i++;
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const content = headingMatch[2];
      const className = `heading-${level}`;
      elements.push(
        <div key={i} className={className}>
          {renderInlineMarkdown(content)}
        </div>
      );
      i++;
      continue;
    }

    if (trimmed.includes('|')) {
      const tableLines = [];
      while (i < lines.length && lines[i].trim().includes('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }
      if (tableLines.length > 0) {
        const tableData = tableLines.join('\n');
        elements.push(
          <div key={`table-${i}`} className="table-wrapper">
            <div className="table-header">
              <CopyTableButton tableData={tableData} />
            </div>
            {renderTable(tableLines)}
          </div>
        );
        continue;
      }
    }

    if (trimmed.startsWith('```')) {
      const codeLines = [];
      let language = trimmed.slice(3).trim();
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++;

      const codeContent = codeLines.join('\n');
      const detectedLang = detectLanguage(codeContent, language);

      elements.push(
        <div key={`code-${i}`} className="code-block-wrapper">
          <div className="code-block-header">
            <span className="language-label">{detectedLang.toUpperCase()}</span>
            <CopyButton text={codeContent} />
          </div>
          <pre className="code-block">
            <code>{codeContent}</code>
          </pre>
        </div>
      );
      continue;
    }

    const listLines = [];
    while (
      i < lines.length &&
      (lines[i].trim().startsWith('-') || lines[i].trim().startsWith('*')) &&
      !lines[i].trim().startsWith('---')
    ) {
      listLines.push(lines[i]);
      i++;
    }
    if (listLines.length > 0) {
      elements.push(
        <ul key={`list-${i}`} className="markdown-list">
          {listLines.map((item, idx) => (
            <li key={idx} className="list-item">
              {renderInlineMarkdown(item.replace(/^[-*]\s*/, '').trim())}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    const numListMatch = line.trim().match(/^\d+\.\s+(.+)$/);
    if (numListMatch) {
      const numListLines = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        numListLines.push(lines[i]);
        i++;
      }
      elements.push(
        <ol key={`numlist-${i}`} className="markdown-list-ordered">
          {numListLines.map((item, idx) => (
            <li key={idx} className="list-item">
              {renderInlineMarkdown(item.replace(/^\d+\.\s+/, '').trim())}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    if (trimmed.startsWith('>')) {
      const quoteLines = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s*/, ''));
        i++;
      }
      elements.push(
        <blockquote key={`quote-${i}`} className="markdown-blockquote">
          {quoteLines.map((quote, idx) => (
            <div key={idx}>{renderInlineMarkdown(quote)}</div>
          ))}
        </blockquote>
      );
      continue;
    }

    elements.push(
      <p key={i} className="markdown-paragraph">
        {renderInlineMarkdown(trimmed)}
      </p>
    );
    i++;
  }

  return <div className="markdown-content">{elements}</div>;
}

function renderInlineMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  const regex = /\*\*(.*?)\*\*|__(.*?)__|_([^_]+)_|\*(.*?)\*|`([^`]+)`|\[(.*?)\]\((.*?)\)/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    if (match[1]) {
      parts.push(<strong key={match.index}>{match[1]}</strong>);
    } else if (match[2]) {
      parts.push(<strong key={match.index}>{match[2]}</strong>);
    } else if (match[3]) {
      parts.push(<em key={match.index}>{match[3]}</em>);
    } else if (match[4]) {
      parts.push(<em key={match.index}>{match[4]}</em>);
    } else if (match[5]) {
      parts.push(
        <code key={match.index} className="inline-code">
          {match[5]}
        </code>
      );
    } else if (match[6] && match[7]) {
      parts.push(
        <a key={match.index} href={match[7]} target="_blank" rel="noopener noreferrer" className="markdown-link">
          {match[6]}
        </a>
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

function renderTable(tableLines: string[]): React.ReactNode {
  if (tableLines.length < 2) return null;

  const headerCells = tableLines[0]
    .split('|')
    .map(cell => cell.trim())
    .filter(cell => cell);

  const bodyRows = tableLines.slice(2).map(line =>
    line
      .split('|')
      .map(cell => cell.trim())
      .filter(cell => cell)
  );

  return (
    <table className="markdown-table">
      <thead>
        <tr>
          {headerCells.map((cell, idx) => (
            <th key={idx}>{renderInlineMarkdown(cell)}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {bodyRows.map((row, rowIdx) => (
          <tr key={rowIdx}>
            {row.map((cell, cellIdx) => (
              <td key={cellIdx}>{renderInlineMarkdown(cell)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ChatWindow({
  messages,
  loading,
  onPromptClick,
  isNewChat,
}: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const prompts = [
    'Explain complex concepts simply',
    'Get creative ideas',
    'Help with coding',
    'Answer any questions',
  ];

  if (messages.length === 0 && isNewChat) {
    return (
      <div className="chat-window empty-state">
        <div className="empty-state-content">
          <div className="empty-state-icon">💬</div>
          <h2>Let's chat! What's on your mind?</h2>
          <p>Choose from the prompts below or start asking queries. I'm here to help with whatever you need.</p>

          <div className="prompts-grid">
            {prompts.map((prompt, idx) => (
              <div
                key={idx}
                className="prompt-card"
                onClick={() => onPromptClick?.(prompt)}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onPromptClick?.(prompt);
                  }
                }}
              >
                {prompt}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-window">
      <div className="messages-container">
        {messages.map((message, index) => (
          <div key={index} className={`message-wrapper ${message.role}`}>
            <div className="message-content">
              <div className={`message-bubble ${message.role}`}>
                {message.role === 'assistant' ? (
                  <MarkdownRenderer text={message.content} />
                ) : (
                  <div className="user-message">{message.content}</div>
                )}
                {message.isStreaming && <span className="streaming-cursor">▌</span>}
              </div>
            </div>
          </div>
        ))}
        {loading && !messages[messages.length - 1]?.isStreaming && (
          <div className="message-wrapper assistant">
            <div className="message-content">
              <div className="message-bubble assistant typing">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

export default ChatWindow;