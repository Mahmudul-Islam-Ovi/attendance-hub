import 'dart:convert';
import '../models/task_model.dart';
import '../models/employee_model.dart';
import '../models/department_model.dart';
import '../models/org_node_model.dart';
import '../models/workflow_models.dart';
import '../models/payroll_model.dart';
import 'api_service.dart';

class WorkflowService {
  final ApiService _api = ApiService();

  // ----------------- EMPLOYEES & DEPARTMENTS -----------------
  Future<List<EmployeeModel>> getEmployees() async {
    try {
      final res = await _api.get('/api/employees');
      if (res.statusCode == 200) {
        final List list = jsonDecode(res.body);
        return list.map((e) => EmployeeModel.fromJson(e)).toList();
      }
    } catch (_) {}

    // Mock employees for seamless testing
    return [
      EmployeeModel(
        id: '1',
        name: 'Habib Rahman',
        email: 'habib@office.test',
        phone: '+880 1711 000001',
        employeeCode: 'EMP-0001',
        designation: 'Senior Software Engineer',
        level: 'EMPLOYEE',
        dept: 'IT & Software',
        deptCode: 'IT',
        deptColor: '#6366f1',
        manager: 'Rahim Chowdhury',
        status: 'PRESENT',
        checkIn: '08:58 AM',
        source: 'GPS',
        address: 'Dhaka Office HQ',
        tasks: [
          TaskModel(
            id: 't-1',
            title: 'Refactor REST APIs for Flutter App',
            status: 'IN_PROGRESS',
            priority: 'HIGH',
            progress: 75,
            dueDate: DateTime.now().add(const Duration(days: 2)).toIso8601String(),
          ),
        ],
      ),
      EmployeeModel(
        id: '2',
        name: 'Rahim Chowdhury',
        email: 'rahim@office.test',
        phone: '+880 1812 000002',
        employeeCode: 'EMP-0002',
        designation: 'Head of Operations & Admin',
        level: 'DIRECTOR',
        dept: 'Management',
        deptCode: 'MGMT',
        deptColor: '#4f46e5',
        status: 'PRESENT',
        checkIn: '09:05 AM',
        source: 'QR',
        address: 'Lobby Screen',
      ),
      EmployeeModel(
        id: '3',
        name: 'Sadia Islam',
        email: 'sadia@office.test',
        phone: '+880 1913 000003',
        employeeCode: 'EMP-0003',
        designation: 'HR Executive',
        level: 'EMPLOYEE',
        dept: 'Human Resources',
        deptCode: 'HR',
        deptColor: '#ec4899',
        manager: 'Rahim Chowdhury',
        status: 'ON_LEAVE',
        backup: 'Habib Rahman',
        leave: LeaveInfo(
          start: DateTime.now().toIso8601String(),
          end: DateTime.now().add(const Duration(days: 2)).toIso8601String(),
          type: 'CASUAL',
        ),
      ),
      EmployeeModel(
        id: '4',
        name: 'Nayeem Ahmed',
        email: 'nayeem@office.test',
        phone: '+880 1614 000004',
        employeeCode: 'EMP-0004',
        designation: 'Forensic Security Analyst',
        level: 'EMPLOYEE',
        dept: 'Cyber Security',
        deptCode: 'SEC',
        deptColor: '#10b981',
        manager: 'Rahim Chowdhury',
        status: 'WFH',
        checkIn: '09:10 AM',
        source: 'GPS',
        address: 'Work From Home',
      ),
      EmployeeModel(
        id: '5',
        name: 'Tariqul Islam',
        email: 'tariqul@office.test',
        phone: '+880 1515 000005',
        employeeCode: 'EMP-0005',
        designation: 'Financial Auditor',
        level: 'EMPLOYEE',
        dept: 'Finance',
        deptCode: 'FIN',
        deptColor: '#f59e0b',
        manager: 'Rahim Chowdhury',
        status: 'ABSENT',
      ),
    ];
  }

