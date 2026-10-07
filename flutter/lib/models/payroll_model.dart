class PayrollModel {
  final String id;
  final String month;
  final String employeeName;
  final String employeeCode;
  final String? designation;
  final String? departmentName;
  final String? departmentColor;

  final double basicSalary;
  final double houseRent;
  final double medicalAllowance;
  final double transportAllow;
  final double grossSalary;

  final int workingDays;
  final int presentDays;
  final int absentDays;
  final int leaveDays;
  final int lateDays;

  final double absentDeduction;
  final double lateDeduction;
  final double otherDeductions;
  final double overtimeBonus;
  final double festivalBonus;
  final double performanceBonus;
  final double otherBonus;
  final double advanceRecovery;

  final double totalAdditions;
  final double totalDeductions;
  final double netPayable;
  final String status;
  final String? paidAt;
  final String? notes;

  PayrollModel({
    required this.id,
    required this.month,
    required this.employeeName,
    required this.employeeCode,
    this.designation,
    this.departmentName,
    this.departmentColor,
    required this.basicSalary,
    required this.houseRent,
    required this.medicalAllowance,
    required this.transportAllow,
    required this.grossSalary,
    required this.workingDays,
    required this.presentDays,
    required this.absentDays,
    required this.leaveDays,
    required this.lateDays,
    required this.absentDeduction,
    required this.lateDeduction,
    required this.otherDeductions,
    required this.overtimeBonus,
    required this.festivalBonus,
    required this.performanceBonus,
    required this.otherBonus,
    required this.advanceRecovery,
    required this.totalAdditions,
    required this.totalDeductions,
    required this.netPayable,
    required this.status,
    this.paidAt,
    this.notes,
  });

  factory PayrollModel.fromJson(Map<String, dynamic> json) {
    String eName = '';
    String eCode = '';
    String? desig;
    String? dName;
    String? dColor;

    if (json['user'] is Map) {
      eName = json['user']['name'] ?? '';
      eCode = json['user']['employeeCode'] ?? '';
      desig = json['user']['designation'];
      if (json['user']['department'] is Map) {
        dName = json['user']['department']['name'];
        dColor = json['user']['department']['color'];
      }
    }

    return PayrollModel(
      id: json['id'] ?? '',
      month: json['month'] ?? '',
      employeeName: eName,
      employeeCode: eCode,
      designation: desig,
      departmentName: dName,
      departmentColor: dColor,
      basicSalary: (json['basicSalary'] as num?)?.toDouble() ?? 0.0,
      houseRent: (json['houseRent'] as num?)?.toDouble() ?? 0.0,
      medicalAllowance: (json['medicalAllowance'] as num?)?.toDouble() ?? 0.0,
      transportAllow: (json['transportAllow'] as num?)?.toDouble() ?? 0.0,
      grossSalary: (json['grossSalary'] as num?)?.toDouble() ?? 0.0,
      workingDays: (json['workingDays'] as num?)?.toInt() ?? 0,
      presentDays: (json['presentDays'] as num?)?.toInt() ?? 0,
      absentDays: (json['absentDays'] as num?)?.toInt() ?? 0,
      leaveDays: (json['leaveDays'] as num?)?.toInt() ?? 0,
      lateDays: (json['lateDays'] as num?)?.toInt() ?? 0,
      absentDeduction: (json['absentDeduction'] as num?)?.toDouble() ?? 0.0,
      lateDeduction: (json['lateDeduction'] as num?)?.toDouble() ?? 0.0,
      otherDeductions: (json['otherDeductions'] as num?)?.toDouble() ?? 0.0,
      overtimeBonus: (json['overtimeBonus'] as num?)?.toDouble() ?? 0.0,
      festivalBonus: (json['festivalBonus'] as num?)?.toDouble() ?? 0.0,
      performanceBonus: (json['performanceBonus'] as num?)?.toDouble() ?? 0.0,
      otherBonus: (json['otherBonus'] as num?)?.toDouble() ?? 0.0,
      advanceRecovery: (json['advanceRecovery'] as num?)?.toDouble() ?? 0.0,
      totalAdditions: (json['totalAdditions'] as num?)?.toDouble() ?? 0.0,
      totalDeductions: (json['totalDeductions'] as num?)?.toDouble() ?? 0.0,
      netPayable: (json['netPayable'] as num?)?.toDouble() ?? 0.0,
      status: json['status'] ?? 'DRAFT',
      paidAt: json['paidAt'],
      notes: json['notes'],
    );
  }
}
