import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Custom 404 page. */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <Compass className="h-7 w-7" />
      </div>
      <h1 className="text-4xl font-bold">404</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        We couldn&apos;t find the page you were looking for.
      </p>
      <div className="flex gap-2">
        <Link href="/">
          <Button variant="outline">Home</Button>
        </Link>
        <Link href="/dashboard">
          <Button>Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
