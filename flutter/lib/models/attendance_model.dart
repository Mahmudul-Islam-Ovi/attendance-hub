class PunchResult {
  final bool ok;
  final String? action;
  final String? status;
  final String message;
  final String? error;
  final bool isPendingApproval;
  final bool hasPunchedIn;
  final bool hasPunchedOut;
  final bool isDoneForDay;
  final String? checkInAt;
  final String? checkOutAt;
  final String? checkInAddress;
  final String? checkOutAddress;

  PunchResult({
    required this.ok,
    this.action,
    this.status,
    required this.message,
    this.error,
    this.isPendingApproval = false,
    this.hasPunchedIn = false,
    this.hasPunchedOut = false,
    this.isDoneForDay = false,
    this.checkInAt,
    this.checkOutAt,
    this.checkInAddress,
    this.checkOutAddress,
  });

  factory PunchResult.fromJson(Map<String, dynamic> json) {
    return PunchResult(
      ok: json['ok'] == true,
      action: json['action'],
      status: json['status'],
      message: json['message'] ?? json['error'] ?? '',
      error: json['error'],
      isPendingApproval: json['isPendingApproval'] == true || json['status'] == 'PENDING_APPROVAL',
      hasPunchedIn: json['hasPunchedIn'] == true || json['action'] == 'CHECK_IN',
      hasPunchedOut: json['hasPunchedOut'] == true || json['action'] == 'CHECK_OUT',
      isDoneForDay: json['isDoneForDay'] == true,
      checkInAt: json['checkInAt'],
      checkOutAt: json['checkOutAt'],
      checkInAddress: json['checkInAddress'],
      checkOutAddress: json['checkOutAddress'],
    );
  }
}

class AttendanceLog {
  final String id;
  final String userId;
  final String? userName;
  final String? employeeCode;
  final String? departmentName;
  final String workDate;
  final String status;
  final String? checkInAt;
  final String? checkInSource;
  final double? checkInLat;
  final double? checkInLng;
  final String? checkInAddress;
  final String? checkOutAt;
  final String? checkOutSource;
  final int workedMinutes;
  final int lateMinutes;
  final bool isWfh;
  final String? note;
  final double? distanceFromOfficeM;

  AttendanceLog({
    required this.id,
    required this.userId,
    this.userName,
    this.employeeCode,
    this.departmentName,
    required this.workDate,
    required this.status,
    this.checkInAt,
    this.checkInSource,
    this.checkInLat,
    this.checkInLng,
    this.checkInAddress,
    this.checkOutAt,
    this.checkOutSource,
    this.workedMinutes = 0,
    this.lateMinutes = 0,
    this.isWfh = false,
    this.note,
    this.distanceFromOfficeM,
  });

  factory AttendanceLog.fromJson(Map<String, dynamic> json) {
    String? uName;
    String? eCode;
    String? dName;
    if (json['user'] is Map) {
      uName = json['user']['name'];
      eCode = json['user']['employeeCode'];
      if (json['user']['department'] is Map) {
        dName = json['user']['department']['name'];
      }
    }

    return AttendanceLog(
      id: json['id'] ?? '',
      userId: json['userId'] ?? '',
      userName: uName ?? json['userName'],
      employeeCode: eCode ?? json['employeeCode'],
      departmentName: dName,
      workDate: json['workDate'] ?? '',
      status: json['status'] ?? 'PRESENT',
      checkInAt: json['checkInAt'],
      checkInSource: json['checkInSource'],
      checkInLat: (json['checkInLat'] as num?)?.toDouble(),
      checkInLng: (json['checkInLng'] as num?)?.toDouble(),
      checkInAddress: json['checkInAddress'],
      checkOutAt: json['checkOutAt'],
      checkOutSource: json['checkOutSource'],
      workedMinutes: (json['workedMinutes'] as num?)?.toInt() ?? 0,
      lateMinutes: (json['lateMinutes'] as num?)?.toInt() ?? 0,
      isWfh: json['isWfh'] == true,
      note: json['note'],
      distanceFromOfficeM: (json['distanceFromOfficeM'] as num?)?.toDouble(),
    );
  }
}

