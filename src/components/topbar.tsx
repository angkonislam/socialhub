import Image from "next/image";
import { getSessionUser } from "@/lib/demo-session";
import { ThemeToggle } from "@/components/theme-toggle";

export async function Topbar({ title }: { title: string }) {
  const user = await getSessionUser();

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur">
      <h1 className="text-lg font-semibold">{title}</h1>

      <div className="flex items-center gap-3">
        <ThemeToggle />

        <div className="flex items-center gap-2">
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name ?? "User"}
              width={32}
              height={32}
              className="rounded-full"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-medium text-accent-foreground">
              {(user.name ?? "U").charAt(0).toUpperCase()}
            </div>
          )}
          <span className="hidden text-sm font-medium sm:inline">
            {user.name ?? "Demo User"}
          </span>
        </div>
      </div>
    </header>
  );
}
