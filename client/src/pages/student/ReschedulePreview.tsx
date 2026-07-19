import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, CheckCircle, XCircle, AlertTriangle, Calendar, Loader2 
} from 'lucide-react';
import apiClient from '../../services/api/client';

interface RescheduleChange {
  taskId: string;
  title: string;
  oldDate: string;
  newDate: string;
  reason: string;
}

interface RescheduleLog {
  _id: string;
  triggerEvent: string;
  status: string;
  changes: RescheduleChange[];
}

export default function ReschedulePreview() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch proposed preview log
  const { data: previewData, isLoading } = useQuery({
    queryKey: ['schedulerPreview'],
    queryFn: async () => {
      const response = await apiClient.get('/scheduler/preview');
      return response.data.data.preview as RescheduleLog | null;
    }
  });

  // Apply changes mutation
  const applyMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/scheduler/apply');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todayTasks'] });
      queryClient.invalidateQueries({ queryKey: ['schedulerPreview'] });
      navigate('/dashboard');
    }
  });

  // Reject changes mutation
  const rejectMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/scheduler/reject');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedulerPreview'] });
      navigate('/dashboard');
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
        <p className="text-sm">Recalculating and loading schedule changes...</p>
      </div>
    );
  }

  const changes = previewData?.changes || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Glow lights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-brand-500/10 blur-[120px] pointer-events-none"></div>

      <div className="max-w-2xl mx-auto space-y-8 z-10 relative">
        {/* Header bar */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-3 rounded-xl border border-slate-900 bg-slate-900/40 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-white">Reschedule Recommendations</h1>
            <p className="text-slate-400 text-xs mt-1">We detected scheduling capacity issues and optimized your study plan.</p>
          </div>
        </div>

        {changes.length > 0 ? (
          <div className="space-y-6">
            {/* Warning info panel */}
            <div className="glass-panel p-5 rounded-2xl border border-amber-500/20 bg-amber-950/10 text-xs text-amber-300 flex gap-3 items-start">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <span className="font-bold text-sm text-white block mb-1">Proposed Updates Details</span>
                <span>
                  The scheduler shifted {changes.length} tasks to prevent study burnout, accommodate break days, and balance daily limit hours. Spaced revision reviews are preserved where possible.
                </span>
              </div>
            </div>

            {/* Changes list */}
            <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2">
              {changes.map((change, idx) => {
                const oldD = new Date(change.oldDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const newD = new Date(change.newDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                return (
                  <div key={idx} className="glass-panel p-4 rounded-xl border border-slate-900 bg-slate-900/10 hover:border-slate-800 transition flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-white">{change.title}</h4>
                      <p className="text-[10px] text-slate-500">Reason: {change.reason}</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-center">
                        <span className="text-[9px] uppercase font-bold text-slate-500 block">Was</span>
                        <span className="text-xs font-semibold text-red-400 line-through">{oldD}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-600 mt-2" />
                      <div className="text-center">
                        <span className="text-[9px] uppercase font-bold text-brand-400 block">New</span>
                        <span className="text-xs font-bold text-emerald-400">{newD}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action buttons */}
            <div className="flex gap-4 border-t border-slate-900 pt-6">
              <button
                type="button"
                onClick={() => applyMutation.mutate()}
                disabled={applyMutation.isPending || rejectMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-white rounded-xl py-4 font-bold text-sm hover:bg-emerald-600 transition disabled:opacity-50"
              >
                {applyMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Applying Changes...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    Accept Schedule
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => rejectMutation.mutate()}
                disabled={applyMutation.isPending || rejectMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-900 border border-slate-850 text-slate-300 rounded-xl py-4 font-bold text-sm hover:bg-slate-800 hover:text-white transition disabled:opacity-50"
              >
                {rejectMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5" />
                    Keep Original
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-900/10 rounded-2xl border border-slate-900">
            <Calendar className="h-12 w-12 text-slate-700 mx-auto mb-3" />
            <h3 className="font-bold text-white">Your Schedule is Optimized</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">No capacity saturation or missed deadlines detected currently.</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-6 bg-slate-900 text-slate-300 border border-slate-800 rounded-xl px-5 py-2.5 text-xs font-semibold hover:bg-slate-800 hover:text-white transition"
            >
              Return to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Icon helper
function ChevronRight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      {...props}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}
