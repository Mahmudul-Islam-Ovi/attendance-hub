import 'package:flutter/foundation.dart';

class AppConfig {
  static const String appName = 'Attendance Hub';
  static const String appTagline = 'Enterprise Presence & Workflow';

  // Base URL for API requests.
  // When running on Android Emulator: http://10.0.2.2:3000
  // When running on Windows/Web/iOS Simulator: http://localhost:3000
  // When deployed to production: Change to your deployed server URL (e.g., https://your-server.com)
  static String get defaultBaseUrl {
    if (kIsWeb) {
      return 'http://localhost:3000';
    }
    // Android emulator special localhost alias
    if (defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:3000';
    }
    return 'http://localhost:3000';
  }

  // Active base URL that can be dynamically updated from settings
  static String baseUrl = defaultBaseUrl;

  // Default office location matching seed (Dhaka, Motijheel/Dhaka)
  static const double officeLat = 23.7330;
  static const double officeLng = 90.4172;
  static const double officeRadiusMeters = 200.0;
  static const String officeName = 'Main Office HQ';
}
