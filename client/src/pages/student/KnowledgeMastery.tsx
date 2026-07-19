import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Award, AlertTriangle, HelpCircle, 
  Sparkles, Clock, Loader2
} from 'lucide-react';
import apiClient from '../../services/api/client';

interface Subject {
  _id: string;
  name: string;
  code: string;
  color: string;
}

interface Topic {
  _id: string;
  name: string;
  code: string;
  description: string;
}

interface MasteryRecord {
  _id: string;
  subjectId: Subject;
  topicId?: Topic;
  masteryScore: number;
  confidenceScore: number;
  revisionCount: number;
  lastRevisionDate: string;
  nextRevisionDate: string;
  quizAttempts: number;
  averageQuizScore: number;
  estimatedRetention: number;
  aiRecommendation: string;
}

export default function KnowledgeMastery() {
  const navigate = useNavigate();

  // Fetch list of all mastery progress logs
  const { data: masteries, isLoading } = useQuery({
    queryKey: ['masteriesData'],
    queryFn: async () => {
      const response = await apiClient.get('/mastery');
      return response.data.data.masteries as MasteryRecord[];
    }
  });

  // Fetch weak topics list
  const { data: weakTopics } = useQuery({
    queryKey: ['weakTopicsData'],
    queryFn: async () => {
      const response = await apiClient.get('/mastery/weak-topics');
      return response.data.data.weakTopics as MasteryRecord[];
    }
  });

  // Fetch upcoming revision queue
  const { data: revisionQueue } = useQuery({
    queryKey: ['revisionQueueData'],
    queryFn: async () => {
      const response = await apiClient.get('/mastery/revision-queue');
      return response.data.data.queue as MasteryRecord[];
    }
  });

  if (isLoading || !masteries) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
        <p className="text-sm">Retrieving academic mastery parameters...</p>
      </div>
    );
  }

  // Filter subject mastery records (records without subtopics/topics represent general subject logs)
  const subjectRecords = masteries.filter(m => m.subjectId && !m.topicId);
  const topicRecords = masteries.filter(m => m.topicId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Lights */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-brand-500/5 blur-[120px] pointer-events-none"></div>

      <div className="max-w-6xl mx-auto space-y-8 z-10 relative">
        {/* Header bar */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-3 rounded-xl border border-slate-900 bg-slate-900/40 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
              <Award className="h-6 w-6 text-brand-400" />
              Academic Mastery Hub
            </h1>
            <p className="text-slate-400 text-xs mt-1">Continuous spaced repetition tracking and active recall metrics logs.</p>
          </div>
        </div>

        {/* 1. Subject Mastery Cards grid */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-white">Subject Mastery Indexes</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {subjectRecords.length > 0 ? (
              subjectRecords.map((record) => (
                <div key={record._id} className="glass-panel p-5 rounded-2xl border border-slate-900 relative hover:border-slate-800 transition">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-slate-900" style={{ color: record.subjectId?.color }}>
                        {record.subjectId?.code || 'SUB'}
                      </span>
                      <h3 className="font-extrabold text-white mt-1.5">{record.subjectId?.name}</h3>
                    </div>

                    {/* Circular Mastery Score */}
                    <div className="relative inline-flex items-center justify-center">
                      <svg className="w-12 h-12 transform -rotate-90">
                        <circle cx="24" cy="24" r="20" stroke="#0f172a" strokeWidth="3" fill="transparent" />
                        <circle 
                          cx="24" cy="24" r="20" stroke={record.subjectId?.color || '#3b82f6'} strokeWidth="3" fill="transparent"
                          strokeDasharray={125.6}
                          strokeDashoffset={125.6 - (125.6 * record.masteryScore) / 100}
                          className="transition-all duration-500 ease-out"
                        />
                      </svg>
                      <span className="absolute text-[10px] font-bold text-white">{record.masteryScore}%</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-900 text-center text-xs">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-500 block">Revisions</span>
                      <span className="font-semibold text-slate-300">{record.revisionCount || 0}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-500 block">Confidence</span>
                      <span className="font-semibold text-amber-400">{record.confidenceScore}/5</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-500 block">Retention</span>
                      <span className="font-semibold text-emerald-400">{record.estimatedRetention || 100}%</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-8 bg-slate-900/10 rounded-2xl border border-slate-900">
                <HelpCircle className="h-10 w-10 text-slate-700 mx-auto mb-2" />
                <h4 className="text-slate-400 font-bold">No Subject Mastery Logs</h4>
                <p className="text-xs text-slate-500 mt-1">Logs automatically expand once Daily Check-ins are submitted.</p>
              </div>
            )}
          </div>
        </div>

        {/* Split Details columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Topics progress bars */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-base font-bold text-white border-b border-slate-900 pb-3">Topic-Level Mastery Details</h2>
            
            {topicRecords.length > 0 ? (
              <div className="space-y-4">
                {topicRecords.map((record) => (
                  <div key={record._id} className="glass-panel p-4 rounded-xl border border-slate-900 bg-slate-900/10">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="text-xs font-bold text-white">{record.topicId?.name || 'General Study Segment'}</h4>
                        <span className="text-[9px] text-slate-500">Subject: {record.subjectId?.name}</span>
                      </div>
                      <span className="text-xs font-bold text-brand-400">{record.masteryScore}% Mastery</span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden mb-3">
                      <div 
                        className="h-full bg-brand-500 rounded-full" 
                        style={{ width: `${record.masteryScore}%` }}
                      ></div>
                    </div>

                    {/* AI Recommendation Alert */}
                    <div className="p-3 bg-brand-500/5 rounded-lg border border-brand-500/10 text-[11px] text-slate-300 flex items-start gap-2">
                      <Sparkles className="h-4 w-4 text-brand-400 shrink-0 mt-0.5" />
                      <span>{record.aiRecommendation}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-xs text-slate-500 italic block py-4">No detailed topic progress logs. Complete a study task to check topic benchmarks.</span>
            )}
          </div>

          {/* Weakness list and Revision Queue sidebar */}
          <div className="space-y-6">
            {/* Revision Queue */}
            <div>
              <h2 className="text-base font-bold text-white border-b border-slate-900 pb-3 flex items-center gap-1.5">
                <Clock className="h-5 w-5 text-brand-400" />
                Revision Queue
              </h2>
              <div className="space-y-3 mt-4">
                {revisionQueue && revisionQueue.length > 0 ? (
                  revisionQueue.map((record) => (
                    <div key={record._id} className="bg-slate-900/30 p-3.5 rounded-xl border border-slate-900 text-xs flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-slate-200">{record.topicId?.name || record.subjectId?.name}</h4>
                        <span className="text-[10px] text-slate-500">Due: {new Date(record.nextRevisionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-red-950/40 text-red-400 border border-red-500/20">
                        Overdue
                      </span>
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-slate-500 italic block">No upcoming spaced reviews currently due.</span>
                )}
              </div>
            </div>

            {/* Weak topics */}
            <div>
              <h2 className="text-base font-bold text-white border-b border-slate-900 pb-3 flex items-center gap-1.5">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Weaker Areas
              </h2>
              <div className="space-y-3 mt-4">
                {weakTopics && weakTopics.length > 0 ? (
                  weakTopics.map((record) => (
                    <div key={record._id} className="bg-slate-900/30 p-3.5 rounded-xl border border-slate-900 text-xs flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-slate-200">{record.topicId?.name || record.subjectId?.name}</h4>
                        <span className="text-[10px] text-slate-500">Mastery Index: {record.masteryScore}%</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-amber-950/40 text-amber-400 border border-amber-500/20">
                        Low Score
                      </span>
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-slate-500 italic block">None! Keep up the good performance indexes.</span>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
