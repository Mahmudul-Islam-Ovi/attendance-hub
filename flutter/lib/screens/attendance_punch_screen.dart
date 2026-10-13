import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:intl/intl.dart';
import 'package:latlong2/latlong.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:provider/provider.dart';
import '../constants/app_colors.dart';
import '../models/attendance_model.dart';
import '../providers/auth_provider.dart';
import '../services/attendance_service.dart';
import '../widgets/employee_avatar.dart';
import '../widgets/glass_container.dart';
import '../widgets/status_badge.dart';

class AttendancePunchScreen extends StatefulWidget {
  const AttendancePunchScreen({super.key});

  @override
  State<AttendancePunchScreen> createState() => _AttendancePunchScreenState();
}

class _AttendancePunchScreenState extends State<AttendancePunchScreen> with SingleTickerProviderStateMixin {
  final AttendanceService _attendance = AttendanceService();

  late Timer _clockTimer;
  Timer? _liveSyncTimer;
  DateTime _currentTime = DateTime.now();
  late AnimationController _pulseController;

  bool _isWfh = false;
  bool _isPunchedIn = false;
  bool _isDoneForDay = false;
  bool _isPendingApproval = false;
  bool _loading = false;
  String? _inTime;
  String? _outTime;
  String? _statusMsg;
  bool _msgSuccess = true;

  List<AttendanceLog> _liveCheckins = [];

