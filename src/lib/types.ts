export type UiStatus = "PRESENT" | "LATE" | "ABSENT" | "ON_LEAVE" | "WFH";

export type TaskRow = {
  id: string; title: string; status: string; priority: string;
  progress: number; dueDate: string | null; overdue: boolean; coveredBy: string | null;
};

export type EmployeeRow = {
  id: string; name: string; email: string; phone: string | null; employeeCode: string;
  avatarUrl: string | null;
  designation: string | null; level: string; dept: string | null; deptCode: string | null; deptColor: string | null;
  manager: string | null; status: UiStatus;
  checkIn: string | null; checkOut: string | null; source: string | null;
  lat: number | null; lng: number | null; address: string | null;
  leave: { start: string; end: string; type: string } | null; backup: string | null;
  tasks: TaskRow[];
};
