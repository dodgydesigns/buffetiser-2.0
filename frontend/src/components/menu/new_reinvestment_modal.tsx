import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Stack,
} from "@mui/material";

type NewReinvestmentModalProps = {
  open: boolean;
  endpoint: string;
  onClose: () => void;
};

function NewReinvestmentModal({ open, endpoint, onClose }: NewReinvestmentModalProps) {
  const [symbol, setSymbol] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [units, setUnits] = useState("");

  const handleClose = () => {
    onClose();
  };

  const handleSave = () => {
    handleClose();

    const result = {
      symbol,
      date,
      units,
    };

    fetch(endpoint, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(result),
    });

    console.log(JSON.stringify(result));
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>New Re-investment Allocation</DialogTitle>
      <DialogContent>
        <Typography variant="body2" gutterBottom>
          When dividends are reinvested, this will add the required units to the investment at the given price and date.
        </Typography>
        <Stack spacing={2}>
          <TextField
            fullWidth
            label="Symbol"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          />
          <TextField
            fullWidth
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <TextField
            fullWidth
            label="Units"
            value={units}
            onChange={(e) => setUnits(e.target.value)}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button variant="contained" color="primary" onClick={handleSave}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default NewReinvestmentModal;
