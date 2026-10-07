import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import 'constants/app_colors.dart';
import 'constants/app_theme.dart';
import 'providers/auth_provider.dart';
import 'screens/login_screen.dart';
import 'screens/main_navigation_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Set system navigation and status bar style
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
      systemNavigationBarColor: Colors.white,
      systemNavigationBarIconBrightness: Brightness.dark,
    ),
  );

  final authProvider = AuthProvider();
  await authProvider.initialize();

  runApp(
    AttendanceHubApp(authProvider: authProvider),
  );
}

class AttendanceHubApp extends StatelessWidget {
  final AuthProvider? authProvider;

  const AttendanceHubApp({super.key, this.authProvider});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        if (authProvider != null)
          ChangeNotifierProvider<AuthProvider>.value(value: authProvider!)
        else
          ChangeNotifierProvider<AuthProvider>(create: (_) => AuthProvider()),
      ],
      child: MaterialApp(
        title: 'Attendance Hub',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        home: Consumer<AuthProvider>(
          builder: (context, auth, _) {
            if (auth.isLoading) {
              return const Scaffold(
                backgroundColor: AppColors.bg,
                body: Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      SizedBox(
                        width: 48,
                        height: 48,
                        child: CircularProgressIndicator(
                          valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary),
                          strokeWidth: 3,
                        ),
                      ),
                      SizedBox(height: 20),
                      Text(
                        'Attendance Hub',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: AppColors.textDark,
                        ),
                      ),
                      SizedBox(height: 4),
                      Text(
                        'Connecting enterprise presence...',
                        style: TextStyle(
                          fontSize: 12,
                          color: AppColors.textMuted,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }

            if (auth.isAuthenticated) {
              return MainNavigationScreen(key: ValueKey(auth.user?.id));
            }

            return const LoginScreen();
          },
        ),
      ),
    );
  }
}
