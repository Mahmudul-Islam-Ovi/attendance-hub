import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../constants/app_colors.dart';
import '../constants/app_config.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../widgets/glass_container.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailCtrl = TextEditingController(text: 'habib@office.test');
  final _pwCtrl = TextEditingController(text: 'Password@123');
  bool _obscurePw = true;
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _pwCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _error = null;
      _loading = true;
    });

    final auth = Provider.of<AuthProvider>(context, listen: false);
    final ok = await auth.login(_emailCtrl.text, _pwCtrl.text);

    if (mounted) {
      setState(() {
        _loading = false;
        if (!ok) {
          _error = auth.error ?? 'ইমেইল বা পাসওয়ার্ড সঠিক নয়। আবার চেষ্টা করুন।';
        }
      });
    }
  }

  void _showServerSettings() {
    final urlCtrl = TextEditingController(text: AppConfig.baseUrl);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Server / Backend URL', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Enter your local Next.js server or deployed API URL:',
              style: TextStyle(fontSize: 12, color: AppColors.textMuted),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: urlCtrl,
              decoration: const InputDecoration(
                hintText: 'http://192.168.1.100:3000',
              ),
            ),
            const SizedBox(height: 10),
            const Text(
              'Note: Android emulator uses http://10.0.2.2:3000 by default.',
              style: TextStyle(fontSize: 11, color: AppColors.primary),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              await ApiService().setCustomBaseUrl(urlCtrl.text.trim());
              if (mounted) Navigator.pop(ctx);
            },
            child: const Text('Save URL'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Background Gradient Spheres
          Positioned(
            top: -100,
            right: -100,
            child: Container(
              width: 300,
              height: 300,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.primaryLight.withOpacity(0.2),
              ),
            ),
          ),
          Positioned(
            bottom: -100,
            left: -100,
            child: Container(
              width: 300,
              height: 300,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.violet.withOpacity(0.2),
              ),
            ),
          ),

          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // Brand Icon
                    Container(
                      height: 64,
                      width: 64,
                      decoration: BoxDecoration(
                        gradient: AppColors.primaryGradient,
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primary.withOpacity(0.35),
                            blurRadius: 18,
                            offset: const Offset(0, 8),
                          ),
                        ],
                      ),
                      child: const Icon(
                        Icons.fingerprint,
                        color: Colors.white,
                        size: 38,
                      ),
                    ),
                    const SizedBox(height: 16),

                    const Text(
                      'Attendance Hub',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.w900,
                        color: AppColors.textDark,
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'আপনার অ্যাকাউন্টে লগইন করুন',
                      style: TextStyle(
                        fontSize: 13,
                        color: AppColors.textMuted,
                      ),
                    ),
                    const SizedBox(height: 28),

                    // Login Card
                    GlassContainer(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          // Email
                          const Text(
                            'ইমেইল অ্যাড্রেস',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: AppColors.textDark,
                            ),
                          ),
                          const SizedBox(height: 6),
                          TextField(
                            controller: _emailCtrl,
                            keyboardType: TextInputType.emailAddress,
                            decoration: const InputDecoration(
                              hintText: 'habib@office.test',
                              prefixIcon: Icon(Icons.mail_outline, size: 20),
                            ),
                          ),
                          const SizedBox(height: 18),

                          // Password
                          const Text(
                            'পাসওয়ার্ড',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: AppColors.textDark,
                            ),
                          ),
                          const SizedBox(height: 6),
                          TextField(
                            controller: _pwCtrl,
                            obscureText: _obscurePw,
                            decoration: InputDecoration(
                              hintText: '••••••••',
                              prefixIcon: const Icon(Icons.lock_outline, size: 20),
                              suffixIcon: IconButton(
                                icon: Icon(
                                  _obscurePw ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                                  size: 20,
                                ),
                                onPressed: () => setState(() => _obscurePw = !_obscurePw),
                              ),
                            ),
                          ),

                          if (_error != null) ...[
                            const SizedBox(height: 14),
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: AppColors.absentBg,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: AppColors.absent.withOpacity(0.3)),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.error_outline, color: AppColors.absent, size: 18),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      _error!,
                                      style: const TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                        color: AppColors.absentText,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],

                          const SizedBox(height: 24),

                          // Login Button
                          ElevatedButton(
                            onPressed: _loading ? null : _submit,
                            child: _loading
                                ? const SizedBox(
                                    height: 20,
                                    width: 20,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      color: Colors.white,
                                    ),
                                  )
                                : const Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(Icons.login, size: 18),
                                      SizedBox(width: 8),
                                      Text('লগইন করুন (Sign In)'),
                                    ],
                                  ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Demo Accounts Quick Selection
                    GlassContainer(
                      padding: const EdgeInsets.all(14),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Row(
                            children: [
                              Text('🔑 ', style: TextStyle(fontSize: 14)),
                              Text(
                                'ডেমো লগইন তথ্য (Quick Fill)',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w800,
                                  color: AppColors.primary,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: [
                              ActionChip(
                                label: const Text('কর্মী (Habib - Employee)', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                                avatar: const Icon(Icons.person, size: 16, color: AppColors.primary),
                                backgroundColor: AppColors.primary.withOpacity(0.08),
                                onPressed: () {
                                  setState(() {
                                    _emailCtrl.text = 'habib@office.test';
                                    _pwCtrl.text = 'Password@123';
                                  });
                                },
                              ),
                              ActionChip(
                                label: const Text('অ্যাডমিন (Rahim - Admin)', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                                avatar: const Icon(Icons.shield, size: 16, color: AppColors.late),
                                backgroundColor: AppColors.lateBg,
                                onPressed: () {
                                  setState(() {
                                    _emailCtrl.text = 'rahim@office.test';
                                    _pwCtrl.text = 'Password@123';
                                  });
                                },
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),
                    TextButton.icon(
                      onPressed: _showServerSettings,
                      icon: const Icon(Icons.settings, size: 16, color: AppColors.textMuted),
                      label: Text(
                        'Server Settings (${AppConfig.baseUrl})',
                        style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
