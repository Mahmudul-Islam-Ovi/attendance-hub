import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../constants/app_colors.dart';
import '../providers/auth_provider.dart';
import '../widgets/app_drawer.dart';

// Screens
import 'dashboard_screen.dart';
import 'attendance_punch_screen.dart';
import 'employee_directory_screen.dart';
import 'departments_screen.dart';
import 'org_tree_screen.dart';
import 'tasks_screen.dart';
import 'assigned_assets_screen.dart';
import 'movements_screen.dart';
import 'claims_screen.dart';
import 'advance_salary_screen.dart';
import 'extra_work_screen.dart';
import 'shifts_screen.dart';
import 'overtime_screen.dart';
import 'document_request_screen.dart';
import 'payroll_screen.dart';
import 'attendance_reconciliation_screen.dart';
import 'monthly_attendance_screen.dart';
import 'job_card_screen.dart';
import 'claim_report_screen.dart';
import 'qr_lobby_screen.dart';
import 'profile_screen.dart';

class MainNavigationScreen extends StatefulWidget {
  final int? initialIndex;
  const MainNavigationScreen({super.key, this.initialIndex});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  late int _currentScreenIndex;
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  @override
  void initState() {
    super.initState();
    if (widget.initialIndex != null) {
      _currentScreenIndex = widget.initialIndex!;
    } else {
      final auth = Provider.of<AuthProvider>(context, listen: false);
      // Employees land directly on Punch screen (index 1), Admins on Dashboard (index 0)
      _currentScreenIndex = auth.isAdmin ? 0 : 1;
    }
  }

  void _onSelectDrawerScreen(int index) {
    Navigator.of(context).pop(); // Close drawer
    setState(() {
      _currentScreenIndex = index;
    });
  }

  // Convert current screen index to bottom navigation bar index (0 to 4)
  int _getBottomNavIndex() {
    switch (_currentScreenIndex) {
      case 0:
        return 0; // Dashboard
      case 5:
        return 1; // Tasks (Swapped to position 1)
      case 1:
        return 2; // Punch (Swapped to prominent Center position 2)
      case 2:
        return 3; // People / Directory
      case 20:
        return 4; // Profile
      default:
        return -1; // Other screen opened via drawer
    }
  }

  void _onBottomNavTapped(int index) {
    setState(() {
      switch (index) {
        case 0:
          _currentScreenIndex = 0; // Dashboard
          break;
        case 1:
          _currentScreenIndex = 5; // Tasks (Moved where Punch was)
          break;
        case 2:
          _currentScreenIndex = 1; // Punch (Moved to Center)
          break;
        case 3:
          _currentScreenIndex = 2; // Directory
          break;
        case 4:
          _currentScreenIndex = 20; // Profile
          break;
      }
    });
  }

  List<Widget> _buildScreens() {
    return [
      DashboardScreen(
        onNavigate: (idx) {
          setState(() {
            _currentScreenIndex = idx;
          });
        },
      ), // 0
      const AttendancePunchScreen(), // 1
      const EmployeeDirectoryScreen(), // 2
      const DepartmentsScreen(), // 3
      const OrgTreeScreen(), // 4
      const TasksScreen(), // 5
      const AssignedAssetsScreen(), // 6
      const MovementsScreen(), // 7
      const ClaimsScreen(), // 8
      const AdvanceSalaryScreen(), // 9
      const ExtraWorkScreen(), // 10
      const ShiftsScreen(), // 11
      const OvertimeScreen(), // 12
      const DocumentRequestScreen(), // 13
      const PayrollScreen(), // 14
      const AttendanceReconciliationScreen(), // 15 (Reconciliation)
      const MonthlyAttendanceScreen(), // 16 (Monthly attendance - personal & team)
      const JobCardScreen(), // 17 (Job Card - personal & subordinate)
      const ClaimReportScreen(), // 18 (Claim Report & summary)
      const QrLobbyScreen(), // 19
      const ProfileScreen(), // 20
    ];
  }

  @override
  Widget build(BuildContext context) {
    final bottomNavIndex = _getBottomNavIndex();
    final screens = _buildScreens();

    return Scaffold(
      key: _scaffoldKey,
      drawer: AppDrawer(
        currentIndex: _currentScreenIndex,
        onSelectScreen: _onSelectDrawerScreen,
      ),
      body: IndexedStack(
        index: _currentScreenIndex,
        children: screens,
      ),
      bottomNavigationBar: SafeArea(
        top: false,
        child: Container(
          height: 66,
          decoration: BoxDecoration(
            color: Colors.white,
            border: const Border(
              top: BorderSide(color: AppColors.border, width: 1),
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 16,
                offset: const Offset(0, -4),
              ),
            ],
          ),
          child: Stack(
            clipBehavior: Clip.none,
            alignment: Alignment.topCenter,
            children: [
              // 5 Column Slots
              Row(
                children: [
                  // 0: Dashboard
                  Expanded(
                    child: _buildBarItem(
                      navIndex: 0,
                      icon: Icons.dashboard_outlined,
                      activeIcon: Icons.dashboard,
                      label: 'Dashboard',
                      isSelected: bottomNavIndex == 0,
                    ),
                  ),
                  // 1: Tasks (Now in position 1!)
                  Expanded(
                    child: _buildBarItem(
                      navIndex: 1,
                      icon: Icons.check_box_outlined,
                      activeIcon: Icons.check_box,
                      label: 'Tasks',
                      isSelected: bottomNavIndex == 1,
                    ),
                  ),
                  // 2: Placeholder for the large Punch button in center
                  const Expanded(
                    child: SizedBox(),
                  ),
                  // 3: Directory
                  Expanded(
                    child: _buildBarItem(
                      navIndex: 3,
                      icon: Icons.people_outline,
                      activeIcon: Icons.people,
                      label: 'Directory',
                      isSelected: bottomNavIndex == 3,
                    ),
                  ),
                  // 4: Profile
                  Expanded(
                    child: _buildBarItem(
                      navIndex: 4,
                      icon: Icons.person_outline,
                      activeIcon: Icons.person,
                      label: 'Profile',
                      isSelected: bottomNavIndex == 4,
                    ),
                  ),
                ],
              ),

              // Large, Prominent, Elevated Punch Button in the Center
              Positioned(
                top: -16,
                child: GestureDetector(
                  onTap: () => _onBottomNavTapped(2),
                  behavior: HitTestBehavior.opaque,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 58,
                        height: 58,
                        decoration: BoxDecoration(
                          gradient: AppColors.primaryGradient,
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 3.5),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.primary.withOpacity(0.42),
                              blurRadius: 14,
                              spreadRadius: 1,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: const Center(
                          child: Icon(
                            Icons.fingerprint,
                            color: Colors.white,
                            size: 32,
                          ),
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        'Punch',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: bottomNavIndex == 2 ? FontWeight.w800 : FontWeight.w700,
                          color: bottomNavIndex == 2 ? AppColors.primary : AppColors.textMuted,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBarItem({
    required int navIndex,
    required IconData icon,
    required IconData activeIcon,
    required String label,
    required bool isSelected,
  }) {
    return InkWell(
      onTap: () => _onBottomNavTapped(navIndex),
      splashColor: AppColors.primary.withOpacity(0.1),
      highlightColor: Colors.transparent,
      child: Padding(
        padding: const EdgeInsets.only(top: 8, bottom: 4),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              isSelected ? activeIcon : icon,
              color: isSelected ? AppColors.primary : AppColors.textLight,
              size: 22,
            ),
            const SizedBox(height: 3),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                color: isSelected ? AppColors.primary : AppColors.textLight,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
