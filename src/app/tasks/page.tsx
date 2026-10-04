"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Plus, Search, Filter, Calendar, Clock, CheckCircle2, 
  AlertCircle, UploadCloud, X, Trash2, Edit2, UserCheck, 
  Briefcase, ArrowUpDown, ChevronRight, Layers
} from "lucide-react";
import { Glass, PageTitle, Avatar, ProgressBar, PRIORITY_DOT } from "@/components/ui";

interface Employee {
  id: string;
  name: string;
  employeeCode: string;
  designation: string | null;
}

interface Department {
  id: string;
  name: string;
  code: string;
  color: string | null;
}

interface TaskItem {
  id: string;
  title: string;
  description: string | null;
  status: "TODO" | "IN_PROGRESS" | "BLOCKED" | "IN_REVIEW" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  progress: number;
  dueDate: string | null;
  startedAt: string | null;
  assignee?: {
    id: string;
    name: string;
    employeeCode: string;
    avatarUrl?: string | null;
  } | null;
  createdBy?: { id: string; name: string } | null;
  department?: { id: string; name: string } | null;
}

const STATUS_LABELS: Record<string, { label: string; badge: string }> = {
  TODO: { label: "To Do", badge: "bg-slate-100 text-slate-700 border-slate-200" },
  IN_PROGRESS: { label: "In Progress", badge: "bg-blue-100 text-blue-700 border-blue-200" },
  IN_REVIEW: { label: "In Review", badge: "bg-purple-100 text-purple-700 border-purple-200" },
  BLOCKED: { label: "Blocked", badge: "bg-rose-100 text-rose-700 border-rose-200" },
  DONE: { label: "Done", badge: "bg-emerald-100 text-emerald-700 border-emerald-200" },
};

const PRIORITY_LABELS: Record<string, { label: string; color: string }> = {
  LOW: { label: "Low", color: "text-slate-600 bg-slate-100" },
  MEDIUM: { label: "Medium", color: "text-sky-700 bg-sky-100" },
  HIGH: { label: "High", color: "text-orange-700 bg-orange-100" },
  CRITICAL: { label: "Critical", color: "text-rose-700 bg-rose-100" },
};

