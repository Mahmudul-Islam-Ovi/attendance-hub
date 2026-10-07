import 'package:flutter/material.dart';
import '../constants/app_colors.dart';
import '../models/workflow_models.dart';
import '../services/workflow_service.dart';
import '../widgets/glass_container.dart';
import '../widgets/status_badge.dart';

class ClaimReportScreen extends StatefulWidget {
  const ClaimReportScreen({super.key});

  @override
  State<ClaimReportScreen> createState() => _ClaimReportScreenState();
}

class _ClaimReportScreenState extends State<ClaimReportScreen> {
  final WorkflowService _workflow = WorkflowService();

  List<ClaimItem> _claims = [];
  bool _loading = true;

  String _typeFilter = 'ALL';
  String _statusFilter = 'ALL';

  final List<String> _types = ['ALL', 'TRAVEL', 'MEDICAL', 'EQUIPMENT', 'OTHER'];
  final List<String> _statuses = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'PAID'];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    final data = await _workflow.getClaims();
    if (mounted) {
      setState(() {
        _claims = data;
        _loading = false;
      });
    }
  }

  List<ClaimItem> get _filteredClaims {
    return _claims.where((c) {
      final matchType = _typeFilter == 'ALL' || c.type == _typeFilter;
      final matchStatus = _statusFilter == 'ALL' || c.status == _statusFilter;
      return matchType && matchStatus;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final totalAmount = _claims.fold<double>(0, (sum, c) => sum + c.amount);
    final pendingAmount = _claims.where((c) => c.status == 'PENDING').fold<double>(0, (sum, c) => sum + c.amount);
    final approvedAmount = _claims.where((c) => c.status == 'APPROVED' || c.status == 'PAID').fold<double>(0, (sum, c) => sum + c.amount);

    final travelAmount = _claims.where((c) => c.type == 'TRAVEL').fold<double>(0, (sum, c) => sum + c.amount);
    final medicalAmount = _claims.where((c) => c.type == 'MEDICAL').fold<double>(0, (sum, c) => sum + c.amount);
    final equipAmount = _claims.where((c) => c.type == 'EQUIPMENT').fold<double>(0, (sum, c) => sum + c.amount);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Expense & Claim Report', style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadData,
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadData,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Overview Metric Cards
                    Row(
                      children: [
                        Expanded(
                          child: GlassContainer(
                            padding: const EdgeInsets.all(12),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('TOTAL CLAIMED', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.textMuted)),
                                const SizedBox(height: 4),
                                Text('৳${totalAmount.toStringAsFixed(0)}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppColors.primary)),
                                const SizedBox(height: 2),
                                Text('${_claims.length} vouchers', style: const TextStyle(fontSize: 11, color: AppColors.textDark)),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: GlassContainer(
                            padding: const EdgeInsets.all(12),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('PENDING REVIEW', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.leaveText)),
                                const SizedBox(height: 4),
                                Text('৳${pendingAmount.toStringAsFixed(0)}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppColors.leaveText)),
                                const SizedBox(height: 2),
                                Text('${_claims.where((c) => c.status == 'PENDING').length} pending', style: const TextStyle(fontSize: 11, color: AppColors.textDark)),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: GlassContainer(
                            padding: const EdgeInsets.all(12),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('APPROVED & PAID', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.presentText)),
                                const SizedBox(height: 4),
                                Text('৳${approvedAmount.toStringAsFixed(0)}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppColors.presentText)),
                                const SizedBox(height: 2),
                                Text('${_claims.where((c) => c.status == 'APPROVED' || c.status == 'PAID').length} settled', style: const TextStyle(fontSize: 11, color: AppColors.textDark)),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),

                    // Category Breakdown
                    GlassContainer(
                      padding: const EdgeInsets.all(14),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Category Breakdown', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textDark)),
                          const SizedBox(height: 10),
                          Row(
                            children: [
                              _buildCategoryBadge('Conveyance', '৳${travelAmount.toStringAsFixed(0)}', Icons.directions_car, AppColors.primary),
                              const SizedBox(width: 8),
                              _buildCategoryBadge('Medical', '৳${medicalAmount.toStringAsFixed(0)}', Icons.local_hospital, AppColors.leave),
                              const SizedBox(width: 8),
                              _buildCategoryBadge('Equipment', '৳${equipAmount.toStringAsFixed(0)}', Icons.devices, AppColors.violet),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Category Filter Chips
                    const Text('Filter by Category', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textMuted)),
                    const SizedBox(height: 6),
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: _types.map((t) {
                          final active = _typeFilter == t;
                          return Padding(
                            padding: const EdgeInsets.only(right: 6),
                            child: FilterChip(
                              label: Text(t, style: const TextStyle(fontSize: 11)),
                              selected: active,
                              selectedColor: AppColors.primary.withOpacity(0.15),
                              labelStyle: TextStyle(color: active ? AppColors.primary : AppColors.textDark, fontWeight: active ? FontWeight.bold : FontWeight.w500),
                              onSelected: (val) => setState(() => _typeFilter = t),
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                    const SizedBox(height: 8),

                    // Status Filter Chips
                    const Text('Filter by Status', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textMuted)),
                    const SizedBox(height: 6),
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: _statuses.map((s) {
                          final active = _statusFilter == s;
                          return Padding(
                            padding: const EdgeInsets.only(right: 6),
                            child: FilterChip(
                              label: Text(s, style: const TextStyle(fontSize: 11)),
                              selected: active,
                              selectedColor: AppColors.primary.withOpacity(0.15),
                              labelStyle: TextStyle(color: active ? AppColors.primary : AppColors.textDark, fontWeight: active ? FontWeight.bold : FontWeight.w500),
                              onSelected: (val) => setState(() => _statusFilter = s),
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Claims List
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Claim Vouchers', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.textDark)),
                        Text('${_filteredClaims.length} records', style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
                      ],
                    ),
                    const SizedBox(height: 10),

                    if (_filteredClaims.isEmpty)
                      const Center(
                        child: Padding(
                          padding: EdgeInsets.all(30),
                          child: Text('No claims found matching filters.', style: TextStyle(color: AppColors.textMuted)),
                        ),
                      )
                    else
                      ..._filteredClaims.map((c) {
                        return GlassContainer(
                          margin: const EdgeInsets.only(bottom: 10),
                          padding: const EdgeInsets.all(14),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.all(8),
                                        decoration: BoxDecoration(
                                          color: AppColors.primaryLight.withOpacity(0.2),
                                          borderRadius: BorderRadius.circular(10),
                                        ),
                                        child: Icon(
                                          c.type == 'TRAVEL'
                                              ? Icons.directions_car
                                              : c.type == 'MEDICAL'
                                                  ? Icons.local_hospital
                                                  : Icons.receipt_long,
                                          size: 18,
                                          color: AppColors.primary,
                                        ),
                                      ),
                                      const SizedBox(width: 10),
                                      Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(c.userName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                                          Text('${c.employeeCode} • ${c.type}', style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
                                        ],
                                      ),
                                    ],
                                  ),
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      Text('৳${c.amount.toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: AppColors.textDark)),
                                      const SizedBox(height: 2),
                                      StatusBadge(status: c.status),
                                    ],
                                  ),
                                ],
                              ),
                              if (c.description != null && c.description!.isNotEmpty) ...[
                                const Divider(height: 18),
                                Text(
                                  c.description!,
                                  style: const TextStyle(fontSize: 12, color: AppColors.slate700),
                                ),
                              ],
                            ],
                          ),
                        );
                      }),
                    const SizedBox(height: 40),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildCategoryBadge(String label, String amount, IconData icon, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        decoration: BoxDecoration(
          color: color.withOpacity(0.08),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withOpacity(0.2)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, size: 16, color: color),
            const SizedBox(height: 4),
            Text(amount, style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: color)),
            Text(label, style: const TextStyle(fontSize: 10, color: AppColors.textMuted)),
          ],
        ),
      ),
    );
  }
}
