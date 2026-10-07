import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../constants/app_colors.dart';
import '../models/workflow_models.dart';
import '../providers/auth_provider.dart';
import '../services/workflow_service.dart';
import '../widgets/glass_container.dart';
import '../widgets/status_badge.dart';

class DocumentRequestScreen extends StatefulWidget {
  const DocumentRequestScreen({super.key});

  @override
  State<DocumentRequestScreen> createState() => _DocumentRequestScreenState();
}

class _DocumentRequestScreenState extends State<DocumentRequestScreen> {
  final WorkflowService _service = WorkflowService();
  bool _isLoading = true;
  List<DocumentRequestItem> _items = [];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    final data = await _service.fetchDocumentRequests();
    if (mounted) {
      setState(() {
        _items = data;
        _isLoading = false;
      });
    }
  }

  void _showNewRequestDialog() {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    String docType = 'NOC / Experience Certificate';
    String format = 'DIGITAL';
    final purposeCtrl = TextEditingController();

    final docTypes = [
      'NOC / Experience Certificate',
      'Salary Certificate',
      'Bank Introduction Letter',
      'Embassy / Visa Letter',
    ];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(ctx).viewInsets.bottom,
          ),
          child: Container(
            padding: const EdgeInsets.all(24),
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
            ),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Request HR Document',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textDark,
                        ),
                      ),
                      IconButton(
                        onPressed: () => Navigator.pop(ctx),
                        icon: const Icon(Icons.close),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  const Text('Document Type', style: TextStyle(fontWeight: FontWeight.w600, color: AppColors.slate700)),
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                    decoration: BoxDecoration(
                      color: AppColors.slate50,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        value: docType,
                        isExpanded: true,
                        items: docTypes.map((t) => DropdownMenuItem(value: t, child: Text(t))).toList(),
                        onChanged: (val) {
                          if (val != null) {
                            setModalState(() => docType = val);
                          }
                        },
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Text('Purpose / Addressee', style: TextStyle(fontWeight: FontWeight.w600, color: AppColors.slate700)),
                  const SizedBox(height: 6),
                  TextField(
                    controller: purposeCtrl,
                    maxLines: 3,
                    decoration: InputDecoration(
                      hintText: 'e.g. Visa application to Embassy of Japan / Personal bank account opening...',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      filled: true,
                      fillColor: AppColors.slate50,
                    ),
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      onPressed: () async {
                        if (purposeCtrl.text.trim().isEmpty) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Please enter the purpose of this document')),
                          );
                          return;
                        }

                        final now = DateTime.now();
                        final user = auth.user;
                        final newItem = DocumentRequestItem(
                          id: 'doc-${now.millisecondsSinceEpoch}',
                          userId: user?.id ?? '1',
                          userName: user?.name ?? 'Employee',
                          employeeCode: user?.employeeCode ?? 'EMP-0001',
                          docType: docType,
                          purpose: purposeCtrl.text.trim(),
                          format: format,
                          status: 'PENDING',
                          createdAt: '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}',
                        );

                        await _service.submitDocumentRequest(newItem);
                        if (mounted) {
                          Navigator.pop(ctx);
                          _loadData();
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Document request submitted successfully')),
                          );
                        }
                      },
                      child: const Text('Submit Request', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Document Requests', style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadData,
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showNewRequestDialog,
        backgroundColor: AppColors.primary,
        icon: const Icon(Icons.add, color: Colors.white),
        label: const Text('New Request', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadData,
              child: _items.isEmpty
                  ? const Center(
                      child: Text('No document requests found', style: TextStyle(color: AppColors.textMuted)),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.fromLTRB(16, 16, 16, 90),
                      itemCount: _items.length,
                      itemBuilder: (context, index) {
                        final item = _items[index];
                        return GlassContainer(
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.all(16),
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
                                          color: AppColors.primaryLight.withOpacity(0.15),
                                          borderRadius: BorderRadius.circular(10),
                                        ),
                                        child: const Icon(Icons.description_outlined, color: AppColors.primary, size: 20),
                                      ),
                                      const SizedBox(width: 12),
                                      Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            item.docType,
                                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.textDark),
                                          ),
                                          Text(
                                            'Requested: ${item.createdAt}',
                                            style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                  StatusBadge(status: item.status),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Text(
                                'Applicant: ${item.userName} (${item.employeeCode})',
                                style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: AppColors.slate700),
                              ),
                              if (item.purpose != null && item.purpose!.isNotEmpty) ...[
                                const SizedBox(height: 4),
                                Text(
                                  'Purpose: ${item.purpose}',
                                  style: const TextStyle(fontSize: 13, color: AppColors.slate600),
                                ),
                              ],
                            ],
                          ),
                        );
                      },
                    ),
            ),
    );
  }
}
