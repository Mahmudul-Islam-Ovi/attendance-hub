import { getEmployees } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { PageTitle } from "@/components/ui";
import { EmployeeDirectory } from "@/components/employee-directory";

export const dynamic = "force-dynamic";

export default async function EmployeesPage() {
  const [employees, depts] = await Promise.all([getEmployees(), prisma.department.findMany({ orderBy: { name: "asc" }, select: { name: true } })]);
  return (
    <>
      <PageTitle title="People" sub="Search the directory, then tap a person for their status, tasks and backup." />
      <EmployeeDirectory employees={employees} departments={depts.map((d) => d.name)} />
    </>
  );
}
