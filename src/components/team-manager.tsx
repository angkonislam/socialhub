"use client";

import { useState } from "react";
import { toast } from "sonner";
import { UserPlus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { WorkspaceMember, WorkspaceRole } from "@/lib/types";

const ROLE_STYLE: Record<WorkspaceRole, string> = {
  owner: "bg-primary/15 text-primary",
  editor: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  viewer: "bg-slate-500/15 text-slate-600 dark:text-slate-300",
};

/** Workspace team: list members, invite, change role, remove. */
export function TeamManager({ initial }: { initial: WorkspaceMember[] }) {
  const [members, setMembers] = useState(initial);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [removing, setRemoving] = useState<WorkspaceMember | null>(null);
  const [busy, setBusy] = useState(false);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<WorkspaceRole>("editor");

  async function invite() {
    if (!email || !name) {
      toast.error("Name and email are required");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, role }),
      });
      if (!res.ok) throw new Error();
      const { member } = await res.json();
      setMembers((prev) => [...prev, member]);
      toast.success(`Invited ${name}`);
      setInviteOpen(false);
      setEmail("");
      setName("");
      setRole("editor");
    } catch {
      toast.error("Could not invite member");
    } finally {
      setBusy(false);
    }
  }

  async function changeRole(id: string, newRole: WorkspaceRole) {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, role: newRole } : m))
    );
    const res = await fetch("/api/members", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, role: newRole }),
    });
    if (res.ok) toast.success("Role updated");
    else toast.error("Could not update role");
  }

  async function remove() {
    if (!removing) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/members?id=${removing.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setMembers((prev) => prev.filter((m) => m.id !== removing.id));
      toast.success("Member removed");
      setRemoving(null);
    } catch {
      toast.error("Could not remove member");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {members.length} member{members.length !== 1 && "s"} in this workspace
        </p>
        <Button size="sm" onClick={() => setInviteOpen(true)}>
          <UserPlus className="h-4 w-4" /> Invite member
        </Button>
      </div>

      <div className="space-y-3">
        {members.map((m) => (
          <Card key={m.id}>
            <CardContent className="flex items-center justify-between pt-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent font-medium text-accent-foreground">
                  {m.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {m.role === "owner" ? (
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${ROLE_STYLE.owner}`}
                  >
                    owner
                  </span>
                ) : (
                  <select
                    value={m.role}
                    onChange={(e) => changeRole(m.id, e.target.value as WorkspaceRole)}
                    className="rounded-lg border border-input bg-background px-2 py-1 text-xs capitalize outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="editor">editor</option>
                    <option value="viewer">viewer</option>
                  </select>
                )}
                {m.role !== "owner" && (
                  <button
                    onClick={() => setRemoving(m)}
                    className="rounded p-1.5 text-destructive hover:bg-accent"
                    aria-label="Remove member"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Invite modal */}
      <Dialog open={inviteOpen} onClose={() => setInviteOpen(false)}>
        <h2 className="text-lg font-semibold">Invite a team member</h2>
        <div className="mt-4 space-y-3">
          <Input
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as WorkspaceRole)}
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm capitalize outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="editor">Editor — can create & publish</option>
            <option value="viewer">Viewer — read only</option>
          </select>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setInviteOpen(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={invite} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Send invite
          </Button>
        </div>
      </Dialog>

      <ConfirmDialog
        open={!!removing}
        title="Remove member?"
        message={`${removing?.name} will lose access to this workspace.`}
        confirmLabel="Remove"
        loading={busy}
        onConfirm={remove}
        onClose={() => setRemoving(null)}
      />
    </div>
  );
}
