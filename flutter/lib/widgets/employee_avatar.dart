import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import '../constants/app_config.dart';

class EmployeeAvatar extends StatelessWidget {
  final String name;
  final String? imageUrl;
  final String? colorHex;
  final double size;

  const EmployeeAvatar({
    super.key,
    required this.name,
    this.imageUrl,
    this.colorHex,
    this.size = 40,
  });

  Color _parseColor(String? hex) {
    if (hex == null || hex.isEmpty) return const Color(0xFF6366F1);
    try {
      final clean = hex.replaceAll('#', '');
      if (clean.length == 6) {
        return Color(int.parse('0xFF$clean'));
      }
    } catch (_) {}
    return const Color(0xFF6366F1);
  }

  String _getInitials(String str) {
    final parts = str.trim().split(' ');
    if (parts.isEmpty || parts[0].isEmpty) return '??';
    if (parts.length == 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    if (imageUrl != null && imageUrl!.isNotEmpty) {
      final url = imageUrl!;

      // 1. Base64 data URI
      if (url.startsWith('data:image')) {
        try {
          final base64String = url.split(',').last;
          final bytes = base64Decode(base64String);
          return ClipRRect(
            borderRadius: BorderRadius.circular(size / 2),
            child: Image.memory(
              bytes,
              width: size,
              height: size,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => _buildFallback(),
            ),
          );
        } catch (_) {}
      }

      // 2. Relative upload URL (/uploads/...)
      String fullUrl = url;
      if (url.startsWith('/')) {
        fullUrl = '${AppConfig.baseUrl}$url';
      }

      // 3. Network URL
      if (fullUrl.startsWith('http')) {
        return ClipRRect(
          borderRadius: BorderRadius.circular(size / 2),
          child: Image.network(
            fullUrl,
            width: size,
            height: size,
            fit: BoxFit.cover,
            errorBuilder: (_, __, ___) => _buildFallback(),
          ),
        );
      }

      // 4. Local file path
      if (!kIsWeb && File(url).existsSync()) {
        return ClipRRect(
          borderRadius: BorderRadius.circular(size / 2),
          child: Image.file(
            File(url),
            width: size,
            height: size,
            fit: BoxFit.cover,
            errorBuilder: (_, __, ___) => _buildFallback(),
          ),
        );
      }
    }

    return _buildFallback();
  }

  Widget _buildFallback() {
    return Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: _parseColor(colorHex),
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: _parseColor(colorHex).withOpacity(0.3),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Text(
        _getInitials(name),
        style: TextStyle(
          color: Colors.white,
          fontSize: size * 0.38,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }
}
