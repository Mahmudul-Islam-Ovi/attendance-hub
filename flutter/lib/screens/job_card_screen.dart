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

class JobCardScreen extends StatefulWidget {
  const JobCardScreen({super.key});

  @override
  State<JobCardScreen> createState() => _JobCardScreenState();
}

class _JobCardScreenState extends State<JobCardScreen> {
  final AttendanceService _attendance = AttendanceService();
  final WorkflowService _workflow = WorkflowService();

  DateTime _currentMonth = DateTime.now();
  String? _selectedUserId;
  List<Map<String, dynamic>> _teamMembers = [];

  MonthlyAttendanceSummary? _summary;
  List<MonthlyAttendanceDay> _days = [];
  Map<String, dynamic>? _targetUserInfo;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadInitialData();
  }

  Future<void> _loadInitialData() async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    if (auth.isAdmin) {
      final emps = await _workflow.getEmployeeListSimple();
      if (mounted) {
        setState(() {
          _teamMembers = emps;
        });
      }
    }
    _loadJobCard();
  }

  Future<void> _loadJobCard() async {
    setState(() => _loading = true);
    final monthStr = DateFormat('yyyy-MM').format(_currentMonth);
    final data = await _attendance.getMonthlyAttendance(
      month: monthStr,
      userId: _selectedUserId,
    );

    if (mounted) {
      setState(() {
        _summary = data['summary'];
        _days = data['days'] ?? [];
        _targetUserInfo = data['user'];
        _loading = false;
      });
    }
  }

  void _changeMonth(int delta) {
    setState(() {
      _currentMonth = DateTime(_currentMonth.year, _currentMonth.month + delta, 1);
    });
    _loadJobCard();
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final isAdmin = auth.isAdmin;
    final monthDisplay = DateFormat('MMMM yyyy').format(_currentMonth);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Job Card / হাজিরা খাতা', style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadJobCard,
            tooltip: 'Refresh',
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadJobCard,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Employee Picker for Admin / Managers
              if (isAdmin && _teamMembers.isNotEmpty) ...[
                GlassContainer(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Select Employee (Subordinate Job Card):',
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
                            child: Text('My Own Job Card (${auth.user?.name ?? ""})'),
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
                          _loadJobCard();
                        },
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
              ],

              // Month Navigator Header
              GlassContainer(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    IconButton(
                      icon: const Icon(Icons.chevron_left, color: AppColors.primary),
                      onPressed: () => _changeMonth(-1),
                    ),
                    Row(
                      children: [
                        const Icon(Icons.calendar_today_outlined, size: 16, color: AppColors.primary),
                        const SizedBox(width: 8),
                        Text(
                          monthDisplay,
                          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: AppColors.textDark),
                        ),
                      ],
                    ),
                    IconButton(
                      icon: const Icon(Icons.chevron_right, color: AppColors.primary),
                      onPressed: () => _changeMonth(1),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),

              if (_loading)
                const Center(child: Padding(padding: EdgeInsets.all(50), child: CircularProgressIndicator()))
              else ...[
                // Employee Identity Card if viewing subordinate
                if (_targetUserInfo != null && _selectedUserId != null) ...[
                  GlassContainer(
                    padding: const EdgeInsets.all(12),
                    child: Row(
                      children: [
                        const CircleAvatar(
                          backgroundColor: AppColors.primaryLight,
                          radius: 20,
                          child: Icon(Icons.person, color: AppColors.primary),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                _targetUserInfo!['name'] ?? '',
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                              ),
                              Text(
                                '${_targetUserInfo!['employeeCode'] ?? ""} • ${_targetUserInfo!['designation'] ?? ""}',
                                style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                ],

                // Summary Stats Grid
                if (_summary != null) ...[
                  GridView.count(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisCount: 3,
                    crossAxisSpacing: 8,
                    mainAxisSpacing: 8,
                    childAspectRatio: 1.3,
                    children: [
                      _buildMiniStat('Working Days', '${_summary!.workingDays}', AppColors.primary, AppColors.primary.withOpacity(0.1)),
                      _buildMiniStat('Present', '${_summary!.presentCount}', AppColors.present, AppColors.presentBg),
                      _buildMiniStat('Late Days', '${_summary!.lateCount}', AppColors.leave, AppColors.leaveBg),
                      _buildMiniStat('Absent', '${_summary!.absentCount}', AppColors.absent, AppColors.absentBg),
                      _buildMiniStat('On Leave', '${_summary!.leaveCount}', AppColors.violet, AppColors.violet.withOpacity(0.1)),
                      _buildMiniStat('Total Hours', '${_summary!.totalWorkedHours}h', AppColors.wfh, AppColors.wfhBg),
                    ],
                  ),
                  const SizedBox(height: 16),
                ],

                // Daily Job Card Table/List
                const Text(
                  'Daily Punch Records (দৈনিক উপস্থিতি)',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: AppColors.textDark),
                ),
                const SizedBox(height: 10),

                if (_days.isEmpty)
                  const Center(
                    child: Padding(
                      padding: EdgeInsets.all(30),
                      child: Text('No attendance logs for this month.', style: TextStyle(color: AppColors.textMuted)),
                    ),
                  )
                else
                  ..._days.map((day) {
                    final isWeekend = day.isWeekend;
                    final parsedDate = DateTime.tryParse(day.date);
                    final dayNum = parsedDate != null ? DateFormat('dd').format(parsedDate) : '${day.day}';
                    final dayName = parsedDate != null ? DateFormat('E').format(parsedDate) : 'Day';

                    return GlassContainer(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      color: isWeekend ? AppColors.slate100.withOpacity(0.5) : Colors.white,
                      child: Row(
                        children: [
                          // Date box
                          Container(
                            width: 48,
                            padding: const EdgeInsets.symmetric(vertical: 6),
                            decoration: BoxDecoration(
                              color: isWeekend ? AppColors.slate200 : AppColors.primaryLight.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Column(
                              children: [
                                Text(
                                  dayNum,
                                  style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: AppColors.textDark),
                                ),
                                Text(
                                  dayName,
                                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: isWeekend ? AppColors.textMuted : AppColors.primary),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 12),

                          // Times & Hours
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    const Icon(Icons.login, size: 14, color: AppColors.present),
                                    const SizedBox(width: 4),
                                    Text(day.checkInAt ?? '—', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                                    const SizedBox(width: 10),
                                    const Icon(Icons.logout, size: 14, color: AppColors.violet),
                                    const SizedBox(width: 4),
                                    Text(day.checkOutAt ?? '—', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    if (day.workedMinutes > 0)
                                      Text(
                                        'Worked: ${(day.workedMinutes / 60).floor()}h ${day.workedMinutes % 60}m',
                                        style: const TextStyle(fontSize: 11, color: AppColors.textDark, fontWeight: FontWeight.w600),
                                      ),
                                    if (day.lateMinutes > 0) ...[
                                      const SizedBox(width: 8),
                                      Text(
                                        'Late: ${day.lateMinutes}m',
                                        style: const TextStyle(fontSize: 11, color: AppColors.leaveText, fontWeight: FontWeight.bold),
                                      ),
                                    ],
                                  ],
                                ),
                              ],
                            ),
                          ),

                          // Status Badge
                          StatusBadge(status: day.status),
                        ],
                      ),
                    );
                  }),
                const SizedBox(height: 30),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMiniStat(String label, String value, Color color, Color bg) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            value,
            style: TextStyle(fontSize: 17, fontWeight: FontWeight.w900, color: color),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.textMuted),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}
