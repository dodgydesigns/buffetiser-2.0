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

type SaleModalProps = {
  investment: Pick<Investment, "id" | "symbol" | "name" | "units">;
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
      margin="dense"
      label="Date"
      fullWidth
      onClick={onClick}
      inputRef={ref}
      value={value ?? ""}
      slotProps={{ htmlInput: { readOnly: true } }}
    />
  )
);

DateInput.displayName = "DateInput";

export default function SaleModal({
  investment,
  constants,
  endpoint,
  onClose,
}: SaleModalProps) {
  const modalConstants = normaliseModalConstants(constants);
  const [currency, setCurrency] = useState("AUD");
  const [exchange, setExchange] = useState("XASX");
  const [units, setUnits] = useState(0);
  const [pricePerUnit, setPricePerUnit] = useState(0);
  const [fee, setFee] = useState(0);
  const [date, setDate] = useState(new Date());
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (investment.id === undefined) {
      alert("This investment does not have a database key.");
      return;
    }

    if (units <= 0 || units > investment.units) {
      alert(`Enter units between 0 and ${investment.units}.`);
      return;
    }

    setSaving(true);

    const result = {
      investment_key: String(investment.id),
      currency,
      exchange,
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
          errorData.detail || `Failed to save sale (${response.status})`
        );
      }

      onClose(true);
    } catch (error) {
      setSaving(false);
      alert(
        `Error saving sale: ${
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
      <DialogTitle>
        Sell {investment.name} ({investment.symbol})
      </DialogTitle>
      <DialogContent dividers>
        <p>{investment.units} units available.</p>

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

        <TextField
          margin="dense"
          label="Units"
          fullWidth
          type="number"
          value={units}
          slotProps={{ htmlInput: { min: 0, max: investment.units } }}
          onChange={(event) => setUnits(parseFloat(event.target.value) || 0)}
        />

        <TextField
          margin="dense"
          label="Price/Unit"
          fullWidth
          type="number"
          value={pricePerUnit}
          slotProps={{ htmlInput: { min: 0 } }}
          onChange={(event) => setPricePerUnit(parseFloat(event.target.value) || 0)}
        />

        <TextField
          margin="dense"
          label="Fee"
          fullWidth
          type="number"
          value={fee}
          slotProps={{ htmlInput: { min: 0 } }}
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
          {saving ? "Saving…" : "Save sale"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
