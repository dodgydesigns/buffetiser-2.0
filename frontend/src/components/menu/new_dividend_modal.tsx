import { useState, type MouseEvent } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Typography, Box } from "@mui/material";

type NewDividendModalProps = {
  open: boolean;
  endpoint: string;
  onClose: () => void;
};

function NewDividendModal({ open, endpoint, onClose }: NewDividendModalProps) {
  const [symbol, setSymbol] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState("");

  const handleClose = () => {
    onClose();
  };

  const handleSave = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    handleClose();

    const result = {
      symbol,
      date,
      amount,
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
      <DialogTitle>New Dividend Payment</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" gutterBottom>
          Record dividends paid for shares that are not re-invested.
        </Typography>
        <Box sx={{ display: "grid", gap: 2, mt: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
          <TextField
            label="Symbol"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            fullWidth
          />
          <TextField
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            fullWidth
          />
          <TextField
            label="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            fullWidth
            sx={{ gridColumn: "1 / -1" }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default NewDividendModal;