class MonthlyAttendanceDay {
  final String date;
  final int day;
  final int dayOfWeek;
  final bool isWeekend;
  final String status;
  final String? checkInAt;
  final String? checkInSource;
  final String? checkOutAt;
  final String? checkOutSource;
  final int workedMinutes;
  final int lateMinutes;
  final String? note;

  MonthlyAttendanceDay({
    required this.date,
    required this.day,
    required this.dayOfWeek,
    required this.isWeekend,
    required this.status,
    this.checkInAt,
    this.checkInSource,
    this.checkOutAt,
    this.checkOutSource,
    this.workedMinutes = 0,
    this.lateMinutes = 0,
    this.note,
  });

  factory MonthlyAttendanceDay.fromJson(Map<String, dynamic> json) {
    return MonthlyAttendanceDay(
      date: json['date'] ?? '',
      day: (json['day'] as num?)?.toInt() ?? 1,
      dayOfWeek: (json['dayOfWeek'] as num?)?.toInt() ?? 0,
      isWeekend: json['isWeekend'] == true,
      status: json['status'] ?? 'ABSENT',
      checkInAt: json['checkInAt'],
      checkInSource: json['checkInSource'],
      checkOutAt: json['checkOutAt'],
      checkOutSource: json['checkOutSource'],
      workedMinutes: (json['workedMinutes'] as num?)?.toInt() ?? 0,
      lateMinutes: (json['lateMinutes'] as num?)?.toInt() ?? 0,
      note: json['note'],
    );
  }
}

class MonthlyAttendanceSummary {
  final int totalDays;
  final int workingDays;
  final int presentCount;
  final int lateCount;
  final int absentCount;
  final int wfhCount;
  final int leaveCount;
  final int weekendCount;
  final String totalWorkedHours;
  final int presenceRate;

  MonthlyAttendanceSummary({
    this.totalDays = 0,
    this.workingDays = 0,
    this.presentCount = 0,
    this.lateCount = 0,
    this.absentCount = 0,
    this.wfhCount = 0,
    this.leaveCount = 0,
    this.weekendCount = 0,
    this.totalWorkedHours = '0.0',
    this.presenceRate = 0,
  });

  factory MonthlyAttendanceSummary.fromJson(Map<String, dynamic> json) {
    return MonthlyAttendanceSummary(
      totalDays: (json['totalDays'] as num?)?.toInt() ?? 0,
      workingDays: (json['workingDays'] as num?)?.toInt() ?? 0,
      presentCount: (json['presentCount'] as num?)?.toInt() ?? 0,
      lateCount: (json['lateCount'] as num?)?.toInt() ?? 0,
      absentCount: (json['absentCount'] as num?)?.toInt() ?? 0,
      wfhCount: (json['wfhCount'] as num?)?.toInt() ?? 0,
      leaveCount: (json['leaveCount'] as num?)?.toInt() ?? 0,
      weekendCount: (json['weekendCount'] as num?)?.toInt() ?? 0,
      totalWorkedHours: json['totalWorkedHours']?.toString() ?? '0.0',
      presenceRate: (json['presenceRate'] as num?)?.toInt() ?? 0,
    );
  }
}

class DashboardMetrics {
  final int total;
  final int present;
  final int onLeave;
  final int absent;
  final int wfh;
  final int available;
  final int late;
  final int rate;

  DashboardMetrics({
    this.total = 0,
    this.present = 0,
    this.onLeave = 0,
    this.absent = 0,
    this.wfh = 0,
    this.available = 0,
    this.late = 0,
    this.rate = 0,
  });

  factory DashboardMetrics.fromJson(Map<String, dynamic> json) {
    final t = (json['total'] as num?)?.toInt() ?? 0;
    final p = (json['present'] as num?)?.toInt() ?? 0;
    final w = (json['wfh'] as num?)?.toInt() ?? 0;
    final r = t > 0 ? (((p + w) / t) * 100).round() : 0;

    return DashboardMetrics(
      total: t,
      present: p,
      onLeave: (json['onLeave'] as num?)?.toInt() ?? 0,
      absent: (json['absent'] as num?)?.toInt() ?? 0,
      wfh: w,
      available: (json['available'] as num?)?.toInt() ?? 0,
      late: (json['late'] as num?)?.toInt() ?? 0,
      rate: r,
    );
  }
}
