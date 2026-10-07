import 'package:flutter/material.dart';
import '../constants/app_colors.dart';
import '../models/department_model.dart';
import '../services/workflow_service.dart';
import '../widgets/glass_container.dart';

class DepartmentsScreen extends StatefulWidget {
  const DepartmentsScreen({super.key});

  @override
  State<DepartmentsScreen> createState() => _DepartmentsScreenState();
}

class _DepartmentsScreenState extends State<DepartmentsScreen> {
  final WorkflowService _workflow = WorkflowService();
  List<DepartmentModel> _departments = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadDepts();
  }

  Future<void> _loadDepts() async {
    setState(() => _loading = true);
    final list = await _workflow.getDepartments();
    if (mounted) {
      setState(() {
        _departments = list;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Teams & Departments', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900)),
          const Text('Departmental presence rates, team heads, and active staffing.', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
          const SizedBox(height: 16),
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _departments.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (ctx, i) {
              final d = _departments[i];
              final rate = d.total > 0 ? ((d.present / d.total) * 100).round() : 0;
              Color color = AppColors.primary;
              try {
                final clean = d.color.replaceAll('#', '');
                color = Color(int.parse('0xFF$clean'));
              } catch (_) {}

              return GlassContainer(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Container(
                              height: 12,
                              width: 12,
                              decoration: BoxDecoration(color: color, shape: BoxShape.circle),
                            ),
                            const SizedBox(width: 8),
                            Text(d.name, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800)),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(color: color.withOpacity(0.12), borderRadius: BorderRadius.circular(10)),
                          child: Text('$rate% Present', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: color)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('In Today: ${d.present} / ${d.total}', style: const TextStyle(fontSize: 12, color: AppColors.textMuted, fontWeight: FontWeight.w600)),
                        Text('Code: ${d.code}', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.textLight)),
                      ],
                    ),
                    const SizedBox(height: 6),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(6),
                      child: LinearProgressIndicator(
                        value: d.total > 0 ? (d.present / d.total) : 0,
                        minHeight: 6,
                        backgroundColor: AppColors.bg,
                        valueColor: AlwaysStoppedAnimation(color),
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
