import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeRaw from 'rehype-raw';
import BubbleVideoPlayer from './BubbleVideoPlayer';
import FloatingVideoPlayer from './FloatingVideoPlayer';
import { VideoProvider } from '../context/VideoContext';

interface StyledMarkdownProps {
  content: string;
  className?: string;
  id?: string; // Add ID for persistence namespacing
}

const StyledMarkdown: React.FC<StyledMarkdownProps> = ({ content, className = '', id }) => {
  // State for checkboxes
  const [checkedItems, setCheckedItems] = React.useState<{ [key: string]: boolean }>({});

  // Load state on mount or when id changes
  React.useEffect(() => {
    if (id) {
      const saved = localStorage.getItem(`checklist_${id}`);
      if (saved) {
        try {
          setCheckedItems(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse checklist state", e);
        }
      } else {
        setCheckedItems({});
      }
    }
  }, [id]);

  // Save state when it changes
  const toggleCheckbox = (index: number) => {
    if (!id) return;

    setCheckedItems(prev => {
      const next = { ...prev, [index]: !prev[index] };
      localStorage.setItem(`checklist_${id}`, JSON.stringify(next));
      return next;
    });
  };

  // Helper to count checkboxes to give them unique indices
  let checkboxCount = 0;

  // Pre-process content to fix markdown bolding issues with French contractions
  // e.g. **l'**école -> <strong>l'</strong>école
  // And normalize legacy checkboxes: - ☐ -> - [ ]
  const processedContent = React.useMemo(() => {
    let newContent = content.replace(/\*\*([LlDdQqNnJjMmTtSsCc]')\*\*/g, '<strong>$1</strong>');
    newContent = newContent.replace(/-\s*☐/g, '- [ ]');
    newContent = newContent.replace(/-\s*☑/g, '- [x]');
    return newContent;
  }, [content]);

  return (
    <VideoProvider lessonId={id || 'global'}>
      <div className={`styled-markdown ${className}`}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeSlug, rehypeRaw]}
          components={{
            // Headings avec le style serif-display
            h1: ({ children, ...props }) => (
              <h1 className="text-4xl font-black text-[#5A6B70] serif-display italic mb-6 mt-8 first:mt-0" {...props}>
                {children}
              </h1>
            ),
            h2: ({ children, ...props }) => {
              // Extract text content safely
              const textContent = React.Children.toArray(children).reduce<string>((acc, child) => {
                return acc + (typeof child === 'string' ? child : '');
              }, '');

              // Check if we should show the video player (Lesson 1 only request)
              // We check if the ID (lesson id) contains '01' as a heuristic for Lesson 1
              const showVideo = id && (id.includes('01') || id.includes('lecon-01'));

              return (
                <h2 className="text-3xl font-bold text-[#5A6B70] serif-display italic mb-5 mt-8 first:mt-0 flex items-center group" {...props}>
                  <span className="flex-grow">{children}</span>
                  {showVideo && <BubbleVideoPlayer sectionTitle={textContent} lessonId={id} />}
                </h2>
              );
            },
            h3: ({ children, ...props }) => (
              <h3 className="text-2xl font-bold text-[#dd8b8b] serif-display italic mb-4 mt-6" {...props}>
                {children}
              </h3>
            ),
            h4: ({ children, ...props }) => (
              <h4 className="text-xl font-bold text-[#5A6B70] mb-3 mt-5" {...props}>
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
            // LI block replaced          // Interactive Checkboxes
            input: (props) => {
              if (props.type === "checkbox") {
                const index = checkboxCount++;
                const isChecked = checkedItems[index] || props.checked || false;

                return (
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleCheckbox(index)}
                    disabled={!id} // Disable if no ID provided (preview mode)
                    className={`
                    appearance-none w-5 h-5 border-2 border-[#dd8b8b] rounded 
                    bg-white checked:bg-[#dd8b8b] checked:border-[#dd8b8b] 
                    cursor-pointer relative align-middle mr-2 mt-[-2px]
                    transition-all duration-200 ease-in-out
                    after:content-[''] after:hidden after:absolute after:left-[6px] after:top-[2px] 
                    after:w-[6px] after:h-[10px] after:border-white after:border-r-2 after:border-b-2 
                    after:rotate-45 checked:after:block
                    hover:scale-110
                  `}
                  />
                );
              }
              return <input {...props} />;
            },
            // Custom LI to handle task list items styling
            li: ({ children, className, ...props }) => {
              // Check if this is a task list item
              const isTaskList = className?.includes('task-list-item');

              if (isTaskList) {
                return (
                  <li className="flex items-start mb-2 pl-0 list-none" {...props}>
                    {children}
                  </li>
                );
              }

              return (
                <li className="mb-2 pl-2 leading-relaxed" {...props}>
                  {children}
                </li>
              );
            },
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
            code: (props: any) => {
              const { inline, children } = props;
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
            a: ({ href, children }) => {
              // Check if it's an internal anchor link
              const isAnchor = href?.startsWith('#');

              if (isAnchor) {
                return (
                  <a
                    href={href}
                    className="text-[#dd8b8b] font-bold hover:text-[#c97a7a] underline transition-colors cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      const targetId = href?.slice(1);
                      const targetElement = document.getElementById(targetId || '');
                      if (targetElement) {
                        targetElement.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                  >
                    {children}
                  </a>
                );
              }

              // External links open in new tab
              return (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#dd8b8b] font-bold hover:text-[#c97a7a] underline transition-colors"
                >
                  {children}
                </a>
              );
            },
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
          {processedContent}
        </ReactMarkdown>
        <FloatingVideoPlayer />
      </div>
    </VideoProvider>
  );
};

export default StyledMarkdown;

