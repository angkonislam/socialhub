import Link from "next/link";
import { PenSquare } from "lucide-react";
import { getSessionUser } from "@/lib/demo-session";
import { listPosts } from "@/lib/data";
import { Topbar } from "@/components/topbar";
import { PostsList } from "@/components/posts-list";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function PostsPage() {
  const user = await getSessionUser();
  const posts = await listPosts(user.id);

  return (
    <>
      <Topbar title="Posts" />
      <div className="p-6">
        {posts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <PenSquare className="h-6 w-6" />
              </div>
              <p className="font-medium">No posts yet</p>
              <p className="text-sm text-muted-foreground">
                Create your first post and publish it across your channels.
              </p>
              <Link href="/compose">
                <Button>
                  <PenSquare className="h-4 w-4" /> Compose a post
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <PostsList posts={posts} />
        )}
      </div>
    </>
  );
}
