"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Settings > Security: delete the account and everything it owns.
export function DeleteAccountSection({ email }: { email?: string | null }) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const expected = email || "DELETE";

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch("/api/user", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to delete your account");
        setDeleting(false);
        return;
      }
      await signOut({ callbackUrl: "/" });
    } catch {
      setError("Failed to delete your account");
      setDeleting(false);
    }
  };

  return (
    <div className="rounded-xl border border-red-300 bg-card p-6 dark:border-red-900">
      <h2 className="mb-2 font-semibold text-red-600 dark:text-red-400">Delete account</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Deletes your account, your blueprints (including the ones you shared with a team),
        drafts, saved variables, API tokens and passkeys. Your support forum posts and
        comments stay but no longer show your name. This cannot be undone.
      </p>
      {!open ? (
        <Button
          variant="outline"
          onClick={() => setOpen(true)}
          className="border-red-400 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete my account
        </Button>
      ) : (
        <div className="space-y-3">
          <label className="block text-sm">
            Type <span className="font-mono font-medium">{expected}</span> to confirm
            <input
              type="text"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2"
              autoFocus
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button
              onClick={handleDelete}
              disabled={deleting || confirm.trim().toLowerCase() !== expected.toLowerCase()}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleting ? "Deleting..." : "Delete my account"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setOpen(false);
                setConfirm("");
                setError(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
