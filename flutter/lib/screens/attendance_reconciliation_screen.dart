import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../constants/app_colors.dart';
import '../models/attendance_model.dart';
import '../models/employee_model.dart';
import '../services/attendance_service.dart';
import '../services/workflow_service.dart';
import '../widgets/glass_container.dart';
import '../widgets/status_badge.dart';

class AttendanceReconciliationScreen extends StatefulWidget {
  const AttendanceReconciliationScreen({super.key});

  @override
  State<AttendanceReconciliationScreen> createState() => _AttendanceReconciliationScreenState();
}

class _AttendanceReconciliationScreenState extends State<AttendanceReconciliationScreen> {
  final AttendanceService _attendance = AttendanceService();
  final WorkflowService _workflow = WorkflowService();

  List<AttendanceLog> _logs = [];
  List<EmployeeModel> _employees = [];
  bool _loading = true;

  String _statusFilter = 'ALL';
  DateTime? _selectedDate;

  final List<String> _statuses = [
    'ALL',
    'PENDING_APPROVAL',
    'PRESENT',
    'LATE',
    'ABSENT',
    'WFH',
  ];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    final dateStr = _selectedDate != null ? DateFormat('yyyy-MM-dd').format(_selectedDate!) : null;
    final futures = await Future.wait([
      _attendance.getReconciliationLogs(
        status: _statusFilter,
        date: dateStr,
      ),
      _workflow.getEmployees(),
    ]);

