import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../constants/app_colors.dart';
import '../models/attendance_model.dart';
import '../models/department_model.dart';
import '../models/employee_model.dart';
import '../models/task_model.dart';
import '../providers/auth_provider.dart';
import '../services/attendance_service.dart';
import '../services/workflow_service.dart';
import '../widgets/glass_container.dart';
import '../widgets/status_badge.dart';

class DashboardScreen extends StatefulWidget {
  final Function(int screenIndex) onNavigate;

  const DashboardScreen({super.key, required this.onNavigate});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final WorkflowService _workflow = WorkflowService();
  final AttendanceService _attendance = AttendanceService();

  bool _loading = true;
  List<EmployeeModel> _employees = [];
  List<DepartmentModel> _departments = [];
  List<TaskModel> _tasks = [];
  List<AttendanceLog> _pendingPunches = [];
  Map<String, dynamic>? _myTodayPunch;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    try {
      final auth = Provider.of<AuthProvider>(context, listen: false);
      final user = auth.user;

      final emps = await _workflow.getEmployees();
      final depts = await _workflow.getDepartments();
      final tasks = await _workflow.getTasks();
      final recLogs = await _attendance.getReconciliationLogs();

      Map<String, dynamic>? myPunch;
      if (user != null) {
        myPunch = await _attendance.getTodayPunchStatus(
          userId: user.id,
          employeeCode: user.employeeCode,
        );
      }

      if (mounted) {
        setState(() {
          _employees = emps;
          _departments = depts;
          _tasks = tasks;
          _pendingPunches = recLogs.where((l) => l.status == 'PENDING_APPROVAL').toList();
          _myTodayPunch = myPunch;
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _approvePunch(String logId) async {
    setState(() {
      _pendingPunches.removeWhere((p) => p.id == logId);
    });
    await _attendance.approvePunch(logId);
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Punch approved successfully!'),
        backgroundColor: AppColors.present,
      ),
    );
    _loadData();
  }

  Future<void> _rejectPunch(String logId) async {
    setState(() {
      _pendingPunches.removeWhere((p) => p.id == logId);
    });
    await _attendance.rejectPunch(logId);
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Punch rejected.'),
        backgroundColor: AppColors.absent,
      ),
    );
    _loadData();
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final user = auth.user;
    final isAdmin = auth.isAdmin;

    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    final dateStr = DateFormat('EEEE, d MMMM yyyy').format(DateTime.now());

    return RefreshIndicator(
      onRefresh: _loadData,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Welcome Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        isAdmin ? 'Company Dashboard' : 'Welcome back, ${user?.name.split(" ")[0]}',
                        style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w900,
                          color: AppColors.textDark,
                          letterSpacing: -0.5,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '$dateStr • ${user?.designation ?? "Employee"}',
                        style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                      ),
                    ],
                  ),
                ),
                Row(
                  children: [
                    IconButton(
                      onPressed: _loadData,
                      icon: const Icon(Icons.refresh, color: AppColors.primary),
                      tooltip: 'Refresh',
                    ),
                    IconButton(
                      tooltip: 'Sign Out',
                      icon: const Icon(Icons.logout_rounded, color: AppColors.absent),
                      onPressed: () {
                        showDialog(
                          context: context,
                          builder: (ctx) => AlertDialog(
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                            title: const Row(
                              children: [
                                Icon(Icons.logout_rounded, color: AppColors.absent),
                                SizedBox(width: 10),
                                Text('Sign Out', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                              ],
                            ),
                            content: const Text(
                              'Are you sure you want to sign out from Attendance Hub?',
                              style: TextStyle(fontSize: 13, color: AppColors.slate700),
                            ),
                            actions: [
                              TextButton(
                                onPressed: () => Navigator.pop(ctx),
                                child: const Text('Cancel', style: TextStyle(color: AppColors.textMuted)),
                              ),
                              ElevatedButton(
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppColors.absent,
                                  foregroundColor: Colors.white,
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                ),
                                onPressed: () {
                                  Navigator.pop(ctx);
                                  auth.logout();
                                },
                                child: const Text('Log Out', style: TextStyle(fontWeight: FontWeight.bold)),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 16),

            if (isAdmin) ...[
              _buildAdminMetrics(),
              const SizedBox(height: 16),
              _buildDepartmentProgress(),
              const SizedBox(height: 16),
              _buildNeedsAttention(),
            ] else ...[
              _buildEmployeeStatusCard(),
              const SizedBox(height: 16),
              _buildQuickActionCards(),
              const SizedBox(height: 16),
              _buildPersonalTasks(),
            ],
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  // ----------------- ADMIN DASHBOARD WIDGETS -----------------
  Widget _buildAdminMetrics() {
    final total = _employees.length;
    final present = _employees.where((e) => e.status == 'PRESENT').length;
    final late = _employees.where((e) => e.status == 'LATE').length;
    final onLeave = _employees.where((e) => e.status == 'ON_LEAVE').length;
    final absent = _employees.where((e) => e.status == 'ABSENT').length;
    final wfh = _employees.where((e) => e.status == 'WFH').length;
    final rate = total > 0 ? (((present + late + wfh) / total) * 100).round() : 0;

    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      crossAxisSpacing: 10,
      mainAxisSpacing: 10,
      childAspectRatio: 1.6,
      children: [
        _buildMetricTile('Total Employees', '$total', Icons.people_outline, AppColors.primary, AppColors.primary.withOpacity(0.1)),
        _buildMetricTile('Present Today', '${present + late}', Icons.how_to_reg_outlined, AppColors.present, AppColors.presentBg),
        _buildMetricTile('On Leave', '$onLeave', Icons.flight_takeoff_outlined, AppColors.leave, AppColors.leaveBg),
        _buildMetricTile('Absent', '$absent', Icons.person_off_outlined, AppColors.absent, AppColors.absentBg),
        _buildMetricTile('Work From Home', '$wfh', Icons.home_work_outlined, AppColors.wfh, AppColors.wfhBg),
        _buildMetricTile('Attendance Rate', '$rate%', Icons.percent, AppColors.violet, AppColors.violet.withOpacity(0.1)),
      ],
    );
  }

  Widget _buildMetricTile(String label, String value, IconData icon, Color color, Color bg) {
    return GlassContainer(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(10)),
            child: Icon(icon, color: color, size: 18),
          ),
          const Spacer(),
          Text(
            value,
            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: AppColors.textDark),
          ),
          Text(
            label,
            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.textMuted),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildDepartmentProgress() {
    return GlassContainer(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Departments Presence', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.textDark)),
          const SizedBox(height: 12),
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _departments.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (ctx, i) {
              final d = _departments[i];
              final percent = d.total > 0 ? (d.present / d.total) : 0.0;
              Color color = AppColors.primary;
              try {
                final clean = d.color.replaceAll('#', '');
                color = Color(int.parse('0xFF$clean'));
              } catch (_) {}

              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(d.name, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textDark)),
                      Text('${d.present} / ${d.total} in', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textMuted)),
                    ],
                  ),
                  const SizedBox(height: 6),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: LinearProgressIndicator(
                      value: percent,
                      minHeight: 8,
                      backgroundColor: AppColors.border,
                      valueColor: AlwaysStoppedAnimation<Color>(color),
                    ),
                  ),
                ],
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildNeedsAttention() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Needs Attention', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.textDark)),
        const SizedBox(height: 10),

        // Location approval
        if (_pendingPunches.isNotEmpty)
          GlassContainer(
            color: AppColors.leaveBg.withOpacity(0.5),
            border: Border.all(color: AppColors.leave.withOpacity(0.3)),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.location_on, color: AppColors.leaveText, size: 18),
                    const SizedBox(width: 8),
                    Text(
                      'Pending Location Approvals (${_pendingPunches.length})',
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: AppColors.leaveText),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                ..._pendingPunches.map((p) => Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(p.userName ?? 'Employee', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
                                Text(p.checkInAddress ?? 'Out of bounds', style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
                              ],
                            ),
                          ),
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              OutlinedButton(
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: AppColors.absent,
                                  side: const BorderSide(color: AppColors.absent),
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                ),
                                onPressed: () => _rejectPunch(p.id),
                                child: const Text('Reject', style: TextStyle(fontSize: 11)),
                              ),
                              const SizedBox(width: 6),
                              ElevatedButton(
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppColors.present,
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                ),
                                onPressed: () => _approvePunch(p.id),
                                child: const Text('Approve', style: TextStyle(fontSize: 11)),
                              ),
                            ],
                          ),
                        ],
                      ),
                    )),
              ],
            ),
          ),
      ],
    );
  }

  // ----------------- EMPLOYEE DASHBOARD WIDGETS -----------------
  Widget _buildEmployeeStatusCard() {
    final bool hasPunchedIn = _myTodayPunch?['hasPunchedIn'] == true;
    final bool isPendingApproval = _myTodayPunch?['isPendingApproval'] == true ||
        _myTodayPunch?['status'] == 'PENDING_APPROVAL';
    final bool isDoneForDay = _myTodayPunch?['isDoneForDay'] == true;
    final String currentStatus = _myTodayPunch?['status'] ?? (hasPunchedIn ? 'PRESENT' : 'ABSENT');

    String inTimeStr = '';
    final rawIn = _myTodayPunch?['checkInAt'];
    if (rawIn != null && rawIn.toString().isNotEmpty) {
      try {
        final dt = DateTime.parse(rawIn.toString()).toLocal();
        inTimeStr = DateFormat('hh:mm a').format(dt);
      } catch (_) {
        inTimeStr = rawIn.toString();
      }
    }

    String outTimeStr = '';
    final rawOut = _myTodayPunch?['checkOutAt'];
    if (rawOut != null && rawOut.toString().isNotEmpty) {
      try {
        final dt = DateTime.parse(rawOut.toString()).toLocal();
        outTimeStr = DateFormat('hh:mm a').format(dt);
      } catch (_) {
        outTimeStr = rawOut.toString();
      }
    }

    if (isPendingApproval) {
      return Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.leaveBg,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: AppColors.leave.withOpacity(0.5), width: 1.5),
        ),
        child: Row(
          children: [
            Container(
              height: 44,
              width: 44,
              decoration: BoxDecoration(
                color: AppColors.leave.withOpacity(0.2),
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Icon(Icons.hourglass_top_rounded, color: AppColors.leaveText, size: 24),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Waiting for Admin Approval',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: AppColors.leaveText),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    inTimeStr.isNotEmpty
                        ? 'Punched in at $inTimeStr • Awaiting admin approval'
                        : 'Location out of bounds • Awaiting admin approval',
                    style: const TextStyle(fontSize: 11, color: AppColors.leaveText),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 6),
            const StatusBadge(status: 'PENDING_APPROVAL'),
          ],
        ),
      );
    }

    if (isDoneForDay) {
      return Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.presentBg,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: AppColors.present.withOpacity(0.4), width: 1.5),
        ),
        child: Row(
          children: [
            Container(
              height: 44,
              width: 44,
              decoration: BoxDecoration(
                color: AppColors.present.withOpacity(0.2),
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Icon(Icons.check_circle_rounded, color: AppColors.present, size: 24),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Today\'s Attendance Completed',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: AppColors.present),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'In: $inTimeStr  •  Out: $outTimeStr',
                    style: const TextStyle(fontSize: 11, color: AppColors.textDark),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 6),
            StatusBadge(status: currentStatus),
          ],
        ),
      );
    }

    if (hasPunchedIn) {
      return GlassContainer(
        child: Row(
          children: [
            Container(
              height: 44,
              width: 44,
              decoration: BoxDecoration(
                gradient: AppColors.primaryGradient,
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Icon(Icons.fingerprint, color: Colors.white, size: 24),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Active at Work Today', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
                  Text('Punched in at $inTimeStr', style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
                ],
              ),
            ),
            const SizedBox(width: 6),
            StatusBadge(status: currentStatus),
          ],
        ),
      );
    }

    return GlassContainer(
      child: Row(
        children: [
          Container(
            height: 44,
            width: 44,
            decoration: BoxDecoration(
              color: AppColors.slate200,
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Icon(Icons.fingerprint, color: AppColors.textMuted, size: 24),
          ),
          const SizedBox(width: 12),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Not Punched In Yet', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
                Text('Shift: 09:00 AM – 06:00 PM', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
              ],
            ),
          ),
          const SizedBox(width: 6),
          const StatusBadge(status: 'ABSENT'),
        ],
      ),
    );
  }

  Widget _buildQuickActionCards() {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      crossAxisSpacing: 10,
      mainAxisSpacing: 10,
      childAspectRatio: 1.9,
      children: [
        _buildActionTile('Punch In / Out', Icons.fingerprint, AppColors.primary, () => widget.onNavigate(1)),
        _buildActionTile('My Tasks', Icons.check_circle_outline, AppColors.present, () => widget.onNavigate(5)),
        _buildActionTile('Monthly Sheet', Icons.calendar_month, AppColors.violet, () => widget.onNavigate(16)),
        _buildActionTile('Pay Slip', Icons.account_balance_wallet_outlined, AppColors.late, () => widget.onNavigate(14)),
      ],
    );
  }

  Widget _buildActionTile(String title, IconData icon, Color color, VoidCallback onTap) {
    return GlassContainer(
      onTap: onTap,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              title,
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textDark),
              maxLines: 2,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPersonalTasks() {
    return GlassContainer(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('My Tasks & Deadlines', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.textDark)),
              TextButton(
                onPressed: () => widget.onNavigate(5),
                child: const Text('View All', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primary)),
              ),
            ],
          ),
          const SizedBox(height: 6),
          if (_tasks.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 16),
              child: Center(
                child: Text('No pending tasks! 🎉', style: TextStyle(color: AppColors.textMuted, fontSize: 13)),
              ),
            )
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _tasks.take(3).length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (ctx, i) {
                final t = _tasks[i];
                return Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              t.title,
                              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textDark),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: t.status == 'DONE' ? AppColors.presentBg : AppColors.primary.withOpacity(0.08),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              t.status,
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w800,
                                color: t.status == 'DONE' ? AppColors.presentText : AppColors.primary,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(6),
                        child: LinearProgressIndicator(
                          value: t.progress / 100.0,
                          minHeight: 6,
                          backgroundColor: AppColors.bg,
                          valueColor: const AlwaysStoppedAnimation<Color>(AppColors.present),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
        ],
      ),
    );
  }
}
