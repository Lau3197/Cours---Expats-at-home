import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface StyledMarkdownProps {
  content: string;
  className?: string;
}

const StyledMarkdown: React.FC<StyledMarkdownProps> = ({ content, className = '' }) => {
  return (
    <div className={`styled-markdown ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings avec le style serif-display
          h1: ({ children }) => (
            <h1 className="text-4xl font-black text-[#5A6B70] serif-display italic mb-6 mt-8 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-3xl font-bold text-[#5A6B70] serif-display italic mb-5 mt-8 first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-2xl font-bold text-[#dd8b8b] serif-display italic mb-4 mt-6">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-xl font-bold text-[#5A6B70] mb-3 mt-5">
              {children}
            </h4>
          ),
          // Paragraphs
          p: ({ children }) => (
            <p className="text-[#5A6B70]/90 leading-relaxed mb-4 font-medium text-base">
              {children}
            </p>
          ),
          // Lists
          ul: ({ children }) => (
            <ul className="mb-6 space-y-3 text-[#5A6B70]/90 ml-6 list-disc marker:text-[#dd8b8b]">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-6 space-y-3 text-[#5A6B70]/90 ml-4 marker:text-[#dd8b8b] marker:font-black">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="mb-2 pl-2 leading-relaxed">
              {children}
            </li>
          ),
          // Tables avec style personnalisé
          table: ({ children }) => (
            <div className="overflow-x-auto my-8 rounded-[24px] border-2 border-[#dd8b8b]/20 shadow-lg bg-white">
              <table className="w-full border-collapse">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-gradient-to-r from-[#dd8b8b]/15 to-[#E8C586]/15">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-[#dd8b8b]/10 bg-white">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-[#F9F7F2] transition-all duration-200 even:bg-[#F9F7F2]/30">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-[0.2em] text-[#5A6B70] sans-geometric border-b-2 border-[#dd8b8b]/30 first:rounded-tl-[24px] last:rounded-tr-[24px]">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-6 py-4 text-sm font-medium text-[#5A6B70]/90 border-b border-[#dd8b8b]/5 leading-relaxed">
              {children}
            </td>
          ),
          // Code blocks
          code: ({ inline, children }) => {
            if (inline) {
              return (
                <code className="bg-[#F9F7F2] text-[#dd8b8b] px-2 py-1 rounded-lg text-sm font-mono font-bold">
                  {children}
                </code>
              );
            }
            return (
              <code className="block bg-[#5A6B70] text-white p-4 rounded-2xl overflow-x-auto text-sm font-mono mb-4">
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="bg-[#5A6B70] text-white p-4 rounded-2xl overflow-x-auto mb-4">
              {children}
            </pre>
          ),
          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-[#E8C586] pl-6 py-3 my-4 bg-[#E8C586]/5 rounded-r-2xl italic text-[#5A6B70]/80">
              {children}
            </blockquote>
          ),
          // Links
          a: ({ href, children }) => (
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#dd8b8b] font-bold hover:text-[#c97a7a] underline transition-colors"
            >
              {children}
            </a>
          ),
          // Strong/Bold
          strong: ({ children }) => (
            <strong className="font-black text-[#5A6B70]">
              {children}
            </strong>
          ),
          // Emphasis/Italic
          em: ({ children }) => (
            <em className="italic text-[#5A6B70]/90">
              {children}
            </em>
          ),
          // Horizontal rule
          hr: () => (
            <hr className="my-8 border-t-2 border-[#dd8b8b]/20 rounded-full" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default StyledMarkdown;

