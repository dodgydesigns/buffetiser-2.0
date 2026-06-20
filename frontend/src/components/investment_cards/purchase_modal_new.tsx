import { useState, forwardRef, type ReactElement } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import enAU from "date-fns/locale/en-AU";
import "react-datepicker/dist/react-datepicker.css";

import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";

import {
  getConstantOptionValue,
  normaliseModalConstants,
  type InvestmentModalConstants,
} from "./types";

registerLocale("enAU", enAU);

type PurchaseModalProps = {
  className?: string;
  constants?: InvestmentModalConstants;
  endpoint: string;
  onClose: (saved: boolean) => void;
};

type DateInputProps = {
  value?: string;
  onClick?: () => void;
};

const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  ({ value, onClick }, ref) => (
    <TextField
      id="date-input"
      color="primary"
      margin="dense"
      label="Date"
      fullWidth
      onClick={onClick}
      inputRef={ref}
      value={value ?? ""}
      sx={{ "& .MuiOutlinedInput-root": { color: "#777777", fontSize: "1.1em" } }}
    />
  )
);

DateInput.displayName = "DateInput";

function NewPurchaseModal({ constants, endpoint, onClose }: PurchaseModalProps) {
  const modalConstants = normaliseModalConstants(constants);

  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("AUD");
  const [exchange, setExchange] = useState("XASX");
  const [platform, setPlatform] = useState("CMC");
  const [units, setUnits] = useState(0);
  const [pricePerUnit, setPricePerUnit] = useState(0);
  const [fee, setFee] = useState(0);
  const [date, setDate] = useState<Date>(new Date());

  const handleClose = (saved: boolean) => {
    onClose(saved);
  };

  const handleSave = async () => {
    if (!symbol || !currency || !exchange || !platform) {
      alert("Please fill in symbol, currency, exchange and platform.");
      return;
    }

  const result = {
    symbol,
    currency,
    exchange,
    platform,
    units,
    price_per_unit: pricePerUnit,
    fee,
    date: date.toISOString(),
    trade_count: 1,
  };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(result),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to save purchase: ${response.status} ${
            errorData.detail || response.statusText
          }`
        );
      }

      handleClose(true);
    } catch (error) {
      console.error("Saving purchase with data:", JSON.stringify(result));
      console.error("POSTing to endpoint:", endpoint);
      console.error("Error saving purchase:", error);
      alert(
        `Error saving purchase: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  return (
    <Dialog open onClose={() => handleClose(false)} maxWidth="sm" fullWidth>
      <DialogTitle>New Purchase</DialogTitle>

      <DialogContent dividers>
        <p>
          If you have purchased shares in an existing investment, use this dialog
          to add the details of the purchase to your portfolio.
        </p>

        <TextField
          margin="dense"
          label="Symbol"
          fullWidth
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
        />

        <TextField
          margin="dense"
          label="Name"
          fullWidth
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <FormControl fullWidth margin="dense">
          <InputLabel>Currency</InputLabel>
          <Select
            value={currency}
            label="Currency"
            onChange={(e) => setCurrency(e.target.value)}
          >
            {modalConstants.currency.map((x) => {
              const value = getConstantOptionValue(x);
              return (
                <MenuItem key={value} value={value}>
                  {value}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>

        <FormControl fullWidth margin="dense">
          <InputLabel>Exchange</InputLabel>
          <Select
            value={exchange}
            label="Exchange"
            onChange={(e) => setExchange(e.target.value)}
          >
            {modalConstants.exchange.map((x) => {
              const value = getConstantOptionValue(x);
              return (
                <MenuItem key={value} value={value}>
                  {value}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>

        <FormControl fullWidth margin="dense">
          <InputLabel>Platform</InputLabel>
          <Select
            value={platform}
            label="Platform"
            onChange={(e) => setPlatform(e.target.value)}
          >
            {modalConstants.platform.map((x) => {
              const value = getConstantOptionValue(x);
              return (
                <MenuItem key={value} value={value}>
                  {value}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>

        <TextField
          margin="dense"
          label="Units"
          fullWidth
          type="number"
          value={units}
          onChange={(e) => setUnits(parseFloat(e.target.value) || 0)}
        />

        <TextField
          margin="dense"
          label="Price/Unit"
          fullWidth
          type="number"
          value={pricePerUnit}
          onChange={(e) => setPricePerUnit(parseFloat(e.target.value) || 0)}
        />

        <TextField
          margin="dense"
          label="Fee"
          fullWidth
          type="number"
          value={fee}
          onChange={(e) => setFee(parseFloat(e.target.value) || 0)}
        />

        <DatePicker
          locale="enAU"
          dateFormat="dd/MM/yyyy"
          selected={date}
          onChange={(d) => {
            if (d) setDate(d);
          }}
          customInput={<DateInput /> as ReactElement}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={() => handleClose(false)}>Cancel</Button>
        <Button variant="contained" onClick={handleSave}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default NewPurchaseModal;