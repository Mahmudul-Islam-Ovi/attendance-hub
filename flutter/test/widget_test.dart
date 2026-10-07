import 'package:flutter_test/flutter_test.dart';
import 'package:attendance_hub/main.dart';

void main() {
  testWidgets('App smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const AttendanceHubApp());
    expect(find.byType(AttendanceHubApp), findsOneWidget);
  });
}
