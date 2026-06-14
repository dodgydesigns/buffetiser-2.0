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
  investment: Pick<Investment, "symbol" | "name">;
  endpoint: string;
  onClose: (saved: boolean) => void;
};

function RemoveModal({ investment, endpoint, onClose }: RemoveModalProps) {
  const [symbol] = useState(investment.symbol);
  const [name] = useState(investment.name);
  const endpoint_string = endpoint;

  const handleClose = () => {
    onClose(true);
  };

  return (
    <Dialog open onClose={() => handleClose()} maxWidth="sm" fullWidth>
      <DialogTitle>Remove Investment</DialogTitle>
      <DialogContent dividers>
        <Typography gutterBottom>
          Are you sure you want to remove <strong>{name} ({symbol})</strong> from Buffetiser?
        </Typography>
        <Typography gutterBottom>
          The data for {symbol} will be retained but the investment will not be shown.
        </Typography>
        <Typography gutterBottom>
          You will have to modify the Investment in the DB to show it again.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button
          color="error"
          variant="contained"
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
            const result = { symbol: symbol };
            fetch(endpoint_string, {
              method: "POST",
              headers: { Accept: "application/json", "Content-Type": "application/json" },
              body: JSON.stringify(result),
            });
            console.log(JSON.stringify(result));
          }}
        >
          REMOVE
        </Button>
        <Button onClick={(e) => {e.stopPropagation(); handleClose()}}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}

export default RemoveModal;
