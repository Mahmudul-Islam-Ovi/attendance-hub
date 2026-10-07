class MovementItem {
  final String id;
  final String userId;
  final String userName;
  final String employeeCode;
  final String date;
  final String outTime;
  final String returnTime;
  final String purpose;
  final String destination;
  final String? vehicle;
  final String status;
  final String createdAt;

  MovementItem({
    required this.id,
    required this.userId,
    required this.userName,
    required this.employeeCode,
    required this.date,
    required this.outTime,
    required this.returnTime,
    required this.purpose,
    required this.destination,
    this.vehicle,
    required this.status,
    required this.createdAt,
  });

  factory MovementItem.fromJson(Map<String, dynamic> json) {
    return MovementItem(
      id: json['id'] ?? '',
      userId: json['userId'] ?? '',
      userName: json['userName'] ?? '',
      employeeCode: json['employeeCode'] ?? '',
      date: json['date'] ?? '',
      outTime: json['outTime'] ?? '',
      returnTime: json['returnTime'] ?? '',
      purpose: json['purpose'] ?? '',
      destination: json['destination'] ?? '',
      vehicle: json['vehicle'],
      status: json['status'] ?? 'PENDING',
      createdAt: json['createdAt'] ?? '',
    );
  }
}

class ClaimItem {
  final String id;
  final String userId;
  final String userName;
  final String employeeCode;
  final String type; // TRAVEL, MEDICAL, EQUIPMENT, OTHER
  final double amount;
  final String? description;
  final String? attachmentUrl;
  final String status;
  final String createdAt;

  ClaimItem({
    required this.id,
    required this.userId,
    required this.userName,
    required this.employeeCode,
    required this.type,
    required this.amount,
    this.description,
    this.attachmentUrl,
    required this.status,
    required this.createdAt,
  });

  factory ClaimItem.fromJson(Map<String, dynamic> json) {
    String uName = '';
    String eCode = '';
    if (json['user'] is Map) {
      uName = json['user']['name'] ?? '';
      eCode = json['user']['employeeCode'] ?? '';
    } else {
      uName = json['userName'] ?? '';
      eCode = json['employeeCode'] ?? '';
    }

    return ClaimItem(
      id: json['id'] ?? '',
      userId: json['userId'] ?? '',
      userName: uName,
      employeeCode: eCode,
      type: json['type'] ?? 'OTHER',
      amount: (json['amount'] as num?)?.toDouble() ?? 0.0,
      description: json['description'],
      attachmentUrl: json['attachmentUrl'],
      status: json['status'] ?? 'PENDING',
      createdAt: json['createdAt'] ?? '',
    );
  }
}

class AdvanceSalaryItem {
  final String id;
  final String userId;
  final String userName;
  final String employeeCode;
  final double amount;
  final String requestedMonth;
  final String? reason;
  final int installments;
  final String status;
  final String createdAt;

  AdvanceSalaryItem({
    required this.id,
    required this.userId,
    required this.userName,
    required this.employeeCode,
    required this.amount,
    required this.requestedMonth,
    this.reason,
    required this.installments,
    required this.status,
    required this.createdAt,
  });

  factory AdvanceSalaryItem.fromJson(Map<String, dynamic> json) {
    return AdvanceSalaryItem(
      id: json['id'] ?? '',
      userId: json['userId'] ?? '',
      userName: json['userName'] ?? '',
      employeeCode: json['employeeCode'] ?? '',
      amount: (json['amount'] as num?)?.toDouble() ?? 0.0,
      requestedMonth: json['requestedMonth'] ?? '',
      reason: json['reason'],
      installments: (json['installments'] as num?)?.toInt() ?? 1,
      status: json['status'] ?? 'PENDING',
      createdAt: json['createdAt'] ?? '',
    );
  }
}

class ExtraWorkItem {
  final String id;
  final String userId;
  final String userName;
  final String employeeCode;
  final String date;
  final double hours;
  final String? reason;
  final String createdAt;

  ExtraWorkItem({
    required this.id,
    required this.userId,
    required this.userName,
    required this.employeeCode,
    required this.date,
    required this.hours,
    this.reason,
    required this.createdAt,
  });

  factory ExtraWorkItem.fromJson(Map<String, dynamic> json) {
    String uName = '';
    String eCode = '';
    if (json['user'] is Map) {
      uName = json['user']['name'] ?? '';
      eCode = json['user']['employeeCode'] ?? '';
    } else {
      uName = json['userName'] ?? '';
      eCode = json['employeeCode'] ?? '';
    }

    return ExtraWorkItem(
      id: json['id'] ?? '',
      userId: json['userId'] ?? '',
      userName: uName,
      employeeCode: eCode,
      date: json['date'] ?? '',
      hours: (json['hours'] as num?)?.toDouble() ?? 0.0,
      reason: json['reason'],
      createdAt: json['createdAt'] ?? '',
    );
  }
}

