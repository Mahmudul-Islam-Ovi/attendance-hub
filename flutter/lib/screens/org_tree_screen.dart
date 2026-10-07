import 'package:flutter/material.dart';
import '../constants/app_colors.dart';
import '../models/org_node_model.dart';
import '../services/workflow_service.dart';
import '../widgets/employee_avatar.dart';
import '../widgets/glass_container.dart';
import '../widgets/status_badge.dart';

class OrgTreeScreen extends StatefulWidget {
  const OrgTreeScreen({super.key});

  @override
  State<OrgTreeScreen> createState() => _OrgTreeScreenState();
}

class _OrgTreeScreenState extends State<OrgTreeScreen> {
  final WorkflowService _workflow = WorkflowService();
  List<OrgNodeModel> _roots = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadTree();
  }

  Future<void> _loadTree() async {
    setState(() => _loading = true);
    final list = await _workflow.getOrgTree();
    if (mounted) {
      setState(() {
        _roots = list;
        _loading = false;
      });
    }
  }

  Widget _buildNode(OrgNodeModel node, int depth) {
    return Padding(
      padding: EdgeInsets.only(left: depth * 16.0, bottom: 8.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          GlassContainer(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            child: Row(
              children: [
                EmployeeAvatar(name: node.name, size: 36, colorHex: node.color),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(node.name, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800)),
                      Text('${node.position ?? ""} • ${node.dept ?? ""}',
                          style: const TextStyle(fontSize: 10, color: AppColors.textMuted)),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withOpacity(0.08),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(node.level, style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: AppColors.primary)),
                ),
                const SizedBox(width: 6),
                StatusBadge(status: node.status, fontSize: 10),
              ],
            ),
          ),
          if (node.children.isNotEmpty) ...[
            const SizedBox(height: 6),
            ...node.children.map((c) => _buildNode(c, depth + 1)),
          ],
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Organisation Tree', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900)),
          const Text('Multi-tier company hierarchy from CEO to employee levels.', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
          const SizedBox(height: 16),
          ..._roots.map((r) => _buildNode(r, 0)),
        ],
      ),
    );
  }
}
