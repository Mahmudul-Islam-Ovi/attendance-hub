import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../constants/app_colors.dart';
import '../models/workflow_models.dart';
import '../providers/auth_provider.dart';
import '../services/workflow_service.dart';
import '../widgets/glass_container.dart';

class ExtraWorkScreen extends StatefulWidget {
  const ExtraWorkScreen({super.key});

  @override
  State<ExtraWorkScreen> createState() => _ExtraWorkScreenState();
}

class _ExtraWorkScreenState extends State<ExtraWorkScreen> {
  final WorkflowService _workflow = WorkflowService();
  List<ExtraWorkItem> _items = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    final list = await _workflow.getExtraWork();
    if (mounted) {
      setState(() {
        _items = list;
        _loading = false;
      });
    }
  }

  void _showNewDialog() {
    final hoursCtrl = TextEditingController();
    final reasonCtrl = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
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
                const Text('Log Extra Work / Weekend', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                IconButton(onPressed: () => Navigator.pop(ctx), icon: const Icon(Icons.close)),
              ],
            ),
            const SizedBox(height: 14),
            TextField(
              controller: hoursCtrl,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Extra Hours Worked *', hintText: 'e.g. 5.5'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: reasonCtrl,
              maxLines: 2,
              decoration: const InputDecoration(labelText: 'Reason / Project Assignment *', hintText: 'Server migration, weekend release...'),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () async {
                final hours = double.tryParse(hoursCtrl.text.trim());
                if (hours == null || reasonCtrl.text.trim().isEmpty) return;
                final auth = Provider.of<AuthProvider>(context, listen: false);
                final user = auth.user;
                Navigator.pop(ctx);
                await _workflow.createExtraWork({
                  'userId': user?.id ?? '1',
                  'date': DateFormat('yyyy-MM-dd').format(DateTime.now()),
                  'hours': hours,
                  'reason': reasonCtrl.text.trim(),
                });
                _loadData();
              },
              child: const Text('Save Record'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());

    final totalHours = _items.fold<double>(0, (sum, i) => sum + i.hours);

    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        onPressed: _showNewDialog,
        icon: const Icon(Icons.add),
        label: const Text('Log Extra Work', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 80),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('My Extra Work Days', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900)),
            const Text('Track weekend duties, extra hours, and compensatory off entitlements.', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
            const SizedBox(height: 16),
            GlassContainer(
              padding: const EdgeInsets.all(14),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  Column(
                    children: [
                      Text('${_items.length}', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: AppColors.textDark)),
                      const Text('Total Days', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
                    ],
                  ),
                  Container(height: 30, width: 1, color: AppColors.border),
                  Column(
                    children: [
                      Text('${totalHours.toStringAsFixed(1)} hrs', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: AppColors.primary)),
                      const Text('Extra Hours', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            if (_items.isEmpty)
              const Center(child: Padding(padding: EdgeInsets.all(32), child: Text('No extra work records logged.')))
            else
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: _items.length,
                separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder: (ctx, i) {
                  final item = _items[i];
                  return GlassContainer(
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
                          child: const Icon(Icons.schedule, color: AppColors.primary, size: 22),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('${item.hours} Hours Extra', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800)),
                              if (item.reason != null)
                                Text(item.reason!, style: const TextStyle(fontSize: 12, color: AppColors.textDark)),
                              Text(item.date, style: const TextStyle(fontSize: 10, color: AppColors.textMuted)),
                            ],
                          ),
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
