import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../constants/app_colors.dart';
import '../providers/auth_provider.dart';
import 'employee_avatar.dart';

class AppDrawer extends StatelessWidget {
  final Function(int screenIndex) onSelectScreen;
  final int currentIndex;

  const AppDrawer({
    super.key,
    required this.onSelectScreen,
    required this.currentIndex,
  });

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final user = auth.user;
    final isAdmin = auth.isAdmin;

    return Drawer(
      backgroundColor: Colors.white.withOpacity(0.96),
      surfaceTintColor: Colors.transparent,
      child: SafeArea(
        child: Column(
          children: [
            // Drawer Header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Row(
                children: [
                  Container(
                    height: 40,
                    width: 40,
                    decoration: BoxDecoration(
                      gradient: AppColors.primaryGradient,
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primary.withOpacity(0.3),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: const Icon(Icons.fingerprint, color: Colors.white, size: 24),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Attendance Hub',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                            color: AppColors.textDark,
                          ),
                        ),
                        Text(
                          'Enterprise Presence',
                          style: TextStyle(fontSize: 11, color: AppColors.textMuted),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.close, color: AppColors.textMuted),
                  ),
                ],
              ),
            ),

            // User Info Banner
            if (user != null)
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.08),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.primary.withOpacity(0.15)),
                ),
                child: Row(
                  children: [
                    EmployeeAvatar(
                      name: user.name,
                      imageUrl: user.avatarUrl,
                      size: 38,
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            user.name,
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: AppColors.textDark,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          Text(
                            user.designation ?? user.email,
                            style: const TextStyle(
                              fontSize: 10,
                              color: AppColors.textMuted,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        user.employeeCode,
                        style: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

            const Divider(color: AppColors.border, height: 16),

            // Modules list
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                children: [
                  _buildSectionHeader('CORE'),
                  _buildItem(0, 'Dashboard', Icons.dashboard_outlined),
                  _buildItem(1, 'Punch Attendance', Icons.fingerprint, isPrimary: true),
                  _buildItem(2, 'People Directory', Icons.people_outline),
                  _buildItem(3, 'Teams & Departments', Icons.business_outlined),
                  _buildItem(4, 'Org Tree', Icons.account_tree_outlined),

                  const SizedBox(height: 12),
                  _buildSectionHeader('WORKFLOW & REQUESTS'),
                  _buildItem(5, 'Task Management', Icons.check_box_outlined),
                  _buildItem(6, 'Assigned Asset', Icons.laptop_mac_outlined),
                  _buildItem(7, 'My Movements', Icons.explore_outlined),
                  _buildItem(8, 'My Claims', Icons.receipt_long_outlined),
                  _buildItem(9, 'My Advance Salary', Icons.attach_money_outlined),
                  _buildItem(10, 'My Extra Work Days', Icons.event_available_outlined),
                  _buildItem(11, 'My Shifts', Icons.wb_sunny_outlined),
                  _buildItem(12, 'My Overtime', Icons.access_time_outlined),
                  _buildItem(13, 'My Document Request', Icons.description_outlined),

                  const SizedBox(height: 12),
                  _buildSectionHeader('TIMESHEETS & REPORTS'),
                  _buildItem(14, 'Pay Slip & Payroll', Icons.account_balance_wallet_outlined, isPrimary: true),
                  if (isAdmin)
                    _buildItem(15, 'Attendance Reconciliation', Icons.verified_user_outlined),
                  _buildItem(16, 'Monthly Attendance', Icons.calendar_month_outlined),
                  _buildItem(17, 'My & Team Job Card', Icons.credit_card_outlined),
                  _buildItem(18, 'Expense & Claim Report', Icons.bar_chart_outlined),
                  _buildItem(19, 'Lobby QR Screen', Icons.qr_code_2_outlined),

                  const SizedBox(height: 12),
                  _buildSectionHeader('ACCOUNT'),
                  _buildItem(20, 'My Profile', Icons.person_outline),
                ],
              ),
            ),

            // Logout Footer
            Padding(
              padding: const EdgeInsets.all(12),
              child: ListTile(
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                tileColor: AppColors.absentBg.withOpacity(0.5),
                leading: const Icon(Icons.logout, color: AppColors.absent, size: 20),
                title: const Text(
                  'Sign Out',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: AppColors.absent,
                  ),
                ),
                onTap: () {
                  Navigator.of(context).pop();
                  auth.logout();
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 4),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w800,
          letterSpacing: 1.0,
          color: AppColors.textLight,
        ),
      ),
    );
  }

  Widget _buildItem(int index, String label, IconData icon, {bool isPrimary = false}) {
    final bool active = currentIndex == index;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: ListTile(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        selected: active,
        selectedTileColor: AppColors.primary,
        tileColor: isPrimary && !active ? AppColors.primary.withOpacity(0.08) : Colors.transparent,
        dense: true,
        leading: Icon(
          icon,
          size: 20,
          color: active
              ? Colors.white
              : (isPrimary ? AppColors.primary : AppColors.textMuted),
        ),
        title: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: active || isPrimary ? FontWeight.w700 : FontWeight.w500,
            color: active
                ? Colors.white
                : (isPrimary ? AppColors.primary : AppColors.textDark),
          ),
        ),
        trailing: Icon(
          Icons.chevron_right,
          size: 16,
          color: active ? Colors.white.withOpacity(0.7) : AppColors.textLight,
        ),
        onTap: () => onSelectScreen(index),
      ),
    );
  }
}
