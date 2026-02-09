import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeRaw from 'rehype-raw';
import BubbleVideoPlayer from './BubbleVideoPlayer';
import FloatingVideoPlayer from './FloatingVideoPlayer';
import { VideoProvider } from '../context/VideoContext';
import { slugify } from '../utils/stringUtils';


interface StyledMarkdownProps {
  content: string;
  className?: string;
  id?: string; // Add ID for persistence namespacing
  isStatic?: boolean;
  disableVideo?: boolean;
}

const StyledMarkdown: React.FC<StyledMarkdownProps> = ({ content, className = '', id, isStatic = false, disableVideo = false }) => {
  // State for checkboxes
  const [checkedItems, setCheckedItems] = React.useState<{ [key: string]: boolean }>({});

  // ... (existing useEffects)

  // Load state on mount or when id changes
  React.useEffect(() => {
    if (!isStatic && id) {
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
  }, [id, isStatic]);

  // Save state when it changes
  const toggleCheckbox = (index: number) => {
    if (!id || isStatic) return;

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

    // Regex explanation:
    // 1. Match start of line or newline
    // 2. Match optional whitespace
    // 3. Match hyphen and space "- "
    // 4. Match [t] or [f]
    newContent = newContent.replace(/(^|\n)\s*-\s*\[t\]/g, '$1- <input type="checkbox" data-quiz="correct" />');
    newContent = newContent.replace(/(^|\n)\s*-\s*\[f\]/g, '$1- <input type="checkbox" data-quiz="wrong" />');

    // If static (printable view), remove emojis from headers for clearer professional look
    if (isStatic) {
      // Regex matches: Newline/Start -> Headings (#) -> Optional Space -> Emojis -> Optional Space
      // Ranges cover generic emoticons, symbols, pictographs, transport, etc.
      newContent = newContent.replace(/(^|\n)(#+\s*)([\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]+)\s*/gu, '$1$2');
    }

    return newContent;
  }, [content, isStatic]);

  // Define the Markdown Content Component to reuse
  const MarkdownContent = (
    <div className={`styled-markdown ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSlug, rehypeRaw]}
        components={{
          // Headings avec le style serif-display
          h1: ({ children, ...props }) => (
            <h1 className="text-4xl font-black text-[#5A6B70] serif-display italic mb-6 mt-8 first:mt-0 scroll-mt-32" {...props}>
              {children}
            </h1>
          ),

          h2: ({ children, ...props }) => {
            // Extract text content safely
            const textContent = React.Children.toArray(children).reduce<string>((acc, child) => {
              return acc + (typeof child === 'string' ? child : '');
            }, '');

            // Generate ID consistently with CoursePlayer
            const id = slugify(textContent);

            // Check if we should show the video player (Lesson 1 only request)
            // We check if the ID (lesson id) contains '01' as a heuristic for Lesson 1
            const showVideo = !isStatic && !disableVideo && id && (id.includes('01') || id.includes('lecon-01'));

            return (
              <h2 {...props} id={id} className="text-3xl font-bold text-[#5A6B70] serif-display italic mb-5 mt-8 first:mt-0 flex items-center group scroll-mt-32">
                <span className="flex-grow">{children}</span>
                {showVideo && <BubbleVideoPlayer sectionTitle={textContent} lessonId={id} />}
              </h2>
            );
          },
          h3: ({ children, ...props }) => (
            <h3 className="text-2xl font-bold text-[#dd8b8b] serif-display italic mb-4 mt-6 scroll-mt-32" {...props}>
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
          // Interactive Select for Quizzes
          select: ({ children, ...props }) => {
            const [status, setStatus] = React.useState<'neutral' | 'correct' | 'wrong'>('neutral');

            const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
              const value = e.target.value;
              if (value === 'correct') {
                setStatus('correct');
              } else if (value === 'wrong') {
                setStatus('wrong');
              } else {
                setStatus('neutral');
              }
              if (props.onChange) {
                props.onChange(e);
              }
            };

            const getBorderColor = () => {
              switch (status) {
                case 'correct': return 'border-green-500 bg-green-50 text-green-700';
                case 'wrong': return 'border-red-500 bg-red-50 text-red-700';
                default: return 'border-[#dd8b8b]/30 focus:border-[#dd8b8b] bg-white text-[#5A6B70]';
              }
            };

            return (
              <div className="inline-block relative mr-2 my-2 align-middle">
                <select
                  {...props}
                  onChange={handleChange}
                  className={`
                    appearance-none px-4 py-2 pr-8 rounded-xl border-2 font-medium cursor-pointer shadow-sm
                    outline-none transition-all duration-300 ease-in-out
                    ${getBorderColor()}
                  `}
                >
                  {children}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#5A6B70]/50">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            );
          },
          option: ({ children, ...props }) => (
            <option {...props} className="text-[#5A6B70] bg-white py-2">{children}</option>
          ),

          input: (props: any) => {
            // 1. CHECK FOR QUIZ MODE (data-quiz attribute)
            if (props['data-quiz']) {
              const [status, setStatus] = React.useState<'neutral' | 'correct' | 'wrong'>('neutral');
              const isCorrect = props['data-quiz'] === 'correct';

              const handleClick = () => {
                if (isCorrect) {
                  setStatus('correct');
                } else {
                  setStatus('wrong');
                }
              };

              // Determine styles based on status
              let borderColor = 'border-[#dd8b8b]';
              let bgColor = 'bg-white';
              let icon = null;

              if (status === 'correct') {
                borderColor = 'border-green-500';
                bgColor = 'bg-green-500';
              } else if (status === 'wrong') {
                borderColor = 'border-red-500';
                bgColor = 'bg-red-500';
              }

              return (
                <span className="inline-flex items-center relative mr-2 cursor-pointer group" onClick={handleClick}>
                  <input
                    type="checkbox"
                    className="appearance-none w-5 h-5 border-2 rounded transition-all duration-200 ease-in-out cursor-pointer"
                    style={{
                      borderColor: status === 'neutral' ? '#dd8b8b' : (status === 'correct' ? '#22c55e' : '#ef4444'),
                      backgroundColor: status === 'neutral' ? 'white' : (status === 'correct' ? '#22c55e' : '#ef4444')
                    }}
                    checked={status !== 'neutral'}
                    readOnly
                  />
                  {/* Checkmark or X icon overlay */}
                  <span className={`absolute inset-0 flex items-center justify-center text-white pointer-events-none transition-opacity ${status === 'neutral' ? 'opacity-0' : 'opacity-100'}`}>
                    {status === 'correct' ? (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    )}
                  </span>
                  {/* Hover hint (optional, kept subtle) */}
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#dd8b8b] rounded-full opacity-0 group-hover:opacity-20 transition-opacity"></span>
                </span>
              );
            }

            // 2. STANDARD CHECKBOXES (Persistence)
            if (props.type === "checkbox") {
              const index = checkboxCount++;
              const isChecked = checkedItems[index] || props.checked || false;

              return (
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleCheckbox(index)}
                  disabled={!id || isStatic} // Disable if no ID provided or static
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
                    if (!isStatic) {
                      const targetId = href?.slice(1);
                      const targetElement = document.getElementById(targetId || '');
                      if (targetElement) {
                        targetElement.scrollIntoView({ behavior: 'smooth' });
                      }
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
      {!isStatic && !disableVideo && <FloatingVideoPlayer />}
    </div>
  );

  if (isStatic || disableVideo) {
    return MarkdownContent;
  }

  return (
    <VideoProvider lessonId={id || 'global'}>
      {MarkdownContent}
    </VideoProvider>
  );
};

export default StyledMarkdown;

