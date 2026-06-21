import { forwardRef, useState } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import enAU from "date-fns/locale/en-AU";
import "react-datepicker/dist/react-datepicker.css";

import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";

import {
  getConstantOptionValue,
  normaliseModalConstants,
  type Investment,
  type InvestmentModalConstants,
} from "./types";

registerLocale("enAU", enAU);

export type PurchaseModalProps = {
  className?: string;
  investment: Pick<Investment, "symbol" | "name">;
  editableInvestment?: boolean;
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
      slotProps={{ htmlInput: { readOnly: true } }}
      sx={{ "& .MuiOutlinedInput-root": { color: "#777777", fontSize: "1.1em" } }}
    />
  )
);

DateInput.displayName = "DateInput";

export default function PurchaseModal({
  investment,
  editableInvestment = false,
  constants,
  endpoint,
  onClose,
}: PurchaseModalProps) {
  const modalConstants = normaliseModalConstants(constants);

  const [symbol, setSymbol] = useState(investment.symbol);
  const [name, setName] = useState(investment.name);
  const [currency, setCurrency] = useState("AUD");
  const [exchange, setExchange] = useState("XASX");
  const [platform, setPlatform] = useState("CMC");
  const [units, setUnits] = useState(0);
  const [pricePerUnit, setPricePerUnit] = useState(0);
  const [fee, setFee] = useState(0);
  const [date, setDate] = useState<Date>(new Date());
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!symbol || !currency || !exchange || !platform) {
      alert("Please fill in symbol, currency, exchange and platform.");
      return;
    }

    setSaving(true);

    const result = {
      symbol,
      name: name || symbol,
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

      onClose(true);
    } catch (error) {
      setSaving(false);
      alert(
        `Error saving purchase: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  return (
    <Dialog
      open
      onClose={() => {
        if (!saving) onClose(false);
      }}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>New Purchase</DialogTitle>

      <DialogContent dividers>
        <p>Add the purchase details to your portfolio.</p>

        <TextField
          margin="dense"
          label="Symbol"
          fullWidth
          type="text"
          value={symbol}
          disabled={!editableInvestment}
          onChange={(event) => setSymbol(event.target.value.toUpperCase())}
        />

        <TextField
          margin="dense"
          label="Name"
          fullWidth
          type="text"
          value={name}
          disabled={!editableInvestment}
          onChange={(event) => setName(event.target.value)}
        />

        <FormControl fullWidth margin="dense">
          <InputLabel>Currency</InputLabel>
          <Select
            value={currency}
            label="Currency"
            onChange={(event) => setCurrency(event.target.value)}
          >
            {modalConstants.currency.map((option) => {
              const value = getConstantOptionValue(option);
              return <MenuItem key={value} value={value}>{value}</MenuItem>;
            })}
          </Select>
        </FormControl>

        <FormControl fullWidth margin="dense">
          <InputLabel>Exchange</InputLabel>
          <Select
            value={exchange}
            label="Exchange"
            onChange={(event) => setExchange(event.target.value)}
          >
            {modalConstants.exchange.map((option) => {
              const value = getConstantOptionValue(option);
              return <MenuItem key={value} value={value}>{value}</MenuItem>;
            })}
          </Select>
        </FormControl>

        <FormControl fullWidth margin="dense">
          <InputLabel>Platform</InputLabel>
          <Select
            value={platform}
            label="Platform"
            onChange={(event) => setPlatform(event.target.value)}
          >
            {modalConstants.platform.map((option) => {
              const value = getConstantOptionValue(option);
              return <MenuItem key={value} value={value}>{value}</MenuItem>;
            })}
          </Select>
        </FormControl>

        <TextField
          margin="dense"
          label="Units"
          fullWidth
          type="number"
          value={units}
          onChange={(event) => setUnits(parseFloat(event.target.value) || 0)}
        />

        <TextField
          margin="dense"
          label="Price/Unit"
          fullWidth
          type="number"
          value={pricePerUnit}
          onChange={(event) => setPricePerUnit(parseFloat(event.target.value) || 0)}
        />

        <TextField
          margin="dense"
          label="Fee"
          fullWidth
          type="number"
          value={fee}
          onChange={(event) => setFee(parseFloat(event.target.value) || 0)}
        />

        <DatePicker
          locale="enAU"
          dateFormat="dd/MM/yyyy"
          selected={date}
          onChange={(selectedDate) => {
            if (selectedDate) setDate(selectedDate);
          }}
          customInput={<DateInput />}
        />
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
