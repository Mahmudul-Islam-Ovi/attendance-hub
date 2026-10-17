import '../constants/app_config.dart';

class UserModel {
  final String id;
  final String employeeCode;
  final String name;
  final String email;
  final String? phone;
  final String? avatarUrl;
  final String? designation;
  final String role;
  final String level;
  final String status;
  final String? departmentName;
  final String? departmentColor;
  final bool wfhAllowed;
  final String shiftStart;
  final String shiftEnd;
  final double basicSalary;
  final String? officeLocationId;
  final String? officeLocationName;
  final String? officeLocationAddress;
  final double? officeLocationLat;
  final double? officeLocationLng;
  final int? officeLocationRadius;

  UserModel({
    required this.id,
    required this.employeeCode,
    required this.name,
    required this.email,
    this.phone,
    this.avatarUrl,
    this.designation,
    required this.role,
    required this.level,
    required this.status,
    this.departmentName,
    this.departmentColor,
    this.wfhAllowed = false,
    this.shiftStart = '09:00',
    this.shiftEnd = '18:00',
    this.basicSalary = 0,
    this.officeLocationId,
    this.officeLocationName,
    this.officeLocationAddress,
    this.officeLocationLat,
    this.officeLocationLng,
    this.officeLocationRadius,
  });

  bool get isAdmin => [
        'SYSTEM_ADMIN',
        'CEO',
        'EXECUTIVE_DIRECTOR',
        'HR_ADMIN',
        'SUPER_ADMIN',
        'ADMIN',
        'HR',
      ].contains(role);

  bool get isManager => [
        'MANAGER',
        'DIRECTOR',
        'DEPT_HEAD',
        'TEAM_LEAD',
      ].contains(role);

  bool get canAddEmployee => isAdmin || role == 'HR_ADMIN';

  factory UserModel.fromJson(Map<String, dynamic> json) {
    String? deptName;
    String? deptCol;

    if (json['department'] is Map) {
      deptName = json['department']['name'];
      deptCol = json['department']['color'];
    } else if (json['department'] is String) {
      deptName = json['department'];
      deptCol = json['departmentColor'];
    }

    String? offId;
    String? offName;
    String? offAddr;
    double? offLat;
    double? offLng;
    int? offRad;

    if (json['officeLocation'] is Map) {
      offId = json['officeLocation']['id'];
      offName = json['officeLocation']['name'];
      offAddr = json['officeLocation']['address'];
      offLat = (json['officeLocation']['latitude'] as num?)?.toDouble();
      offLng = (json['officeLocation']['longitude'] as num?)?.toDouble();
      offRad = (json['officeLocation']['radiusMeters'] as num?)?.toInt();
    } else if (json['officeLocationName'] != null) {
      offId = json['officeLocationId'];
      offName = json['officeLocationName'];
      offAddr = json['officeLocationAddress'];
      offLat = (json['officeLocationLat'] as num?)?.toDouble();
      offLng = (json['officeLocationLng'] as num?)?.toDouble();
      offRad = (json['officeLocationRadius'] as num?)?.toInt();
    } else if (json['officeLocationId'] != null) {
      offId = json['officeLocationId'];
    }

    // Dynamic fallback to AppConfig active office
    offId ??= AppConfig.officeId;
    offName ??= AppConfig.officeName;
    offAddr ??= AppConfig.officeAddress;
    offLat ??= AppConfig.officeLat;
    offLng ??= AppConfig.officeLng;
    offRad ??= AppConfig.officeRadiusMeters.toInt();

    return UserModel(
      id: json['id'] ?? '',
      employeeCode: json['employeeCode'] ?? '',
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      phone: json['phone'],
      avatarUrl: json['avatarUrl'],
      designation: json['designation'],
      role: json['role'] ?? 'EMPLOYEE',
      level: json['level'] ?? 'EMPLOYEE',
      status: json['status'] ?? 'ACTIVE',
      departmentName: deptName,
      departmentColor: deptCol,
      wfhAllowed: json['wfhAllowed'] == true,
      shiftStart: json['shiftStart'] ?? '09:00',
      shiftEnd: json['shiftEnd'] ?? '18:00',
      basicSalary: (json['basicSalary'] as num?)?.toDouble() ?? 0.0,
      officeLocationId: offId,
      officeLocationName: offName,
      officeLocationAddress: offAddr,
      officeLocationLat: offLat,
      officeLocationLng: offLng,
      officeLocationRadius: offRad,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'employeeCode': employeeCode,
      'name': name,
      'email': email,
      'phone': phone,
      'avatarUrl': avatarUrl,
      'designation': designation,
      'role': role,
      'level': level,
      'status': status,
      'department': departmentName,
      'departmentColor': departmentColor,
      'wfhAllowed': wfhAllowed,
      'shiftStart': shiftStart,
      'shiftEnd': shiftEnd,
      'basicSalary': basicSalary,
      'officeLocationId': officeLocationId,
      'officeLocationName': officeLocationName,
      'officeLocationAddress': officeLocationAddress,
      'officeLocationLat': officeLocationLat,
      'officeLocationLng': officeLocationLng,
      'officeLocationRadius': officeLocationRadius,
    };
  }
}
