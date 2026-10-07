import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../constants/app_colors.dart';
import '../models/workflow_models.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../services/workflow_service.dart';
import '../widgets/glass_container.dart';
import '../widgets/status_badge.dart';

class ClaimsScreen extends StatefulWidget {
  const ClaimsScreen({super.key});

  @override
  State<ClaimsScreen> createState() => _ClaimsScreenState();
}

class _ClaimsScreenState extends State<ClaimsScreen> {
  final WorkflowService _workflow = WorkflowService();
  final ApiService _api = ApiService();
  final ImagePicker _picker = ImagePicker();

  List<ClaimItem> _claims = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    final list = await _workflow.getClaims();
    if (mounted) {
      setState(() {
        _claims = list;
        _loading = false;
      });
    }
  }

  void _showNewClaimDialog() {
    final amountCtrl = TextEditingController();
    final descCtrl = TextEditingController();
    String type = 'TRAVEL';
    String? attachmentUrl;
    String? pickedFileName;
    bool isUploadingImage = false;

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
                    const Text('New Expense Claim', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                    IconButton(onPressed: () => Navigator.pop(ctx), icon: const Icon(Icons.close)),
                  ],
                ),
                const SizedBox(height: 14),
                DropdownButtonFormField<String>(
                  value: type,
                  decoration: const InputDecoration(labelText: 'Expense Category'),
                  items: const [
                    DropdownMenuItem(value: 'TRAVEL', child: Text('Travel / Conveyance')),
                    DropdownMenuItem(value: 'MEDICAL', child: Text('Medical / Health')),
                    DropdownMenuItem(value: 'EQUIPMENT', child: Text('Equipment & Hardware')),
                    DropdownMenuItem(value: 'OTHER', child: Text('Other / Miscellaneous')),
                  ],
                  onChanged: (v) => setModalState(() => type = v ?? 'TRAVEL'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: amountCtrl,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    labelText: 'Amount (BDT ৳) *',
                    hintText: 'e.g. 1500',
                    prefixText: '৳ ',
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: descCtrl,
                  maxLines: 2,
                  decoration: const InputDecoration(
                    labelText: 'Description / Remarks *',
                    hintText: 'Client visit fare, diagnostic test...',
                  ),
                ),
                const SizedBox(height: 12),

                // Receipt Attachment
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.slate100,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        attachmentUrl != null ? Icons.check_circle : Icons.receipt_outlined,
                        color: attachmentUrl != null ? AppColors.present : AppColors.primary,
                        size: 22,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          pickedFileName ?? 'Attach Bill / Receipt Photo (Optional)',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: attachmentUrl != null ? FontWeight.bold : FontWeight.normal,
                            color: attachmentUrl != null ? AppColors.textDark : AppColors.textMuted,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (isUploadingImage)
                        const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                      else
                        TextButton.icon(
                          icon: const Icon(Icons.camera_alt, size: 16),
                          label: Text(attachmentUrl != null ? 'Change' : 'Upload'),
                          onPressed: () async {
                            final image = await _picker.pickImage(source: ImageSource.gallery, imageQuality: 80);
                            if (image != null) {
                              setModalState(() {
                                isUploadingImage = true;
                                pickedFileName = image.name;
                              });
                              final bytes = await image.readAsBytes();
                              final uploadedUrl = await _api.uploadFile(bytes, image.name);
                              setModalState(() {
                                isUploadingImage = false;
                                attachmentUrl = uploadedUrl;
                              });
                            }
                          },
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                ElevatedButton(
                  onPressed: () async {
                    final amount = double.tryParse(amountCtrl.text.trim());
                    if (amount == null || descCtrl.text.trim().isEmpty) return;
                    final auth = Provider.of<AuthProvider>(context, listen: false);
                    final user = auth.user;
                    Navigator.pop(ctx);
                    await _workflow.createClaim({
                      'userId': user?.id ?? '1',
                      'type': type,
                      'amount': amount,
                      'description': descCtrl.text.trim(),
                      if (attachmentUrl != null) 'attachmentUrl': attachmentUrl,
                    });
                    _loadData();
                  },
                  child: const Text('Submit Claim Request'),
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

    final pendingTotal = _claims.where((c) => c.status == 'PENDING').fold<double>(0, (sum, c) => sum + c.amount);
    final approvedTotal = _claims.where((c) => c.status == 'APPROVED').fold<double>(0, (sum, c) => sum + c.amount);

    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        onPressed: _showNewClaimDialog,
        icon: const Icon(Icons.add),
        label: const Text('New Claim', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 80),
        child: Column(
          children: [
            // Stats
            Row(
              children: [
                Expanded(
                  child: GlassContainer(
                    padding: const EdgeInsets.all(12),
                    color: AppColors.leaveBg.withOpacity(0.4),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('৳${pendingTotal.toStringAsFixed(0)}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppColors.leaveText)),
                        const Text('Pending Review', style: TextStyle(fontSize: 11, color: AppColors.leaveText)),
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
                        Text('৳${approvedTotal.toStringAsFixed(0)}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppColors.presentText)),
                        const Text('Approved & Paid', style: TextStyle(fontSize: 11, color: AppColors.presentText)),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // List
            if (_claims.isEmpty)
              const Center(child: Padding(padding: EdgeInsets.all(32), child: Text('No claims submitted yet.')))
            else
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: _claims.length,
                separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder: (ctx, i) {
                  final c = _claims[i];
                  return GlassContainer(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('৳${c.amount.toStringAsFixed(0)}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppColors.primary)),
                            StatusBadge(status: c.status),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(c.type, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.textLight)),
                        const SizedBox(height: 6),
                        if (c.description != null)
                          Text(c.description!, style: const TextStyle(fontSize: 13, color: AppColors.textDark)),
                        if (c.status == 'PENDING') ...[
                          const SizedBox(height: 10),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: [
                              TextButton(
                                onPressed: () async {
                                  await _workflow.updateClaimStatus(c.id, 'REJECTED');
                                  _loadData();
                                },
                                child: const Text('Reject', style: TextStyle(color: AppColors.absent, fontSize: 11)),
                              ),
                              const SizedBox(width: 8),
                              ElevatedButton(
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppColors.present,
                                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                ),
                                onPressed: () async {
                                  await _workflow.updateClaimStatus(c.id, 'APPROVED');
                                  _loadData();
                                },
                                child: const Text('Approve Claim', style: TextStyle(fontSize: 11)),
                              ),
                            ],
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
