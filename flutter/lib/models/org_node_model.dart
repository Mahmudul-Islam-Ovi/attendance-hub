class OrgNodeModel {
  final String id;
  final String name;
  final String? position;
  final String level;
  final String? dept;
  final String? color;
  final String status;
  final List<OrgNodeModel> children;

  OrgNodeModel({
    required this.id,
    required this.name,
    this.position,
    required this.level,
    this.dept,
    this.color,
    this.status = 'ABSENT',
    this.children = const [],
  });

  factory OrgNodeModel.fromJson(Map<String, dynamic> json) {
    final rawChildren = json['children'];
    final List<OrgNodeModel> childList = [];
    if (rawChildren is List) {
      for (final c in rawChildren) {
        if (c is Map<String, dynamic>) {
          childList.add(OrgNodeModel.fromJson(c));
        }
      }
    }

    return OrgNodeModel(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      position: json['position'],
      level: json['level'] ?? 'EMPLOYEE',
      dept: json['dept'],
      color: json['color'] ?? '#6366f1',
      status: json['status'] ?? 'ABSENT',
      children: childList,
    );
  }
}
