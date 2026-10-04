"use client";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function TrendChart({ data }: { data: { day: string; present: number; late: number; wfh: number }[] }) {
  return (
    <div className="h-60 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barSize={20}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
          <YAxis tickLine={false} axisLine={false} width={28} fontSize={12} allowDecimals={false} />
          <Tooltip cursor={{ fill: "rgba(99,102,241,0.08)" }} contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 8px 30px rgba(15,23,42,.12)" }} />
          <Bar dataKey="present" name="Present" stackId="a" fill="#10b981" />
          <Bar dataKey="late" name="Late" stackId="a" fill="#f97316" />
          <Bar dataKey="wfh" name="WFH" stackId="a" fill="#3b82f6" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
