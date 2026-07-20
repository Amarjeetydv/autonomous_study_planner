import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  MessageSquare, Send, Search, CheckCircle2, Target
} from 'lucide-react';
import apiClient from '../../services/api/client';
import UserAvatar from '../../components/ui/UserAvatar';
import EmptyState from '../../components/ui/EmptyState';
import { MentorSkeleton } from '../../components/ui/Skeleton';
import { toast } from '../../services/toast';

import { useSelector } from 'react-redux';
import { RootState } from '../../app/store';

export default function MentorMessages() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch all conversations for the mentor
  const { data: conversations, isLoading, isError, refetch } = useQuery({
    queryKey: ['mentorConversations'],
    queryFn: async () => {
      const response = await apiClient.get('/messages/conversations');
      return response.data?.data?.conversations || [];
    },
    refetchInterval: 5000,
  });

  // Set default active conversation if none selected
  useEffect(() => {
    if (conversations && conversations.length > 0 && !activeConvId) {
      setActiveConvId(conversations[0]._id);
    }
  }, [conversations, activeConvId]);

  // Fetch messages for active conversation
  const { data: messagesList, refetch: refetchMessages } = useQuery({
    queryKey: ['mentorConversationMessages', activeConvId],
    queryFn: async () => {
      if (!activeConvId) return [];
      const response = await apiClient.get(`/messages/${activeConvId}`);
      await apiClient.patch(`/messages/read/${activeConvId}`);
      return response.data?.data?.messages || [];
    },
    enabled: !!activeConvId,
    refetchInterval: activeConvId ? 3000 : false,
  });

  const sendMentorMessageMutation = useMutation({
    mutationFn: async (payload: { conversationId: string; message: string; receiverId?: string }) => {
      const response = await apiClient.post('/messages', payload);
      return response.data.data.message;
    },
    onSuccess: () => {
      setInputMessage('');
      refetchMessages();
      toast.success('Message sent to student.', '💬 Dispatched');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to send message', 'Error');
    }
  });

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesList]);

  if (isLoading) {
    return <MentorSkeleton />;
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 flex flex-col items-center justify-center">
        <EmptyState
          icon={MessageSquare}
          title="Failed to Load Discussion Channels"
          description="Could not connect to the messaging server."
          actionLabel="Retry Connection"
          onAction={() => refetch()}
        />
      </div>
    );
  }

  const activeConversations = conversations || [];
  const filteredConversations = activeConversations.filter((conv: any) => {
    const student = conv.participants?.find((p: any) => p.roles?.includes('Student')) || conv.participants?.[0];
    return (
      student?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student?.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const currentConv = activeConversations.find((c: any) => c._id === activeConvId) || activeConversations[0];
  const selectedStudent = currentConv?.participants?.find((p: any) => p.roles?.includes('Student')) || currentConv?.participants?.[0];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !currentConv) return;

    sendMentorMessageMutation.mutate({
      conversationId: currentConv._id,
      receiverId: selectedStudent?._id,
      message: inputMessage.trim(),
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-6 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-6 z-10 relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-900 pb-4">
          <div>
            <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-purple-400" />
              Mentor Student Discussions
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">
              Direct mentor-to-student messaging portal and review assistance.
            </p>
          </div>
        </div>

        {activeConversations.length > 0 ? (
          /* 3-Column Layout: Conversation List | Chat Area | Student Details */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[650px]">
            {/* Column 1: Conversations List */}
            <div className="lg:col-span-4 glass-panel rounded-2xl border border-slate-900 flex flex-col justify-between overflow-hidden">
              <div className="p-4 border-b border-slate-900 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Assigned Channels</span>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search student channels..."
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                {filteredConversations.map((conv: any) => {
                  const student = conv.participants?.find((p: any) => p.roles?.includes('Student')) || conv.participants?.[0];
                  const isActive = conv._id === activeConvId;
                  return (
                    <button
                      key={conv._id}
                      onClick={() => setActiveConvId(conv._id)}
                      className={`w-full p-3 rounded-xl text-left transition flex items-start gap-3 border ${
                        isActive
                          ? 'bg-slate-900 border-brand-500/30 text-white'
                          : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-900/40 hover:text-slate-200'
                      }`}
                    >
                      <UserAvatar name={student?.name} status="online" size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <h4 className="font-bold text-xs text-slate-100 truncate">{student?.name || 'Student'}</h4>
                          <span className="text-[10px] text-slate-500">
                            {new Date(conv.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{conv.lastMessage?.text || student?.email}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Column 2: Chat Area */}
            <div className="lg:col-span-5 glass-panel rounded-2xl border border-slate-900 flex flex-col justify-between overflow-hidden">
              {/* Active Header */}
              <div className="p-4 border-b border-slate-900 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <UserAvatar name={selectedStudent?.name} status="online" size="sm" />
                  <div>
                    <h3 className="font-bold text-white text-xs">{selectedStudent?.name || 'Student'}</h3>
                    <span className="text-[10px] text-slate-400">{selectedStudent?.email}</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
                  Online
                </span>
              </div>

              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {messagesList && messagesList.length > 0 ? (
                  messagesList.map((msg: any) => {
                    const currentUserId = (user as any)?.id || (user as any)?._id;
                    const isMentorMsg = msg.senderId?._id === currentUserId || msg.senderId === currentUserId;
                    return (
                      <div
                        key={msg._id}
                        className={`flex flex-col ${isMentorMsg ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-xs p-3 rounded-2xl text-xs leading-relaxed ${
                            isMentorMsg
                              ? 'bg-brand-600 text-white rounded-br-none'
                              : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-bl-none'
                          }`}
                        >
                          {msg.message}
                        </div>
                        <span className="text-[9px] text-slate-500 mt-1 px-1">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex flex-col justify-center items-center text-center p-6 space-y-2 text-slate-500">
                    <MessageSquare className="h-8 w-8 text-slate-600" />
                    <p className="text-xs font-semibold text-slate-400">No Messages Logged Yet</p>
                    <p className="text-[11px] text-slate-500">Type a message below to initiate discussion with {selectedStudent?.name}.</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Bar */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-900 flex items-center gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Write a message or mentor recommendation..."
                  className="flex-1 bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-brand-500"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || sendMentorMessageMutation.isPending}
                  className="p-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white transition shadow-lg shadow-brand-500/20 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>

            {/* Column 3: Student Details Panel */}
            <div className="lg:col-span-3 glass-panel rounded-2xl border border-slate-900 p-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="text-center pb-4 border-b border-slate-900">
                  <UserAvatar name={selectedStudent?.name} size="lg" status="online" />
                  <h3 className="font-extrabold text-white text-sm mt-2">{selectedStudent?.name || 'Student'}</h3>
                  <span className="text-[10px] text-slate-400 block">{selectedStudent?.email}</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                      <Target className="h-3 w-3 text-brand-400" />
                      Chat Thread Status
                    </span>
                    <p className="font-bold text-slate-200 text-[11px]">
                      Active Direct Channel
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                      Status
                    </span>
                    <p className="font-bold text-emerald-400 text-xs">Connected & Synced</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <EmptyState
            icon={MessageSquare}
            title="No Active Discussion Channels"
            description="Discussion channels activate automatically when students link their study profiles to your mentor account."
          />
        )}
      </div>
    </div>
  );
}
