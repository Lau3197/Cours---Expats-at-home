
import React, { useState } from 'react';
import { ThumbsUp, Reply, MoreHorizontal, Flag, MessageCircle } from 'lucide-react';
import { Comment } from '../types';

interface LessonCommentsProps {
  comments: Comment[];
  onAddComment: (text: string) => void;
}

const LessonComments: React.FC<LessonCommentsProps> = ({ comments, onAddComment }) => {
  const [newComment, setNewComment] = useState('');
  // Note: ideally we'd trigger a notification to the thread owner here via backend functions.
  // For now, the parent handles the actual add logic.

  const CommentItem = ({ comment, isReply = false }: { comment: Comment, isReply?: boolean }) => (
    <div className={`group flex gap-4 ${isReply ? 'ml-12 mt-4' : 'mt-8'}`}>
      <div className="flex-shrink-0">
        <div className={`w-10 h-10 rounded-2xl overflow-hidden border-2 ${comment.isInstructor ? 'border-[#E8C586]' : 'border-[#dd8b8b]/10'}`}>
          <img src={comment.userAvatar} alt={comment.userName} className="w-full h-full object-cover" />
        </div>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-sm font-bold text-[#5A6B70] sans-geometric">{comment.userName}</span>
          {comment.isInstructor && (
            <span className="bg-[#E8C586]/10 text-[#E8C586] text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
              Expert
            </span>
          )}
          <span className="text-[10px] text-[#5A6B70]/40 font-bold sans-geometric uppercase tracking-widest">{comment.timestamp}</span>
        </div>
        <div className={`p-4 rounded-[20px] text-sm leading-relaxed ${comment.isInstructor ? 'bg-[#E8C586]/5 text-[#5A6B70]' : 'bg-white text-[#5A6B70]/80 shadow-sm border border-[#dd8b8b]/5'
          }`}>
          {comment.text}
        </div>
        <div className="flex items-center gap-6 mt-2 px-1">
          <button className="flex items-center gap-1.5 text-[10px] font-black text-[#5A6B70]/40 hover:text-[#dd8b8b] sans-geometric uppercase tracking-widest transition-colors">
            <ThumbsUp className="w-3 h-3" /> {comment.likes}
          </button>
          {!isReply && (
            <button className="flex items-center gap-1.5 text-[10px] font-black text-[#5A6B70]/40 hover:text-[#dd8b8b] sans-geometric uppercase tracking-widest transition-colors">
              <Reply className="w-3 h-3" /> Reply
            </button>
          )}
          <button className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto text-[#5A6B70]/30 hover:text-[#5A6B70]">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
        {comment.replies?.map(reply => (
          <CommentItem key={reply.id} comment={reply} isReply />
        ))}
      </div>
    </div>
  );

  return (
    <div className="mt-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-3 mb-10">
        <div className="bg-[#dd8b8b] p-2.5 rounded-2xl text-white">
          <MessageCircle className="w-6 h-6" />
        </div>
        <h3 className="text-2xl font-bold text-[#5A6B70] serif-display italic">
          Expert <span className="text-[#dd8b8b] not-italic">Community</span>
        </h3>
        <span className="text-xs font-black text-[#5A6B70]/30 sans-geometric uppercase tracking-widest ml-auto">
          {comments.length} Discussion Threads
        </span>
      </div>

      <div className="bg-[#F9F7F2] p-6 rounded-[32px] border-2 border-dashed border-[#dd8b8b]/20 mb-12">
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-2xl bg-white flex-shrink-0 overflow-hidden border border-[#dd8b8b]/10">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Join the conversation... Partagez vos pensées!"
              className="w-full bg-white border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-[#dd8b8b]/20 min-h-[100px] resize-none shadow-sm"
            />
            <div className="flex justify-end mt-4">
              <button
                onClick={() => { onAddComment(newComment); setNewComment(''); }}
                className="bg-[#5A6B70] text-white px-8 py-3 rounded-2xl font-bold hover:bg-[#dd8b8b] transition-all sans-geometric uppercase tracking-widest text-xs shadow-lg shadow-[#5A6B70]/10"
              >
                Post Comment
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {comments.map(c => <CommentItem key={c.id} comment={c} />)}
      </div>
    </div>
  );
};

export default LessonComments;
