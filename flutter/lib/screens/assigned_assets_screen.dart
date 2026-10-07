import 'package:flutter/material.dart';
import '../constants/app_colors.dart';
import '../models/workflow_models.dart';
import '../services/workflow_service.dart';
import '../widgets/glass_container.dart';
import '../widgets/status_badge.dart';

class AssignedAssetsScreen extends StatefulWidget {
  const AssignedAssetsScreen({super.key});

  @override
  State<AssignedAssetsScreen> createState() => _AssignedAssetsScreenState();
}

class _AssignedAssetsScreenState extends State<AssignedAssetsScreen> {
  final WorkflowService _service = WorkflowService();
  bool _isLoading = true;
  List<AssetItem> _items = [];
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    final data = await _service.fetchAssignedAssets();
    if (mounted) {
      setState(() {
        _items = data;
        _isLoading = false;
      });
    }
  }

  IconData _getCategoryIcon(String category) {
    final cat = category.toLowerCase();
    if (cat.contains('laptop') || cat.contains('computer')) {
      return Icons.laptop_mac;
    } else if (cat.contains('display') || cat.contains('monitor')) {
      return Icons.desktop_windows;
    } else if (cat.contains('phone') || cat.contains('mobile')) {
      return Icons.smartphone;
    }
    return Icons.devices;
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _items.where((a) {
      if (_searchQuery.isEmpty) return true;
      final q = _searchQuery.toLowerCase();
      final serial = a.serialNumber?.toLowerCase() ?? '';
      return a.assetName.toLowerCase().contains(q) ||
          serial.contains(q) ||
          a.userName.toLowerCase().contains(q) ||
          a.category.toLowerCase().contains(q);
    }).toList();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Assigned Assets', style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadData,
          ),
        ],
      ),
      body: Column(
        children: [
          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: TextField(
              onChanged: (val) => setState(() => _searchQuery = val),
              decoration: InputDecoration(
                hintText: 'Search by asset name, serial, or employee...',
                prefixIcon: const Icon(Icons.search, color: AppColors.textMuted),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppColors.border),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppColors.border),
                ),
                filled: true,
                fillColor: AppColors.slate50,
              ),
            ),
          ),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : RefreshIndicator(
                    onRefresh: _loadData,
                    child: filtered.isEmpty
                        ? const Center(
                            child: Text('No assets found', style: TextStyle(color: AppColors.textMuted)),
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: filtered.length,
                            itemBuilder: (context, index) {
                              final item = filtered[index];
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
                                              padding: const EdgeInsets.all(10),
                                              decoration: BoxDecoration(
                                                color: AppColors.primaryLight.withOpacity(0.15),
                                                borderRadius: BorderRadius.circular(12),
                                              ),
                                              child: Icon(
                                                _getCategoryIcon(item.category),
                                                color: AppColors.primary,
                                                size: 22,
                                              ),
                                            ),
                                            const SizedBox(width: 12),
                                            Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Text(
                                                  item.assetName,
                                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: AppColors.textDark),
                                                ),
                                                Text(
                                                  'SN: ${item.serialNumber ?? "N/A"}',
                                                  style: const TextStyle(fontSize: 12, color: AppColors.textMuted, fontFamily: 'monospace'),
                                                ),
                                              ],
                                            ),
                                          ],
                                        ),
                                        StatusBadge(status: item.condition),
                                      ],
                                    ),
                                    const SizedBox(height: 14),
                                    Container(
                                      padding: const EdgeInsets.all(10),
                                      decoration: BoxDecoration(
                                        color: AppColors.slate50,
                                        borderRadius: BorderRadius.circular(10),
                                        border: Border.all(color: AppColors.border),
                                      ),
                                      child: Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Row(
                                            children: [
                                              const Icon(Icons.person_outline, size: 16, color: AppColors.textMuted),
                                              const SizedBox(width: 6),
                                              Text(
                                                'Assigned to: ${item.userName}',
                                                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textDark),
                                              ),
                                            ],
                                          ),
                                          Text(
                                            item.assignedDate,
                                            style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            },
                          ),
                  ),
          ),
        ],
      ),
    );
  }
}