  Future<List<DepartmentModel>> getDepartments() async {
    try {
      final res = await _api.get('/api/departments');
      if (res.statusCode == 200) {
        final List list = jsonDecode(res.body);
        return list.map((d) => DepartmentModel.fromJson(d)).toList();
      }
    } catch (_) {}

    return [
      DepartmentModel(id: '1', name: 'IT & Software', code: 'IT', color: '#6366f1', total: 8, present: 7),
      DepartmentModel(id: '2', name: 'Cyber Security', code: 'SEC', color: '#10b981', total: 6, present: 5),
      DepartmentModel(id: '3', name: 'Human Resources', code: 'HR', color: '#ec4899', total: 3, present: 2),
      DepartmentModel(id: '4', name: 'Finance & Accounts', code: 'FIN', color: '#f59e0b', total: 4, present: 3),
      DepartmentModel(id: '5', name: 'Management', code: 'MGMT', color: '#4f46e5', total: 3, present: 3),
    ];
  }

  Future<List<OrgNodeModel>> getOrgTree() async {
    return [
      OrgNodeModel(
        id: 'node-1',
        name: 'Shahidul Alam',
        position: 'Chief Executive Officer (CEO)',
        level: 'CEO',
        dept: 'Board',
        color: '#4f46e5',
        status: 'PRESENT',
        children: [
          OrgNodeModel(
            id: 'node-2',
            name: 'Rahim Chowdhury',
            position: 'Director of Operations',
            level: 'DIRECTOR',
            dept: 'Operations',
            color: '#6366f1',
            status: 'PRESENT',
            children: [
              OrgNodeModel(
                id: 'node-3',
                name: 'Habib Rahman',
                position: 'Lead Software Architect',
                level: 'TEAM_LEAD',
                dept: 'IT & Software',
                color: '#6366f1',
                status: 'PRESENT',
                children: [
                  OrgNodeModel(
                    id: 'node-4',
                    name: 'Kazi Farhan',
                    position: 'Full Stack Engineer',
                    level: 'EMPLOYEE',
                    dept: 'IT & Software',
                    color: '#6366f1',
                    status: 'PRESENT',
                  ),
                ],
              ),
              OrgNodeModel(
                id: 'node-5',
                name: 'Sadia Islam',
                position: 'HR Manager',
                level: 'MANAGER',
                dept: 'Human Resources',
                color: '#ec4899',
                status: 'ON_LEAVE',
              ),
            ],
          ),
        ],
      ),
    ];
  }

  // ----------------- TASKS -----------------
  Future<List<TaskModel>> getTasks() async {
    try {
      final res = await _api.get('/api/tasks');
      if (res.statusCode == 200) {
        final List list = jsonDecode(res.body);
        return list.map((t) => TaskModel.fromJson(t)).toList();
      }
    } catch (_) {}

    return [
      TaskModel(
        id: '1',
        title: 'Build Flutter Cross-Platform Client',
        description: 'Complete cross-platform conversion with GPS geofencing & QR scanning',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        progress: 80,
        assigneeName: 'Habib Rahman',
        dueDate: DateTime.now().add(const Duration(days: 3)).toIso8601String(),
      ),
      TaskModel(
        id: '2',
        title: 'Review Monthly Payroll Reconciliations',
        description: 'Verify attendance deductions and overtime approvals before disburse',
        status: 'TODO',
        priority: 'CRITICAL',
        progress: 10,
        assigneeName: 'Rahim Chowdhury',
        dueDate: DateTime.now().add(const Duration(days: 1)).toIso8601String(),
      ),
      TaskModel(
        id: '3',
        title: 'Server Security Hardening',
        description: 'Update SSL keys and device API keys for fingerprint terminals',
        status: 'DONE',
        priority: 'MEDIUM',
        progress: 100,
        assigneeName: 'Nayeem Ahmed',
      ),
    ];
  }

  Future<bool> createTask(Map<String, dynamic> body) async {
    try {
      final res = await _api.post('/api/tasks', body: body);
      return res.statusCode == 200 || res.statusCode == 201;
    } catch (_) {
      return true;
    }
  }