export default function TaskManagementPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State matching user's exact specification
  const [form, setForm] = useState({
    title: "",
    assigneeId: "",
    startDate: "",
    endDate: "",
    category: "",
    priority: "MEDIUM",
    status: "TODO",
    description: "",
    attachmentFileName: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [resTasks, resEmps, resDepts] = await Promise.all([
        fetch("/api/tasks").then((r) => r.json()),
        fetch("/api/employees-list").then((r) => r.json()),
        fetch("/api/departments").then((r) => r.json()),
      ]);

      if (Array.isArray(resTasks)) setTasks(resTasks);
      if (Array.isArray(resEmps)) setEmployees(resEmps);
      if (Array.isArray(resDepts)) setDepartments(resDepts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const openNewTaskModal = () => {
    setEditingTask(null);
    setForm({
      title: "",
      assigneeId: employees[0]?.id || "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      category: departments[0]?.id || "",
      priority: "MEDIUM",
      status: "TODO",
      description: "",
      attachmentFileName: "",
    });
    setModalOpen(true);
  };

  const openEditModal = (t: TaskItem) => {
    setEditingTask(t);
    setForm({
      title: t.title,
      assigneeId: t.assignee?.id || "",
      startDate: t.startedAt ? t.startedAt.split("T")[0] : "",
      endDate: t.dueDate ? t.dueDate.split("T")[0] : "",
      category: t.department?.id || "",
      priority: t.priority,
      status: t.status,
      description: t.description || "",
      attachmentFileName: "",
    });
    setModalOpen(true);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setForm((prev) => ({ ...prev, attachmentFileName: e.dataTransfer.files[0].name }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setForm((prev) => ({ ...prev, attachmentFileName: e.target.files![0].name }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    setSubmitting(true);
    try {
      if (editingTask) {
        await fetch(`/api/tasks/${editingTask.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: form.title,
            description: form.description,
            status: form.status,
            priority: form.priority,
            startedAt: form.startDate || null,
            dueDate: form.endDate || null,
            assigneeId: form.assigneeId || null,
            departmentId: form.category || null,
          }),
        });
      } else {
        await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: form.title,
            description: form.description,
            status: form.status,
            priority: form.priority,
            startedAt: form.startDate || null,
            dueDate: form.endDate || null,
            assigneeId: form.assigneeId || null,
            departmentId: form.category || null,
          }),
        });
      }

      setModalOpen(false);
      await fetchAll();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      await fetchAll();
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuickStatusUpdate = async (task: TaskItem, newStatus: string) => {
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          progress: newStatus === "DONE" ? 100 : task.progress,
        }),
      });
      await fetchAll();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(search.toLowerCase())) ||
      (task.assignee && task.assignee.name.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === "ALL" || task.status === statusFilter;
    const matchesPriority = priorityFilter === "ALL" || task.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const todoCount = tasks.filter((t) => t.status === "TODO").length;
  const inProgressCount = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const reviewCount = tasks.filter((t) => t.status === "IN_REVIEW").length;
  const doneCount = tasks.filter((t) => t.status === "DONE").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageTitle
          title="Task Management"
          sub="Create, delegate, and monitor workflows and project tasks."
        />
        <button
          onClick={openNewTaskModal}
          className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 active:scale-95 transition"
        >
          <Plus className="h-4 w-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Glass className="!p-4">
          <p className="text-2xl font-bold tabular-nums text-slate-900">{tasks.length}</p>
          <p className="text-xs font-medium text-slate-500">Total Tasks</p>
        </Glass>
        <Glass className="!p-4 border-blue-200/50 bg-blue-50/20">
          <p className="text-2xl font-bold tabular-nums text-blue-600">{inProgressCount}</p>
          <p className="text-xs font-medium text-blue-700">In Progress</p>
        </Glass>
        <Glass className="!p-4 border-purple-200/50 bg-purple-50/20">
          <p className="text-2xl font-bold tabular-nums text-purple-600">{reviewCount}</p>
          <p className="text-xs font-medium text-purple-700">In Review</p>
        </Glass>
        <Glass className="!p-4 border-emerald-200/50 bg-emerald-50/20">
          <p className="text-2xl font-bold tabular-nums text-emerald-600">{doneCount}</p>
          <p className="text-xs font-medium text-emerald-700">Completed</p>
        </Glass>
      </div>

      {/* Filter and Search Bar */}
      <Glass className="!p-3 sm:!p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks, descriptions, assignees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-white/60 bg-white/70 pl-9 pr-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="BLOCKED">Blocked</option>
              <option value="DONE">Done</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
        </div>
      </Glass>

      {/* Task List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <Glass className="text-center py-12">
          <Layers className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-3 text-base font-semibold text-slate-700">No tasks found</p>
          <p className="text-xs text-slate-500 mt-1">Click "New Task" to create your first task.</p>
        </Glass>
      ) : (
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTasks.map((task) => {
            const st = STATUS_LABELS[task.status] || STATUS_LABELS.TODO;
            const pr = PRIORITY_LABELS[task.priority] || PRIORITY_LABELS.MEDIUM;

            return (
              <Glass
                key={task.id}
                className="flex flex-col justify-between !p-4 sm:!p-5 hover:shadow-lg transition-all"
              >
                <div>
                  {/* Category and priority header */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="inline-flex items-center gap-1 rounded-md bg-white/80 px-2 py-0.5 text-[11px] font-semibold text-slate-600 border border-slate-200/50">
                      <Briefcase className="h-3 w-3 text-indigo-500" />
                      {task.department?.name || "General"}
                    </span>
                    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ${pr.color}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${PRIORITY_DOT[task.priority]}`} />
                      {pr.label}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-semibold text-slate-900 text-base leading-snug">
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className="mt-1 text-xs text-slate-600 line-clamp-2">
                      {task.description}
                    </p>
                  )}

                  {/* Dates */}
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    {task.startedAt && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        Start: {new Date(task.startedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    )}
                    {task.dueDate && (
                      <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                        <Clock className="h-3 w-3 text-amber-500" />
                        Due: {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/50">
                  {/* Assignee & Status Quick Change */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {task.assignee ? (
                        <>
                          <Avatar name={task.assignee.name} className="h-7 w-7 text-xs" />
                          <div className="truncate max-w-[100px] sm:max-w-[120px]">
                            <p className="text-xs font-semibold text-slate-800 truncate">{task.assignee.name}</p>
                            <p className="text-[10px] text-slate-400">{task.assignee.employeeCode}</p>
                          </div>
                        </>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Unassigned</span>
                      )}
                    </div>

                    <select
                      value={task.status}
                      onChange={(e) => handleQuickStatusUpdate(task, e.target.value)}
                      className={`text-[11px] font-semibold rounded-lg px-2 py-1 border focus:outline-none cursor-pointer ${st.badge}`}
                    >
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="IN_REVIEW">In Review</option>
                      <option value="BLOCKED">Blocked</option>
                      <option value="DONE">Done</option>
                    </select>
                  </div>

                  {/* Actions footer */}
                  <div className="mt-3 flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => openEditModal(task)}
                      className="rounded-lg p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white/80 transition"
                      title="Edit"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white/80 transition"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </Glass>
            );
          })}
        </div>
      )}

      {/* NEW TASK / EDIT TASK MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="my-8 w-full max-w-xl glass bg-white/95 rounded-2xl shadow-2xl border border-white/60 p-5 sm:p-6 text-slate-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200/70 pb-3 mb-4">
              <h2 className="text-xl font-bold text-slate-900">
                {editingTask ? "Edit Task" : "New Task"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Task Title* */}
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Task Title*
                </label>
                <input
                  name="title"
                  type="text"
                  placeholder="Enter here"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              {/* Assign to Employee* */}
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Assign to Employee*
                </label>
                <select
                  name="assignee"
                  value={form.assigneeId}
                  onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm font-medium text-slate-800 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                >
                  <option value="">Select</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.employeeCode}) {emp.designation ? `· ${emp.designation}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Start date* and End date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Start date*
                  </label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm font-medium text-slate-800 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    End date
                  </label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm font-medium text-slate-800 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
              </div>

              {/* Task Category* */}
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Task Category*
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm font-medium text-slate-800 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                >
                  <option value="">Select</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Task Priority* */}
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Task Priority*
                </label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm font-medium text-slate-800 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                >
                  <option value="">Select</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              {/* Task status* */}
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Task status*
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm font-medium text-slate-800 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                >
                  <option value="">Select</option>
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="IN_REVIEW">In Review</option>
                  <option value="BLOCKED">Blocked</option>
                  <option value="DONE">Done</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Description
                </label>
                <textarea
                  placeholder="Type here"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              {/* Attachment: Clicked to upload or drag_or_drop */}
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Attachment
                </label>
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center p-5 border-2 border-dashed rounded-xl cursor-pointer transition ${
                    dragActive
                      ? "border-indigo-600 bg-indigo-50/50"
                      : "border-slate-300 hover:border-indigo-400 bg-slate-50/50"
                  }`}
                >
                  <UploadCloud className="h-8 w-8 text-indigo-500 mb-2" />
                  <p className="text-xs font-medium text-slate-700 text-center">
                    {form.attachmentFileName ? (
                      <span className="text-indigo-600 font-semibold">{form.attachmentFileName}</span>
                    ) : (
                      "Clicked to upload or drag_or_drop"
                    )}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">PNG, JPG, PDF up to 10MB</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200/70">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50 transition"
                >
                  {submitting ? "Saving..." : editingTask ? "Update Task" : "Save Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
