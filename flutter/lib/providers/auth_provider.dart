import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';

class AuthProvider extends ChangeNotifier {
  final AuthService _authService = AuthService();

  UserModel? _user;
  bool _isLoading = true;
  String? _error;

  UserModel? get user => _user;
  UserModel? get currentUser => _user;
  bool get isLoading => _isLoading;
  bool get isLoggedIn => _user != null;
  bool get isAuthenticated => _user != null;
  bool get isAdmin => _user?.isAdmin ?? false;
  String? get error => _error;

  Future<void> init() async {
    _isLoading = true;
    notifyListeners();
    try {
      _user = await _authService.getCachedUser();
    } catch (e) {
      debugPrint('AuthProvider.init error: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> initialize() => init();

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _user = await _authService.login(email, password);
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    _isLoading = true;
    notifyListeners();
    await _authService.logout();
    _user = null;
    _isLoading = false;
    notifyListeners();
  }

  Future<bool> updateProfile({
    required String name,
    String? phone,
    String? avatarUrl,
    String? password,
  }) async {
    try {
      final updated = await _authService.updateProfile(
        name: name,
        phone: phone,
        avatarUrl: avatarUrl,
        password: password,
      );
      if (updated != null) {
        _user = updated;
        notifyListeners();
        return true;
      }
    } catch (e) {
      _error = e.toString();
    }
    return false;
  }
}
