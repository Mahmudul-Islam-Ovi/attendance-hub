import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../constants/app_colors.dart';
import '../models/attendance_model.dart';
import '../providers/auth_provider.dart';
import '../services/attendance_service.dart';
import '../services/workflow_service.dart';
import '../widgets/glass_container.dart';
import '../widgets/status_badge.dart';

class MonthlyAttendanceScreen extends StatefulWidget {
  const MonthlyAttendanceScreen({super.key});

  @override
  State<MonthlyAttendanceScreen> createState() => _MonthlyAttendanceScreenState();
}

class _MonthlyAttendanceScreenState extends State<MonthlyAttendanceScreen> {
  final AttendanceService _attendance = AttendanceService();
  final WorkflowService _workflow = WorkflowService();

  String _selectedMonth = DateFormat('yyyy-MM').format(DateTime.now());
  String? _selectedUserId;
  List<Map<String, dynamic>> _teamMembers = [];
  MonthlyAttendanceSummary? _summary;
  List<MonthlyAttendanceDay> _days = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadInitial();
  }

  Future<void> _loadInitial() async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    if (auth.isAdmin) {
      final emps = await _workflow.getEmployeeListSimple();
      if (mounted) {
        setState(() {
          _teamMembers = emps;
        });
      }
    }
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    final data = await _attendance.getMonthlyAttendance(
      month: _selectedMonth,
      userId: _selectedUserId,
    );
    if (mounted) {
      setState(() {
        _summary = data['summary'];
        _days = data['days'] ?? [];
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final isAdmin = auth.isAdmin;

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Subordinate picker for Admins / Managers
          if (isAdmin && _teamMembers.isNotEmpty) ...[
            GlassContainer(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Select Employee (Subordinate Timesheet):',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textMuted),
                  ),
                  const SizedBox(height: 6),
                  DropdownButtonFormField<String>(
                    value: _selectedUserId,
                    isExpanded: true,
                    decoration: InputDecoration(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    items: [
                      DropdownMenuItem<String>(
                        value: null,
                        child: Text('My Own Timesheet (${auth.user?.name ?? ""})'),
                      ),
                      ..._teamMembers.map((m) {
                        return DropdownMenuItem<String>(
                          value: m['id'] as String,
                          child: Text('${m['name']} (${m['employeeCode'] ?? ""})'),
                        );
                      }),
                    ],
                    onChanged: (val) {
                      setState(() => _selectedUserId = val);
                      _loadData();
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
          ],

          // Header & Month
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Monthly Timesheet', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900)),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.calendar_month, size: 16, color: AppColors.primary),
                    const SizedBox(width: 6),
                    Text(_selectedMonth, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          if (_loading)
            const Center(child: Padding(padding: EdgeInsets.all(40), child: CircularProgressIndicator()))
          else if (_summary != null) ...[
            // Rate & Summary Cards
            Row(
              children: [
                Expanded(
                  flex: 3,
                  child: GlassContainer(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('PRESENCE RATE', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppColors.textMuted)),
                        const SizedBox(height: 4),
                        Text('${_summary!.presenceRate}%', style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w900, color: AppColors.present)),
                        const SizedBox(height: 4),
                        Text('${_summary!.presentCount} / ${_summary!.workingDays} Days In', style: const TextStyle(fontSize: 11, color: AppColors.textDark, fontWeight: FontWeight.w600)),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  flex: 3,
                  child: GlassContainer(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('WORKED HOURS', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppColors.textMuted)),
                        const SizedBox(height: 4),
                        Text('${_summary!.totalWorkedHours}h', style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w900, color: AppColors.primary)),
                        const SizedBox(height: 4),
                        Text('${_summary!.lateCount} Late Entries', style: const TextStyle(fontSize: 11, color: AppColors.late, fontWeight: FontWeight.w600)),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Daily List
            GlassContainer(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Day by Day Work Log', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800)),
                  const SizedBox(height: 12),
                  ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: _days.length,
                    separatorBuilder: (_, __) => const Divider(color: AppColors.border, height: 16),
                    itemBuilder: (ctx, i) {
                      final d = _days[i];
                      return Row(
                        children: [
                          Container(
                            width: 36,
                            height: 36,
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                              color: d.isWeekend ? AppColors.bg : AppColors.primary.withOpacity(0.08),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              '${d.day}',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w800,
                                color: d.isWeekend ? AppColors.textMuted : AppColors.primary,
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  d.checkInAt != null ? '${d.checkInAt} → ${d.checkOutAt ?? "--"}' : (d.note ?? 'No Punch'),
                                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
                                ),
                                Text(
                                  d.date,
                                  style: const TextStyle(fontSize: 10, color: AppColors.textMuted),
                                ),
                              ],
                            ),
                          ),
                          StatusBadge(status: d.status),
                        ],
                      );
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
          ],
        ],
      ),
    );
  }
}
