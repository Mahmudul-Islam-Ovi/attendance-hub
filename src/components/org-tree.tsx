"use client";
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import type { OrgTreeNode } from "@/lib/data";
import { Avatar, LEVEL_LABEL, STATUS } from "./ui";
import { cn } from "@/lib/utils";

function Node({ n, depth }: { n: OrgTreeNode; depth: number }) {
  const [open, setOpen] = useState(depth < 2);
  const has = n.children.length > 0;
  return (
    <li>
      <div className="glass flex items-center gap-3 rounded-2xl p-3">
        {has ? (
          <button onClick={() => setOpen(!open)} aria-expanded={open} aria-label={open ? "Collapse" : "Expand"} className="rounded-lg p-1 text-slate-500 hover:bg-white">
            <ChevronRight className={cn("h-4 w-4 transition-transform", open && "rotate-90")} />
          </button>
        ) : <span className="w-6" />}
        <Avatar name={n.name} color={n.color} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{n.name}</p>
          <p className="truncate text-xs text-slate-500">{n.position}{n.dept ? ` - ${n.dept}` : ""}</p>
        </div>
        <span className="hidden rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 sm:inline">{LEVEL_LABEL[n.level]}</span>
        <span className={cn("h-3 w-3 shrink-0 rounded-full", STATUS[n.status].dot)} title={STATUS[n.status].label} />
      </div>
      {has && open && (
        <ul className="ml-4 mt-2 space-y-2 border-l-2 border-indigo-200/80 pl-3 sm:ml-8 sm:pl-5">
          {n.children.map((c) => <Node key={c.id} n={c} depth={depth + 1} />)}
        </ul>
      )}
    </li>
  );
}

export function OrgTree({ roots }: { roots: OrgTreeNode[] }) {
  return <ul className="space-y-2">{roots.map((r) => <Node key={r.id} n={r} depth={0} />)}</ul>;
}