    if (mounted) {
      setState(() {
        _logs = futures[0] as List<AttendanceLog>;
        _employees = futures[1] as List<EmployeeModel>;
        _loading = false;
      });
    }
  }

  Future<void> _approveLog(String logId) async {
    final success = await _attendance.approvePunch(logId);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(success ? 'Attendance approved as Present!' : 'Approval failed'),
          backgroundColor: AppColors.present,
        ),
      );
      _loadData();
    }
  }

  Future<void> _rejectLog(String logId) async {
    final success = await _attendance.rejectPunch(logId);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(success ? 'Attendance marked as Absent.' : 'Action failed'),
          backgroundColor: AppColors.absent,
        ),
      );
      _loadData();
    }
  }

  Future<void> _deleteLog(String logId) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Delete Attendance Record?'),
        content: const Text('Are you sure you want to permanently remove this attendance log?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel', style: TextStyle(color: AppColors.textMuted)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.absent,
              foregroundColor: Colors.white,
            ),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      await _attendance.deleteReconciliationRecord(logId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Record removed successfully.')),
        );
        _loadData();
      }
    }
  }

  void _showAddOrEditModal({AttendanceLog? log}) {
    final isEditing = log != null;
    String selectedUserId = log?.userId ?? (_employees.isNotEmpty ? _employees.first.id : '');
    DateTime workDate = log != null ? DateTime.tryParse(log.workDate) ?? DateTime.now() : (_selectedDate ?? DateTime.now());
    TimeOfDay inTime = const TimeOfDay(hour: 9, minute: 0);
    TimeOfDay outTime = const TimeOfDay(hour: 18, minute: 0);
    String status = log?.status ?? 'PRESENT';
    final noteCtrl = TextEditingController(text: log?.note ?? '');

    if (log != null && log.checkInAt != null) {
      try {
        final parsed = DateFormat('hh:mm a').parse(log.checkInAt!);
        inTime = TimeOfDay(hour: parsed.hour, minute: parsed.minute);
      } catch (_) {}
    }
    if (log != null && log.checkOutAt != null) {
      try {
        final parsed = DateFormat('hh:mm a').parse(log.checkOutAt!);
        outTime = TimeOfDay(hour: parsed.hour, minute: parsed.minute);
      } catch (_) {}
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) {
          return Container(
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
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        isEditing ? 'Edit Attendance Record' : 'Add Manual Attendance',
                        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
                      ),
                      IconButton(onPressed: () => Navigator.pop(ctx), icon: const Icon(Icons.close)),
                    ],
                  ),
                  const SizedBox(height: 14),

                  if (!isEditing) ...[
                    DropdownButtonFormField<String>(
                      value: selectedUserId.isNotEmpty ? selectedUserId : null,
                      decoration: const InputDecoration(labelText: 'Select Employee *'),
                      items: _employees.map((e) {
                        return DropdownMenuItem(
                          value: e.id,
                          child: Text('${e.name} (${e.employeeCode})', overflow: TextOverflow.ellipsis),
                        );
                      }).toList(),
                      onChanged: (v) => setModalState(() => selectedUserId = v ?? ''),
                    ),
                    const SizedBox(height: 12),
                  ],

                  // Work Date Picker
                  ListTile(
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: const BorderSide(color: AppColors.border),
                    ),
                    leading: const Icon(Icons.calendar_today, color: AppColors.primary, size: 20),
                    title: const Text('Work Date', style: TextStyle(fontSize: 12, color: AppColors.textMuted)),
                    subtitle: Text(
                      DateFormat('EEE, d MMM yyyy').format(workDate),
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                    ),
                    trailing: const Icon(Icons.arrow_drop_down),
                    onTap: () async {
                      final picked = await showDatePicker(
                        context: context,
                        initialDate: workDate,
                        firstDate: DateTime(2023),
                        lastDate: DateTime.now().add(const Duration(days: 30)),
                      );
                      if (picked != null) setModalState(() => workDate = picked);
                    },
                  ),
                  const SizedBox(height: 12),

                  // In & Out Times
                  Row(
                    children: [
                      Expanded(
                        child: ListTile(
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                            side: const BorderSide(color: AppColors.border),
                          ),
                          leading: const Icon(Icons.login, color: AppColors.present, size: 20),
                          title: const Text('In Time', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
                          subtitle: Text(inTime.format(context), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                          onTap: () async {
                            final t = await showTimePicker(context: context, initialTime: inTime);
                            if (t != null) setModalState(() => inTime = t);
                          },
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: ListTile(
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                            side: const BorderSide(color: AppColors.border),
                          ),
                          leading: const Icon(Icons.logout, color: AppColors.violet, size: 20),
                          title: const Text('Out Time', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
                          subtitle: Text(outTime.format(context), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                          onTap: () async {
                            final t = await showTimePicker(context: context, initialTime: outTime);
                            if (t != null) setModalState(() => outTime = t);
                          },
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Status Dropdown
                  DropdownButtonFormField<String>(
                    value: status,
                    decoration: const InputDecoration(labelText: 'Attendance Status'),
                    items: const [
                      DropdownMenuItem(value: 'PRESENT', child: Text('PRESENT')),
                      DropdownMenuItem(value: 'LATE', child: Text('LATE')),
                      DropdownMenuItem(value: 'ABSENT', child: Text('ABSENT')),
                      DropdownMenuItem(value: 'WFH', child: Text('WFH (Work From Home)')),
                      DropdownMenuItem(value: 'ON_LEAVE', child: Text('ON_LEAVE')),
                    ],
                    onChanged: (v) => setModalState(() => status = v ?? 'PRESENT'),
                  ),
                  const SizedBox(height: 12),

                  // Note
                  TextField(
                    controller: noteCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Reconciliation Reason / Note',
                      hintText: 'e.g. Forgot biometric punch, Field duty...',
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Save Button
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    onPressed: () async {
                      if (selectedUserId.isEmpty) return;

                      final inDateTime = DateTime(workDate.year, workDate.month, workDate.day, inTime.hour, inTime.minute);
                      final outDateTime = DateTime(workDate.year, workDate.month, workDate.day, outTime.hour, outTime.minute);

                      Navigator.pop(ctx);
                      setState(() => _loading = true);

                      if (isEditing) {
                        await _attendance.updateReconciliationRecord(
                          id: log.id,
                          checkInAt: inDateTime.toIso8601String(),
                          checkOutAt: outDateTime.toIso8601String(),
                          status: status,
                          note: noteCtrl.text.trim(),
                        );
                      } else {
                        await _attendance.createReconciliationRecord(
                          userId: selectedUserId,
                          workDate: DateFormat('yyyy-MM-dd').format(workDate),
                          checkInAt: inDateTime.toIso8601String(),
                          checkOutAt: outDateTime.toIso8601String(),
                          status: status,
                          note: noteCtrl.text.trim(),
                        );
                      }

                      _loadData();
                    },
                    child: Text(
                      isEditing ? 'Update Record' : 'Save Attendance Record',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final pendingCount = _logs.where((l) => l.status == 'PENDING_APPROVAL').length;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Attendance Reconciliation', style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            tooltip: 'Filter Date',
            icon: Icon(
              Icons.calendar_month,
              color: _selectedDate != null ? AppColors.primary : AppColors.textDark,
            ),
            onPressed: () async {
              final picked = await showDatePicker(
                context: context,
                initialDate: _selectedDate ?? DateTime.now(),
                firstDate: DateTime(2023),
                lastDate: DateTime.now().add(const Duration(days: 30)),
              );
              if (picked != null) {
                setState(() => _selectedDate = picked);
                _loadData();
              }
            },
          ),
          if (_selectedDate != null)
            IconButton(
              tooltip: 'Clear Date Filter',
              icon: const Icon(Icons.clear, color: AppColors.absent),
              onPressed: () {
                setState(() => _selectedDate = null);
                _loadData();
              },
            ),
          IconButton(
            tooltip: 'Refresh',
            icon: const Icon(Icons.refresh),
            onPressed: _loadData,
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppColors.primary,
        icon: const Icon(Icons.add, color: Colors.white),
        label: const Text('Manual Punch', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        onPressed: () => _showAddOrEditModal(),
      ),
      body: RefreshIndicator(
        onRefresh: _loadData,
        child: Column(
          children: [
            // Filter Bar
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              color: Colors.white,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        _selectedDate != null
                            ? 'Date: ${DateFormat('d MMMM yyyy').format(_selectedDate!)}'
                            : 'All Records',
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textDark),
                      ),
                      if (pendingCount > 0)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: AppColors.leaveBg,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: AppColors.leave.withOpacity(0.4)),
                          ),
                          child: Text(
                            '$pendingCount Pending Approval',
                            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.leaveText),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: _statuses.map((s) {
                        final active = _statusFilter == s;
                        return Padding(
                          padding: const EdgeInsets.only(right: 6),
                          child: ChoiceChip(
                            label: Text(s.replaceAll('_', ' '), style: const TextStyle(fontSize: 11)),
                            selected: active,
                            selectedColor: AppColors.primary.withOpacity(0.15),
                            labelStyle: TextStyle(
                              color: active ? AppColors.primary : AppColors.textDark,
                              fontWeight: active ? FontWeight.bold : FontWeight.w500,
                            ),
                            onSelected: (val) {
                              if (val) {
                                setState(() => _statusFilter = s);
                                _loadData();
                              }
                            },
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ],
              ),
            ),

            // Content List
            Expanded(
              child: _loading
                  ? const Center(child: CircularProgressIndicator())
                  : _logs.isEmpty
                      ? const Center(
                          child: Text('No attendance records found for this filter.', style: TextStyle(color: AppColors.textMuted)),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.fromLTRB(16, 12, 16, 90),
                          itemCount: _logs.length,
                          itemBuilder: (context, index) {
                            final log = _logs[index];
                            final isPending = log.status == 'PENDING_APPROVAL';

                            return GlassContainer(
                              margin: const EdgeInsets.only(bottom: 12),
                              padding: const EdgeInsets.all(14),
                              border: isPending ? Border.all(color: AppColors.leave.withOpacity(0.6), width: 1.5) : null,
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  // Header row
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              log.userName ?? 'Employee',
                                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                                            ),
                                            Text(
                                              '${log.employeeCode ?? ""} • ${log.departmentName ?? "General"}',
                                              style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                                            ),
                                          ],
                                        ),
                                      ),
                                      StatusBadge(status: log.status),
                                    ],
                                  ),
                                  const Divider(height: 18),

                                  // In / Out row
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Row(
                                        children: [
                                          const Icon(Icons.login, size: 16, color: AppColors.present),
                                          const SizedBox(width: 4),
                                          Text(
                                            log.checkInAt ?? '—',
                                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                                          ),
                                          const SizedBox(width: 12),
                                          const Icon(Icons.logout, size: 16, color: AppColors.violet),
                                          const SizedBox(width: 4),
                                          Text(
                                            log.checkOutAt ?? '—',
                                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                                          ),
                                        ],
                                      ),
                                      if (log.workedMinutes > 0)
                                        Text(
                                          '${(log.workedMinutes / 60).floor()}h ${log.workedMinutes % 60}m',
                                          style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12, color: AppColors.primary),
                                        ),
                                    ],
                                  ),

                                  // Address / Out of bounds warning
                                  if (log.checkInAddress != null) ...[
                                    const SizedBox(height: 6),
                                    Row(
                                      children: [
                                        const Icon(Icons.location_on_outlined, size: 14, color: AppColors.textMuted),
                                        const SizedBox(width: 4),
                                        Expanded(
                                          child: Text(
                                            log.checkInAddress!,
                                            style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],

                                  if (log.note != null && log.note!.isNotEmpty) ...[
                                    const SizedBox(height: 4),
                                    Text(
                                      'Note: ${log.note}',
                                      style: const TextStyle(fontSize: 11, fontStyle: FontStyle.italic, color: AppColors.slate600),
                                    ),
                                  ],

                                  const SizedBox(height: 10),

                                  // Action Buttons row
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.end,
                                    children: [
                                      if (isPending) ...[
                                        OutlinedButton(
                                          style: OutlinedButton.styleFrom(
                                            foregroundColor: AppColors.absent,
                                            side: const BorderSide(color: AppColors.absent),
                                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                          ),
                                          onPressed: () => _rejectLog(log.id),
                                          child: const Text('Reject', style: TextStyle(fontSize: 11)),
                                        ),
                                        const SizedBox(width: 6),
                                        ElevatedButton(
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: AppColors.present,
                                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                          ),
                                          onPressed: () => _approveLog(log.id),
                                          child: const Text('Approve', style: TextStyle(fontSize: 11)),
                                        ),
                                        const SizedBox(width: 8),
                                      ],
                                      IconButton(
                                        icon: const Icon(Icons.edit_outlined, size: 18, color: AppColors.primary),
                                        onPressed: () => _showAddOrEditModal(log: log),
                                        tooltip: 'Edit record',
                                      ),
                                      IconButton(
                                        icon: const Icon(Icons.delete_outline, size: 18, color: AppColors.absent),
                                        onPressed: () => _deleteLog(log.id),
                                        tooltip: 'Delete record',
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
      ),
    );
  }
}
