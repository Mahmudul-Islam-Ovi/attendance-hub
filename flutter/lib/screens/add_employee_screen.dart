import 'package:flutter/material.dart';
import '../constants/app_colors.dart';
import '../models/department_model.dart';
import '../services/workflow_service.dart';
import '../widgets/glass_container.dart';

class AddEmployeeScreen extends StatefulWidget {
  const AddEmployeeScreen({super.key});

  @override
  State<AddEmployeeScreen> createState() => _AddEmployeeScreenState();
}

class _AddEmployeeScreenState extends State<AddEmployeeScreen> {
  final WorkflowService _workflow = WorkflowService();
  final _formKey = GlobalKey<FormState>();

  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _designationCtrl = TextEditingController();
  final _salaryCtrl = TextEditingController(text: '45000');
  final _houseRentCtrl = TextEditingController(text: '18000');
  final _medicalCtrl = TextEditingController(text: '4500');
  final _transportCtrl = TextEditingController(text: '3500');
  final _passwordCtrl = TextEditingController(text: 'Password@123');

  String _level = 'EMPLOYEE';
  String _role = 'EMPLOYEE';
  String? _departmentId;
  String? _managerId;
  bool _wfhAllowed = false;

  List<DepartmentModel> _departments = [];
  List<Map<String, dynamic>> _managers = [];
  bool _loading = false;
  bool _initialDataLoading = true;

  final List<String> _levels = [
    'EMPLOYEE',
    'OFFICER',
    'MANAGER',
    'LEAD',
    'HEAD',
    'DIRECTOR',
    'CXO',
  ];

  final List<String> _roles = [
    'EMPLOYEE',
    'MANAGER',
    'HR',
    'ADMIN',
    'HR_ADMIN',
    'CEO',
    'SYSTEM_ADMIN',
  ];

  @override
  void initState() {
    super.initState();
    _loadInitialData();
  }

