import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/demo-session";
import { addAccount, listAccounts } from "@/lib/data";

interface TelegramChat {
  id: number;
  title?: string;
  username?: string;
  type: string;
  photo?: { small_file_id: string };
}

export async function POST(req: Request) {
  try {
    const { bot_token, channel } = await req.json() as { bot_token: string; channel: string };

    if (!bot_token?.trim() || !channel?.trim()) {
      return NextResponse.json({ error: "bot_token and channel are required" }, { status: 400 });
    }

    const chatId = channel.startsWith("@") ? channel : `@${channel}`;

    // Verify bot can access the channel
    const tgRes = await fetch(
      `https://api.telegram.org/bot${bot_token}/getChat?chat_id=${encodeURIComponent(chatId)}`,
      { cache: "no-store" }
    );
    const tgJson = await tgRes.json();

    if (!tgRes.ok || !tgJson.ok) {
      const desc: string = tgJson.description ?? "Could not access this channel";
      return NextResponse.json({ error: desc }, { status: 400 });
    }

    const chat: TelegramChat = tgJson.result;
    if (chat.type !== "channel" && chat.type !== "supergroup") {
      return NextResponse.json({ error: "Only channels and supergroups are supported" }, { status: 400 });
    }

    const externalId = String(chat.id);
    const displayName = chat.title ?? chat.username ?? chatId;

    const { id: userId } = await getSessionUser();
    const existing = await listAccounts(userId);
    const alreadyConnected = existing.some(
      (a) => a.platform === "telegram" && a.external_id === externalId
    );

    if (alreadyConnected) {
      return NextResponse.json({ already_connected: true });
    }

    const account = await addAccount({
      user_id: userId,
      platform: "telegram",
      account_type: "telegram_channel",
      external_id: externalId,
      display_name: displayName,
      avatar_url: null,
      access_token: bot_token,
    });

    return NextResponse.json({ account });
  } catch (err) {
    console.error("[Telegram connect error]", err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
