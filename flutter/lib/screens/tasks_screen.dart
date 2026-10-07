import 'package:flutter/material.dart';
import '../constants/app_colors.dart';
import '../models/task_model.dart';
import '../services/workflow_service.dart';
import '../widgets/glass_container.dart';

class TasksScreen extends StatefulWidget {
  const TasksScreen({super.key});

  @override
  State<TasksScreen> createState() => _TasksScreenState();
}

class _TasksScreenState extends State<TasksScreen> {
  final WorkflowService _workflow = WorkflowService();

  List<TaskModel> _tasks = [];
  bool _loading = true;
  String _selectedStatus = 'ALL';
  final List<String> _statuses = ['ALL', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED', 'DONE'];

  @override
  void initState() {
    super.initState();
    _loadTasks();
  }

  Future<void> _loadTasks() async {
    setState(() => _loading = true);
    final tasks = await _workflow.getTasks();
    if (mounted) {
      setState(() {
        _tasks = tasks;
        _loading = false;
      });
    }
  }

  List<TaskModel> get _filteredTasks {
    if (_selectedStatus == 'ALL') return _tasks;
    return _tasks.where((t) => t.status == _selectedStatus).toList();
  }

  void _showAddTaskDialog() {
    final titleCtrl = TextEditingController();
    final descCtrl = TextEditingController();
    String priority = 'MEDIUM';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) => Container(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 20,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
          ),
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Create New Task', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                  IconButton(onPressed: () => Navigator.pop(ctx), icon: const Icon(Icons.close)),
                ],
              ),
              const SizedBox(height: 14),
              TextField(
                controller: titleCtrl,
                decoration: const InputDecoration(labelText: 'Task Title *', hintText: 'e.g. Implement Biometric Bridge'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: descCtrl,
                maxLines: 2,
                decoration: const InputDecoration(labelText: 'Description', hintText: 'Requirements & details...'),
              ),
              const SizedBox(height: 14),
              DropdownButtonFormField<String>(
                value: priority,
                decoration: const InputDecoration(labelText: 'Priority'),
                items: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
                    .map((p) => DropdownMenuItem(value: p, child: Text(p)))
                    .toList(),
                onChanged: (v) => setModalState(() => priority = v ?? 'MEDIUM'),
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: () async {
                  if (titleCtrl.text.trim().isEmpty) return;
                  Navigator.pop(ctx);
                  await _workflow.createTask({
                    'title': titleCtrl.text.trim(),
                    'description': descCtrl.text.trim(),
                    'priority': priority,
                    'status': 'TODO',
                  });
                  _loadTasks();
                },
                child: const Text('Add Task'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());

    final list = _filteredTasks;

    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        onPressed: _showAddTaskDialog,
        icon: const Icon(Icons.add),
        label: const Text('New Task', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: Column(
        children: [
          // Filter Chips
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            color: Colors.white.withOpacity(0.8),
            child: SizedBox(
              height: 36,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: _statuses.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (ctx, i) {
                  final st = _statuses[i];
                  final active = _selectedStatus == st;
                  return ChoiceChip(
                    label: Text(st == 'ALL' ? 'All Tasks' : st, style: TextStyle(fontSize: 11, fontWeight: active ? FontWeight.bold : FontWeight.normal)),
                    selected: active,
                    selectedColor: AppColors.primary,
                    labelStyle: TextStyle(color: active ? Colors.white : AppColors.textDark),
                    onSelected: (_) => setState(() => _selectedStatus = st),
                  );
                },
              ),
            ),
          ),

          // List
          Expanded(
            child: list.isEmpty
                ? const Center(child: Text('No tasks found.', style: TextStyle(color: AppColors.textMuted)))
                : ListView.separated(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 80),
                    itemCount: list.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (ctx, i) {
                      final t = list[i];
                      Color priorityColor = AppColors.primary;
                      if (t.priority == 'CRITICAL') priorityColor = AppColors.absent;
                      if (t.priority == 'HIGH') priorityColor = AppColors.late;

                      return GlassContainer(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: priorityColor.withOpacity(0.12),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    t.priority,
                                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: priorityColor),
                                  ),
                                ),
                                Text(
                                  t.status,
                                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.textMuted),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(t.title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.textDark)),
                            if (t.description != null && t.description!.isNotEmpty) ...[
                              const SizedBox(height: 4),
                              Text(t.description!, style: const TextStyle(fontSize: 12, color: AppColors.textMuted), maxLines: 2),
                            ],
                            const SizedBox(height: 12),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text('Progress: ${t.progress}%', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600)),
                                if (t.assigneeName != null)
                                  Text('Assignee: ${t.assigneeName}', style: const TextStyle(fontSize: 11, color: AppColors.primary, fontWeight: FontWeight.bold)),
                              ],
                            ),
                            const SizedBox(height: 6),
                            ClipRRect(
                              borderRadius: BorderRadius.circular(6),
                              child: LinearProgressIndicator(
                                value: t.progress / 100.0,
                                minHeight: 6,
                                backgroundColor: AppColors.bg,
                                valueColor: const AlwaysStoppedAnimation(AppColors.present),
                              ),
                            ),
                            const SizedBox(height: 10),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.end,
                              children: [
                                if (t.status != 'DONE')
                                  TextButton(
                                    onPressed: () async {
                                      await _workflow.updateTaskStatus(t.id, 'DONE', 100);
                                      _loadTasks();
                                    },
                                    child: const Text('Mark Done', style: TextStyle(color: AppColors.present, fontWeight: FontWeight.bold, fontSize: 12)),
                                  ),
                              ],
                            ),
                          ],
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
