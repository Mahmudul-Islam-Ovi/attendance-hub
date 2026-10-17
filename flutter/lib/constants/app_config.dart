import 'package:shared_preferences/shared_preferences.dart';

class AppConfig {
  static const String appName = 'Attendance Hub';
  static const String appTagline = 'Enterprise Presence & Workflow';

  // Production Server URL (Vercel deployment connected with Cloud Neon Database)
  static const String productionUrl = 'https://attendance-hub-livid.vercel.app';

  // Base URL for API requests.
  // Defaults to production Vercel server so apps & web share the exact same live database.
  static String get defaultBaseUrl {
    return productionUrl;
  }

  // Active base URL that can be dynamically updated from settings
  static String baseUrl = defaultBaseUrl;

  // Dynamic active office parameters initialized to the live active database office (Uttara Sector 3)
  static String officeId = 'cmv6e34vr0002qenmfii9kp9s';
  static String officeName = 'Main Office';
  static String officeAddress = 'সড়ক ৪, সেক্টর ৩, উত্তরা, ঢাকা';
  static double officeLat = 23.86484;
  static double officeLng = 90.397331;
  static double officeRadiusMeters = 50.0;

  /// Dynamically update active office and persist locally
  static Future<void> updateActiveOffice({
    required String id,
    required String name,
    required String address,
    required double lat,
    required double lng,
    required double radius,
  }) async {
    officeId = id;
    officeName = name;
    officeAddress = address;
    officeLat = lat;
    officeLng = lng;
    officeRadiusMeters = radius;

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('active_office_id', id);
      await prefs.setString('active_office_name', name);
      await prefs.setString('active_office_address', address);
      await prefs.setDouble('active_office_lat', lat);
      await prefs.setDouble('active_office_lng', lng);
      await prefs.setDouble('active_office_radius', radius);
    } catch (_) {}
  }

  /// Load cached office settings from local storage
  static Future<void> loadSavedOffice() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final id = prefs.getString('active_office_id');
      final lat = prefs.getDouble('active_office_lat');
      final lng = prefs.getDouble('active_office_lng');
      if (id != null && lat != null && lng != null) {
        officeId = id;
        officeLat = lat;
        officeLng = lng;
        officeName = prefs.getString('active_office_name') ?? officeName;
        officeAddress = prefs.getString('active_office_address') ?? officeAddress;
        officeRadiusMeters = prefs.getDouble('active_office_radius') ?? officeRadiusMeters;
      }
    } catch (_) {}
  }
}
