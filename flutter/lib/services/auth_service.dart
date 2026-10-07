import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user_model.dart';
import 'api_service.dart';

class AuthService {
  final ApiService _api = ApiService();

  Future<UserModel?> getCachedUser() async {
    final prefs = await SharedPreferences.getInstance();
    final userStr = prefs.getString('cached_user');
    if (userStr != null) {
      try {
        final map = jsonDecode(userStr);
        return UserModel.fromJson(map);
      } catch (e) {
        debugPrint('Error parsing cached user: $e');
      }
    }
    return null;
  }

  Future<void> saveUser(UserModel user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('cached_user', jsonEncode(user.toJson()));
  }

  Future<UserModel?> login(String email, String password) async {
    final cleanEmail = email.trim().toLowerCase();

    try {
      // 1. Direct REST Authentication for mobile & web apps
      final res = await _api.post('/api/auth/login', body: {
        'email': cleanEmail,
        'password': password,
      });

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (data != null && data['user'] != null) {
          final user = UserModel.fromJson(data['user']);
          await saveUser(user);
          return user;
        }
      } else if (res.statusCode == 401 || res.statusCode == 403) {
        final data = jsonDecode(res.body);
        final err = data['error'] ?? 'ইমেইল বা পাসওয়ার্ড সঠিক নয়।';
        throw Exception(err);
      }
    } catch (e) {
      if (e.toString().contains('সঠিক নয়') || e.toString().contains('inactive') || e.toString().contains('Invalid')) {
        rethrow;
      }
      debugPrint('Online login attempt failed: $e. Checking offline demo users...');
    }

    // 2. Built-in Demo accounts (matches seed.ts in attendance-hub)
    if (password == 'Password@123' || password == '123456') {
      if (cleanEmail == 'habib@office.test' || cleanEmail.contains('habib')) {
        final user = UserModel(
          id: 'emp-habib-001',
          employeeCode: 'EMP-0001',
          name: 'Habib Rahman',
          email: 'habib@office.test',
          phone: '+880 1711 000001',
          avatarUrl: 'https://i.pravatar.cc/150?u=Habib',
          designation: 'Senior Software Engineer',
          role: 'EMPLOYEE',
          level: 'EMPLOYEE',
          status: 'ACTIVE',
          departmentName: 'IT & Software',
          departmentColor: '#6366f1',
          wfhAllowed: true,
          basicSalary: 65000,
        );
        await saveUser(user);
        return user;
      } else if (cleanEmail == 'rahim@office.test' || cleanEmail.contains('admin') || cleanEmail.contains('rahim')) {
        final user = UserModel(
          id: 'admin-rahim-001',
          employeeCode: 'EMP-0002',
          name: 'Rahim Chowdhury',
          email: 'rahim@office.test',
          phone: '+880 1812 000002',
          avatarUrl: 'https://i.pravatar.cc/150?u=Rahim',
          designation: 'Head of Operations & Admin',
          role: 'SYSTEM_ADMIN',
          level: 'DIRECTOR',
          status: 'ACTIVE',
          departmentName: 'Management',
          departmentColor: '#4f46e5',
          wfhAllowed: true,
          basicSalary: 120000,
        );
        await saveUser(user);
        return user;
      }
    }

    throw Exception('Invalid email or password. Please try again.');
  }

  Future<void> logout() async {
    try {
      await _api.post('/api/auth/signout');
    } catch (_) {}
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('cached_user');
    await prefs.remove('session_cookie');
  }

  Future<UserModel?> updateProfile({
    required String name,
    String? phone,
    String? avatarUrl,
    String? password,
  }) async {
    final body = {
      'name': name,
      if (phone != null) 'phone': phone,
      if (avatarUrl != null) 'avatarUrl': avatarUrl,
      if (password != null && password.isNotEmpty) 'password': password,
    };

    try {
      final res = await _api.patch('/api/me', body: body);
      if (res.statusCode == 200) {
        final json = jsonDecode(res.body);
        if (json['user'] != null) {
          final updated = UserModel.fromJson(json['user']);
          await saveUser(updated);
          return updated;
        }
      }
    } catch (_) {}

    // Update local cache if offline
    final current = await getCachedUser();
    if (current != null) {
      final updated = UserModel(
        id: current.id,
        employeeCode: current.employeeCode,
        name: name,
        email: current.email,
        phone: phone ?? current.phone,
        avatarUrl: avatarUrl ?? current.avatarUrl,
        designation: current.designation,
        role: current.role,
        level: current.level,
        status: current.status,
        departmentName: current.departmentName,
        departmentColor: current.departmentColor,
        wfhAllowed: current.wfhAllowed,
        basicSalary: current.basicSalary,
      );
      await saveUser(updated);
      return updated;
    }
    return null;
  }
}