  @override
  void initState() {
    super.initState();
    _clockTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() => _currentTime = DateTime.now());
    });

    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    )..repeat(reverse: true);

    _loadData();

    // Instant real-time live sync every 2 seconds
    _liveSyncTimer = Timer.periodic(const Duration(seconds: 2), (_) {
      if (mounted) _loadData(silent: true);
    });
  }

  @override
  void dispose() {
    _clockTimer.cancel();
    _liveSyncTimer?.cancel();
    _pulseController.dispose();
    super.dispose();
  }

  Future<void> _loadData({bool silent = false}) async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final user = auth.user;
    if (user == null) return;

    try {
      final data = await _attendance.getTodayPunchStatus(
        userId: user.id,
        employeeCode: user.employeeCode,
      );

      if (mounted) {
        final wasPending = _isPendingApproval;
        final newIsPunchedIn = data['hasPunchedIn'] == true;
        final newIsDoneForDay = data['isDoneForDay'] == true;
        final newIsPendingApproval = data['isPendingApproval'] == true || data['status'] == 'PENDING_APPROVAL';

        // Detect if admin just approved it in real-time
        if (wasPending && !newIsPendingApproval && newIsPunchedIn) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Row(
                children: [
                  Icon(Icons.check_circle_rounded, color: Colors.white, size: 22),
                  SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'অভিনন্দন! অ্যাডমিন আপনার পাঞ্চ অনুমোদন করেছেন। স্ট্যাটাস আপডেট হয়েছে।',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                    ),
                  ),
                ],
              ),
              backgroundColor: AppColors.present,
              duration: Duration(seconds: 4),
            ),
          );
        }

        setState(() {
          _isPunchedIn = newIsPunchedIn;
          _isDoneForDay = newIsDoneForDay;
          _isPendingApproval = newIsPendingApproval;

          final inStr = data['checkInAt'] ?? (data['log'] is Map ? data['log']['checkInAt'] : null);
          if (inStr != null && inStr.toString().isNotEmpty) {
            try {
              final dt = DateTime.parse(inStr.toString()).toLocal();
              _inTime = DateFormat('hh:mm a').format(dt);
            } catch (_) {
              _inTime = inStr.toString();
            }
          }

          final outStr = data['checkOutAt'] ?? (data['log'] is Map ? data['log']['checkOutAt'] : null);
          if (outStr != null && outStr.toString().isNotEmpty) {
            try {
              final dt = DateTime.parse(outStr.toString()).toLocal();
              _outTime = DateFormat('hh:mm a').format(dt);
            } catch (_) {
              _outTime = outStr.toString();
            }
          }

          if (data['liveCheckins'] is List && (data['liveCheckins'] as List).isNotEmpty) {
            _liveCheckins = (data['liveCheckins'] as List)
                .map((e) => AttendanceLog.fromJson(e as Map<String, dynamic>))
                .toList();
          }
        });
      }
    } catch (_) {}
  }

  Future<void> _onPunchButtonPressed() async {
    if (_loading) return;

    if (_isDoneForDay) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('আজকের পাঞ্চ ইন এবং পাঞ্চ আউট সম্পন্ন হয়েছে। দিনে কেবল একবার পাঞ্চ করা যাবে।'),
          backgroundColor: AppColors.primary,
        ),
      );
      return;
    }

    if (_isPendingApproval) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('আপনার পাঞ্চ ইন ইতোমধ্যে জমা হয়েছে এবং অ্যাডমিন অনুমোদনের অপেক্ষায় রয়েছে (Waiting for Approval)।'),
          backgroundColor: AppColors.leave,
        ),
      );
      return;
    }

    final auth = Provider.of<AuthProvider>(context, listen: false);
    final user = auth.user;
    if (user == null) return;

    setState(() {
      _loading = true;
      _statusMsg = null;
    });

    // 1. Fetch current GPS position and location details with dynamic office params
    final locDetails = await _attendance.getLocationDetails(
      officeLat: user.officeLocationLat,
      officeLng: user.officeLocationLng,
      officeRadius: user.officeLocationRadius,
      officeName: user.officeLocationName,
    );

    if (!mounted) return;
    setState(() => _loading = false);

    // Anti-spoofing check
    if (locDetails?['isMocked'] == true) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('ভুয়া জিপিএস (Fake GPS / Mock Location) শনাক্ত হয়েছে! আপনি হাজিরা দিতে পারবেন না।'),
          backgroundColor: AppColors.absent,
        ),
      );
      return;
    }

    if (locDetails == null && !_isWfh) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Location permission / GPS is required. Please turn on GPS and retry.'),
          backgroundColor: AppColors.absent,
        ),
      );
      return;
    }

    // 2. Open confirmation popup with read-only map and address
    _showPunchConfirmationModal(locDetails);
  }

  void _showPunchConfirmationModal(Map<String, dynamic>? locDetails) {
    final now = DateTime.now();
    final timeStr = DateFormat('hh:mm:ss a').format(now);
    final dateStr = DateFormat('EEEE, d MMMM yyyy').format(now);

    final isPunchIn = !_isPunchedIn;
    final actionLabel = isPunchIn ? 'Punch In (হাজিরা প্রবেশ)' : 'Punch Out (হাজিরা প্রস্থান)';
    final actionColor = isPunchIn ? AppColors.present : AppColors.punchOutGradient.colors.first;

    final String address = locDetails != null
        ? (locDetails['address'] ?? 'Coordinates: ${locDetails['latitude']}, ${locDetails['longitude']}')
        : (_isWfh ? 'Work From Home (হোম লোকেশন)' : 'Office Premise');

    final double? distance = locDetails?['distance'];
    final bool isOutOfBounds = locDetails?['isOutOfBounds'] == true;

    final double empLat = (locDetails?['latitude'] as num?)?.toDouble() ?? 23.7330;
    final double empLng = (locDetails?['longitude'] as num?)?.toDouble() ?? 90.4172;
    final double offLat = (locDetails?['officeLat'] as num?)?.toDouble() ?? 23.7330;
    final double offLng = (locDetails?['officeLng'] as num?)?.toDouble() ?? 90.4172;
    final double offRadius = (locDetails?['officeRadius'] as num?)?.toDouble() ?? 200.0;

    final isLate = !_isWfh && (now.hour > 9 || (now.hour == 9 && now.minute > 15));
    final String projectedStatus = _isWfh
        ? 'WFH'
        : (isOutOfBounds ? 'PENDING_APPROVAL' : (isLate ? 'LATE' : 'PRESENT'));

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Container(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
            boxShadow: [
              BoxShadow(
                color: Colors.black12,
                blurRadius: 20,
                offset: Offset(0, -4),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Top Drag Indicator
              Center(
                child: Container(
                  width: 44,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 14),
                  decoration: BoxDecoration(
                    color: AppColors.slate300,
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),

              // Title Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: actionColor.withOpacity(0.12),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(
                          isPunchIn ? Icons.login : Icons.logout,
                          color: actionColor,
                          size: 22,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Confirm Attendance Punch',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                              color: AppColors.textDark,
                            ),
                          ),
                          Text(
                            actionLabel,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: actionColor,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(ctx),
                    icon: const Icon(Icons.close, color: AppColors.textMuted),
                  ),
                ],
              ),
              const SizedBox(height: 14),

              // Current Time Card
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: AppColors.slate100.withOpacity(0.7),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('সময় (Punch Time)', style: TextStyle(fontSize: 10, color: AppColors.textMuted, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 2),
                        Text(
                          timeStr,
                          style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w900, color: AppColors.textDark),
                        ),
                      ],
                    ),
                    Text(
                      dateStr,
                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.textMuted),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),

              // Read-Only Live GPS Map
              if (!_isWfh) ...[
                Container(
                  height: 165,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: isOutOfBounds ? AppColors.leave.withValues(alpha: 0.4) : AppColors.primary.withValues(alpha: 0.3),
                      width: 1.5,
                    ),
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: Stack(
                    children: [
                      FlutterMap(
                        options: MapOptions(
                          initialCenter: LatLng(empLat, empLng),
                          initialZoom: 16.0,
                          interactionOptions: const InteractionOptions(flags: InteractiveFlag.none),
                        ),
                        children: [
                          TileLayer(
                            urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                            userAgentPackageName: 'com.attendancehub.app',
                          ),
                          // Office Geofence Circle
                          CircleLayer(
                            circles: [
                              CircleMarker(
                                point: LatLng(offLat, offLng),
                                color: (isOutOfBounds ? AppColors.leave : AppColors.present).withValues(alpha: 0.18),
                                borderColor: isOutOfBounds ? AppColors.leave : AppColors.present,
                                borderStrokeWidth: 2,
                                radius: offRadius,
                                useRadiusInMeter: true,
                              ),
                            ],
                          ),
                          // Markers
                          MarkerLayer(
                            markers: [
                              // Office Building Marker
                              Marker(
                                point: LatLng(offLat, offLng),
                                width: 34,
                                height: 34,
                                child: Container(
                                  decoration: BoxDecoration(
                                    color: AppColors.primary,
                                    borderRadius: BorderRadius.circular(8),
                                    boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 4)],
                                  ),
                                  child: const Icon(Icons.business, color: Colors.white, size: 20),
                                ),
                              ),
                              // Employee Live Location Marker (Read-Only)
                              Marker(
                                point: LatLng(empLat, empLng),
                                width: 34,
                                height: 34,
                                child: Container(
                                  decoration: BoxDecoration(
                                    color: isOutOfBounds ? AppColors.leave : AppColors.present,
                                    shape: BoxShape.circle,
                                    border: Border.all(color: Colors.white, width: 2.5),
                                    boxShadow: [
                                      BoxShadow(
                                        color: (isOutOfBounds ? AppColors.leave : AppColors.present).withValues(alpha: 0.5),
                                        blurRadius: 8,
                                        spreadRadius: 2,
                                      ),
                                    ],
                                  ),
                                  child: const Icon(Icons.person_pin_circle, color: Colors.white, size: 20),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                      // Top Status Badge
                      Positioned(
                        top: 8,
                        left: 8,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.95),
                            borderRadius: BorderRadius.circular(8),
                            boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 4)],
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                isOutOfBounds ? Icons.cancel : Icons.check_circle,
                                size: 14,
                                color: isOutOfBounds ? AppColors.leave : AppColors.present,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                isOutOfBounds
                                    ? 'সীমানার বাইরে (${distance?.round() ?? 0}m)'
                                    : 'সীমানার ভেতরে (${distance?.round() ?? 0}m)',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  color: isOutOfBounds ? AppColors.leaveText : AppColors.present,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      Positioned(
                        bottom: 6,
                        right: 8,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.65),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: const Text(
                            '🔒 Locked Live GPS',
                            style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
              ],

              // Location Address Card (Prominent & Clear)
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: isOutOfBounds && !_isWfh
                      ? AppColors.leaveBg.withOpacity(0.6)
                      : AppColors.primary.withOpacity(0.06),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isOutOfBounds && !_isWfh
                        ? AppColors.leave.withOpacity(0.4)
                        : AppColors.primary.withOpacity(0.2),
                    width: 1.5,
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(
                          Icons.location_on,
                          color: isOutOfBounds && !_isWfh ? AppColors.leaveText : AppColors.primary,
                          size: 20,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'বর্তমান লোকেশন / ঠিকানা:',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w800,
                            color: isOutOfBounds && !_isWfh ? AppColors.leaveText : AppColors.primary,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      address,
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textDark,
                        height: 1.3,
                      ),
                    ),
                    const SizedBox(height: 10),

                    // Bounds distance badge
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            _isWfh
                                ? Icons.home_work
                                : (isOutOfBounds ? Icons.warning_amber_rounded : Icons.check_circle),
                            size: 15,
                            color: _isWfh
                                ? AppColors.wfh
                                : (isOutOfBounds ? AppColors.leaveText : AppColors.present),
                          ),
                          const SizedBox(width: 6),
                          Flexible(
                            child: Text(
                              _isWfh
                                  ? 'Work From Home (WFH মোড)'
                                  : (isOutOfBounds
                                      ? 'অফিস সীমানার বাইরে (${distance?.round() ?? 0}m দূরে)'
                                      : 'অফিস সীমানার ভেতরে (${distance?.round() ?? 0}m দূরত্ব)'),
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                color: _isWfh
                                    ? AppColors.wfh
                                    : (isOutOfBounds ? AppColors.leaveText : AppColors.present),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),

              // Status Preview
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'প্রত্যাশিত উপস্থিতি স্ট্যাটাস:',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textMuted),
                  ),
                  StatusBadge(status: projectedStatus),
                ],
              ),
              const SizedBox(height: 20),

              // Action Buttons: Cancel & Submit
              Row(
                children: [
                  Expanded(
                    flex: 2,
                    child: OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        side: const BorderSide(color: AppColors.border),
                      ),
                      onPressed: () => Navigator.pop(ctx),
                      child: const Text('বাতিল (Cancel)', style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.textDark)),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    flex: 3,
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: actionColor,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        elevation: 2,
                      ),
                      icon: const Icon(Icons.fingerprint, color: Colors.white, size: 22),
                      label: Text(
                        isPunchIn ? 'পাঞ্চ ইন সাবমিট' : 'পাঞ্চ আউট সাবমিট',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.white),
                      ),
                      onPressed: () {
                        Navigator.pop(ctx);
                        _executePunch(locDetails?['position'], address);
                      },
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Future<void> _executePunch(dynamic position, [String? address]) async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final user = auth.user;
    if (user == null) return;

    setState(() {
      _loading = true;
      _statusMsg = null;
    });

    final targetAction = _isPunchedIn ? 'CHECK_OUT' : 'CHECK_IN';
    final res = await _attendance.punchWithGps(
      userId: user.id,
      employeeCode: user.employeeCode,
      isWfh: _isWfh,
      position: position,
      address: address,
      action: targetAction,
    );

    if (mounted) {
      setState(() {
        _loading = false;
        _msgSuccess = res.ok;
        _statusMsg = res.message;
        if (res.ok) {
          _isPunchedIn = res.hasPunchedIn;
          _isPendingApproval = res.isPendingApproval;
          _isDoneForDay = res.isDoneForDay;
          final nowStr = DateFormat('hh:mm a').format(DateTime.now());
          if (res.action == 'CHECK_IN' || (!res.hasPunchedOut && res.hasPunchedIn)) {
            _inTime = res.checkInAt ?? nowStr;
          } else if (res.action == 'CHECK_OUT' || res.hasPunchedOut) {
            _outTime = res.checkOutAt ?? nowStr;
            _isDoneForDay = true;
          }
        }
      });
      _loadData();
    }
  }

  void _openQrScanner() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        height: MediaQuery.of(ctx).size.height * 0.7,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Scan Lobby QR Code',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(ctx),
                  icon: const Icon(Icons.close),
                ),
              ],
            ),
            const SizedBox(height: 10),
            const Text(
              'Point your phone camera at the QR code displayed on the lobby monitor.',
              style: TextStyle(fontSize: 12, color: AppColors.textMuted),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            Expanded(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(20),
                child: MobileScanner(
                  onDetect: (capture) {
                    final List<Barcode> barcodes = capture.barcodes;
                    if (barcodes.isNotEmpty && barcodes.first.rawValue != null) {
                      final token = barcodes.first.rawValue!;
                      Navigator.pop(ctx);
                      _onQrScanned(token);
                    }
                  },
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _onQrScanned(String token) async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final user = auth.user;
    if (user == null) return;

    setState(() {
      _loading = true;
      _statusMsg = null;
    });

    final res = await _attendance.punchWithQr(
      userId: user.id,
      token: token,
      employeeCode: user.employeeCode,
    );

    if (mounted) {
      setState(() {
        _loading = false;
        _msgSuccess = res.ok;
        _statusMsg = res.message;
        if (res.ok) {
          _isPunchedIn = res.hasPunchedIn;
          _isPendingApproval = res.isPendingApproval;
          _isDoneForDay = res.isDoneForDay;
          final nowStr = DateFormat('hh:mm a').format(DateTime.now());
          if (res.action == 'CHECK_IN' || (!res.hasPunchedOut && res.hasPunchedIn)) {
            _inTime = res.checkInAt ?? nowStr;
          } else if (res.action == 'CHECK_OUT' || res.hasPunchedOut) {
            _outTime = res.checkOutAt ?? nowStr;
            _isDoneForDay = true;
          }
        }
      });
      _loadData();
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final user = auth.user;
    final clockStr = DateFormat('hh:mm:ss a').format(_currentTime);

    final punchLabel = _isDoneForDay
        ? 'Done for Today'
        : (_isPendingApproval
            ? 'Waiting Approval'
            : (_isPunchedIn ? 'Punch Out' : 'Punch In'));

    final punchGradient = _isDoneForDay
        ? const LinearGradient(colors: [Colors.grey, Colors.blueGrey])
        : (_isPendingApproval
            ? const LinearGradient(colors: [Color(0xFFF59E0B), Color(0xFFD97706)])
            : (_isPunchedIn ? AppColors.punchOutGradient : AppColors.primaryGradient));

    return SafeArea(
      bottom: false,
      child: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Column(
        children: [
          // Digital Clock & Status Caption
          Text(
            clockStr,
            style: const TextStyle(
              fontSize: 34,
              fontWeight: FontWeight.w900,
              color: AppColors.textDark,
              letterSpacing: -1,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            _inTime != null
                ? 'In $_inTime${_outTime != null ? ", out $_outTime" : ""}'
                : 'You have not punched in yet today',
            style: const TextStyle(fontSize: 13, color: AppColors.textMuted, fontWeight: FontWeight.w500),
          ),

          // Waiting for approval or Done banner
          if (_isPendingApproval) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              decoration: BoxDecoration(
                color: AppColors.leaveBg,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.leave.withOpacity(0.4), width: 1.5),
              ),
              child: const Row(
                children: [
                  Icon(Icons.hourglass_top_rounded, color: AppColors.leaveText, size: 24),
                  SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Waiting for Admin Approval',
                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: AppColors.leaveText),
                        ),
                        SizedBox(height: 2),
                        Text(
                          'পাঞ্চ ইন সম্পন্ন হয়েছে। অফিস সীমানার বাইরে থাকায় অ্যাডমিনের অনুমোদনের অপেক্ষায় রয়েছে।',
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: AppColors.leaveText),
                        ),
                      ],
                    ),
                  ),
                  SizedBox(width: 8),
                  StatusBadge(status: 'PENDING_APPROVAL'),
                ],
              ),
            ),
          ] else if (_isDoneForDay) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              decoration: BoxDecoration(
                color: AppColors.presentBg,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.present.withOpacity(0.4), width: 1.5),
              ),
              child: const Row(
                children: [
                  Icon(Icons.check_circle_rounded, color: AppColors.present, size: 24),
                  SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Today\'s Attendance Completed',
                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: AppColors.present),
                        ),
                        SizedBox(height: 2),
                        Text(
                          'আজকের পাঞ্চ ইন এবং পাঞ্চ আউট সম্পন্ন হয়েছে। দিনে কেবল একবার পাঞ্চ করা যাবে।',
                          style: TextStyle(fontSize: 11, color: AppColors.textDark),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 24),

          // Big Pulsing Punch Button
          Center(
            child: Stack(
              alignment: Alignment.center,
              children: [
                if (!_isDoneForDay && !_isPendingApproval && !_loading)
                  AnimatedBuilder(
                    animation: _pulseController,
                    builder: (context, child) {
                      return Container(
                        height: 180 + (_pulseController.value * 24),
                        width: 180 + (_pulseController.value * 24),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: (_isPunchedIn ? AppColors.absent : AppColors.primary)
                              .withOpacity(0.18 - (_pulseController.value * 0.12)),
                        ),
                      );
                    },
                  ),
                GestureDetector(
                  onTap: _isDoneForDay || _isPendingApproval || _loading ? _onPunchButtonPressed : _onPunchButtonPressed,
                  child: Container(
                    height: 160,
                    width: 160,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: punchGradient,
                      boxShadow: [
                        BoxShadow(
                          color: (_isPendingApproval
                                  ? AppColors.leave
                                  : (_isPunchedIn ? AppColors.absent : AppColors.primary))
                              .withOpacity(0.35),
                          blurRadius: 28,
                          offset: const Offset(0, 10),
                        ),
                      ],
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        if (_loading)
                          const CircularProgressIndicator(color: Colors.white, strokeWidth: 3)
                        else
                          Icon(
                            _isDoneForDay
                                ? Icons.verified_rounded
                                : (_isPendingApproval
                                    ? Icons.hourglass_top_rounded
                                    : (_isPunchedIn ? Icons.exit_to_app : Icons.location_on)),
                            color: Colors.white,
                            size: 38,
                          ),
                        const SizedBox(height: 8),
                        Text(
                          _loading ? 'Checking...' : punchLabel,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          Text(
            'GPS punch validates presence within ${user?.officeLocationRadius ?? 200}m of ${user?.officeLocationName ?? "Head Office"}.',
            style: const TextStyle(fontSize: 12, color: AppColors.textMuted, fontWeight: FontWeight.w600),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 20),

          // QR Scanner & WFH Buttons
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: AppColors.textDark,
                    elevation: 1,
                    side: const BorderSide(color: AppColors.border),
                  ),
                  onPressed: _openQrScanner,
                  icon: const Icon(Icons.qr_code_scanner, size: 18, color: AppColors.primary),
                  label: const Text('Scan Lobby QR'),
                ),
              ),
            ],
          ),
          if (user?.wfhAllowed == true && !_isPunchedIn) ...[
            const SizedBox(height: 10),
            GlassContainer(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.home_work_outlined, color: AppColors.wfh, size: 20),
                      SizedBox(width: 8),
                      Text('I am working from home (WFH)', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                    ],
                  ),
                  Switch(
                    value: _isWfh,
                    activeColor: AppColors.primary,
                    onChanged: (v) => setState(() => _isWfh = v),
                  ),
                ],
              ),
            ),
          ],

          // Status message box
          if (_statusMsg != null) ...[
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: _msgSuccess ? AppColors.presentBg : AppColors.absentBg,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Row(
                children: [
                  Icon(_msgSuccess ? Icons.check_circle : Icons.warning_amber_rounded,
                      color: _msgSuccess ? AppColors.present : AppColors.absent, size: 20),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      _statusMsg!,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: _msgSuccess ? AppColors.presentText : AppColors.absentText,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 24),

          // Live Check-ins Today
          GlassContainer(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Live Check-ins Today', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.textDark)),
                const SizedBox(height: 12),
                ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: _liveCheckins.length,
                  separatorBuilder: (_, __) => const Divider(color: AppColors.border, height: 16),
                  itemBuilder: (ctx, i) {
                    final l = _liveCheckins[i];
                    return Row(
                      children: [
                        EmployeeAvatar(name: l.userName ?? 'User', size: 36),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(l.userName ?? 'Employee', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
                              Text(l.checkInAddress ?? 'HQ', style: const TextStyle(fontSize: 11, color: AppColors.textMuted), maxLines: 1),
                            ],
                          ),
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(color: AppColors.bg, borderRadius: BorderRadius.circular(6)),
                              child: Text(l.checkInSource ?? 'GPS', style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold)),
                            ),
                            const SizedBox(height: 2),
                            Text(l.checkInAt ?? '', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.textDark)),
                          ],
                        ),
                      ],
                    );
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
        ],
      ),
    ),
    );
  }
}
