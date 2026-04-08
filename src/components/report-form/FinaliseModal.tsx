"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface FinaliseModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  signedOffBy: string;
  venueName: string;
  reportDate: string;
}

export function FinaliseModal({
  open,
  onClose,
  onConfirm,
  signedOffBy,
  venueName,
  reportDate,
}: FinaliseModalProps) {
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Finalise Report"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleConfirm} loading={loading}>
            Yes, Finalise
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-gray-700">
          You are about to finalise the End of Trade report for:
        </p>
        <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm space-y-1">
          <div>
            <span className="text-gray-500">Venue: </span>
            <span className="font-medium">{venueName}</span>
          </div>
          <div>
            <span className="text-gray-500">Date: </span>
            <span className="font-medium">{reportDate}</span>
          </div>
          <div>
            <span className="text-gray-500">Signed off by: </span>
            <span className="font-medium">{signedOffBy}</span>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Once finalised, the report will be locked. Managers and admins can
          reopen it if needed.
        </p>
        <p className="text-sm font-medium text-gray-800">
          Are you sure you want to finalise this report?
        </p>
      </div>
    </Modal>
  );
}