class ShiftItem {
  final String id;
  final String userId;
  final String userName;
  final String employeeCode;
  final String date;
  final String shiftName;
  final String startTime;
  final String endTime;
  final bool isWeekend;
  final String status;
  final String createdAt;

  ShiftItem({
    required this.id,
    required this.userId,
    required this.userName,
    required this.employeeCode,
    required this.date,
    required this.shiftName,
    required this.startTime,
    required this.endTime,
    required this.isWeekend,
    required this.status,
    required this.createdAt,
  });

  factory ShiftItem.fromJson(Map<String, dynamic> json) {
    return ShiftItem(
      id: json['id'] ?? '',
      userId: json['userId'] ?? '',
      userName: json['userName'] ?? '',
      employeeCode: json['employeeCode'] ?? '',
      date: json['date'] ?? '',
      shiftName: json['shiftName'] ?? 'Regular General',
      startTime: json['startTime'] ?? '09:00',
      endTime: json['endTime'] ?? '18:00',
      isWeekend: json['isWeekend'] == true,
      status: json['status'] ?? 'SCHEDULED',
      createdAt: json['createdAt'] ?? '',
    );
  }
}

class OvertimeItem {
  final String id;
  final String userId;
  final String userName;
  final String employeeCode;
  final String date;
  final double hours;
  final String? project;
  final String? reason;
  final String status;
  final String createdAt;

  OvertimeItem({
    required this.id,
    required this.userId,
    required this.userName,
    required this.employeeCode,
    required this.date,
    required this.hours,
    this.project,
    this.reason,
    required this.status,
    required this.createdAt,
  });

  factory OvertimeItem.fromJson(Map<String, dynamic> json) {
    return OvertimeItem(
      id: json['id'] ?? '',
      userId: json['userId'] ?? '',
      userName: json['userName'] ?? '',
      employeeCode: json['employeeCode'] ?? '',
      date: json['date'] ?? '',
      hours: (json['hours'] as num?)?.toDouble() ?? 0.0,
      project: json['project'],
      reason: json['reason'],
      status: json['status'] ?? 'PENDING',
      createdAt: json['createdAt'] ?? '',
    );
  }
}

class DocumentRequestItem {
  final String id;
  final String userId;
  final String userName;
  final String employeeCode;
  final String docType;
  final String? purpose;
  final String format; // DIGITAL, PRINTED
  final String? remarks;
  final String status;
  final String createdAt;

  DocumentRequestItem({
    required this.id,
    required this.userId,
    required this.userName,
    required this.employeeCode,
    required this.docType,
    this.purpose,
    required this.format,
    this.remarks,
    required this.status,
    required this.createdAt,
  });

  factory DocumentRequestItem.fromJson(Map<String, dynamic> json) {
    return DocumentRequestItem(
      id: json['id'] ?? '',
      userId: json['userId'] ?? '',
      userName: json['userName'] ?? '',
      employeeCode: json['employeeCode'] ?? '',
      docType: json['docType'] ?? 'Salary Certificate',
      purpose: json['purpose'],
      format: json['format'] ?? 'DIGITAL',
      remarks: json['remarks'],
      status: json['status'] ?? 'PENDING',
      createdAt: json['createdAt'] ?? '',
    );
  }
}

class AssetItem {
  final String id;
  final String userId;
  final String userName;
  final String employeeCode;
  final String assetName;
  final String category;
  final String? serialNumber;
  final String condition;
  final String assignedDate;
  final String status;
  final String? remarks;
  final String createdAt;

  AssetItem({
    required this.id,
    required this.userId,
    required this.userName,
    required this.employeeCode,
    required this.assetName,
    required this.category,
    this.serialNumber,
    required this.condition,
    required this.assignedDate,
    required this.status,
    this.remarks,
    required this.createdAt,
  });

  factory AssetItem.fromJson(Map<String, dynamic> json) {
    return AssetItem(
      id: json['id'] ?? '',
      userId: json['userId'] ?? '',
      userName: json['userName'] ?? '',
      employeeCode: json['employeeCode'] ?? '',
      assetName: json['assetName'] ?? '',
      category: json['category'] ?? 'Laptop / Computer',
      serialNumber: json['serialNumber'],
      condition: json['condition'] ?? 'GOOD',
      assignedDate: json['assignedDate'] ?? '',
      status: json['status'] ?? 'ASSIGNED',
      remarks: json['remarks'],
      createdAt: json['createdAt'] ?? '',
    );
  }
}
