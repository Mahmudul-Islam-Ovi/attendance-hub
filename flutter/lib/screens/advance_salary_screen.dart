import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../constants/app_colors.dart';
import '../models/workflow_models.dart';
import '../providers/auth_provider.dart';
import '../services/workflow_service.dart';
import '../widgets/glass_container.dart';
import '../widgets/status_badge.dart';

class AdvanceSalaryScreen extends StatefulWidget {
  const AdvanceSalaryScreen({super.key});

  @override
  State<AdvanceSalaryScreen> createState() => _AdvanceSalaryScreenState();
}

class _AdvanceSalaryScreenState extends State<AdvanceSalaryScreen> {
  final WorkflowService _workflow = WorkflowService();

  List<AdvanceSalaryItem> _items = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    final list = await _workflow.getAdvanceSalary();
    if (mounted) {
      setState(() {
        _items = list;
        _loading = false;
      });
    }
  }

  void _showNewRequestDialog() {
    final amountCtrl = TextEditingController();
    final reasonCtrl = TextEditingController();
    int installments = 1;

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
                  const Text('Advance Salary Request', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                  IconButton(onPressed: () => Navigator.pop(ctx), icon: const Icon(Icons.close)),
                ],
              ),
              const SizedBox(height: 14),
              TextField(
                controller: amountCtrl,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Amount (BDT ৳) *', hintText: 'e.g. 20000', prefixText: '৳ '),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<int>(
                value: installments,
                decoration: const InputDecoration(labelText: 'Deduction Installments'),
                items: [
                  const DropdownMenuItem(value: 1, child: Text('1 Month (Full deduction)')),
                  const DropdownMenuItem(value: 2, child: Text('2 Months (50% each)')),
                  const DropdownMenuItem(value: 3, child: Text('3 Months (Equal 3 installments)')),
                ],
                onChanged: (v) => setModalState(() => installments = v ?? 1),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: reasonCtrl,
                maxLines: 2,
                decoration: const InputDecoration(labelText: 'Reason for Advance *', hintText: 'Medical, house rent, emergency...'),
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: () async {
                  final amount = double.tryParse(amountCtrl.text.trim());
                  if (amount == null || reasonCtrl.text.trim().isEmpty) return;
                  final auth = Provider.of<AuthProvider>(context, listen: false);
                  final user = auth.user;
                  Navigator.pop(ctx);
                  await _workflow.createAdvanceSalary({
                    'userId': user?.id ?? '1',
                    'amount': amount,
                    'requestedMonth': '2026-11',
                    'installments': installments,
                    'reason': reasonCtrl.text.trim(),
                  });
                  _loadData();
                },
                child: const Text('Submit Request'),
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
        onPressed: _showNewRequestDialog,
        icon: const Icon(Icons.add),
        label: const Text('Request Advance', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 80),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('My Advance Salary', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900)),
            const Text('Request emergency payroll advance and track repayment schedule.', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
            const SizedBox(height: 16),
            if (_items.isEmpty)
              const Center(child: Padding(padding: EdgeInsets.all(32), child: Text('No advance salary requests recorded.')))
            else
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: _items.length,
                separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder: (ctx, i) {
                  final a = _items[i];
                  return GlassContainer(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('৳${a.amount.toStringAsFixed(0)}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppColors.primary)),
                            StatusBadge(status: a.status),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text('Installments: ${a.installments} Month(s) • For ${a.requestedMonth}', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.textLight)),
                        if (a.reason != null) ...[
                          const SizedBox(height: 4),
                          Text('"${a.reason}"', style: const TextStyle(fontSize: 12, color: AppColors.textDark)),
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
