import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, Search, Star, ArrowLeft, Loader2, Target 
} from 'lucide-react';
import apiClient from '../../services/api/client';

interface StudentLink {
  studentId: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  invitedAt: string;
}

interface StudentDetail {
  studentId: string;
  goal: {
    _id: string;
    title: string;
    targetDate: string;
    status: string;
  } | null;
  tasksCount: number;
  completedTasksCount: number;
  streak: number;
  mastery: any[];
  quizzes: any[];
  calendar: any[];
  achievements: any[];
  feedback: any[];
}

export default function MentorDashboard() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'Overview' | 'Mastery' | 'Quizzes' | 'Feedback'>('Overview');
  
  // Feedback Form State
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(5);

  // Fetch assigned students list
  const { data: students, isLoading: isStudentsLoading } = useQuery({
    queryKey: ['mentorStudentsList'],
    queryFn: async () => {
      const response = await apiClient.get('/mentors/students');
      return response.data.data.students as StudentLink[];
    }
  });

  // Fetch student detailed context parameters
  const { data: studentDetail } = useQuery({
    queryKey: ['mentorStudentDetails', selectedStudentId],
    queryFn: async () => {
      if (!selectedStudentId) return null;
      const response = await apiClient.get(`/mentors/student/${selectedStudentId}`);
      return response.data.data.detail as StudentDetail;
    },
    enabled: !!selectedStudentId
  });

  // Accept/reject request mutations if they type a link or similar
  // Leave feedback mutation
  const feedbackMutation = useMutation({
    mutationFn: async (payload: any) => {
      const response = await apiClient.post('/mentors/feedback', payload);
      return response.data.data.feedback;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentorStudentDetails', selectedStudentId] });
      setFeedbackComment('');
      setFeedbackRating(5);
    }
  });

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentDetail || !studentDetail.goal) return;

    feedbackMutation.mutate({
      studentId: selectedStudentId,
      goalId: studentDetail.goal._id,
      planId: studentDetail.goal._id, // fallback map
      comment: feedbackComment,
      rating: feedbackRating
    });
  };

  const filteredStudents = students?.filter(link => 
    link.studentId.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    link.studentId.email.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (isStudentsLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
        <p className="text-sm">Accessing mentor portal & student links...</p>
      </div>
    );
  }

  // Detail Sub-view Panel
  if (selectedStudentId && studentDetail) {
    const studentInfo = students?.find(s => s.studentId._id === selectedStudentId)?.studentId;


    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center gap-4 border-b border-slate-900 pb-5">
            <button
              onClick={() => setSelectedStudentId(null)}
              className="p-3 rounded-xl border border-slate-900 bg-slate-900/40 text-slate-400 hover:text-white transition"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-extrabold text-white">{studentInfo?.name}</h1>
              <p className="text-xs text-slate-400">{studentInfo?.email}</p>
            </div>
          </div>

          {/* Sub-tabs bar */}
          <div className="flex gap-2 border-b border-slate-900/60 pb-3 text-xs font-bold">
            {(['Overview', 'Mastery', 'Quizzes', 'Feedback'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg transition ${
                  activeTab === tab 
                    ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === 'Overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left summary */}
              <div className="glass-panel p-5 rounded-2xl border border-slate-900 space-y-4">
                <h3 className="font-extrabold text-white text-sm">Learning Summary</h3>
                <div className="space-y-3 text-[11px] text-slate-400">
                  <div className="flex justify-between border-b border-slate-900/40 pb-2">
                    <span>Active Goal</span>
                    <span className="font-bold text-white text-right max-w-[150px] truncate">
                      {studentDetail.goal ? studentDetail.goal.title : 'No active goal'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-900/40 pb-2">
                    <span>Consistency Streak</span>
                    <span className="font-bold text-brand-400">{studentDetail.streak} Days</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-900/40 pb-2">
                    <span>Daily Tasks Completed</span>
                    <span className="font-bold text-white">{studentDetail.completedTasksCount} Completed</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Trophy count</span>
                    <span className="font-bold text-yellow-400">{studentDetail.achievements?.length} Unlocked</span>
                  </div>
                </div>
              </div>

              {/* Middle Goal Widget */}
              <div className="glass-panel p-5 rounded-2xl border border-slate-900 md:col-span-2 space-y-4">
                <h3 className="font-extrabold text-white text-sm">Active Target Timeline</h3>
                {studentDetail.goal ? (
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 font-semibold">{studentDetail.goal.title}</span>
                      <span className="text-slate-400">Target Date: {new Date(studentDetail.goal.targetDate).toLocaleDateString()}</span>
                    </div>
                    <div className="p-4 bg-slate-900/20 border border-slate-900 rounded-xl flex items-center gap-3">
                      <Target className="h-5 w-5 text-brand-400" />
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        Student is currently locked into this active study planner configuration. All tasks generated feed this target.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="h-28 flex items-center justify-center border border-dashed border-slate-900 rounded-xl text-xs text-slate-500">
                    Student has not configured an active intake goal.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'Mastery' && (
            <div className="glass-panel p-5 rounded-2xl border border-slate-900 space-y-4">
              <h3 className="font-extrabold text-white text-sm">Knowledge Mastery Index</h3>
              {studentDetail.mastery && studentDetail.mastery.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {studentDetail.mastery.map((m: any) => (
                    <div key={m._id} className="p-4 rounded-xl border border-slate-900 bg-slate-900/10 flex justify-between items-center">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-500">{m.subjectId?.name}</span>
                        <h4 className="text-xs font-bold text-white mt-0.5">{m.topicId?.name}</h4>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-brand-400">{Math.round(m.masteryScore)}%</span>
                        <span className="text-[9px] text-slate-500 block">Mastery Score</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-32 flex items-center justify-center border border-dashed border-slate-900 rounded-xl text-xs text-slate-500">
                  No knowledge mastery data logs recorded yet.
                </div>
              )}
            </div>
          )}

          {activeTab === 'Quizzes' && (
            <div className="glass-panel p-5 rounded-2xl border border-slate-900 space-y-4">
              <h3 className="font-extrabold text-white text-sm">Diagnostic Quiz History</h3>
              {studentDetail.quizzes && studentDetail.quizzes.length > 0 ? (
                <div className="space-y-3">
                  {studentDetail.quizzes.map((q: any) => (
                    <div key={q._id} className="p-4 rounded-xl border border-slate-900 bg-slate-900/10 flex justify-between items-center text-xs">
                      <div>
                        <h4 className="font-bold text-slate-200">{q.quizId?.title || 'Diagnostic Assessment'}</h4>
                        <span className="text-[9px] text-slate-500">Attempted {new Date(q.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-brand-400">{q.score} Marks ({q.accuracy}%)</span>
                        <span className="text-[9px] text-slate-500 block">Graded Accuracy</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-32 flex items-center justify-center border border-dashed border-slate-900 rounded-xl text-xs text-slate-500">
                  No quiz attempts recorded.
                </div>
              )}
            </div>
          )}

          {activeTab === 'Feedback' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Form */}
              <div className="glass-panel p-5 rounded-2xl border border-slate-900 space-y-4 h-fit">
                <h3 className="font-extrabold text-white text-sm">Leave Progress Feedback</h3>
                <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Rate Current Progress</label>
                    <select
                      value={feedbackRating}
                      onChange={(e) => setFeedbackRating(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-brand-500"
                    >
                      {[5, 4, 3, 2, 1].map(r => (
                        <option key={r} value={r}>{r} Stars {r === 5 ? '(Excellent)' : ''}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Comments / Instructions</label>
                    <textarea
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                      placeholder="Comment on streaks consistency, weak topics, or suggest custom quiz reviews..."
                      className="w-full h-32 bg-slate-950 border border-slate-900 rounded-xl px-4 py-3 text-xs text-slate-300 focus:outline-none focus:border-brand-500 resize-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={feedbackMutation.isPending || !studentDetail.goal}
                    className="w-full bg-brand-500 text-white rounded-xl py-3 text-xs font-bold hover:bg-brand-600 transition flex items-center justify-center gap-1.5"
                  >
                    {feedbackMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Post Feedback'
                    )}
                  </button>
                </form>
              </div>

              {/* History list */}
              <div className="glass-panel p-5 rounded-2xl border border-slate-900 md:col-span-2 space-y-4">
                <h3 className="font-extrabold text-white text-sm">Feedback History</h3>
                {studentDetail.feedback && studentDetail.feedback.length > 0 ? (
                  <div className="space-y-4">
                    {studentDetail.feedback.map((f: any) => (
                      <div key={f._id} className="p-4 rounded-xl border border-slate-900 bg-slate-900/10 space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] text-slate-500 font-semibold">
                            Posted {new Date(f.createdAt).toLocaleDateString()}
                          </span>
                          <div className="flex items-center text-yellow-400 gap-0.5 font-bold">
                            <Star className="h-3.5 w-3.5 fill-current" />
                            <span>{f.rating} / 5</span>
                          </div>
                        </div>
                        <p className="text-slate-300 leading-relaxed">{f.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-32 flex items-center justify-center border border-dashed border-slate-900 rounded-xl text-xs text-slate-500">
                    No feedback records logged yet.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Lights */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-500/5 blur-[120px] pointer-events-none"></div>

      <div className="max-w-5xl mx-auto space-y-8 z-10 relative">
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-slate-900 pb-5">
          <div>
            <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-brand-400" />
              Mentor Collaboration Workspace
            </h1>
            <p className="text-slate-400 text-xs mt-1">Select assigned students to review study logs and post progress recommendations.</p>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search students by name or email ID..."
            className="w-full bg-slate-900/40 border border-slate-900 rounded-xl pl-11 pr-4 py-3 text-xs text-slate-300 focus:outline-none focus:border-brand-500"
          />
        </div>

        {/* Students list */}
        {filteredStudents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredStudents.map((link) => (
              <div 
                key={link.studentId._id}
                className="glass-panel p-5 rounded-2xl border border-slate-900 flex justify-between items-center hover:border-slate-800 transition"
              >
                <div>
                  <h3 className="font-extrabold text-white text-sm">{link.studentId.name}</h3>
                  <span className="text-[10px] text-slate-500 block mt-0.5">{link.studentId.email}</span>
                  <span className="text-[9px] text-slate-500 block mt-1.5">Joined {new Date(link.invitedAt).toLocaleDateString()}</span>
                </div>

                <button
                  onClick={() => setSelectedStudentId(link.studentId._id)}
                  className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl px-4 py-2.5 text-xs font-bold transition"
                >
                  Manage Profile
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-44 flex flex-col justify-center items-center text-slate-600 text-center">
            <Users className="h-12 w-12 text-slate-700 mb-2" />
            <h4 className="text-slate-400 font-bold text-xs">No students linked to your account.</h4>
            <p className="text-[10px] text-slate-500 mt-1">Accept student connection codes to populate your workspace dashboard.</p>
          </div>
        )}
      </div>
    </div>
  );
}
