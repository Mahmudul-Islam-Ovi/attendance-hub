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

  // Default office location matching seed (Dhaka, Motijheel/Dhaka)
  static const double officeLat = 23.7330;
  static const double officeLng = 90.4172;
  static const double officeRadiusMeters = 200.0;
  static const String officeName = 'Main Office HQ';
}
