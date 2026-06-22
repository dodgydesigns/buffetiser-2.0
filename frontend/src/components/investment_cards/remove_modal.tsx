import { useState } from "react";
import type { Investment } from "./types";

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
  const [archiving, setArchiving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleArchive = async () => {
    if (investment.id === undefined) {
      setError("This investment does not have a database key.");
      return;
    }

    setArchiving(true);
    setError(null);

    try {
      const response = await fetch(
        `${endpoint}/${encodeURIComponent(String(investment.id))}/archive`,
        { method: "PATCH" }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Archive failed (${response.status})`);
      }

      onClose(true);
    } catch (archiveError) {
      setError(
        archiveError instanceof Error
          ? archiveError.message
          : "Unable to archive investment."
      );
      setArchiving(false);
    }
  };

  return (
    <Dialog
      open
      onClose={() => {
        if (!archiving) onClose(false);
      }}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Archive Investment?</DialogTitle>
      <DialogContent dividers>
        <Typography gutterBottom>
          Are you sure you want to archive{" "}
          <strong>{investment.name} ({investment.symbol})</strong>?
        </Typography>
        <Typography gutterBottom>
          It will be hidden from the dashboard, but all purchases, sales,
          dividends, reinvestments and price history will remain in the database.
        </Typography>
        <Typography>
          You can continue to view its transactions in Report.
        </Typography>
        {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
      </DialogContent>
      <DialogActions>
        <Button
          color="error"
          variant="contained"
          disabled={archiving}
          onClick={handleArchive}
        >
          {archiving ? "Archiving…" : "Archive"}
        </Button>
        <Button disabled={archiving} onClick={() => onClose(false)}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default RemoveModal;
