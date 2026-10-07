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
  });

  bool get isAdmin => [
        'SYSTEM_ADMIN',
        'CEO',
        'EXECUTIVE_DIRECTOR',
        'HR_ADMIN',
        'SUPER_ADMIN',
        'ADMIN',
        'HR',
        'MANAGER',
      ].contains(role);

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
    };
  }
}
