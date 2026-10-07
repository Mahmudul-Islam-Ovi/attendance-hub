import 'task_model.dart';

class EmployeeModel {
  final String id;
  final String name;
  final String email;
  final String? phone;
  final String employeeCode;
  final String? avatarUrl;
  final String? designation;
  final String level;
  final String? dept;
  final String? deptCode;
  final String? deptColor;
  final String? manager;
  final String status; // PRESENT, LATE, ABSENT, ON_LEAVE, WFH
  final String? checkIn;
  final String? checkOut;
  final String? source;
  final double? lat;
  final double? lng;
  final String? address;
  final LeaveInfo? leave;
  final String? backup;
  final List<TaskModel> tasks;

  EmployeeModel({
    required this.id,
    required this.name,
    required this.email,
    this.phone,
    required this.employeeCode,
    this.avatarUrl,
    this.designation,
    required this.level,
    this.dept,
    this.deptCode,
    this.deptColor,
    this.manager,
    required this.status,
    this.checkIn,
    this.checkOut,
    this.source,
    this.lat,
    this.lng,
    this.address,
    this.leave,
    this.backup,
    this.tasks = const [],
  });

  factory EmployeeModel.fromJson(Map<String, dynamic> json) {
    LeaveInfo? lInfo;
    if (json['leave'] is Map) {
      lInfo = LeaveInfo.fromJson(json['leave']);
    }

    final rawTasks = json['tasks'];
    final List<TaskModel> taskList = [];
    if (rawTasks is List) {
      for (final t in rawTasks) {
        if (t is Map<String, dynamic>) {
          taskList.add(TaskModel.fromJson(t));
        }
      }
    }

    return EmployeeModel(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      phone: json['phone'],
      employeeCode: json['employeeCode'] ?? '',
      avatarUrl: json['avatarUrl'],
      designation: json['designation'],
      level: json['level'] ?? 'EMPLOYEE',
      dept: json['dept'],
      deptCode: json['deptCode'],
      deptColor: json['deptColor'] ?? '#6366f1',
      manager: json['manager'],
      status: json['status'] ?? 'ABSENT',
      checkIn: json['checkIn'],
      checkOut: json['checkOut'],
      source: json['source'],
      lat: (json['lat'] as num?)?.toDouble(),
      lng: (json['lng'] as num?)?.toDouble(),
      address: json['address'],
      leave: lInfo,
      backup: json['backup'],
      tasks: taskList,
    );
  }
}

class LeaveInfo {
  final String start;
  final String end;
  final String type;

  LeaveInfo({
    required this.start,
    required this.end,
    required this.type,
  });

  factory LeaveInfo.fromJson(Map<String, dynamic> json) {
    return LeaveInfo(
      start: json['start'] ?? '',
      end: json['end'] ?? '',
      type: json['type'] ?? '',
    );
  }
}
