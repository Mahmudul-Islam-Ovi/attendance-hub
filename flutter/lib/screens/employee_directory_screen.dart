import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../constants/app_colors.dart';
import '../models/employee_model.dart';
import '../providers/auth_provider.dart';
import '../services/workflow_service.dart';
import '../widgets/employee_avatar.dart';
import '../widgets/glass_container.dart';
import '../widgets/status_badge.dart';
import 'add_employee_screen.dart';

class EmployeeDirectoryScreen extends StatefulWidget {
  const EmployeeDirectoryScreen({super.key});

  @override
  State<EmployeeDirectoryScreen> createState() => _EmployeeDirectoryScreenState();
}

class _EmployeeDirectoryScreenState extends State<EmployeeDirectoryScreen> {
  final WorkflowService _workflow = WorkflowService();

  List<EmployeeModel> _allEmployees = [];
  bool _loading = true;
  String _query = '';
  String _selectedDept = 'ALL';
  String _selectedStatus = 'ALL';

  final List<String> _statuses = ['ALL', 'PRESENT', 'LATE', 'WFH', 'ON_LEAVE', 'ABSENT'];

  @override
  void initState() {
    super.initState();
    _loadEmployees();
  }

  Future<void> _loadEmployees() async {
    setState(() => _loading = true);
    final emps = await _workflow.getEmployees();
    if (mounted) {
      setState(() {
        _allEmployees = emps;
        _loading = false;
      });
    }
  }

  List<EmployeeModel> get _filteredList {
    return _allEmployees.where((e) {
      final matchQuery = _query.isEmpty ||
          e.name.toLowerCase().contains(_query.toLowerCase()) ||
          e.employeeCode.toLowerCase().contains(_query.toLowerCase()) ||
          (e.designation ?? '').toLowerCase().contains(_query.toLowerCase());

      final matchDept = _selectedDept == 'ALL' || e.dept == _selectedDept;
      final matchStatus = _selectedStatus == 'ALL' || e.status == _selectedStatus;

      return matchQuery && matchDept && matchStatus;
    }).toList();
  }

  Set<String> get _departments {
    final s = {'ALL'};
    for (final e in _allEmployees) {
      if (e.dept != null) s.add(e.dept!);
    }
    return s;
  }

