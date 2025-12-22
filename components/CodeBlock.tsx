'use client'

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeBlockProps {
  language: string;
  value: string;
}

export const CodeBlock = ({ language, value }: CodeBlockProps) => {
  return (
    <SyntaxHighlighter
      language={language || 'text'}
      style={vscDarkPlus}
      customStyle={{ borderRadius: '0.5rem', margin: '1rem 0' }}
    >
      {value}
    </SyntaxHighlighter>
  );
};
