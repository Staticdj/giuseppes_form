"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Alert } from "@/components/ui/Alert";
import { reopenReport } from "@/actions/report";

export function ReopenButton({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleReopen() {
    setError(null);
    startTransition(async () => {
      const result = await reopenReport(reportId);
      if (result.success) {
        setOpen(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        Reopen
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Reopen Report"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleReopen}
              loading={isPending}
            >
              Yes, Reopen
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          {error && <Alert type="error" message={error} />}
          <p className="text-gray-700 text-sm">
            This will change the report status back to <strong>Draft</strong>,
            allowing edits. Are you sure?
          </p>
        </div>
      </Modal>
    </>
  );
}
