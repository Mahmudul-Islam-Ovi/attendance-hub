import 'package:flutter/material.dart';

class AppColors {
  // Brand Primary & Gradients
  static const Color primary = Color(0xFF4F46E5); // Indigo 600
  static const Color primaryLight = Color(0xFF6366F1); // Indigo 500
  static const Color primaryDark = Color(0xFF4338CA); // Indigo 700
  static const Color violet = Color(0xFF7C3AED); // Violet 600
  static const Color accent = Color(0xFF8B5CF6);

  // Status Tones
  static const Color present = Color(0xFF10B981); // Emerald 500
  static const Color presentBg = Color(0xFFD1FAE5);
  static const Color presentText = Color(0xFF065F46);

  static const Color late = Color(0xFFF97316); // Orange 500
  static const Color lateBg = Color(0xFFFFEDD5);
  static const Color lateText = Color(0xFF9A3412);

  static const Color absent = Color(0xFFF43F5E); // Rose 500
  static const Color absentBg = Color(0xFFFFE4E6);
  static const Color absentText = Color(0xFF9F1239);

  static const Color leave = Color(0xFFF59E0B); // Amber 500
  static const Color leaveBg = Color(0xFFFEF3C7);
  static const Color leaveText = Color(0xFF92400E);

  static const Color wfh = Color(0xFF0EA5E9); // Sky 500
  static const Color wfhBg = Color(0xFFE0F2FE);
  static const Color wfhText = Color(0xFF075985);

  // Backgrounds & Neutrals
  static const Color bg = Color(0xFFF1F5F9); // Slate 100
  static const Color background = Color(0xFFF1F5F9);
  static const Color surface = Colors.white;
  static const Color textDark = Color(0xFF0F172A); // Slate 900
  static const Color textMuted = Color(0xFF64748B); // Slate 500
  static const Color textLight = Color(0xFF94A3B8); // Slate 400
  static const Color border = Color(0xFFE2E8F0); // Slate 200

  // Slate Palette
  static const Color slate50 = Color(0xFFF8FAFC);
  static const Color slate100 = Color(0xFFF1F5F9);
  static const Color slate200 = Color(0xFFE2E8F0);
  static const Color slate300 = Color(0xFFCBD5E1);
  static const Color slate400 = Color(0xFF94A3B8);
  static const Color slate500 = Color(0xFF64748B);
  static const Color slate600 = Color(0xFF475569);
  static const Color slate700 = Color(0xFF334155);
  static const Color slate800 = Color(0xFF1E293B);
  static const Color slate900 = Color(0xFF0F172A);

  // Gradients
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [Color(0xFF4F46E5), Color(0xFF7C3AED)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient punchOutGradient = LinearGradient(
    colors: [Color(0xFFF43F5E), Color(0xFFFB923C)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient netPayableGradient = LinearGradient(
    colors: [Color(0xFF4338CA), Color(0xFF6D28D9)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}
