import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  CheckCircle2, 
  TrendingUp, 
  Clock, 
  MessageSquare, 
  PlusCircle, 
  FolderKanban, 
  ArrowUpRight, 
  Paperclip, 
  Radio, 
  FileText,
  Filter,
  CheckSquare
} from 'lucide-react';
import { useProjectStore } from '../store/projectStore';
import { useUserStore, INITIAL_USERS } from '../store/userStore';
import { Task, Project } from '../types';

export type ActivityType = 'task_completed' | 'task_in_progress' | 'task_created' | 'indicator_updated' | 'task_comment';

export interface FeedActivity {
  id: string;
  type: ActivityType;
  timestamp: number;
  projectId: string;
  projectName: string;
  userId?: string;
  userName: string;
  userRole?: string;
  title: string;
  subtitle?: string;
  details?: string;
  valueBadge?: string;
  tags?: string[];
  priority?: string;
  task?: Task;
  attachmentName?: string;
}

interface ActivityFeedProps {
  onSelectTask?: (task: Task) => void;
  maxInitialItems?: number;
  className?: string;
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 45 * 1000) return 'Baru saja';
  const minutes = Math.floor(diff / (60 * 1000));
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / (60 * 1000 * 60));
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  return new Date(timestamp).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function ActivityFeed({ onSelectTask, maxInitialItems = 8, className = '' }: ActivityFeedProps) {
  const { projects, allTasks, subscribeToProjects, subscribeToAllTasks } = useProjectStore();
  const { users, fetchUsers } = useUserStore();

  const [activeTab, setActiveTab] = useState<'all' | 'completions' | 'indicators' | 'tasks'>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [visibleCount, setVisibleCount] = useState<number>(maxInitialItems);

  // Subscribe to real-time updates from Firestore/store
  useEffect(() => {
    const unsubProjects = subscribeToProjects();
    const unsubTasks = subscribeToAllTasks();
    fetchUsers();

    return () => {
      unsubProjects();
      unsubTasks();
    };
  }, [subscribeToProjects, subscribeToAllTasks, fetchUsers]);

  // Lookup helper for user profiles
  const allKnownUsers = useMemo(() => {
    const map = new Map<string, { name: string; role: string; photoURL?: string | null }>();
    INITIAL_USERS.forEach(u => {
      map.set(u.uid, { name: u.displayName || u.email, role: u.role, photoURL: u.photoURL });
    });
    users.forEach(u => {
      map.set(u.uid, { name: u.displayName || u.email, role: u.role, photoURL: u.photoURL });
    });
    return map;
  }, [users]);

  const getUserInfo = (uid?: string) => {
    if (!uid) return { name: 'Anggota Tim', role: 'Tim Monev DFW' };
    const found = allKnownUsers.get(uid);
    if (found) return found;
    return { name: uid === 'admin' ? 'Admin DFW' : uid, role: 'Tim Lapangan' };
  };

  // Compile all activities from projects and tasks
  const activities = useMemo(() => {
    const list: FeedActivity[] = [];
    const projectMap = new Map<string, Project>();
    projects.forEach(p => projectMap.set(p.id, p));

    // 1. Task completions & Task activities
    allTasks.forEach(task => {
      const project = projectMap.get(task.projectId);
      const projectName = project ? project.name : 'Proyek Perikanan';
      const actorUid = task.assignees?.[0] || task.createdBy;
      const actorInfo = getUserInfo(actorUid);

      // Task Completion
      if (task.status === 'Done') {
        const completedTime = task.completedAt || task.dueDate || task.createdAt;
        const subtasksDoneCount = task.subtasks?.filter(s => s.isCompleted).length || 0;
        const totalSubtasks = task.subtasks?.length || 0;

        list.push({
          id: `done-${task.id}`,
          type: 'task_completed',
          timestamp: completedTime,
          projectId: task.projectId,
          projectName,
          userId: actorUid,
          userName: actorInfo.name,
          userRole: actorInfo.role === 'field_officer' ? 'Field Officer' : actorInfo.role === 'project_coordinator' ? 'Koordinator Proyek' : 'Admin DFW',
          title: task.title,
          subtitle: totalSubtasks > 0 ? `${subtasksDoneCount}/${totalSubtasks} subtask selesai diverifikasi` : 'Tugas berhasil diselesaikan',
          details: task.description,
          priority: task.priority,
          tags: task.tags,
          task
        });
      } 
      // In Progress / Review Task
      else if (task.status === 'In Progress' || task.status === 'Review') {
        const taskTime = task.updatedAt || task.startDate || task.createdAt;
        list.push({
          id: `prog-${task.id}`,
          type: 'task_in_progress',
          timestamp: taskTime,
          projectId: task.projectId,
          projectName,
          userId: actorUid,
          userName: actorInfo.name,
          userRole: actorInfo.role === 'field_officer' ? 'Field Officer' : actorInfo.role === 'project_coordinator' ? 'Koordinator Proyek' : 'Admin DFW',
          title: task.title,
          subtitle: task.status === 'In Progress' ? 'Sedang aktif dikerjakan di lapangan' : 'Menunggu tinjauan koordinator',
          details: task.description,
          priority: task.priority,
          tags: task.tags,
          task
        });
      }

      // New Task Created
      if (task.createdAt && Date.now() - task.createdAt < 7 * 24 * 3600 * 1000) {
        const creatorInfo = getUserInfo(task.createdBy);
        list.push({
          id: `created-${task.id}`,
          type: 'task_created',
          timestamp: task.createdAt,
          projectId: task.projectId,
          projectName,
          userId: task.createdBy,
          userName: creatorInfo.name,
          userRole: 'Pembuat Tugas',
          title: task.title,
          subtitle: 'Tugas baru ditambahkan ke proyek',
          details: task.description,
          priority: task.priority,
          tags: task.tags,
          task
        });
      }

      // Task & Subtask Comments / Field Notes
      if (task.comments && task.comments.length > 0) {
        task.comments.forEach(comment => {
          const cUserInfo = getUserInfo(comment.userId);
          list.push({
            id: `cmt-${comment.id}`,
            type: 'task_comment',
            timestamp: comment.createdAt,
            projectId: task.projectId,
            projectName,
            userId: comment.userId,
            userName: cUserInfo.name,
            userRole: 'Catatan Tim',
            title: task.title,
            subtitle: `Komentar baru pada tugas`,
            details: comment.text,
            task,
            attachmentName: comment.imageName
          });
        });
      }

      // Subtasks comments
      if (task.subtasks) {
        task.subtasks.forEach(st => {
          if (st.comments && st.comments.length > 0) {
            st.comments.forEach(sc => {
              const scUserInfo = getUserInfo(sc.userId);
              list.push({
                id: `subcmt-${sc.id}`,
                type: 'task_comment',
                timestamp: sc.createdAt,
                projectId: task.projectId,
                projectName,
                userId: sc.userId,
                userName: scUserInfo.name,
                userRole: 'Verifikasi Lapangan',
                title: `${task.title} (${st.title})`,
                subtitle: `Catatan verifikasi subtask`,
                details: sc.text,
                task,
                attachmentName: sc.imageName
              });
            });
          }
        });
      }
    });

    // 2. Project Indicator Updates (Capaian Kinerja & Bukti MoV)
    projects.forEach(project => {
      if (project.indicators) {
        project.indicators.forEach(indicator => {
          if (indicator.updates && indicator.updates.length > 0) {
            indicator.updates.forEach(upd => {
              const updaterInfo = getUserInfo(upd.updatedBy);
              list.push({
                id: `ind-upd-${upd.id}`,
                type: 'indicator_updated',
                timestamp: upd.timestamp,
                projectId: project.id,
                projectName: project.name,
                userId: upd.updatedBy,
                userName: updaterInfo.name,
                userRole: 'Pencatatan Monev',
                title: indicator.name,
                subtitle: `Progres capaian indikator diperbarui`,
                details: upd.note || 'Pembaruan berkala target indikator proyek.',
                valueBadge: `${upd.value > 0 ? '+' : ''}${upd.value} ${indicator.unit}`,
                attachmentName: upd.attachments && upd.attachments.length > 0 ? upd.attachments[0].name : undefined
              });
            });
          }
        });
      }
    });

    // Sort descending by timestamp (most recent first)
    list.sort((a, b) => b.timestamp - a.timestamp);
    return list;
  }, [projects, allTasks, allKnownUsers]);

  // Filter based on active tab and selected project
  const filteredActivities = useMemo(() => {
    return activities.filter(item => {
      // Project filter
      if (selectedProjectId !== 'all' && item.projectId !== selectedProjectId) {
        return false;
      }

      // Tab filter
      if (activeTab === 'completions') {
        return item.type === 'task_completed';
      }
      if (activeTab === 'indicators') {
        return item.type === 'indicator_updated';
      }
      if (activeTab === 'tasks') {
        return item.type === 'task_in_progress' || item.type === 'task_created' || item.type === 'task_comment';
      }
      return true;
    });
  }, [activities, activeTab, selectedProjectId]);

  // Counts for tabs
  const tabCounts = useMemo(() => {
    const byProject = (item: FeedActivity) => selectedProjectId === 'all' || item.projectId === selectedProjectId;
    return {
      all: activities.filter(byProject).length,
      completions: activities.filter(a => byProject(a) && a.type === 'task_completed').length,
      indicators: activities.filter(a => byProject(a) && a.type === 'indicator_updated').length,
      tasks: activities.filter(a => byProject(a) && (a.type === 'task_in_progress' || a.type === 'task_created' || a.type === 'task_comment')).length
    };
  }, [activities, selectedProjectId]);

  const displayedActivities = filteredActivities.slice(0, visibleCount);

  return (
    <div className={`bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden ${className}`}>
      {/* Feed Header */}
      <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-gray-50/50 to-white">
        <div>
          <div className="flex items-center space-x-2.5">
            <h2 className="text-lg font-bold text-gray-900">Activity Feed</h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <span className="relative flex h-2 w-2 mr-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Real-time Live
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Pembaruan tugas selesai, progres indikator MoV, dan catatan lapangan terkini lintas seluruh proyek.
          </p>
        </div>

        {/* Project Selector Filter */}
        <div className="flex items-center space-x-2 shrink-0">
          <Filter className="w-3.5 h-3.5 text-gray-400" />
          <select
            value={selectedProjectId}
            onChange={(e) => {
              setSelectedProjectId(e.target.value);
              setVisibleCount(maxInitialItems);
            }}
            className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:outline-hidden focus:ring-1 focus:ring-teal-500 max-w-[200px] truncate"
          >
            <option value="all">Semua Proyek ({projects.length})</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-5 pt-3 pb-2 border-b border-gray-100 flex items-center space-x-2 overflow-x-auto text-xs">
        <button
          type="button"
          onClick={() => { setActiveTab('all'); setVisibleCount(maxInitialItems); }}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center ${
            activeTab === 'all'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          Semua Aktivitas
          <span className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] ${
            activeTab === 'all' ? 'bg-teal-700 text-teal-100' : 'bg-gray-200 text-gray-700'
          }`}>
            {tabCounts.all}
          </span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('completions'); setVisibleCount(maxInitialItems); }}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center ${
            activeTab === 'completions'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
          Tugas Selesai
          <span className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] ${
            activeTab === 'completions' ? 'bg-emerald-700 text-emerald-100' : 'bg-gray-200 text-gray-700'
          }`}>
            {tabCounts.completions}
          </span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('indicators'); setVisibleCount(maxInitialItems); }}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center ${
            activeTab === 'indicators'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 mr-1" />
          Capaian Indikator (MoV)
          <span className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] ${
            activeTab === 'indicators' ? 'bg-teal-800 text-teal-100' : 'bg-gray-200 text-gray-700'
          }`}>
            {tabCounts.indicators}
          </span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('tasks'); setVisibleCount(maxInitialItems); }}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center ${
            activeTab === 'tasks'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Clock className="w-3.5 h-3.5 mr-1" />
          Tugas Aktif & Diskusi
          <span className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] ${
            activeTab === 'tasks' ? 'bg-blue-700 text-blue-100' : 'bg-gray-200 text-gray-700'
          }`}>
            {tabCounts.tasks}
          </span>
        </button>
      </div>

      {/* Feed List */}
      <div className="divide-y divide-gray-100 max-h-[580px] overflow-y-auto">
        {displayedActivities.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Radio className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="font-medium text-gray-700 text-sm">Belum ada aktivitas yang tercatat</p>
            <p className="text-xs text-gray-400 mt-1">
              {activeTab === 'completions' 
                ? 'Belum ada tugas yang diselesaikan pada filter terpilih.' 
                : 'Pembaruan tugas atau indikator akan muncul secara langsung di sini.'}
            </p>
          </div>
        ) : (
          displayedActivities.map((act) => {
            const isJustNow = Date.now() - act.timestamp < 3 * 60 * 1000;

            // Icon & colors based on type
            let iconBox = (
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            );
            let actionBadgeText = 'Menyelesaikan tugas';
            let actionBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';

            if (act.type === 'indicator_updated') {
              iconBox = (
                <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
              );
              actionBadgeText = 'Update Capaian';
              actionBadgeClass = 'bg-teal-50 text-teal-800 border-teal-200';
            } else if (act.type === 'task_in_progress') {
              iconBox = (
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
              );
              actionBadgeText = 'Tugas Berjalan';
              actionBadgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
            } else if (act.type === 'task_created') {
              iconBox = (
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <PlusCircle className="w-4 h-4" />
                </div>
              );
              actionBadgeText = 'Tugas Baru';
              actionBadgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
            } else if (act.type === 'task_comment') {
              iconBox = (
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
              );
              actionBadgeText = 'Catatan Lapangan';
              actionBadgeClass = 'bg-purple-50 text-purple-700 border-purple-200';
            }

            return (
              <div 
                key={act.id} 
                className={`p-4 transition-colors hover:bg-gray-50/80 ${
                  isJustNow ? 'bg-emerald-50/20' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  {iconBox}

                  <div className="flex-1 min-w-0">
                    {/* User & Meta Row */}
                    <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span className="text-xs font-semibold text-gray-900">{act.userName}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-sm border font-medium text-gray-500 bg-gray-50">
                          {act.userRole}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${actionBadgeClass}`}>
                          {actionBadgeText}
                        </span>
                        {isJustNow && (
                          <span className="text-[10px] bg-red-500 text-white font-bold px-1.5 py-0.2 rounded-full animate-pulse">
                            NEW
                          </span>
                        )}
                      </div>

                      <span className="text-[11px] text-gray-400 font-medium whitespace-nowrap">
                        {formatRelativeTime(act.timestamp)}
                      </span>
                    </div>

                    {/* Main Title & Action */}
                    <div className="flex items-baseline justify-between gap-2">
                      <h4 className="text-sm font-semibold text-gray-900 leading-snug">
                        {act.task && onSelectTask ? (
                          <button
                            type="button"
                            onClick={() => onSelectTask(act.task!)}
                            className="text-left text-teal-800 hover:text-teal-600 hover:underline inline-flex items-center"
                          >
                            <span>{act.title}</span>
                            <ArrowUpRight className="w-3.5 h-3.5 ml-1 inline text-teal-600 shrink-0" />
                          </button>
                        ) : (
                          <span>{act.title}</span>
                        )}
                      </h4>

                      {/* Value badge for Indicator Updates */}
                      {act.valueBadge && (
                        <span className="text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md shrink-0">
                          {act.valueBadge}
                        </span>
                      )}
                    </div>

                    {/* Subtitle / context */}
                    {act.subtitle && (
                      <p className="text-xs text-gray-500 mt-0.5">{act.subtitle}</p>
                    )}

                    {/* Detail snippet / notes */}
                    {act.details && (
                      <p className="text-xs text-gray-600 mt-1.5 bg-gray-50 p-2 rounded-md border border-gray-100/80 line-clamp-2 italic">
                        "{act.details}"
                      </p>
                    )}

                    {/* Footer tags and project link */}
                    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center space-x-2 flex-wrap">
                        {/* Project Link Badge */}
                        <Link 
                          to={`/projects/${act.projectId}`}
                          className="inline-flex items-center text-[11px] text-teal-700 bg-teal-50/60 hover:bg-teal-100/70 border border-teal-200 px-2 py-0.5 rounded-md font-medium transition-colors"
                        >
                          <FolderKanban className="w-3 h-3 mr-1 text-teal-600" />
                          <span className="max-w-[180px] truncate">{act.projectName}</span>
                        </Link>

                        {/* Priority Badge if Task */}
                        {act.priority && (
                          <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            act.priority === 'High' ? 'bg-red-100 text-red-700' :
                            act.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {act.priority}
                          </span>
                        )}

                        {/* Tags */}
                        {act.tags && act.tags.slice(0, 2).map((tg, tIdx) => (
                          <span key={tIdx} className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                            #{tg}
                          </span>
                        ))}

                        {/* MoV Attachment badge if any */}
                        {act.attachmentName && (
                          <span className="inline-flex items-center text-[11px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100" title={act.attachmentName}>
                            <Paperclip className="w-3 h-3 mr-1 text-blue-500" />
                            <span className="max-w-[120px] truncate">{act.attachmentName}</span>
                          </span>
                        )}
                      </div>

                      {/* Quick action button */}
                      {act.task && onSelectTask && (
                        <button
                          type="button"
                          onClick={() => onSelectTask(act.task!)}
                          className="text-[11px] text-teal-600 hover:text-teal-800 font-medium inline-flex items-center ml-auto"
                        >
                          Detail Tugas &rarr;
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Load More */}
      {filteredActivities.length > visibleCount && (
        <div className="p-3 border-t border-gray-100 text-center bg-gray-50/50">
          <button
            type="button"
            onClick={() => setVisibleCount(prev => prev + 10)}
            className="text-xs font-semibold text-teal-700 hover:text-teal-900 py-1 px-3 rounded-lg hover:bg-teal-50 transition-colors"
          >
            Tampilkan lebih banyak aktivitas ({filteredActivities.length - visibleCount} tersisa)
          </button>
        </div>
      )}
    </div>
  );
}
