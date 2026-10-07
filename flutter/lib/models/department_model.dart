class DepartmentModel {
  final String id;
  final String name;
  final String code;
  final String color;
  final int total;
  final int present;

  DepartmentModel({
    required this.id,
    required this.name,
    required this.code,
    this.color = '#6366f1',
    this.total = 0,
    this.present = 0,
  });

  factory DepartmentModel.fromJson(Map<String, dynamic> json) {
    return DepartmentModel(
      id: json['id'] ?? json['code'] ?? '',
      name: json['name'] ?? '',
      code: json['code'] ?? '',
      color: json['color'] ?? '#6366f1',
      total: (json['total'] as num?)?.toInt() ?? 0,
      present: (json['present'] as num?)?.toInt() ?? 0,
    );
  }
}
