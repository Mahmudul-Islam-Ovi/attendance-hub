import 'package:flutter/material.dart';
import '../constants/app_colors.dart';

class StatusBadge extends StatelessWidget {
  final String status;
  final double fontSize;

  const StatusBadge({
    super.key,
    required this.status,
    this.fontSize = 11,
  });

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color textColor;
    String emoji;
    String label;

    switch (status.toUpperCase()) {
      case 'PRESENT':
        bg = AppColors.presentBg;
        textColor = AppColors.presentText;
        emoji = '🟢';
        label = 'Present';
        break;
      case 'LATE':
        bg = AppColors.lateBg;
        textColor = AppColors.lateText;
        emoji = '🟠';
        label = 'Late';
        break;
      case 'WFH':
        bg = AppColors.wfhBg;
        textColor = AppColors.wfhText;
        emoji = '🔵';
        label = 'WFH';
        break;
      case 'ON_LEAVE':
      case 'LEAVE':
        bg = AppColors.leaveBg;
        textColor = AppColors.leaveText;
        emoji = '🟡';
        label = 'On leave';
        break;
      case 'PENDING_APPROVAL':
        bg = const Color(0xFFFEF3C7);
        textColor = const Color(0xFFB45309);
        emoji = '⏳';
        label = 'Pending';
        break;
      case 'APPROVED':
        bg = AppColors.presentBg;
        textColor = AppColors.presentText;
        emoji = '✓';
        label = 'Approved';
        break;
      case 'REJECTED':
        bg = AppColors.absentBg;
        textColor = AppColors.absentText;
        emoji = '✕';
        label = 'Rejected';
        break;
      case 'COMPLETED':
      case 'DISBURSED':
      case 'ISSUED':
        bg = const Color(0xFFDBEAFE);
        textColor = const Color(0xFF1D4ED8);
        emoji = '✓';
        label = status.toUpperCase();
        break;
      case 'ABSENT':
      default:
        bg = AppColors.absentBg;
        textColor = AppColors.absentText;
        emoji = '🔴';
        label = 'Absent';
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(emoji, style: TextStyle(fontSize: fontSize)),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: fontSize,
              fontWeight: FontWeight.w700,
              color: textColor,
            ),
          ),
        ],
      ),
    );
  }
}
