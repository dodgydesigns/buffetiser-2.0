import { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";

type NewDividendModalProps = {
  open: boolean;
  endpoint: string;
  onClose: (saved: boolean) => void;
};

export default function NewDividendModal({
  open,
  endpoint,
  onClose,
}: NewDividendModalProps) {
  const [symbol, setSymbol] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const value = Number(amount);
    if (!symbol || value <= 0) {
      alert("Enter a symbol and a positive dividend amount.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ symbol, date, value }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || `Save failed (${response.status})`);
      }
      onClose(true);
    } catch (error) {
      setSaving(false);
      alert(
        `Error saving dividend: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!saving) onClose(false);
      }}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>New Dividend Payment</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" gutterBottom>
          Records a cash dividend for reporting. It does not alter holdings,
          cost basis, or investment profit.
        </Typography>
        <Box
          sx={{
            display: "grid",
            gap: 2,
            mt: 2,
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          }}
        >
          <TextField
            label="Symbol"
            value={symbol}
            onChange={(event) => setSymbol(event.target.value.toUpperCase())}
            fullWidth
          />
          <TextField
            label="Date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            fullWidth
          />
          <TextField
            label="Amount"
            type="number"
            value={amount}
            slotProps={{ htmlInput: { min: 0, step: "any" } }}
            onChange={(event) => setAmount(event.target.value)}
            fullWidth
            sx={{ gridColumn: "1 / -1" }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button disabled={saving} onClick={() => onClose(false)}>
          Cancel
        </Button>
        <Button disabled={saving} variant="contained" onClick={handleSave}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
