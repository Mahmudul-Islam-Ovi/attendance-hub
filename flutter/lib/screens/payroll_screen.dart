import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../constants/app_colors.dart';
import '../models/payroll_model.dart';
import '../services/workflow_service.dart';
import '../widgets/glass_container.dart';

class PayrollScreen extends StatefulWidget {
  const PayrollScreen({super.key});

  @override
  State<PayrollScreen> createState() => _PayrollScreenState();
}

class _PayrollScreenState extends State<PayrollScreen> {
  final WorkflowService _workflow = WorkflowService();

  String _selectedMonth = DateFormat('yyyy-MM').format(DateTime.now());
  PayrollModel? _payroll;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadPayroll();
  }

  Future<void> _loadPayroll() async {
    setState(() => _loading = true);
    final data = await _workflow.getPayroll(_selectedMonth);
    if (mounted) {
      setState(() {
        _payroll = data;
        _loading = false;
      });
    }
  }

  String _fmt(double amount) {
    return '৳${amount.toStringAsFixed(0)}';
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Month Selector
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Pay Slip & Payroll', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900)),
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
          else if (_payroll == null)
            const Center(child: Text('No payroll record found for this month.'))
          else ...[
            // Net Payable Hero Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: AppColors.netPayableGradient,
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primaryDark.withOpacity(0.35),
                    blurRadius: 20,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        _payroll!.employeeName,
                        style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w800),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          _payroll!.status,
                          style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                  Text(
                    '${_payroll!.employeeCode} • ${_payroll!.designation ?? ""}',
                    style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 11),
                  ),
                  const SizedBox(height: 16),
                  const Text('NET PAYABLE SALARY', style: TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.w700)),
                  Text(
                    _fmt(_payroll!.netPayable),
                    style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.w900),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Attendance Days Summary
            Row(
              children: [
                _buildDayTile('Working', '${_payroll!.workingDays}', AppColors.textDark),
                const SizedBox(width: 6),
                _buildDayTile('Present', '${_payroll!.presentDays}', AppColors.present),
                const SizedBox(width: 6),
                _buildDayTile('Late', '${_payroll!.lateDays}', AppColors.late),
                const SizedBox(width: 6),
                _buildDayTile('Leave', '${_payroll!.leaveDays}', AppColors.leave),
                const SizedBox(width: 6),
                _buildDayTile('Absent', '${_payroll!.absentDays}', AppColors.absent),
              ],
            ),
            const SizedBox(height: 16),

            // Earnings Breakdown
            GlassContainer(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.arrow_upward, color: AppColors.present, size: 18),
                      SizedBox(width: 6),
                      Text('আয় (Earnings)', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.textDark)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  _buildSalaryRow('মূল বেতন (Basic Salary)', _fmt(_payroll!.basicSalary)),
                  _buildSalaryRow('বাড়ি ভাড়া ভাতা (House Rent)', _fmt(_payroll!.houseRent)),
                  _buildSalaryRow('চিকিৎসা ভাতা (Medical)', _fmt(_payroll!.medicalAllowance)),
                  _buildSalaryRow('যাতায়াত ভাতা (Transport)', _fmt(_payroll!.transportAllow)),
                  if (_payroll!.overtimeBonus > 0)
                    _buildSalaryRow('ওভারটাইম বোনাস (Overtime)', _fmt(_payroll!.overtimeBonus)),
                  if (_payroll!.performanceBonus > 0)
                    _buildSalaryRow('পারফরম্যান্স বোনাস', _fmt(_payroll!.performanceBonus)),
                  const Divider(color: AppColors.border, height: 20),
                  _buildSalaryRow(
                    'মোট আয় (Gross + Additions)',
                    _fmt(_payroll!.grossSalary + _payroll!.totalAdditions),
                    isBold: true,
                    color: AppColors.presentText,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),

            // Deductions Breakdown
            GlassContainer(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.arrow_downward, color: AppColors.absent, size: 18),
                      SizedBox(width: 6),
                      Text('কর্তন (Deductions)', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.textDark)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  _buildSalaryRow('অনুপস্থিতি কর্তন (Absent)', _fmt(_payroll!.absentDeduction)),
                  _buildSalaryRow('দেরি কর্তন (Late penalty)', _fmt(_payroll!.lateDeduction)),
                  if (_payroll!.advanceRecovery > 0)
                    _buildSalaryRow('অগ্রিম বেতন কিস্তি (Advance Recovery)', _fmt(_payroll!.advanceRecovery)),
                  const Divider(color: AppColors.border, height: 20),
                  _buildSalaryRow(
                    'মোট কর্তন (Total Deductions)',
                    '- ${_fmt(_payroll!.totalDeductions)}',
                    isBold: true,
                    color: AppColors.absent,
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

  Widget _buildDayTile(String label, String value, Color color) {
    return Expanded(
      child: GlassContainer(
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
        child: Column(
          children: [
            Text(value, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: color)),
            const SizedBox(height: 2),
            Text(label, style: const TextStyle(fontSize: 10, color: AppColors.textMuted)),
          ],
        ),
      ),
    );
  }

  Widget _buildSalaryRow(String title, String amount, {bool isBold = false, Color? color}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            title,
            style: TextStyle(
              fontSize: 12,
              fontWeight: isBold ? FontWeight.w800 : FontWeight.w500,
              color: color ?? AppColors.textDark,
            ),
          ),
          Text(
            amount,
            style: TextStyle(
              fontSize: 13,
              fontWeight: isBold ? FontWeight.w900 : FontWeight.w700,
              color: color ?? AppColors.textDark,
            ),
          ),
        ],
      ),
    );
  }
}
