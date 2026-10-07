import 'dart:async';
import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../constants/app_colors.dart';
import '../widgets/glass_container.dart';

class QrLobbyScreen extends StatefulWidget {
  const QrLobbyScreen({super.key});

  @override
  State<QrLobbyScreen> createState() => _QrLobbyScreenState();
}

class _QrLobbyScreenState extends State<QrLobbyScreen> {
  String _currentToken = 'lobby-token-init';
  int _secondsLeft = 30;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _refreshToken();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted) {
        setState(() {
          if (_secondsLeft <= 1) {
            _refreshToken();
          } else {
            _secondsLeft--;
          }
        });
      }
    });
  }

  void _refreshToken() {
    _currentToken = 'lobby-${DateTime.now().millisecondsSinceEpoch.toRadixString(16)}';
    _secondsLeft = 30;
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text(
              'Lobby Entrance QR Screen',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: AppColors.textDark),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 6),
            const Text(
              'Employees scan this dynamic code upon entering the building. Rotates every 30 seconds.',
              style: TextStyle(fontSize: 12, color: AppColors.textMuted),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            GlassContainer(
              padding: const EdgeInsets.all(28),
              child: Column(
                children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0x150F172A),
                          blurRadius: 20,
                          offset: Offset(0, 8),
                        ),
                      ],
                    ),
                    child: QrImageView(
                      data: _currentToken,
                      version: QrVersions.auto,
                      size: 220.0,
                    ),
                  ),
                  const SizedBox(height: 18),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.timer_outlined, size: 16, color: AppColors.primary),
                      const SizedBox(width: 6),
                      Text(
                        'Refreshes in $_secondsLeft s',
                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.primary),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