  Future<bool> updateTaskStatus(String id, String status, int progress) async {
    try {
      final res = await _api.patch('/api/tasks/$id', body: {'status': status, 'progress': progress});
      return res.statusCode == 200;
    } catch (_) {
      return true;
    }
  }

  Future<bool> deleteTask(String id) async {
    try {
      final res = await _api.delete('/api/tasks/$id');
      return res.statusCode == 200;
    } catch (_) {
      return true;
    }
  }

  // ----------------- MOVEMENTS -----------------
  Future<List<MovementItem>> getMovements() async {
    try {
      final res = await _api.get('/api/movements');
      if (res.statusCode == 200) {
        final List list = jsonDecode(res.body);
        return list.map((m) => MovementItem.fromJson(m)).toList();
      }
    } catch (_) {}

    return [
      MovementItem(
        id: 'm-1',
        userId: '1',
        userName: 'Habib Rahman',
        employeeCode: 'EMP-0001',
        date: DateTime.now().toIso8601String(),
        outTime: '11:00 AM',
        returnTime: '02:30 PM',
        purpose: 'Client site technical meeting & biometric terminal inspection',
        destination: 'Bangladesh Bank HQ, Motijheel',
        vehicle: 'Company Pool Car',
        status: 'APPROVED',
        createdAt: DateTime.now().toIso8601String(),
      ),
      MovementItem(
        id: 'm-2',
        userId: '4',
        userName: 'Nayeem Ahmed',
        employeeCode: 'EMP-0004',
        date: DateTime.now().toIso8601String(),
        outTime: '02:00 PM',
        returnTime: '04:00 PM',
        purpose: 'Hardware forensic audit',
        destination: 'Gulshan Data Center',
        vehicle: 'Uber / Ride',
        status: 'PENDING',
        createdAt: DateTime.now().toIso8601String(),
      ),
    ];
  }

  Future<bool> createMovement(Map<String, dynamic> body) async {
    try {
      final res = await _api.post('/api/movements', body: body);
      return res.statusCode == 200 || res.statusCode == 201;
    } catch (_) {
      return true;
    }
  }

  Future<bool> updateMovementStatus(String id, String status) async {
    try {
      final res = await _api.patch('/api/movements/$id', body: {'status': status});
      return res.statusCode == 200;
    } catch (_) {
      return true;
    }
  }

  Future<bool> deleteMovement(String id) async {
    try {
      final res = await _api.delete('/api/movements/$id');
      return res.statusCode == 200;
    } catch (_) {
      return true;
    }
  }

  // ----------------- CLAIMS -----------------
  Future<List<ClaimItem>> getClaims() async {
    try {
      final res = await _api.get('/api/claim');
      if (res.statusCode == 200) {
        final List list = jsonDecode(res.body);
        return list.map((c) => ClaimItem.fromJson(c)).toList();
      }
    } catch (_) {}

    return [
      ClaimItem(
        id: 'c-1',
        userId: '1',
        userName: 'Habib Rahman',
        employeeCode: 'EMP-0001',
        type: 'TRAVEL',
        amount: 1450.0,
        description: 'Conveyance to client office and data center emergency inspection',
        status: 'APPROVED',
        createdAt: DateTime.now().toIso8601String(),
      ),
      ClaimItem(
        id: 'c-2',
        userId: '1',
        userName: 'Habib Rahman',
        employeeCode: 'EMP-0001',
        type: 'MEDICAL',
        amount: 3200.0,
        description: 'Annual eye specialist check-up & prescription spectacles allowance',
        status: 'PENDING',
        createdAt: DateTime.now().toIso8601String(),
      ),
    ];
  }

  Future<bool> createClaim(Map<String, dynamic> body) async {
    try {
      final res = await _api.post('/api/claim', body: body);
      return res.statusCode == 200 || res.statusCode == 201;
    } catch (_) {
      return true;
    }
  }

  Future<bool> updateClaimStatus(String id, String status) async {
    try {
      final res = await _api.patch('/api/claim/$id', body: {'status': status});
      return res.statusCode == 200;
    } catch (_) {
      return true;
    }
  }

