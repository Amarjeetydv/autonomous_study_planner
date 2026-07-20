import { useState } from 'react';
import { 
  FolderKanban, FileText, Link as LinkIcon, Megaphone, Plus, 
  ExternalLink, Trash2
} from 'lucide-react';
import { toast } from '../../services/toast';
import EmptyState from '../../components/ui/EmptyState';

interface ResourceItem {
  id: string;
  title: string;
  type: 'Note' | 'PDF' | 'Link' | 'Announcement';
  content: string;
  createdAt: string;
  targetAudience: string;
}

export default function MentorResources() {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'Note' | 'PDF' | 'Link' | 'Announcement'>('PDF');
  const [content, setContent] = useState('');
  const [targetAudience, setTargetAudience] = useState('All Assigned Students');

  const handleCreateResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error('Please enter both a title and content/link.');
      return;
    }

    const newRes: ResourceItem = {
      id: `res_${Date.now()}`,
      title,
      type,
      content,
      createdAt: new Date().toISOString().split('T')[0],
      targetAudience,
    };

    setResources([newRes, ...resources]);
    toast.success('Resource published to student workspace successfully!', '📚 Resource Published');
    setTitle('');
    setContent('');
    setShowModal(false);
  };

  const handleDeleteResource = (id: string) => {
    setResources(resources.filter((r) => r.id !== id));
    toast.info('Resource removed.', 'Deleted');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="max-w-6xl mx-auto space-y-8 z-10 relative">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-amber-950/80 text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider">
                Study Materials Repo
              </span>
              <span className="text-xs text-slate-500 font-semibold">• Resource Center</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white mt-1.5 flex items-center gap-2">
              <FolderKanban className="h-6 w-6 text-amber-400" />
              Mentor Resource & Announcement Publishing
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              Upload study notes, PDFs, practice links, and broadcast announcements to your students.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs transition shadow-lg shadow-brand-500/20"
          >
            <Plus className="h-4 w-4" />
            Publish New Resource
          </button>
        </div>

        {/* Upload Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 max-w-lg w-full space-y-5 shadow-2xl">
              <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                <h3 className="font-extrabold text-white text-base">Publish Study Resource</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-white font-bold text-xs"
                >
                  ✕ Close
                </button>
              </div>

              <form onSubmit={handleCreateResource} className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Resource Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. DBMS Normalization Notes, Practice Quiz Link"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-brand-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Type</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-brand-500"
                    >
                      <option value="PDF">PDF Document</option>
                      <option value="Note">Study Note</option>
                      <option value="Link">External Link</option>
                      <option value="Announcement">Announcement</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Target Cohort</label>
                    <select
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-brand-500"
                    >
                      <option value="All Assigned Students">All Assigned Students</option>
                      <option value="OS Cohort">OS Cohort</option>
                      <option value="GATE Aspirants">GATE Aspirants</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    {type === 'Link' ? 'Resource URL' : type === 'PDF' ? 'PDF File URL / Link' : 'Content / Message'}
                  </label>
                  <textarea
                    required
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={
                      type === 'Link'
                        ? 'https://example.com/practice'
                        : 'Enter detailed notes or announcement message...'
                    }
                    className="w-full h-28 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-200 outline-none focus:border-brand-500 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition shadow-lg shadow-brand-500/20"
                  >
                    Publish Now
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Resources Grid */}
        {resources.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {resources.map((res) => (
              <div
                key={res.id}
                className="glass-panel p-5 rounded-2xl border border-slate-900 space-y-4 hover:border-slate-800 transition flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-amber-400">
                        {res.type === 'PDF' && <FileText className="h-5 w-5 text-red-400" />}
                        {res.type === 'Note' && <FileText className="h-5 w-5 text-brand-400" />}
                        {res.type === 'Link' && <LinkIcon className="h-5 w-5 text-emerald-400" />}
                        {res.type === 'Announcement' && <Megaphone className="h-5 w-5 text-amber-400" />}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-white text-sm leading-snug">{res.title}</h3>
                        <span className="text-[10px] text-slate-500 font-semibold">{res.targetAudience}</span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        res.type === 'PDF'
                          ? 'bg-red-950/80 text-red-400 border border-red-500/30'
                          : res.type === 'Link'
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                          : res.type === 'Announcement'
                          ? 'bg-amber-950/80 text-amber-400 border border-amber-500/30'
                          : 'bg-brand-950/80 text-brand-400 border border-brand-500/30'
                      }`}
                    >
                      {res.type}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/40 p-3 rounded-xl border border-slate-800/60 break-words">
                    {res.content}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-900 flex items-center justify-between text-xs text-slate-500">
                  <span>Published {res.createdAt}</span>
                  <div className="flex items-center gap-2">
                    {res.type === 'Link' || res.type === 'PDF' ? (
                      <a
                        href={res.content.startsWith('http') ? res.content : '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-brand-400 transition"
                        title="Open Resource"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    ) : null}
                    <button
                      onClick={() => handleDeleteResource(res.id)}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-red-950/40 text-slate-500 hover:text-red-400 transition"
                      title="Delete Resource"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={FolderKanban}
            title="No Resources Published Yet"
            description="Upload notes, PDFs, practice links, or announcements to share study materials with your assigned students."
            actionLabel="Publish First Resource"
            onAction={() => setShowModal(true)}
          />
        )}
      </div>
    </div>
  );
}