  void _showEmployeeDetails(EmployeeModel e) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        height: MediaQuery.of(ctx).size.height * 0.75,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        padding: const EdgeInsets.all(20),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                children: [
                  EmployeeAvatar(name: e.name, imageUrl: e.avatarUrl, colorHex: e.deptColor, size: 54),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(e.name, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                        Text('${e.designation ?? ""} • ${e.dept ?? ""}', style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
                        const SizedBox(height: 4),
                        StatusBadge(status: e.status),
                      ],
                    ),
                  ),
                  IconButton(onPressed: () => Navigator.pop(ctx), icon: const Icon(Icons.close)),
                ],
              ),
              const SizedBox(height: 18),

              // Action Buttons: Call & Email
              Row(
                children: [
                  if (e.phone != null)
                    Expanded(
                      child: ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                        ),
                        onPressed: () => launchUrl(Uri.parse('tel:${e.phone}')),
                        icon: const Icon(Icons.phone, size: 16),
                        label: const Text('Call'),
                      ),
                    ),
                  if (e.phone != null) const SizedBox(width: 10),
                  Expanded(
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.bg,
                        foregroundColor: AppColors.textDark,
                        elevation: 0,
                      ),
                      onPressed: () => launchUrl(Uri.parse('mailto:${e.email}')),
                      icon: const Icon(Icons.mail_outline, size: 16),
                      label: const Text('Email'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),

              // Today's Checkin Details
              if (e.checkIn != null)
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.bg,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.access_time, color: AppColors.primary, size: 20),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          'Checked in at ${e.checkIn} ${e.checkOut != null ? "• Out at ${e.checkOut}" : ""} (${e.source ?? "GPS"})',
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                        ),
                      ),
                    ],
                  ),
                ),

              if (e.leave != null) ...[
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.leaveBg,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.flight_takeoff, color: AppColors.leaveText, size: 20),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          'On ${e.leave!.type} leave. Backup: ${e.backup ?? "Colleague"}',
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.leaveText),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 20),

              // Assigned Tasks
              Text('Assigned Tasks (${e.tasks.length})', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800)),
              const SizedBox(height: 10),
              if (e.tasks.isEmpty)
                const Text('No pending tasks assigned.', style: TextStyle(color: AppColors.textMuted, fontSize: 12))
              else
                ...e.tasks.map((t) => Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.bg,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Text(t.title, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                              ),
                              Text('${t.progress}%', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.primary)),
                            ],
                          ),
                          const SizedBox(height: 6),
                          ClipRRect(
                            borderRadius: BorderRadius.circular(4),
                            child: LinearProgressIndicator(
                              value: t.progress / 100.0,
                              minHeight: 4,
                              valueColor: const AlwaysStoppedAnimation(AppColors.primary),
                              backgroundColor: Colors.white,
                            ),
                          ),
                        ],
                      ),
                    )),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());

    final auth = Provider.of<AuthProvider>(context);
    final isAdmin = auth.isAdmin;
    final list = _filteredList;

    return Scaffold(
      backgroundColor: Colors.transparent,
      floatingActionButton: isAdmin
          ? FloatingActionButton.extended(
              backgroundColor: AppColors.primary,
              icon: const Icon(Icons.person_add, color: Colors.white),
              label: const Text('Add Employee', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              onPressed: () async {
                final created = await Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const AddEmployeeScreen()),
                );
                if (created == true) _loadEmployees();
              },
            )
          : null,
      body: Column(
        children: [
          // Search & Filters Header
          Container(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            color: Colors.white.withOpacity(0.8),
            child: Column(
              children: [
                TextField(
                  onChanged: (v) => setState(() => _query = v),
                  decoration: InputDecoration(
                    hintText: 'Search by name, ID or role...',
                    prefixIcon: const Icon(Icons.search, size: 20),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    fillColor: AppColors.bg,
                    filled: true,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                  ),
                ),
                const SizedBox(height: 10),
                // Filter chips row
                SizedBox(
                  height: 34,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    itemCount: _statuses.length,
                    separatorBuilder: (_, __) => const SizedBox(width: 8),
                    itemBuilder: (ctx, i) {
                      final st = _statuses[i];
                      final active = _selectedStatus == st;
                      return ChoiceChip(
                        label: Text(st == 'ALL' ? 'Everyone' : st, style: TextStyle(fontSize: 11, fontWeight: active ? FontWeight.bold : FontWeight.normal)),
                        selected: active,
                        selectedColor: AppColors.primary,
                        labelStyle: TextStyle(color: active ? Colors.white : AppColors.textDark),
                        onSelected: (_) => setState(() => _selectedStatus = st),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),

          // List
          Expanded(
            child: list.isEmpty
                ? const Center(child: Text('No employees match filters', style: TextStyle(color: AppColors.textMuted)))
                : ListView.separated(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 90),
                    itemCount: list.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (ctx, i) {
                      final e = list[i];
                      return GlassContainer(
                        onTap: () => _showEmployeeDetails(e),
                        padding: const EdgeInsets.all(14),
                        child: Row(
                          children: [
                            EmployeeAvatar(name: e.name, imageUrl: e.avatarUrl, colorHex: e.deptColor, size: 44),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(e.name, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800)),
                                  Text('${e.designation ?? ""} • ${e.dept ?? ""}',
                                      style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                                      maxLines: 1),
                                  const SizedBox(height: 4),
                                  StatusBadge(status: e.status),
                                ],
                              ),
                            ),
                            const Icon(Icons.chevron_right, color: AppColors.textLight),
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
