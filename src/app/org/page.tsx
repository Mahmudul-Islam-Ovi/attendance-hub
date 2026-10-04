import { getOrgTree } from "@/lib/data";
import { PageTitle, STATUS } from "@/components/ui";
import { OrgTree } from "@/components/org-tree";

export const dynamic = "force-dynamic";

export default async function OrgPage() {
  const roots = await getOrgTree();
  return (
    <>
      <PageTitle title="Organisation" sub="CEO, directors, department heads, managers, team leads and employees. The dot shows today's status." />
      <div className="mb-4 flex flex-wrap gap-3 text-xs text-slate-600">
        {Object.values(STATUS).map((s) => <span key={s.label} className="flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} /> {s.label}</span>)}
      </div>
      {roots.length ? <OrgTree roots={roots} /> : <p className="text-sm text-slate-500">No org data yet. Run <code>npm run db:seed</code>.</p>}
    </>
  );
}
