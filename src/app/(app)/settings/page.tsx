import { getSessionUser } from "@/lib/demo-session";
import { getSettings, listTemplates, listWebhooks } from "@/lib/data";
import { Topbar } from "@/components/topbar";
import { SettingsForm } from "@/components/settings-form";
import { TemplatesManager } from "@/components/templates-manager";
import { WebhooksManager } from "@/components/webhooks-manager";

export default async function SettingsPage() {
  const user = await getSessionUser();
  const [settings, templates, webhooks] = await Promise.all([
    getSettings(user.id),
    listTemplates(user.id),
    listWebhooks(user.id),
  ]);

  return (
    <>
      <Topbar title="Settings" />
      <div className="max-w-3xl space-y-6 p-6">
        <SettingsForm initial={settings} />
        <TemplatesManager initial={templates} />
        <WebhooksManager initial={webhooks} />
      </div>
    </>
  );
}
