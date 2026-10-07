import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../constants/app_config.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  String? _sessionCookie;

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _sessionCookie = prefs.getString('session_cookie');
    final savedUrl = prefs.getString('custom_base_url');
    if (savedUrl != null && savedUrl.isNotEmpty) {
      AppConfig.baseUrl = savedUrl;
    }
  }

  Future<void> setCustomBaseUrl(String url) async {
    AppConfig.baseUrl = url;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('custom_base_url', url);
  }

  Future<void> setSessionCookie(String? cookie) async {
    _sessionCookie = cookie;
    final prefs = await SharedPreferences.getInstance();
    if (cookie != null) {
      await prefs.setString('session_cookie', cookie);
    } else {
      await prefs.remove('session_cookie');
    }
  }

  Map<String, String> _buildHeaders([Map<String, String>? extra]) {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (_sessionCookie != null && _sessionCookie!.isNotEmpty) {
      headers['Cookie'] = _sessionCookie!;
    }
    if (extra != null) {
      headers.addAll(extra);
    }
    return headers;
  }

  void _extractCookies(http.Response response) {
    final rawCookie = response.headers['set-cookie'];
    if (rawCookie != null && rawCookie.isNotEmpty) {
      setSessionCookie(rawCookie);
    }
  }

  Future<http.Response> get(String path, {Map<String, String>? headers}) async {
    final url = Uri.parse('${AppConfig.baseUrl}$path');
    try {
      final res = await http.get(url, headers: _buildHeaders(headers)).timeout(
            const Duration(seconds: 4),
          );
      _extractCookies(res);
      return res;
    } catch (_) {
      rethrow;
    }
  }

  Future<http.Response> post(
    String path, {
    Map<String, dynamic>? body,
    Map<String, String>? headers,
  }) async {
    final url = Uri.parse('${AppConfig.baseUrl}$path');
    try {
      final res = await http
          .post(
            url,
            headers: _buildHeaders(headers),
            body: body != null ? jsonEncode(body) : null,
          )
          .timeout(const Duration(seconds: 5));
      _extractCookies(res);
      return res;
    } catch (_) {
      rethrow;
    }
  }

  Future<http.Response> patch(
    String path, {
    Map<String, dynamic>? body,
    Map<String, String>? headers,
  }) async {
    final url = Uri.parse('${AppConfig.baseUrl}$path');
    try {
      final res = await http
          .patch(
            url,
            headers: _buildHeaders(headers),
            body: body != null ? jsonEncode(body) : null,
          )
          .timeout(const Duration(seconds: 5));
      _extractCookies(res);
      return res;
    } catch (_) {
      rethrow;
    }
  }

  Future<http.Response> delete(String path, {Map<String, String>? headers}) async {
    final url = Uri.parse('${AppConfig.baseUrl}$path');
    try {
      final res = await http
          .delete(url, headers: _buildHeaders(headers))
          .timeout(const Duration(seconds: 4));
      _extractCookies(res);
      return res;
    } catch (_) {
      rethrow;
    }
  }

  Future<String?> uploadFile(Uint8List fileBytes, String filename) async {
    final url = Uri.parse('${AppConfig.baseUrl}/api/upload');
    try {
      final request = http.MultipartRequest('POST', url);
      if (_sessionCookie != null && _sessionCookie!.isNotEmpty) {
        request.headers['Cookie'] = _sessionCookie!;
      }
      request.files.add(
        http.MultipartFile.fromBytes('file', fileBytes, filename: filename),
      );
      final streamed = await request.send().timeout(const Duration(seconds: 20));
      final res = await http.Response.fromStream(streamed);
      if (res.statusCode == 200 || res.statusCode == 201) {
        final data = jsonDecode(res.body);
        if (data['url'] != null) {
          String returnedUrl = data['url'];
          if (returnedUrl.startsWith('/')) {
            return '${AppConfig.baseUrl}$returnedUrl';
          }
          return returnedUrl;
        }
      }
    } catch (e) {
      debugPrint('ApiService.uploadFile error: $e');
    }
    return null;
  }
}
