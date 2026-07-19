import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, Users, BookOpen, Clock, Activity, CheckCircle2, 
  Trash2, ShieldAlert, ShieldCheck, UserCheck, Loader2, ArrowLeft 
} from 'lucide-react';
import apiClient from '../../services/api/client';

interface KPIStats {
  totalUsers: number;
  activeStudents: number;
  activeMentors: number;
  goalsCreated: number;
  plansGenerated: number;
  quizzesAttempted: number;
  notificationsDispatched: number;
  avgQuizAccuracy: number;
  averageStudyHoursPerTask: number;
}

interface UserItem {
  _id: string;
  name: string;
  email: string;
  role: 'Student' | 'Mentor' | 'Admin';
  status: 'active' | 'suspended' | 'pending';
}

interface SubjectItem {
  _id: string;
  name: string;
  code: string;
  color: string;
}

interface AuditLogItem {
  _id: string;
  adminId: {
    name: string;
    email: string;
  };
  action: string;
  entity: string;
  newValue?: any;
  createdAt: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'Dashboard' | 'Users' | 'Curriculum' | 'Health' | 'Audits'>('Dashboard');

  // User Management state
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Subject Form State
  const [newSubName, setNewSubName] = useState('');
  const [newSubCode, setNewSubCode] = useState('');
  const [newSubColor, setNewSubColor] = useState('indigo');

  // Queries
  const { data: statsData, isLoading: isStatsLoading } = useQuery({
    queryKey: ['adminDashboardStats'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/dashboard');
      return response.data.data as KPIStats;
    }
  });

  const { data: usersData, isLoading: isUsersLoading } = useQuery({
    queryKey: ['adminUsersList', userSearch, roleFilter],
    queryFn: async () => {
      const url = `/admin/users?search=${userSearch}&role=${roleFilter}`;
      const response = await apiClient.get(url);
      return response.data.data.users as UserItem[];
    }
  });

  const { data: curriculumData, isLoading: isCurriculumLoading } = useQuery({
    queryKey: ['adminCurriculumList'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/curriculum');
      return response.data.data.subjects as SubjectItem[];
    }
  });

  const { data: logsData, isLoading: isLogsLoading } = useQuery({
    queryKey: ['adminAuditLogsList'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/audit-logs');
      return response.data.data.logs as AuditLogItem[];
    }
  });

  const { data: healthData, isLoading: isHealthLoading } = useQuery({
    queryKey: ['adminSystemHealth'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/system-health');
      return response.data.data;
    }
  });