  Future<void> _loadInitialData() async {
    final futures = await Future.wait([
      _workflow.getDepartments(),
      _workflow.getEmployeeListSimple(),
    ]);

    if (mounted) {
      setState(() {
        _departments = futures[0] as List<DepartmentModel>;
        _managers = futures[1] as List<Map<String, dynamic>>;
        if (_departments.isNotEmpty) {
          _departmentId = _departments.first.id;
        }
        _initialDataLoading = false;
      });
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _loading = true);

    final payload = {
      'name': _nameCtrl.text.trim(),
      'email': _emailCtrl.text.trim().toLowerCase(),
      'phone': _phoneCtrl.text.trim(),
      'designation': _designationCtrl.text.trim(),
      'level': _level,
      'role': _role,
      if (_departmentId != null) 'departmentId': _departmentId,
      if (_managerId != null && _managerId!.isNotEmpty) 'managerId': _managerId,
      'wfhAllowed': _wfhAllowed,
      'basicSalary': double.tryParse(_salaryCtrl.text.trim()) ?? 0,
      'houseRent': double.tryParse(_houseRentCtrl.text.trim()) ?? 0,
      'medicalAllowance': double.tryParse(_medicalCtrl.text.trim()) ?? 0,
      'transportAllow': double.tryParse(_transportCtrl.text.trim()) ?? 0,
      'password': _passwordCtrl.text.trim(),
    };

    final result = await _workflow.addEmployee(payload);

    if (mounted) {
      setState(() => _loading = false);
      if (result['ok'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Employee registered successfully!'),
            backgroundColor: AppColors.present,
          ),
        );
        Navigator.pop(context, true);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['error'] ?? 'Failed to register employee'),
            backgroundColor: AppColors.absent,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Add New Employee', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: _initialDataLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Section: Basic Info
                    GlassContainer(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Row(
                            children: [
                              Icon(Icons.person_outline, color: AppColors.primary, size: 20),
                              SizedBox(width: 8),
                              Text('Personal & Contact Info', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                            ],
                          ),
                          const Divider(height: 20),
                          TextFormField(
                            controller: _nameCtrl,
                            decoration: const InputDecoration(
                              labelText: 'Full Name *',
                              hintText: 'e.g. Asif Mahmud',
                            ),
                            validator: (v) => (v == null || v.trim().isEmpty) ? 'Name is required' : null,
                          ),
                          const SizedBox(height: 12),
                          TextFormField(
                            controller: _emailCtrl,
                            keyboardType: TextInputType.emailAddress,
                            decoration: const InputDecoration(
                              labelText: 'Email Address *',
                              hintText: 'asif@company.com',
                            ),
                            validator: (v) {
                              if (v == null || v.trim().isEmpty) return 'Email is required';
                              if (!v.contains('@')) return 'Enter a valid email';
                              return null;
                            },
                          ),
                          const SizedBox(height: 12),
                          TextFormField(
                            controller: _phoneCtrl,
                            keyboardType: TextInputType.phone,
                            decoration: const InputDecoration(
                              labelText: 'Phone Number',
                              hintText: '+880 1712 345678',
                            ),
                          ),
                          const SizedBox(height: 12),
                          TextFormField(
                            controller: _passwordCtrl,
                            obscureText: true,
                            decoration: const InputDecoration(
                              labelText: 'Initial Password *',
                              hintText: 'Default: Password@123',
                            ),
                            validator: (v) => (v == null || v.trim().isEmpty) ? 'Password is required' : null,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Section: Organizational Role
                    GlassContainer(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Row(
                            children: [
                              Icon(Icons.badge_outlined, color: AppColors.primary, size: 20),
                              SizedBox(width: 8),
                              Text('Role & Department', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                            ],
                          ),
                          const Divider(height: 20),
                          TextFormField(
                            controller: _designationCtrl,
                            decoration: const InputDecoration(
                              labelText: 'Designation / Job Title *',
                              hintText: 'e.g. SOC Analyst, Security Engineer',
                            ),
                            validator: (v) => (v == null || v.trim().isEmpty) ? 'Designation is required' : null,
                          ),
                          const SizedBox(height: 12),
                          DropdownButtonFormField<String>(
                            value: _departmentId,
                            decoration: const InputDecoration(labelText: 'Department *'),
                            items: _departments.map((d) {
                              return DropdownMenuItem(value: d.id, child: Text(d.name));
                            }).toList(),
                            onChanged: (v) => setState(() => _departmentId = v),
                            validator: (v) => v == null ? 'Please select a department' : null,
                          ),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              Expanded(
                                child: DropdownButtonFormField<String>(
                                  value: _level,
                                  decoration: const InputDecoration(labelText: 'Job Level'),
                                  items: _levels.map((l) => DropdownMenuItem(value: l, child: Text(l))).toList(),
                                  onChanged: (v) => setState(() => _level = v ?? 'EMPLOYEE'),
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: DropdownButtonFormField<String>(
                                  value: _role,
                                  decoration: const InputDecoration(labelText: 'System Role'),
                                  items: _roles.map((r) => DropdownMenuItem(value: r, child: Text(r))).toList(),
                                  onChanged: (v) => setState(() => _role = v ?? 'EMPLOYEE'),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          DropdownButtonFormField<String>(
                            value: _managerId,
                            decoration: const InputDecoration(labelText: 'Reporting Manager (Optional)'),
                            items: [
                              const DropdownMenuItem(value: '', child: Text('No Direct Manager (Top level)')),
                              ..._managers.map((m) {
                                return DropdownMenuItem(
                                  value: m['id'] as String,
                                  child: Text('${m['name']} (${m['employeeCode'] ?? ""})', overflow: TextOverflow.ellipsis),
                                );
                              }),
                            ],
                            onChanged: (v) => setState(() => _managerId = v),
                          ),
                          const SizedBox(height: 14),
                          SwitchListTile(
                            contentPadding: EdgeInsets.zero,
                            title: const Text('WFH Allowed', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                            subtitle: const Text('Can punch outside office coordinates', style: TextStyle(fontSize: 12, color: AppColors.textMuted)),
                            value: _wfhAllowed,
                            activeColor: AppColors.primary,
                            onChanged: (v) => setState(() => _wfhAllowed = v),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Section: Payroll Compensation
                    GlassContainer(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Row(
                            children: [
                              Icon(Icons.payments_outlined, color: AppColors.present, size: 20),
                              SizedBox(width: 8),
                              Text('Salary & Compensation (BDT ৳)', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                            ],
                          ),
                          const Divider(height: 20),
                          Row(
                            children: [
                              Expanded(
                                child: TextFormField(
                                  controller: _salaryCtrl,
                                  keyboardType: TextInputType.number,
                                  decoration: const InputDecoration(labelText: 'Basic Salary (৳)'),
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: TextFormField(
                                  controller: _houseRentCtrl,
                                  keyboardType: TextInputType.number,
                                  decoration: const InputDecoration(labelText: 'House Rent (৳)'),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              Expanded(
                                child: TextFormField(
                                  controller: _medicalCtrl,
                                  keyboardType: TextInputType.number,
                                  decoration: const InputDecoration(labelText: 'Medical Allowance (৳)'),
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: TextFormField(
                                  controller: _transportCtrl,
                                  keyboardType: TextInputType.number,
                                  decoration: const InputDecoration(labelText: 'Transport (৳)'),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Submit Button
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      onPressed: _loading ? null : _submit,
                      child: _loading
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                            )
                          : const Text('Create Employee Account', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    ),
                    const SizedBox(height: 30),
                  ],
                ),
              ),
            ),
    );
  }
}