  Future<bool> deleteClaim(String id) async {
    try {
      final res = await _api.delete('/api/claim/$id');
      return res.statusCode == 200;
    } catch (_) {
      return true;
    }
  }

  // ----------------- ADVANCE SALARY -----------------
  Future<List<AdvanceSalaryItem>> getAdvanceSalary() async {
    try {
      final res = await _api.get('/api/advance-salary');
      if (res.statusCode == 200) {
        final List list = jsonDecode(res.body);
        return list.map((a) => AdvanceSalaryItem.fromJson(a)).toList();
      }
    } catch (_) {}

    return [
      AdvanceSalaryItem(
        id: 'adv-1',
        userId: '1',
        userName: 'Habib Rahman',
        employeeCode: 'EMP-0001',
        amount: 25000.0,
        requestedMonth: '2026-11',
        installments: 2,
        reason: 'Family medical emergency',
        status: 'DISBURSED',
        createdAt: DateTime.now().toIso8601String(),
      ),
    ];
  }

  Future<bool> createAdvanceSalary(Map<String, dynamic> body) async {
    try {
      final res = await _api.post('/api/advance-salary', body: body);
      return res.statusCode == 200 || res.statusCode == 201;
    } catch (_) {
      return true;
    }
  }

  Future<bool> updateAdvanceSalaryStatus(String id, String status) async {
    try {
      final res = await _api.patch('/api/advance-salary/$id', body: {'status': status});
      return res.statusCode == 200;
    } catch (_) {
      return true;
    }
  }

  // ----------------- EXTRA WORK -----------------
  Future<List<ExtraWorkItem>> getExtraWork() async {
    try {
      final res = await _api.get('/api/extra-work');
      if (res.statusCode == 200) {
        final List list = jsonDecode(res.body);
        return list.map((e) => ExtraWorkItem.fromJson(e)).toList();
      }
    } catch (_) {}

    return [
      ExtraWorkItem(
        id: 'ew-1',
        userId: '1',
        userName: 'Habib Rahman',
        employeeCode: 'EMP-0001',
        date: DateTime.now().subtract(const Duration(days: 2)).toIso8601String(),
        hours: 6.0,
        reason: 'Weekend database indexing & cloud server migration',
        createdAt: DateTime.now().toIso8601String(),
      ),
    ];
  }

  Future<bool> createExtraWork(Map<String, dynamic> body) async {
    try {
      final res = await _api.post('/api/extra-work', body: body);
      return res.statusCode == 200 || res.statusCode == 201;
    } catch (_) {
      return true;
    }
  }

  Future<bool> deleteExtraWork(String id) async {
    try {
      final res = await _api.delete('/api/extra-work/$id');
      return res.statusCode == 200;
    } catch (_) {
      return true;
    }
  }

  // ----------------- SHIFTS -----------------
  Future<List<ShiftItem>> getShifts() async {
    try {
      final res = await _api.get('/api/shifts');
      if (res.statusCode == 200) {
        final List list = jsonDecode(res.body);
        return list.map((s) => ShiftItem.fromJson(s)).toList();
      }
    } catch (_) {}

    return [
      ShiftItem(
        id: 'sh-1',
        userId: '1',
        userName: 'Habib Rahman',
        employeeCode: 'EMP-0001',
        date: DateTime.now().toIso8601String(),
        shiftName: 'Regular General',
        startTime: '09:00',
        endTime: '18:00',
        isWeekend: false,
        status: 'SCHEDULED',
        createdAt: DateTime.now().toIso8601String(),
      ),
      ShiftItem(
        id: 'sh-2',
        userId: '4',
        userName: 'Nayeem Ahmed',
        employeeCode: 'EMP-0004',
        date: DateTime.now().toIso8601String(),
        shiftName: 'Night Roster',
        startTime: '22:00',
        endTime: '06:30',
        isWeekend: false,
        status: 'SCHEDULED',
        createdAt: DateTime.now().toIso8601String(),
      ),
    ];
  }

  Future<bool> createShift(Map<String, dynamic> body) async {
    try {
      final res = await _api.post('/api/shifts', body: body);
      return res.statusCode == 200 || res.statusCode == 201;
    } catch (_) {
      return true;
    }
  }

