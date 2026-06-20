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

type NewInvestmentDialogProps = {
  open: boolean;
  baseURL: string;
  onClose: () => void;
};

export default function NewInvestmentDialog({
  open,
  baseURL,
  onClose,
}: NewInvestmentDialogProps) {
  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");

  const handleSave = async () => {
    const result = {
      symbol,
      name,
    };

    try {
      const response = await fetch(baseURL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(result),
      });

      if (!response.ok) {
        throw new Error(`Failed to create investment: ${response.status} ${response.statusText}`);
      }

      console.log(JSON.stringify(result));
      onClose();
    } catch (error) {
      console.error("Error creating investment:", error);
      alert(`Error creating investment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>New Investment Purchase</DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3}>
          <Typography>
            If you need to add a new investment to your portfolio, use this
            dialog. It will incorporate a new investment and purchase of 0 and
            add it to the investment list.
          </Typography>

          <TextField
            label="Symbol"
            value={symbol}
            fullWidth
            required
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          />

          <TextField
            label="Name"
            value={name}
            fullWidth
            required
            onChange={(e) => setName(e.target.value)}
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}