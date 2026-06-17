import { getSessionUser } from "@/lib/demo-session";
import { listAccounts, listTemplates } from "@/lib/data";
import { Topbar } from "@/components/topbar";
import { Composer } from "@/components/composer";

export default async function ComposePage() {
  const user = await getSessionUser();
  const [accounts, templates] = await Promise.all([
    listAccounts(user.id),
    listTemplates(user.id),
  ]);

  return (
    <>
      <Topbar title="Compose Post" />
      <div className="p-6">
        <Composer accounts={accounts} templates={templates} />
      </div>
    </>
  );
}
