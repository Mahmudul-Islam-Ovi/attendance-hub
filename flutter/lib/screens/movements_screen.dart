import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../constants/app_colors.dart';
import '../models/workflow_models.dart';
import '../providers/auth_provider.dart';
import '../services/workflow_service.dart';
import '../widgets/glass_container.dart';
import '../widgets/status_badge.dart';

class MovementsScreen extends StatefulWidget {
  const MovementsScreen({super.key});

  @override
  State<MovementsScreen> createState() => _MovementsScreenState();
}

class _MovementsScreenState extends State<MovementsScreen> {
  final WorkflowService _workflow = WorkflowService();

  List<MovementItem> _movements = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    final list = await _workflow.getMovements();
    if (mounted) {
      setState(() {
        _movements = list;
        _loading = false;
      });
    }
  }

  void _showNewPassDialog() {
    final destCtrl = TextEditingController();
    final purposeCtrl = TextEditingController();
    final vehicleCtrl = TextEditingController();
    TimeOfDay outTime = const TimeOfDay(hour: 10, minute: 30);
    TimeOfDay returnTime = const TimeOfDay(hour: 13, minute: 0);

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
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('New Movement Pass', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                    IconButton(onPressed: () => Navigator.pop(ctx), icon: const Icon(Icons.close)),
                  ],
                ),
                const SizedBox(height: 14),
                TextField(
                  controller: destCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Destination / Location *',
                    hintText: 'e.g. Bangladesh Bank Motijheel branch',
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: purposeCtrl,
                  maxLines: 2,
                  decoration: const InputDecoration(
                    labelText: 'Official Purpose *',
                    hintText: 'Client meeting, inspection, field visit...',
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        icon: const Icon(Icons.access_time, size: 16),
                        label: Text('Out: ${outTime.format(context)}', style: const TextStyle(fontSize: 12)),
                        onPressed: () async {
                          final t = await showTimePicker(context: context, initialTime: outTime);
                          if (t != null) setModalState(() => outTime = t);
                        },
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: OutlinedButton.icon(
                        icon: const Icon(Icons.access_time, size: 16),
                        label: Text('In: ${returnTime.format(context)}', style: const TextStyle(fontSize: 12)),
                        onPressed: () async {
                          final t = await showTimePicker(context: context, initialTime: returnTime);
                          if (t != null) setModalState(() => returnTime = t);
                        },
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: vehicleCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Vehicle / Commute Mode',
                    hintText: 'e.g. Company Pool Car, Uber, CNG',
                  ),
                ),
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: () async {
                    if (destCtrl.text.trim().isEmpty || purposeCtrl.text.trim().isEmpty) return;
                    final auth = Provider.of<AuthProvider>(context, listen: false);
                    final user = auth.user;
                    Navigator.pop(ctx);
                    await _workflow.createMovement({
                      'userId': user?.id ?? '1',
                      'date': DateFormat('yyyy-MM-dd').format(DateTime.now()),
                      'outTime': outTime.format(context),
                      'returnTime': returnTime.format(context),
                      'destination': destCtrl.text.trim(),
                      'purpose': purposeCtrl.text.trim(),
                      'vehicle': vehicleCtrl.text.trim(),
                    });
                    _loadData();
                  },
                  child: const Text('Submit Movement Pass'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());

    final pendingCount = _movements.where((m) => m.status == 'PENDING').length;
    final activeCount = _movements.where((m) => m.status == 'APPROVED').length;

    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        onPressed: _showNewPassDialog,
        icon: const Icon(Icons.add),
        label: const Text('New Pass', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 80),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Counters
            Row(
              children: [
                Expanded(
                  child: GlassContainer(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('${_movements.length}', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900)),
                        const Text('Total Passes', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: GlassContainer(
                    padding: const EdgeInsets.all(12),
                    color: AppColors.leaveBg.withOpacity(0.4),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('$pendingCount', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: AppColors.leaveText)),
                        const Text('Pending', style: TextStyle(fontSize: 11, color: AppColors.leaveText)),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: GlassContainer(
                    padding: const EdgeInsets.all(12),
                    color: AppColors.presentBg.withOpacity(0.4),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('$activeCount', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: AppColors.presentText)),
                        const Text('Out Now', style: TextStyle(fontSize: 11, color: AppColors.presentText)),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // List
            if (_movements.isEmpty)
              const Center(child: Padding(padding: EdgeInsets.all(32), child: Text('No movement passes recorded.')))
            else
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: _movements.length,
                separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder: (ctx, i) {
                  final m = _movements[i];
                  return GlassContainer(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(m.userName, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800)),
                            StatusBadge(status: m.status),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            const Icon(Icons.location_on_outlined, size: 14, color: AppColors.primary),
                            const SizedBox(width: 4),
                            Expanded(child: Text(m.destination, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600))),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            const Icon(Icons.access_time, size: 14, color: AppColors.textMuted),
                            const SizedBox(width: 4),
                            Text('${m.outTime} → ${m.returnTime}', style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
                            if (m.vehicle != null) ...[
                              const SizedBox(width: 10),
                              Text('• ${m.vehicle}', style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
                            ],
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text('"${m.purpose}"', style: const TextStyle(fontSize: 12, fontStyle: FontStyle.italic, color: AppColors.textDark)),
                        if (m.status == 'PENDING') ...[
                          const SizedBox(height: 10),
                          Align(
                            alignment: Alignment.centerRight,
                            child: ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.present,
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                              ),
                              onPressed: () async {
                                await _workflow.updateMovementStatus(m.id, 'APPROVED');
                                _loadData();
                              },
                              child: const Text('Approve Pass', style: TextStyle(fontSize: 11)),
                            ),
                          ),
                        ] else if (m.status == 'APPROVED') ...[
                          const SizedBox(height: 10),
                          Align(
                            alignment: Alignment.centerRight,
                            child: ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.primary,
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                              ),
                              onPressed: () async {
                                await _workflow.updateMovementStatus(m.id, 'COMPLETED');
                                _loadData();
                              },
                              child: const Text('Mark Returned', style: TextStyle(fontSize: 11)),
                            ),
                          ),
                        ],
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
