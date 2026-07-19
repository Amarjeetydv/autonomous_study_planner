import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Send, Sparkles, User, Loader2, Bot, Plus, Trash2, ArrowLeft,
  MessageSquare
} from 'lucide-react';
import apiClient from '../../services/api/client';

interface ChatMessage {
  _id: string;
  role: 'user' | 'assistant';
  message: string;
  createdAt: string;
}

interface ThreadHistory {
  _id: string;
  latestMessage: string;
  timestamp: string;
}

// Simple local markdown parser helper
const parseMarkdown = (text: string) => {
  if (!text) return '';
  
  // Scrubber escaping to prevent injection
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Code Blocks
  html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-slate-950 p-4 rounded-lg my-3 overflow-x-auto text-[11px] font-mono border border-slate-900">$1</pre>');
  
  // Inline Code
  html = html.replace(/`(.*?)`/g, '<code class="bg-slate-900 px-1.5 py-0.5 rounded text-amber-400 font-mono text-[11px]">$1</code>');

  // Bullet Lists
  html = html.replace(/^\s*-\s+(.*)$/gm, '<li class="ml-4 list-disc my-1">$1</li>');

  // Newlines to breaks (if not inside pre blocks)
  return html.split('\n').join('<br />');
};

export default function AICompanion() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [activeThreadId, setActiveThreadId] = useState<string>('');
  const [inputText, setInputText] = useState<string>('');

  // Fetch past chat threads list
  const { data: historyList, isLoading: isHistoryLoading } = useQuery({
    queryKey: ['chatThreadsHistory'],
    queryFn: async () => {
      const response = await apiClient.get('/chat/history');
      return response.data.data.history as ThreadHistory[];
    }
  });

  // Fetch messages for active thread
  const { data: messages, isLoading: isMessagesLoading } = useQuery({
    queryKey: ['chatMessages', activeThreadId],
    queryFn: async () => {
      const response = await apiClient.get(`/chat/conversation/${activeThreadId}`);
      return response.data.data.conversation as ChatMessage[];
    },
    enabled: !!activeThreadId
  });

  // Automatically load the latest thread or create a new one on startup
  useEffect(() => {
    if (historyList && historyList.length > 0 && !activeThreadId) {
      setActiveThreadId(historyList[0]._id);
    } else if (historyList && historyList.length === 0 && !activeThreadId) {
      startNewSession();
    }
  }, [historyList]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: async (payload: { conversationId: string; message: string }) => {
      const response = await apiClient.post('/chat/message', payload);
      return response.data.data.reply;
    },
    onSuccess: () => {
      setInputText('');
      queryClient.invalidateQueries({ queryKey: ['chatMessages', activeThreadId] });
      queryClient.invalidateQueries({ queryKey: ['chatThreadsHistory'] });
    }
  });

  // Delete thread mutation
  const deleteMutation = useMutation({
    mutationFn: async (threadId: string) => {
      await apiClient.delete(`/chat/conversation/${threadId}`);
    },
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['chatThreadsHistory'] });
      if (activeThreadId === deletedId) {
        setActiveThreadId('');
      }
    }
  });

  const startNewSession = () => {
    const newId = 'companion_' + Date.now();
    setActiveThreadId(newId);
  };

  const handleSend = () => {
    if (!inputText.trim()) return;
    sendMutation.mutate({
      conversationId: activeThreadId,
      message: inputText
    });
  };

  const handleSuggestedQuestion = (question: string) => {
    sendMutation.mutate({
      conversationId: activeThreadId,
      message: question
    });
  };

  const suggestedQuestions = [
    "What topics should I revise next?",
    "Explain concept definitions of my weak areas",
    "How can I structure my spaced repetition calendar?",
    "Provide a motivation boost for today's tasks"
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex relative overflow-hidden">
      {/* Lights */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-500/5 blur-[120px] pointer-events-none"></div>

      {/* Sidebar Thread List */}
      <div className="w-80 border-r border-slate-900/60 bg-slate-950/40 flex flex-col justify-between z-10 shrink-0 hidden md:flex">
        <div className="p-5 border-b border-slate-900 flex justify-between items-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Workspace
          </button>
          <button
            onClick={startNewSession}
            className="flex items-center gap-1 bg-brand-500/10 text-brand-400 border border-brand-500/20 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-brand-500/20 transition"
          >
            <Plus className="h-4.5 w-4.5" />
            New
          </button>
        </div>

        {/* History Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold mb-2">Previous Chats</span>
          {isHistoryLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-slate-600" />
            </div>
          ) : historyList && historyList.length > 0 ? (
            historyList.map((thread) => (
              <div 
                key={thread._id}
                onClick={() => setActiveThreadId(thread._id)}
                className={`w-full text-left p-3 rounded-xl border text-xs cursor-pointer flex justify-between items-center transition ${
                  activeThreadId === thread._id 
                    ? 'bg-slate-900 text-white border-slate-800' 
                    : 'bg-slate-950/30 text-slate-400 border-transparent hover:bg-slate-900/40 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <MessageSquare className="h-4 w-4 shrink-0 text-brand-400" />
                  <span className="truncate leading-none">{thread.latestMessage || 'New Chat Session'}</span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteMutation.mutate(thread._id);
                  }}
                  className="p-1 hover:text-red-400 transition"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          ) : (
            <span className="text-[10px] text-slate-600 italic">No previous threads.</span>
          )}
        </div>
      </div>

      {/* Main Chat Panel */}
      <div className="flex-1 flex flex-col justify-between z-10">
        {/* Header bar */}
        <div className="p-5 border-b border-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bot className="h-6 w-6 text-brand-400" />
            <div>
              <h1 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                AI Study Companion
                <Sparkles className="h-4 w-4 text-brand-400" />
              </h1>
              <p className="text-[10px] text-slate-500">Guides schedules, quiz mistakes, and revision retention curves.</p>
            </div>
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            className="md:hidden p-2.5 rounded-lg bg-slate-900 border border-slate-850 text-slate-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isMessagesLoading ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2">
              <Loader2 className="h-7 w-7 animate-spin text-brand-500" />
              <span className="text-xs">Rebuilding conversation parameters...</span>
            </div>
          ) : messages && messages.length > 0 ? (
            messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div key={msg._id} className={`flex gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
                  {/* Avatar bubble */}
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border ${
                    isUser ? 'bg-slate-900 border-slate-800 text-brand-400' : 'bg-brand-500/10 border-brand-500/20 text-brand-400'
                  }`}>
                    {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>

                  {/* Message card */}
                  <div className={`p-4 rounded-2xl text-xs border ${
                    isUser 
                      ? 'bg-slate-900/60 border-slate-850 text-slate-200 rounded-tr-none' 
                      : 'bg-brand-500/[0.02] border-brand-500/[0.06] text-slate-300 rounded-tl-none leading-relaxed'
                  }`}>
                    {/* Rendered HTML */}
                    <div 
                      dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.message) }} 
                      className="space-y-2 break-words"
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 py-20">
              <Bot className="h-12 w-12 text-brand-400 animate-bounce" />
              <div>
                <h3 className="text-sm font-bold text-slate-300">How can I assist your study checklist today?</h3>
                <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                  I analyze your quiz reports, diagnostic masteries, and schedules to recommend targeted revision guidelines.
                </p>
              </div>

              {/* Recommended chips */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full">
                {suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestedQuestion(q)}
                    className="p-3 bg-slate-900/40 border border-slate-900 hover:border-slate-800 text-[11px] font-semibold text-slate-400 hover:text-white rounded-xl text-left transition"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Typing Indicator */}
          {sendMutation.isPending && (
            <div className="flex gap-3 max-w-[85%] mr-auto items-center">
              <div className="h-8 w-8 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4" />
              </div>
              <div className="p-3 bg-slate-900 border border-slate-900 rounded-2xl rounded-tl-none flex items-center gap-1">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-500" />
                <span className="text-[10px] text-slate-500">Companion is drafting tips...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input box section */}
        <div className="p-5 border-t border-slate-900 bg-slate-950/80 backdrop-blur-md">
          {/* Quick chips if conversation has started */}
          {messages && messages.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-none text-[10px]">
              {suggestedQuestions.slice(0, 2).map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestedQuestion(q)}
                  className="bg-slate-900 border border-slate-850 hover:border-slate-800 px-3 py-1.5 rounded-full text-slate-400 hover:text-white whitespace-nowrap transition"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask for revision schedules, quiz evaluations, or study strategies..."
              className="flex-1 bg-slate-900/60 border border-slate-850 rounded-xl px-4 py-3 text-xs text-slate-200 outline-none focus:border-brand-500/60 transition placeholder-slate-600"
            />
            <button
              onClick={handleSend}
              disabled={!inputText.trim() || sendMutation.isPending}
              className="bg-brand-500 text-white rounded-xl px-5 flex items-center justify-center hover:bg-brand-600 transition disabled:opacity-30"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
