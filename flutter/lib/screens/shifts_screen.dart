import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../constants/app_colors.dart';
import '../models/workflow_models.dart';
import '../providers/auth_provider.dart';
import '../services/workflow_service.dart';
import '../widgets/glass_container.dart';

class ShiftsScreen extends StatefulWidget {
  const ShiftsScreen({super.key});

  @override
  State<ShiftsScreen> createState() => _ShiftsScreenState();
}

class _ShiftsScreenState extends State<ShiftsScreen> {
  final WorkflowService _workflow = WorkflowService();
  List<ShiftItem> _shifts = [];
  bool _loading = true;

  final List<Map<String, dynamic>> _presets = [
    {'name': 'Regular General', 'start': '09:00', 'end': '18:00', 'icon': Icons.wb_sunny_outlined, 'color': AppColors.late},
    {'name': 'Morning Shift', 'start': '07:00', 'end': '15:30', 'icon': Icons.wb_sunny, 'color': AppColors.wfh},
    {'name': 'Evening Shift', 'start': '14:00', 'end': '22:30', 'icon': Icons.nights_stay_outlined, 'color': AppColors.primary},
    {'name': 'Night Roster', 'start': '22:00', 'end': '06:30', 'icon': Icons.bedtime_outlined, 'color': AppColors.violet},
  ];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    final list = await _workflow.getShifts();
    if (mounted) {
      setState(() {
        _shifts = list;
        _loading = false;
      });
    }
  }

  void _showAssignShiftDialog() {
    Map<String, dynamic> selectedPreset = _presets[0];

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
                  const Text('Schedule Employee Shift', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                  IconButton(onPressed: () => Navigator.pop(ctx), icon: const Icon(Icons.close)),
                ],
              ),
              const SizedBox(height: 14),
              const Text('Select Shift Pattern', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textMuted)),
              const SizedBox(height: 8),
              ..._presets.map((p) => RadioListTile<String>(
                    title: Text(p['name'], style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
                    subtitle: Text('${p['start']} – ${p['end']}', style: const TextStyle(fontSize: 11)),
                    value: p['name'],
                    groupValue: selectedPreset['name'],
                    onChanged: (v) => setModalState(() => selectedPreset = p),
                  )),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () async {
                  final auth = Provider.of<AuthProvider>(context, listen: false);
                  final user = auth.user;
                  Navigator.pop(ctx);
                  await _workflow.createShift({
                    'userId': user?.id ?? '1',
                    'date': DateFormat('yyyy-MM-dd').format(DateTime.now()),
                    'shiftName': selectedPreset['name'],
                    'startTime': selectedPreset['start'],
                    'endTime': selectedPreset['end'],
                    'isWeekend': false,
                  });
                  _loadData();
                },
                child: const Text('Confirm Schedule'),
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

    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        onPressed: _showAssignShiftDialog,
        icon: const Icon(Icons.add),
        label: const Text('Schedule Shift', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 80),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('My Shifts & Roster', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900)),
            const Text('Shift patterns, duty rotations, and assigned timing hours.', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
            const SizedBox(height: 16),

            // Presets Cards Grid
            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 2,
              crossAxisSpacing: 10,
              mainAxisSpacing: 10,
              childAspectRatio: 1.8,
              children: _presets.map((p) {
                final Color color = p['color'];
                return GlassContainer(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(p['name'], style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: color)),
                          Icon(p['icon'], size: 16, color: color),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text('${p['start']} – ${p['end']}', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: AppColors.textDark)),
                    ],
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 20),

            const Text('Assigned Shifts Schedule', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800)),
            const SizedBox(height: 10),
            if (_shifts.isEmpty)
              const Center(child: Padding(padding: EdgeInsets.all(32), child: Text('Default company shift (09:00 - 18:00) applies.')))
            else
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: _shifts.length,
                separatorBuilder: (_, __) => const SizedBox(height: 8),
                itemBuilder: (ctx, i) {
                  final s = _shifts[i];
                  return GlassContainer(
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
                          child: const Icon(Icons.access_time_filled, color: AppColors.primary, size: 20),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(s.shiftName, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800)),
                              Text('${s.startTime} → ${s.endTime} • ${s.userName}', style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(color: AppColors.presentBg, borderRadius: BorderRadius.circular(8)),
                          child: const Text('ACTIVE', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: AppColors.presentText)),
                        ),
                      ],
                    ),
                  );
                },
              ),
          ],
        ),
      ),
    );
  }
}
