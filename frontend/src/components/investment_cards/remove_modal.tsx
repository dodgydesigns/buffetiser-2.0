import { useState } from "react";
import type { Investment } from "./types";

import "../menu/popup_styles.css";
import "react-datepicker/dist/react-datepicker.css";
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

type RemoveModalProps = {
  investment: Pick<Investment, "id" | "symbol" | "name">;
  endpoint: string;
  onClose: (saved: boolean) => void;
};

function RemoveModal({ investment, endpoint, onClose }: RemoveModalProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (investment.id === undefined) {
      setError("This investment does not have a database key.");
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const response = await fetch(
        `${endpoint}/${encodeURIComponent(String(investment.id))}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Delete failed (${response.status})`);
      }

      onClose(true);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete investment."
      );
      setDeleting(false);
    }
  };

  return (
    <Dialog
      open
      onClose={() => {
        if (!deleting) onClose(false);
      }}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Delete Investment?</DialogTitle>
      <DialogContent dividers>
        <Typography gutterBottom>
          Are you sure you want to permanently delete{" "}
          <strong>{investment.name} ({investment.symbol})</strong>?
        </Typography>
        <Typography color="error" gutterBottom>
          This will also delete every purchase, sale, dividend and price-history
          record for this investment.
        </Typography>
        <Typography><strong>This action cannot be undone.</strong></Typography>
        {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
      </DialogContent>
      <DialogActions>
        <Button
          color="error"
          variant="contained"
          disabled={deleting}
          onClick={handleDelete}
        >
          {deleting ? "Deleting…" : "Delete permanently"}
        </Button>
        <Button disabled={deleting} onClick={() => onClose(false)}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default RemoveModal;
