import { useState } from "react";
import DatePicker from "react-datepicker";
import { registerLocale } from "react-datepicker";
import enAU from 'date-fns/locale/en-AU';
import {
  getConstantOptionValue,
  normaliseModalConstants,
  type Investment,
  type InvestmentModalConstants,
} from "./types";

import "../menu/popup_styles.css";
import "react-datepicker/dist/react-datepicker.css";
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';

registerLocale('enAU', enAU);

type SaleModalProps = {
  investment: Pick<Investment, "symbol" | "name">;
  constants?: InvestmentModalConstants;
  endpoint: string;
  onClose: (saved: boolean) => void;
};

function SaleModal({ investment, constants, endpoint, onClose }: SaleModalProps) {
  const modalConstants = normaliseModalConstants(constants);
  const [symbol] = useState(investment.symbol);
  const [name] = useState(investment.name);
  const [currency, setCurrency] = useState("");
  const [exchange, setExchange] = useState("");
  const [platform, setPlatform] = useState<string>("");
  const [units, setUnits] = useState<number>(0);
  const [pricePerUnit, setPricePerUnit] = useState<number>(0);
  const [fee, setFee] = useState<number>(0);
  const [date, setDate] = useState(new Date());
  const endpoint_string = endpoint;

  const handleClose = (saved: boolean) => {
    onClose(saved);
  };

  return (
    <Dialog open onClose={() => handleClose(false)} maxWidth="md" fullWidth>
      <DialogTitle>New Sale</DialogTitle>
      <DialogContent dividers>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <Typography variant="subtitle2">Symbol</Typography>
            <Typography>{symbol}</Typography>
          </div>
          <div>
            <Typography variant="subtitle2">Name</Typography>
            <Typography>{name}</Typography>
          </div>

          <FormControl fullWidth>
            <InputLabel id="currency-label">Currency</InputLabel>
            <Select
              labelId="currency-label"
              value={currency}
              label="Currency"
              onChange={(e) => setCurrency(e.target.value)}
            >
              <MenuItem value="">Select...</MenuItem>
              {modalConstants.currency.map((x) => {
                const value = getConstantOptionValue(x);
                return <MenuItem key={value} value={value}>{value}</MenuItem>;
              })}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel id="exchange-label">Exchange</InputLabel>
            <Select
              labelId="exchange-label"
              value={exchange}
              label="Exchange"
              onChange={(e) => setExchange(e.target.value)}
            >
              <MenuItem value="">Select...</MenuItem>
              {modalConstants.exchange.map((x) => {
                const value = getConstantOptionValue(x);
                return <MenuItem key={value} value={value}>{value}</MenuItem>;
              })}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel id="platform-label">Platform</InputLabel>
            <Select
              labelId="platform-label"
              value={platform}
              label="Platform"
              onChange={(e) => setPlatform(e.target.value)}
            >
              <MenuItem value="">Select...</MenuItem>
              {modalConstants.platform.map((x) => {
                const value = getConstantOptionValue(x);
                return <MenuItem key={value} value={value}>{value}</MenuItem>;
              })}
            </Select>
          </FormControl>

          <TextField
            label="Units"
            type="number"
            fullWidth
            onChange={(e) => setUnits(parseFloat(e.target.value) || 0)}
          />

          <TextField
            label="Price/Unit"
            type="number"
            fullWidth
            onChange={(e) => setPricePerUnit(parseFloat(e.target.value) || 0)}
          />

          <TextField
            label="Fee"
            type="number"
            fullWidth
            onChange={(e) => setFee(parseFloat(e.target.value) || 0)}
          />

          <div>
            <Typography variant="subtitle2">Date</Typography>
            <DatePicker
              locale="enAU"
              dateFormat="dd/MM/yyyy"
              selected={date}
              onChange={(e: Date | null) => e && setDate(e)}
            />
          </div>
        </div>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={(e) => {
            e.stopPropagation();
            handleClose(true);

            const result = {
              symbol: symbol,
              currency: currency,
              exchange: exchange,
              platform: platform,
              units: units,
              pricePerUnit: pricePerUnit,
              fee: fee,
              date: date,
            };
            fetch(endpoint_string, {
              method: "POST",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
              },
              body: JSON.stringify(result),
            });
          }}
          variant="contained"
          color="primary"
        >
          Save
        </Button>
        <Button onClick={() => handleClose(false)}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}

export default SaleModal;