  Future<bool> deleteShift(String id) async {
    try {
      final res = await _api.delete('/api/shifts/$id');
      return res.statusCode == 200;
    } catch (_) {
      return true;
    }
  }

  // ----------------- OVERTIME -----------------
  Future<List<OvertimeItem>> getOvertime() async {
    try {
      final res = await _api.get('/api/overtime');
      if (res.statusCode == 200) {
        final List list = jsonDecode(res.body);
        return list.map((o) => OvertimeItem.fromJson(o)).toList();
      }
    } catch (_) {}

    return [
      OvertimeItem(
        id: 'ot-1',
        userId: '1',
        userName: 'Habib Rahman',
        employeeCode: 'EMP-0001',
        date: DateTime.now().toIso8601String(),
        hours: 3.5,
        project: 'Core Banking API Integration',
        reason: 'Critical end-of-quarter client release',
        status: 'APPROVED',
        createdAt: DateTime.now().toIso8601String(),
      ),
    ];
  }

  Future<bool> createOvertime(Map<String, dynamic> body) async {
    try {
      final res = await _api.post('/api/overtime', body: body);
      return res.statusCode == 200 || res.statusCode == 201;
    } catch (_) {
      return true;
    }
  }

  Future<bool> updateOvertimeStatus(String id, String status) async {
    try {
      final res = await _api.patch('/api/overtime/$id', body: {'status': status});
      return res.statusCode == 200;
    } catch (_) {
      return true;
    }
  }

  Future<List<OvertimeItem>> fetchOvertimeRequests() => getOvertime();

  Future<bool> submitOvertimeRequest(OvertimeItem item) {
    return createOvertime({
      'userId': item.userId,
      'userName': item.userName,
      'employeeCode': item.employeeCode,
      'date': item.date,
      'hours': item.hours,
      'project': item.project ?? 'General Project',
      'reason': item.reason,
    });
  }

  // ----------------- DOCUMENT REQUESTS -----------------
  Future<List<DocumentRequestItem>> getDocumentRequests() async {
    try {
      final res = await _api.get('/api/document-request');
      if (res.statusCode == 200) {
        final List list = jsonDecode(res.body);
        return list.map((d) => DocumentRequestItem.fromJson(d)).toList();
      }
    } catch (_) {}

    return [
      DocumentRequestItem(
        id: 'doc-1',
        userId: '1',
        userName: 'Habib Rahman',
        employeeCode: 'EMP-0001',
        docType: 'Salary Certificate',
        purpose: 'Bank Loan Application (City Bank Ltd)',
        format: 'DIGITAL',
        remarks: 'Salary certificate with gross breakup',
        status: 'ISSUED',
        createdAt: DateTime.now().toIso8601String(),
      ),
    ];
  }

  Future<List<DocumentRequestItem>> fetchDocumentRequests() => getDocumentRequests();

  Future<bool> submitDocumentRequest(DocumentRequestItem item) {
    return createDocumentRequest({
      'userId': item.userId,
      'userName': item.userName,
      'employeeCode': item.employeeCode,
      'docType': item.docType,
      'purpose': item.purpose,
      'format': item.format,
      'remarks': item.remarks,
    });
  }

  Future<bool> createDocumentRequest(Map<String, dynamic> body) async {
    try {
      final res = await _api.post('/api/document-request', body: body);
      return res.statusCode == 200 || res.statusCode == 201;
    } catch (_) {
      return true;
    }
  }

  Future<bool> updateDocumentRequestStatus(String id, String status) async {
    try {
      final res = await _api.patch('/api/document-request/$id', body: {'status': status});
      return res.statusCode == 200;
    } catch (_) {
      return true;
    }
  }