  // Mutations
  const userMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const response = await apiClient.patch(`/admin/users/${id}`, payload);
      return response.data.data.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsersList'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['adminAuditLogsList'] });
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/admin/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsersList'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['adminAuditLogsList'] });
    }
  });

  const createSubjectMutation = useMutation({
    mutationFn: async (payload: any) => {
      const response = await apiClient.post('/admin/curriculum', payload);
      return response.data.data.subject;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCurriculumList'] });
      queryClient.invalidateQueries({ queryKey: ['adminAuditLogsList'] });
      setNewSubName('');
      setNewSubCode('');
    }
  });

  const deleteSubjectMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/admin/curriculum/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCurriculumList'] });
      queryClient.invalidateQueries({ queryKey: ['adminAuditLogsList'] });
    }
  });

  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    createSubjectMutation.mutate({
      name: newSubName,
      code: newSubCode,
      color: newSubColor
    });
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Admin': return 'bg-red-950/40 text-red-400 border-red-500/20';
      case 'Mentor': return 'bg-indigo-950/40 text-indigo-400 border-indigo-500/20';
      default: return 'bg-slate-900 text-slate-400 border-slate-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-emerald-400';
      case 'suspended': return 'text-red-400';
      default: return 'text-amber-400';
    }
  };

  if (isStatsLoading || isUsersLoading || isCurriculumLoading || isLogsLoading || isHealthLoading || !statsData) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
        <p className="text-sm">Accessing system vaults & audit files...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Lights */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-500/5 blur-[120px] pointer-events-none"></div>

      <div className="max-w-6xl mx-auto space-y-8 z-10 relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-900 pb-5">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-3 rounded-xl border border-slate-900 bg-slate-900/40 text-slate-400 hover:text-white transition"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
                <Shield className="h-5 w-5 text-brand-400" />
                Enterprise Admin Control Center
              </h1>
              <p className="text-slate-400 text-xs mt-1">Manage users catalog, verify mentors, edit curricula, and audit logs.</p>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex gap-2 border-b border-slate-900/60 pb-3 text-xs font-bold">
          {(['Dashboard', 'Users', 'Curriculum', 'Health', 'Audits'] as const).map(tab => (
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

        {/* Content Tabs */}
        {activeTab === 'Dashboard' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="glass-panel p-5 rounded-2xl border border-slate-900">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Users</span>
                    <h2 className="text-2xl font-extrabold text-white mt-1">{statsData.totalUsers}</h2>
                  </div>
                  <Users className="h-5 w-5 text-brand-400" />
                </div>
                <span className="text-[9px] text-slate-500 block mt-2">
                  {statsData.activeStudents} Students / {statsData.activeMentors} Mentors
                </span>
              </div>

              <div className="glass-panel p-5 rounded-2xl border border-slate-900">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">AI Study Plans</span>
                    <h2 className="text-2xl font-extrabold text-white mt-1">{statsData.plansGenerated}</h2>
                  </div>
                  <BookOpen className="h-5 w-5 text-indigo-400" />
                </div>
                <span className="text-[9px] text-slate-500 block mt-2">{statsData.goalsCreated} Goals Intakes created</span>
              </div>

              <div className="glass-panel p-5 rounded-2xl border border-slate-900">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Assessment Quizzes</span>
                    <h2 className="text-2xl font-extrabold text-white mt-1">{statsData.quizzesAttempted}</h2>
                  </div>
                  <Clock className="h-5 w-5 text-yellow-400" />
                </div>
                <span className="text-[9px] text-slate-500 block mt-2">Avg accuracy score: {statsData.avgQuizAccuracy}%</span>
              </div>

              <div className="glass-panel p-5 rounded-2xl border border-slate-900">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Study Hours Complete</span>
                    <h2 className="text-2xl font-extrabold text-white mt-1">{statsData.averageStudyHoursPerTask} h</h2>
                  </div>
                  <Activity className="h-5 w-5 text-emerald-400" />
                </div>
                <span className="text-[9px] text-slate-500 block mt-2">Dispatched: {statsData.notificationsDispatched} alerts</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Users' && (
          <div className="glass-panel p-5 rounded-2xl border border-slate-900 space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                placeholder="Search catalog by name/email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-xs text-slate-300 outline-none w-full"
              />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-xs text-slate-300 outline-none w-full sm:w-48"
              >
                <option value="">All Roles</option>
                <option value="Student">Student</option>
                <option value="Mentor">Mentor</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-900 text-slate-500">
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Email</th>
                    <th className="pb-3">Role</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersData?.map(user => (
                    <tr key={user._id} className="border-b border-slate-900/40 text-slate-300 hover:bg-slate-900/10">
                      <td className="py-3.5 font-bold text-white">{user.name}</td>
                      <td className="py-3.5">{user.email}</td>
                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 rounded border text-[9px] uppercase font-bold ${getRoleBadge(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className={`py-3.5 font-bold uppercase ${getStatusColor(user.status)}`}>{user.status}</td>
                      <td className="py-3.5 text-right flex justify-end gap-2">
                        {user.role === 'Student' && (
                          <button
                            onClick={() => userMutation.mutate({ id: user._id, payload: { role: 'Mentor' } })}
                            className="p-1.5 rounded bg-indigo-950 text-indigo-400 hover:text-white border border-indigo-500/20"
                            title="Promote to Mentor"
                          >
                            <ShieldCheck className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {user.role === 'Mentor' && (
                          <button
                            onClick={() => userMutation.mutate({ id: user._id, payload: { role: 'Student' } })}
                            className="p-1.5 rounded bg-slate-900 text-slate-400 hover:text-white"
                            title="Demote to Student"
                          >
                            <UserCheck className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {user.status === 'active' ? (
                          <button
                            onClick={() => userMutation.mutate({ id: user._id, payload: { status: 'suspended' } })}
                            className="p-1.5 rounded bg-red-950 text-red-400 hover:text-white border border-red-500/20"
                            title="Suspend"
                          >
                            <ShieldAlert className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => userMutation.mutate({ id: user._id, payload: { status: 'active' } })}
                            className="p-1.5 rounded bg-emerald-950 text-emerald-400 hover:text-white border border-emerald-500/20"
                            title="Activate"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm('Delete this user? This cannot be undone.')) {
                              deleteUserMutation.mutate(user._id);
                            }
                          }}
                          className="p-1.5 rounded bg-slate-900 text-slate-500 hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'Curriculum' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Form */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-900 space-y-4 h-fit">
              <h3 className="font-extrabold text-white text-sm">Add Subject Node</h3>
              <form onSubmit={handleCreateSubject} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="block text-slate-400 font-bold uppercase">Subject Name</label>
                  <input
                    type="text"
                    value={newSubName}
                    onChange={(e) => setNewSubName(e.target.value)}
                    placeholder="e.g. Physics Quantum Mechanics"
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-slate-300 outline-none"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-slate-400 font-bold uppercase">Subject Code</label>
                  <input
                    type="text"
                    value={newSubCode}
                    onChange={(e) => setNewSubCode(e.target.value)}
                    placeholder="e.g. PHY101"
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-slate-300 outline-none"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-slate-400 font-bold uppercase">Badge Color</label>
                  <select
                    value={newSubColor}
                    onChange={(e) => setNewSubColor(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-slate-300 outline-none"
                  >
                    <option value="indigo">Indigo</option>
                    <option value="amber">Amber</option>
                    <option value="red">Red</option>
                    <option value="emerald">Emerald</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={createSubjectMutation.isPending}
                  className="w-full bg-brand-500 text-white rounded-xl py-3 font-bold hover:bg-brand-600 transition"
                >
                  {createSubjectMutation.isPending ? 'Logging Node...' : 'Add Subject'}
                </button>
              </form>
            </div>

            {/* List */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-900 md:col-span-2 space-y-4">
              <h3 className="font-extrabold text-white text-sm">Subjects Catalog</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-900 text-slate-500">
                      <th className="pb-3">Name</th>
                      <th className="pb-3">Code</th>
                      <th className="pb-3">Badge Color</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {curriculumData?.map(sub => (
                      <tr key={sub._id} className="border-b border-slate-900/40 text-slate-300 hover:bg-slate-900/10">
                        <td className="py-3.5 font-bold text-white">{sub.name}</td>
                        <td className="py-3.5 font-semibold text-slate-400">{sub.code}</td>
                        <td className="py-3.5">
                          <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold bg-slate-900 border border-slate-800`}>
                            {sub.color}
                          </span>
                        </td>
                        <td className="py-3.5 text-right">
                          <button
                            onClick={() => {
                              if (confirm(`Delete subject "${sub.name}"?`)) {
                                deleteSubjectMutation.mutate(sub._id);
                              }
                            }}
                            className="p-1 rounded bg-slate-900 text-slate-500 hover:text-red-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Health' && (
          <div className="glass-panel p-5 rounded-2xl border border-slate-900 space-y-4">
            <h3 className="font-extrabold text-white text-sm">System Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="p-4 border border-slate-900 rounded-xl bg-slate-900/10 space-y-3">
                <h4 className="font-bold text-slate-200">Database connection status</h4>
                <div className="flex justify-between">
                  <span>Mongoose Connection State</span>
                  <span className="font-bold text-emerald-400">{healthData?.database || 'Healthy'}</span>
                </div>
              </div>
              <div className="p-4 border border-slate-900 rounded-xl bg-slate-900/10 space-y-3">
                <h4 className="font-bold text-slate-200">API Server uptime</h4>
                <div className="flex justify-between">
                  <span>Uptime</span>
                  <span className="font-bold text-indigo-400">{Math.round(healthData?.uptime || 0)} seconds</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Audits' && (
          <div className="glass-panel p-5 rounded-2xl border border-slate-900 space-y-4">
            <h3 className="font-extrabold text-white text-sm">Audit Trail Logs</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-900 text-slate-500">
                    <th className="pb-3">Admin</th>
                    <th className="pb-3">Action</th>
                    <th className="pb-3">Entity Type</th>
                    <th className="pb-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {logsData?.map(log => (
                    <tr key={log._id} className="border-b border-slate-900/40 text-slate-300 hover:bg-slate-900/10">
                      <td className="py-3.5 font-bold text-white">{log.adminId?.name || 'Admin'}</td>
                      <td className="py-3.5 font-semibold text-slate-400">{log.action}</td>
                      <td className="py-3.5">
                        <span className="px-2 py-0.5 rounded text-[9px] bg-slate-900 text-slate-400 border border-slate-850">
                          {log.entity}
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
