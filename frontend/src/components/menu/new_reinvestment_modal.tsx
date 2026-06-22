import { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

type NewReinvestmentModalProps = {
  open: boolean;
  endpoint: string;
  onClose: (saved: boolean) => void;
};

export default function NewReinvestmentModal({
  open,
  endpoint,
  onClose,
}: NewReinvestmentModalProps) {
  const [symbol, setSymbol] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [units, setUnits] = useState("");
  const [pricePerUnit, setPricePerUnit] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const unitsValue = Number(units);
    const priceValue = Number(pricePerUnit);
    if (!symbol || unitsValue <= 0 || priceValue < 0) {
      alert("Enter a symbol, positive units, and a valid price.");
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
        body: JSON.stringify({
          symbol,
          date,
          units: unitsValue,
          price_per_unit: priceValue,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || `Save failed (${response.status})`);
      }
      onClose(true);
    } catch (error) {
      setSaving(false);
      alert(
        `Error saving reinvestment: ${
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
      <DialogTitle>New Reinvestment Allocation</DialogTitle>
      <DialogContent>
        <Typography variant="body2" gutterBottom>
          Adds allocated units to the investment at the entered price and date.
        </Typography>
        <Stack spacing={2} sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Symbol"
            value={symbol}
            onChange={(event) => setSymbol(event.target.value.toUpperCase())}
          />
          <TextField
            fullWidth
            label="Date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            fullWidth
            label="Units"
            type="number"
            value={units}
            slotProps={{ htmlInput: { min: 0, step: "any" } }}
            onChange={(event) => setUnits(event.target.value)}
          />
          <TextField
            fullWidth
            label="Price/Unit"
            type="number"
            value={pricePerUnit}
            slotProps={{ htmlInput: { min: 0, step: "any" } }}
            onChange={(event) => setPricePerUnit(event.target.value)}
          />
        </Stack>
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