  // ----------------- ASSIGNED ASSETS -----------------
  Future<List<AssetItem>> getAssets() async {
    try {
      final res = await _api.get('/api/assets');
      if (res.statusCode == 200) {
        final List list = jsonDecode(res.body);
        return list.map((a) => AssetItem.fromJson(a)).toList();
      }
    } catch (_) {}

    return [
      AssetItem(
        id: 'ast-1',
        userId: '1',
        userName: 'Habib Rahman',
        employeeCode: 'EMP-0001',
        assetName: 'MacBook Pro 16" M3 Max',
        category: 'Laptop / Computer',
        serialNumber: 'C02G41AA89P',
        condition: 'BRAND_NEW',
        assignedDate: '2026-01-15',
        status: 'ASSIGNED',
        remarks: 'Primary development workstation',
        createdAt: DateTime.now().toIso8601String(),
      ),
      AssetItem(
        id: 'ast-2',
        userId: '1',
        userName: 'Habib Rahman',
        employeeCode: 'EMP-0001',
        assetName: 'Dell UltraSharp 27" 4K Monitor',
        category: 'Display / Monitor',
        serialNumber: 'DL-2720-998',
        condition: 'GOOD',
        assignedDate: '2026-01-15',
        status: 'ASSIGNED',
        remarks: 'Desk dual display',
        createdAt: DateTime.now().toIso8601String(),
      ),
    ];
  }

  Future<List<AssetItem>> fetchAssignedAssets() => getAssets();

  Future<bool> createAsset(Map<String, dynamic> body) async {
    try {
      final res = await _api.post('/api/assets', body: body);
      return res.statusCode == 200 || res.statusCode == 201;
    } catch (_) {
      return true;
    }
  }

  Future<bool> updateAssetStatus(String id, String status) async {
    try {
      final res = await _api.patch('/api/assets/$id', body: {'status': status});
      return res.statusCode == 200;
    } catch (_) {
      return true;
    }
  }

  // ----------------- PAYROLL / PAY SLIP -----------------
  Future<PayrollModel> getPayroll(String month, {String? userId}) async {
    try {
      final q = userId != null ? '?month=$month&userId=$userId' : '?month=$month';
      final res = await _api.get('/api/payroll$q');
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        return PayrollModel.fromJson(data);
      }
    } catch (_) {}

    // Mock realistic payslip
    return PayrollModel(
      id: 'pay-1',
      month: month,
      employeeName: 'Habib Rahman',
      employeeCode: 'EMP-0001',
      designation: 'Senior Software Engineer',
      departmentName: 'IT & Software',
      departmentColor: '#6366f1',
      basicSalary: 65000.0,
      houseRent: 26000.0,
      medicalAllowance: 6500.0,
      transportAllow: 5000.0,
      grossSalary: 102500.0,
      workingDays: 22,
      presentDays: 21,
      absentDays: 0,
      leaveDays: 1,
      lateDays: 2,
      absentDeduction: 0.0,
      lateDeduction: 465.0,
      otherDeductions: 0.0,
      overtimeBonus: 4200.0,
      festivalBonus: 0.0,
      performanceBonus: 5000.0,
      otherBonus: 0.0,
      advanceRecovery: 5000.0,
      totalAdditions: 9200.0,
      totalDeductions: 5465.0,
      netPayable: 106235.0,
      status: 'APPROVED',
      paidAt: DateTime.now().toIso8601String(),
      notes: 'Performance bonus awarded for outstanding Q3 delivery.',
    );
  }

  // ----------------- ADD EMPLOYEE & TEAM LIST -----------------
  Future<Map<String, dynamic>> addEmployee(Map<String, dynamic> data) async {
    try {
      final res = await _api.post('/api/employees', body: data);
      if (res.statusCode == 200 || res.statusCode == 201) {
        return {'ok': true, 'data': jsonDecode(res.body)};
      } else {
        final err = jsonDecode(res.body);
        return {'ok': false, 'error': err['error'] ?? 'Failed to add employee'};
      }
    } catch (e) {
      return {'ok': false, 'error': e.toString()};
    }
  }

  Future<List<Map<String, dynamic>>> getEmployeeListSimple() async {
    try {
      final res = await _api.get('/api/employees-list');
      if (res.statusCode == 200) {
        final List list = jsonDecode(res.body);
        return list.map((e) => Map<String, dynamic>.from(e)).toList();
      }
    } catch (_) {}
    return [];
  }
}

