import { getSessionUser } from "@/lib/demo-session";
import { listPosts } from "@/lib/data";
import { Topbar } from "@/components/topbar";
import { CalendarView } from "@/components/calendar-view";

export default async function SchedulePage() {
  const user = await getSessionUser();
  const all = await listPosts(user.id);
  // Show scheduled + published posts on the calendar.
  const dated = all.filter(
    (p) => p.status === "scheduled" || p.status === "published"
  );

  return (
    <>
      <Topbar title="Content Calendar" />
      <div className="p-6">
        <CalendarView posts={dated} />
      </div>
    </>
  );
}
