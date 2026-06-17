import { getSessionUser } from "@/lib/demo-session";
import { listMembers } from "@/lib/data";
import { Topbar } from "@/components/topbar";
import { TeamManager } from "@/components/team-manager";

export default async function TeamPage() {
  const user = await getSessionUser();
  const members = await listMembers(user.id);

  return (
    <>
      <Topbar title="Team & Workspace" />
      <div className="max-w-3xl p-6">
        <TeamManager initial={members} />
      </div>
    </>
  );
}
