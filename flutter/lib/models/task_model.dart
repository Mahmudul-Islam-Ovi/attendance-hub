class TaskModel {
  final String id;
  final String title;
  final String? description;
  final String status; // TODO, IN_PROGRESS, IN_REVIEW, BLOCKED, DONE
  final String priority; // LOW, MEDIUM, HIGH, CRITICAL
  final int progress;
  final String? dueDate;
  final String? startedAt;
  final String? assigneeId;
  final String? assigneeName;
  final String? assigneeCode;
  final String? assigneeAvatar;
  final String? departmentId;
  final String? departmentName;
  final String? coveredBy;

  TaskModel({
    required this.id,
    required this.title,
    this.description,
    this.status = 'TODO',
    this.priority = 'MEDIUM',
    this.progress = 0,
    this.dueDate,
    this.startedAt,
    this.assigneeId,
    this.assigneeName,
    this.assigneeCode,
    this.assigneeAvatar,
    this.departmentId,
    this.departmentName,
    this.coveredBy,
  });

  bool get isOverdue {
    if (dueDate == null || status == 'DONE') return false;
    final due = DateTime.tryParse(dueDate!);
    return due != null && due.isBefore(DateTime.now());
  }

  factory TaskModel.fromJson(Map<String, dynamic> json) {
    String? aName;
    String? aCode;
    String? aAvatar;
    if (json['assignee'] is Map) {
      aName = json['assignee']['name'];
      aCode = json['assignee']['employeeCode'];
      aAvatar = json['assignee']['avatarUrl'];
    }

    String? dName;
    if (json['department'] is Map) {
      dName = json['department']['name'];
    }

    return TaskModel(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      description: json['description'],
      status: json['status'] ?? 'TODO',
      priority: json['priority'] ?? 'MEDIUM',
      progress: (json['progress'] as num?)?.toInt() ?? 0,
      dueDate: json['dueDate'],
      startedAt: json['startedAt'],
      assigneeId: json['assigneeId'],
      assigneeName: aName ?? json['assigneeName'],
      assigneeCode: aCode ?? json['assigneeCode'],
      assigneeAvatar: aAvatar,
      departmentId: json['departmentId'],
      departmentName: dName ?? json['departmentName'],
      coveredBy: json['coveredBy'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'status': status,
      'priority': priority,
      'progress': progress,
      'dueDate': dueDate,
      'startedAt': startedAt,
      'assigneeId': assigneeId,
      'departmentId': departmentId,
    };
  }
}
