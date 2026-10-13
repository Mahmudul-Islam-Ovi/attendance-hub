class OfficeLocationModel {
  final String id;
  final String name;
  final String address;
  final double latitude;
  final double longitude;
  final int radiusMeters;
  final bool isActive;
  final int employeeCount;
  final int punchCount;

  OfficeLocationModel({
    required this.id,
    required this.name,
    required this.address,
    required this.latitude,
    required this.longitude,
    required this.radiusMeters,
    required this.isActive,
    this.employeeCount = 0,
    this.punchCount = 0,
  });

  factory OfficeLocationModel.fromJson(Map<String, dynamic> json) {
    return OfficeLocationModel(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      address: json['address']?.toString() ?? '',
      latitude: (json['latitude'] as num?)?.toDouble() ?? 23.7330,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 90.4172,
      radiusMeters: (json['radiusMeters'] as num?)?.toInt() ?? 150,
      isActive: json['isActive'] ?? true,
      employeeCount: (json['employeeCount'] as num?)?.toInt() ?? 0,
      punchCount: (json['punchCount'] as num?)?.toInt() ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'address': address,
      'latitude': latitude,
      'longitude': longitude,
      'radiusMeters': radiusMeters,
      'isActive': isActive,
    };
  }
}
