import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, Search, Filter, ArrowRight, ChevronLeft, ChevronRight, 
  Flame, CheckCircle2, Clock
} from 'lucide-react';
import apiClient from '../../services/api/client';
import { MentorSkeleton } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import UserAvatar from '../../components/ui/UserAvatar';

interface StudentItem {
  id: string;
  name: string;
  email: string;
  course: string;
  goalTitle?: string;
  streak?: number;
  completionRate?: number;
  lastActive?: string;
  status: 'Active' | 'At Risk' | 'Completed';
}

export default function MentorStudents() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'At Risk' | 'Completed'>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Fetch student roster from backend API
  const { data: studentsData, isLoading, isError, refetch } = useQuery({
    queryKey: ['mentorStudentsRoster'],
    queryFn: async () => {
      const response = await apiClient.get('/mentors/students');
      const list = response.data?.data?.students || [];
      return list.map((item: any): StudentItem => ({
        id: item.studentId?._id || item._id,
        name: item.studentId?.name || 'Student',
        email: item.studentId?.email || 'No email registered',
        course: item.studentId?.category || 'General Studies',
        goalTitle: item.studentId?.activeGoal || undefined,
        streak: item.studentId?.streak || 0,
        completionRate: item.studentId?.completionRate || 0,
        lastActive: item.invitedAt ? new Date(item.invitedAt).toLocaleDateString() : 'Recently',
        status: item.status === 'accepted' ? 'Active' : 'At Risk',
      }));
    },
  });

  const filteredStudents = useMemo(() => {
    const data: StudentItem[] = studentsData || [];
    return data.filter((student: StudentItem) => {
      const matchesSearch =
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.course.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || student.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [studentsData, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(start, start + itemsPerPage);
  }, [filteredStudents, currentPage]);

  if (isLoading) {
    return <MentorSkeleton />;
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 flex flex-col items-center justify-center">
        <EmptyState
          icon={Users}
          title="Failed to Load Student Roster"
          description="Could not connect to the mentor service to fetch assigned students."
          actionLabel="Retry Connection"
          onAction={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="max-w-6xl mx-auto space-y-8 z-10 relative">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-brand-500/10 text-brand-400 border border-brand-500/20 text-[10px] font-bold uppercase tracking-wider">
                Student Roster
              </span>
              <span className="text-xs text-slate-500 font-semibold">• Management Suite</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white mt-1.5 flex items-center gap-2">
              <Users className="h-6 w-6 text-brand-400" />
              Assigned Students Overview
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              Monitor individual student goals, consistency streaks, and completion rates.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-300 bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl">
              Total Students: {filteredStudents.length}
            </span>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by student name, email, course..."
              className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 outline-none focus:border-brand-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="h-4 w-4 text-slate-500" />
            <span className="text-xs text-slate-400 font-semibold">Filter Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-300 outline-none focus:border-brand-500"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="At Risk">At Risk</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Students Table / Grid */}
        {paginatedStudents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedStudents.map((student: StudentItem) => (
              <div
                key={student.id}
                className="glass-panel p-5 rounded-2xl border border-slate-900 space-y-4 hover:border-slate-800 transition flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <UserAvatar name={student.name} status={student.status === 'Active' ? 'online' : 'idle'} />
                      <div>
                        <h3 className="font-extrabold text-white text-sm">{student.name}</h3>
                        <span className="text-[10px] text-slate-400">{student.email}</span>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        student.status === 'Active'
                          ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/30'
                          : student.status === 'At Risk'
                          ? 'bg-red-950/80 text-red-400 border-red-500/30'
                          : 'bg-indigo-950/80 text-indigo-400 border-indigo-500/30'
                      }`}
                    >
                      {student.status}
                    </span>
                  </div>

                  <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800/80 space-y-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Course / Goal</span>
                    <p className="text-xs font-bold text-slate-200 truncate">{student.goalTitle || student.course}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-900/30 border border-slate-800/60">
                      <span className="text-[9px] text-slate-500 uppercase font-semibold block">Streak</span>
                      <span className="font-extrabold text-brand-400 flex items-center gap-1">
                        <Flame className="h-3.5 w-3.5" />
                        {student.streak || 0} Days
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900/30 border border-slate-800/60">
                      <span className="text-[9px] text-slate-500 uppercase font-semibold block">Completion</span>
                      <span className="font-extrabold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {student.completionRate || 0}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-900/80 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                    <Clock className="h-3 w-3" />
                    Joined {student.lastActive}
                  </span>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-brand-400 transition">
                    View Details
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Users}
            title="No Assigned Students Found"
            description="Share your mentor invite code with students to link their profiles and monitor their study progress."
          />
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-900 pt-4 text-xs font-semibold text-slate-400">
            <span>
              Showing Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 disabled:opacity-40 hover:text-white transition"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 disabled:opacity-40 hover:text-white transition"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
