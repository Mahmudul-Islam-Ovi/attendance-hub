import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'package:latlong2/latlong.dart';
import 'package:url_launcher/url_launcher.dart';
import '../constants/app_colors.dart';
import '../models/office_location_model.dart';
import '../services/workflow_service.dart';
import '../widgets/glass_container.dart';

class OfficeLocationsScreen extends StatefulWidget {
  const OfficeLocationsScreen({super.key});

  @override
  State<OfficeLocationsScreen> createState() => _OfficeLocationsScreenState();
}

class _OfficeLocationsScreenState extends State<OfficeLocationsScreen> {
  final WorkflowService _workflow = WorkflowService();
  List<OfficeLocationModel> _offices = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadOffices();
  }

  Future<void> _loadOffices() async {
    setState(() => _loading = true);
    final data = await _workflow.getOffices();
    if (mounted) {
      setState(() {
        _offices = data;
        _loading = false;
      });
    }
  }

  void _openAddEditDialog([OfficeLocationModel? office]) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _OfficeFormBottomSheet(
        office: office,
        onSaved: () {
          _loadOffices();
        },
      ),
    );
  }

  Future<void> _deleteOffice(OfficeLocationModel office) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Office Location?'),
        content: Text('Are you sure you want to remove "${office.name}"?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (confirm == true) {
      final ok = await _workflow.deleteOffice(office.id);
      if (mounted) {
        if (ok) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('"${office.name}" deleted successfully.')),
          );
          _loadOffices();
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Failed to delete office location. At least one must remain.'),
              backgroundColor: AppColors.absent,
            ),
          );
        }
      }
    }
  }

  Future<void> _openGoogleMaps(double lat, double lng) async {
    final uri = Uri.parse('https://www.google.com/maps?q=$lat,$lng');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Office Geofence & Locations', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadOffices,
            tooltip: 'Refresh',
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppColors.primary,
        onPressed: () => _openAddEditDialog(),
        icon: const Icon(Icons.add_location_alt, color: Colors.white),
        label: const Text('Add Office', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _offices.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.location_off_outlined, size: 64, color: AppColors.textMuted),
                      const SizedBox(height: 12),
                      const Text(
                        'No Office Locations Found',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textDark),
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'Tap the button below to add your first geofenced office.',
                        style: TextStyle(fontSize: 13, color: AppColors.textMuted),
                      ),
                      const SizedBox(height: 20),
                      ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
                        onPressed: () => _openAddEditDialog(),
                        icon: const Icon(Icons.add, color: Colors.white),
                        label: const Text('Add Office Location', style: TextStyle(color: Colors.white)),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadOffices,
                  child: ListView.builder(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
                    itemCount: _offices.length,
                    itemBuilder: (context, i) {
                      final office = _offices[i];
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 14),
                        child: GlassContainer(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(10),
                                    decoration: BoxDecoration(
                                      color: AppColors.primary.withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: const Icon(Icons.business, color: AppColors.primary, size: 24),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          children: [
                                            Expanded(
                                              child: Text(
                                                office.name,
                                                style: const TextStyle(
                                                  fontSize: 16,
                                                  fontWeight: FontWeight.bold,
                                                  color: AppColors.textDark,
                                                ),
                                              ),
                                            ),
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                              decoration: BoxDecoration(
                                                color: office.isActive
                                                    ? AppColors.present.withOpacity(0.12)
                                                    : Colors.grey.withOpacity(0.15),
                                                borderRadius: BorderRadius.circular(8),
                                              ),
                                              child: Text(
                                                office.isActive ? 'Active' : 'Inactive',
                                                style: TextStyle(
                                                  fontSize: 11,
                                                  fontWeight: FontWeight.bold,
                                                  color: office.isActive ? AppColors.present : Colors.grey[700],
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                        if (office.address.isNotEmpty) ...[
                                          const SizedBox(height: 4),
                                          Text(
                                            office.address,
                                            style: const TextStyle(fontSize: 13, color: AppColors.textMuted),
                                          ),
                                        ],
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                              const Divider(height: 24),
                              Row(
                                children: [
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const Text('COORDINATES', style: TextStyle(fontSize: 10, color: AppColors.textMuted, fontWeight: FontWeight.bold)),
                                        const SizedBox(height: 2),
                                        Text(
                                          '${office.latitude.toStringAsFixed(4)}°, ${office.longitude.toStringAsFixed(4)}°',
                                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, fontFamily: 'monospace'),
                                        ),
                                      ],
                                    ),
                                  ),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const Text('GEOFENCE RADIUS', style: TextStyle(fontSize: 10, color: AppColors.textMuted, fontWeight: FontWeight.bold)),
                                        const SizedBox(height: 2),
                                        Text(
                                          '± ${office.radiusMeters} Meters',
                                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primary),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    '${office.employeeCount} Assigned • ${office.punchCount} Punches',
                                    style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                                  ),
                                  Row(
                                    children: [
                                      IconButton(
                                        icon: const Icon(Icons.map_outlined, size: 20, color: AppColors.primary),
                                        tooltip: 'Open in Maps',
                                        onPressed: () => _openGoogleMaps(office.latitude, office.longitude),
                                      ),
                                      IconButton(
                                        icon: const Icon(Icons.edit_outlined, size: 20, color: Colors.blueGrey),
                                        tooltip: 'Edit Location',
                                        onPressed: () => _openAddEditDialog(office),
                                      ),
                                      IconButton(
                                        icon: const Icon(Icons.delete_outline, size: 20, color: Colors.redAccent),
                                        tooltip: 'Delete',
                                        onPressed: () => _deleteOffice(office),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}

class _OfficeFormBottomSheet extends StatefulWidget {
  final OfficeLocationModel? office;
  final VoidCallback onSaved;

  const _OfficeFormBottomSheet({this.office, required this.onSaved});

  @override
  State<_OfficeFormBottomSheet> createState() => _OfficeFormBottomSheetState();
}

class _OfficeFormBottomSheetState extends State<_OfficeFormBottomSheet> {
  final _formKey = GlobalKey<FormState>();
  final WorkflowService _workflow = WorkflowService();

  late TextEditingController _nameCtrl;
  late TextEditingController _addressCtrl;
  late TextEditingController _latCtrl;
  late TextEditingController _lngCtrl;

  int _radiusMeters = 150;
  bool _isActive = true;
  bool _saving = false;
  bool _locating = false;
  String? _gpsMessage;

  @override
  void initState() {
    super.initState();
    final o = widget.office;
    _nameCtrl = TextEditingController(text: o?.name ?? '');
    _addressCtrl = TextEditingController(text: o?.address ?? '');
    _latCtrl = TextEditingController(text: o?.latitude.toString() ?? '23.7330');
    _lngCtrl = TextEditingController(text: o?.longitude.toString() ?? '90.4172');
    _radiusMeters = o?.radiusMeters ?? 150;
    _isActive = o?.isActive ?? true;
  }

  final MapController _mapController = MapController();
  bool _addressLoading = false;

  Future<void> _reverseGeocode(double lat, double lng) async {
    setState(() => _addressLoading = true);
    try {
      final url = Uri.parse(
        'https://nominatim.openstreetmap.org/reverse?format=json&lat=$lat&lon=$lng&zoom=18&addressdetails=1',
      );
      final res = await http.get(url, headers: {'User-Agent': 'AttendanceHubApp/1.0'}).timeout(
        const Duration(seconds: 4),
      );
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (data['display_name'] != null) {
          final parts = (data['display_name'] as String).split(',');
          final shortAddr = parts.length > 4 ? parts.take(4).join(',').trim() : (data['display_name'] as String).trim();
          if (mounted) {
            setState(() {
              _addressCtrl.text = shortAddr;
            });
          }
        }
      }
    } catch (_) {
    } finally {
      if (mounted) setState(() => _addressLoading = false);
    }
  }

  void _onMapTapped(TapPosition tapPosition, LatLng point) {
    setState(() {
      _latCtrl.text = point.latitude.toStringAsFixed(6);
      _lngCtrl.text = point.longitude.toStringAsFixed(6);
      _gpsMessage = 'Location picked: ${point.latitude.toStringAsFixed(4)}, ${point.longitude.toStringAsFixed(4)}';
    });
    _reverseGeocode(point.latitude, point.longitude);
  }

  @override
  void dispose() {
    _nameCtrl.dispose;
    _addressCtrl.dispose();
    _latCtrl.dispose();
    _lngCtrl.dispose();
    super.dispose();
  }

  Future<void> _captureCurrentLocation() async {
    setState(() {
      _locating = true;
      _gpsMessage = 'Detecting current GPS coordinates...';
    });

    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        setState(() {
          _locating = false;
          _gpsMessage = 'Location services are disabled on your device.';
        });
        return;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          setState(() {
            _locating = false;
            _gpsMessage = 'Location permissions denied.';
          });
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        setState(() {
          _locating = false;
          _gpsMessage = 'Location permissions permanently denied.';
        });
        return;
      }

      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 12),
      );

      final latDouble = position.latitude;
      final lngDouble = position.longitude;

      _latCtrl.text = lat;
      _lngCtrl.text = lng;

      // Pan map to detected coordinates
      _mapController.move(LatLng(latDouble, lngDouble), 16.5);

      // Try reverse geocoding via OpenStreetMap Nominatim
      try {
        final url = Uri.parse(
          'https://nominatim.openstreetmap.org/reverse?format=json&lat=$lat&lon=$lng&zoom=18&addressdetails=1',
        );
        final res = await http.get(url, headers: {'User-Agent': 'AttendanceHubApp/1.0'}).timeout(
          const Duration(seconds: 4),
        );
        if (res.statusCode == 200) {
          final data = jsonDecode(res.body);
          if (data['display_name'] != null && _addressCtrl.text.trim().isEmpty) {
            final parts = (data['display_name'] as String).split(',');
            _addressCtrl.text = parts.take(3).join(',').trim();
          }
        }
      } catch (_) {}

      setState(() {
        _locating = false;
        _gpsMessage = 'GPS Captured! Lat: $lat, Lng: $lng';
      });
    } catch (e) {
      setState(() {
        _locating = false;
        _gpsMessage = 'GPS Error: $e';
      });
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _saving = true);

    final payload = {
      if (widget.office != null) 'id': widget.office!.id,
      'name': _nameCtrl.text.trim(),
      'address': _addressCtrl.text.trim(),
      'latitude': double.tryParse(_latCtrl.text.trim()) ?? 23.7330,
      'longitude': double.tryParse(_lngCtrl.text.trim()) ?? 90.4172,
      'radiusMeters': _radiusMeters,
      'isActive': _isActive,
    };

    final res = await _workflow.saveOffice(payload);

    if (mounted) {
      setState(() => _saving = false);
      if (res['ok'] == true) {
        Navigator.pop(context);
        widget.onSaved();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(widget.office != null ? 'Office location updated!' : 'Office location added!'),
            backgroundColor: AppColors.present,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(res['error'] ?? 'Failed to save location'),
            backgroundColor: AppColors.absent,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.office != null;
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.fromLTRB(20, 20, 20, MediaQuery.of(context).viewInsets.bottom + 20),
      child: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    isEdit ? 'Edit Office Geofence' : 'Add New Office Location',
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textDark),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const Divider(),
              const SizedBox(height: 8),

              TextFormField(
                controller: _nameCtrl,
                decoration: const InputDecoration(
                  labelText: 'Office Name *',
                  hintText: 'e.g. Head Office, Banani Branch',
                  prefixIcon: Icon(Icons.business_outlined),
                ),
                validator: (v) => (v == null || v.trim().isEmpty) ? 'Name is required' : null,
              ),
              const SizedBox(height: 12),

              TextFormField(
                controller: _addressCtrl,
                decoration: const InputDecoration(
                  labelText: 'Address (Optional)',
                  hintText: 'e.g. Level 4, Plot 10, Road 4, Dhaka',
                  prefixIcon: Icon(Icons.pin_drop_outlined),
                ),
              ),
              const SizedBox(height: 16),

              // GPS Capture Card
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.06),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.primary.withOpacity(0.2)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.my_location, color: AppColors.primary, size: 20),
                        const SizedBox(width: 8),
                        const Expanded(
                          child: Text(
                            'One-Tap GPS Auto-Detection',
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.primary),
                          ),
                        ),
                        ElevatedButton.icon(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                          onPressed: _locating ? null : _captureCurrentLocation,
                          icon: _locating
                              ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                              : const Icon(Icons.gps_fixed, size: 14, color: Colors.white),
                          label: Text(
                            _locating ? 'Detecting...' : '📍 Capture GPS',
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white),
                          ),
                        ),
                      ],
                    ),
                    if (_gpsMessage != null) ...[
                      const SizedBox(height: 8),
                      Text(
                        _gpsMessage!,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: _gpsMessage!.contains('Captured') || _gpsMessage!.contains('picked') ? AppColors.present : Colors.orange[800],
                        ),
                      ),
                    ],
                    const SizedBox(height: 12),

                    // Interactive OpenStreetMap Location Picker
                    Builder(
                      builder: (context) {
                        final currentLat = double.tryParse(_latCtrl.text.trim()) ?? 23.7330;
                        final currentLng = double.tryParse(_lngCtrl.text.trim()) ?? 90.4172;

                        return Container(
                          height: 210,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: AppColors.border),
                          ),
                          clipBehavior: Clip.antiAlias,
                          child: Stack(
                            children: [
                              FlutterMap(
                                mapController: _mapController,
                                options: MapOptions(
                                  initialCenter: LatLng(currentLat, currentLng),
                                  initialZoom: 16.0,
                                  onTap: _onMapTapped,
                                ),
                                children: [
                                  TileLayer(
                                    urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                                    userAgentPackageName: 'com.attendancehub.app',
                                  ),
                                  CircleLayer(
                                    circles: [
                                      CircleMarker(
                                        point: LatLng(currentLat, currentLng),
                                        color: AppColors.primary.withValues(alpha: 0.18),
                                        borderColor: AppColors.primary,
                                        borderStrokeWidth: 2,
                                        radius: _radiusMeters.toDouble(),
                                        useRadiusInMeter: true,
                                      ),
                                    ],
                                  ),
                                  MarkerLayer(
                                    markers: [
                                      Marker(
                                        point: LatLng(currentLat, currentLng),
                                        width: 38,
                                        height: 38,
                                        child: const Icon(Icons.location_on, color: AppColors.primary, size: 36),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                              Positioned(
                                bottom: 8,
                                left: 8,
                                right: 8,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                  decoration: BoxDecoration(
                                    color: Colors.black.withValues(alpha: 0.72),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      const Icon(Icons.touch_app, size: 14, color: Colors.white70),
                                      const SizedBox(width: 6),
                                      const Text(
                                        'ম্যাপে ট্যাপ করে পিন বসান',
                                        style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600),
                                      ),
                                      if (_addressLoading) ...[
                                        const SizedBox(width: 8),
                                        const SizedBox(
                                          width: 10,
                                          height: 10,
                                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.amber),
                                        ),
                                      ],
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                    const SizedBox(height: 12),

                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: _latCtrl,
                            keyboardType: const TextInputType.numberWithOptions(decimal: true),
                            decoration: const InputDecoration(labelText: 'Latitude *'),
                            validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: TextFormField(
                            controller: _lngCtrl,
                            keyboardType: const TextInputType.numberWithOptions(decimal: true),
                            decoration: const InputDecoration(labelText: 'Longitude *'),
                            validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Radius
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Geofence Radius:', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                  Text('$_radiusMeters Meters', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.primary)),
                ],
              ),
              Slider(
                value: _radiusMeters.toDouble(),
                min: 30,
                max: 1000,
                divisions: 97,
                activeColor: AppColors.primary,
                label: '$_radiusMeters m',
                onChanged: (v) => setState(() => _radiusMeters = v.toInt()),
              ),
              Wrap(
                spacing: 8,
                children: [50, 100, 150, 200, 300, 500].map((r) {
                  final isSelected = _radiusMeters == r;
                  return ChoiceChip(
                    label: Text('${r}m'),
                    selected: isSelected,
                    selectedColor: AppColors.primary.withOpacity(0.2),
                    labelStyle: TextStyle(
                      color: isSelected ? AppColors.primary : AppColors.textDark,
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                      fontSize: 12,
                    ),
                    onSelected: (_) => setState(() => _radiusMeters = r),
                  );
                }).toList(),
              ),
              const SizedBox(height: 8),

              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Active Office', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                subtitle: const Text('Employees can punch in at this office', style: TextStyle(fontSize: 12, color: AppColors.textMuted)),
                value: _isActive,
                activeColor: AppColors.primary,
                onChanged: (v) => setState(() => _isActive = v),
              ),
              const SizedBox(height: 20),

              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                onPressed: _saving ? null : _submit,
                child: _saving
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : Text(
                        isEdit ? 'Update Office Location' : 'Save Office Location',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.white),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
