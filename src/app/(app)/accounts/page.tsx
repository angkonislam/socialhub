import { getSessionUser } from "@/lib/demo-session";
import { listAccounts } from "@/lib/data";
import { isFacebookLive, isYoutubeLive, isInstagramLive, isTikTokLive, isTelegramLive } from "@/lib/flags";
import { Topbar } from "@/components/topbar";
import { AccountsManager } from "@/components/accounts-manager";

export default async function AccountsPage() {
  const user = await getSessionUser();
  const accounts = await listAccounts(user.id);

  return (
    <>
      <Topbar title="Social Accounts" />
      <div className="p-6">
        <AccountsManager
          initialAccounts={accounts}
          facebookLive={isFacebookLive()}
          youtubeLive={isYoutubeLive()}
          instagramLive={isInstagramLive()}
          tiktokLive={isTikTokLive()}
          telegramLive={isTelegramLive()}
        />
      </div>
    </>
  );
}
