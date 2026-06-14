import React, { useState } from "react";
import DatePicker from "react-datepicker";
import { registerLocale } from "react-datepicker";
import enAU from 'date-fns/locale/en-AU';

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
import {
  getConstantOptionValue,
  normaliseModalConstants,
  type Investment,
  type InvestmentModalConstants,
} from "./types";

registerLocale('enAU', enAU);

type PurchaseModalProps = {
  className?: string;
  investment: Pick<Investment, "symbol" | "name">;
  constants?: InvestmentModalConstants;
  endpoint: string;
  onClose: (saved: boolean) => void;
};

function PurchaseModal({ investment, constants, endpoint, onClose }: PurchaseModalProps) {
  const modalConstants = normaliseModalConstants(constants);
  const [symbol] = useState(investment.symbol);
  const [name] = useState(investment.name);
  const [currency, setCurrency] = useState("");
  const [exchange, setExchange] = useState("");
  const [platform, setPlatform] = useState("");
  const [units, setUnits] = useState(0);
  const [pricePerUnit, setPricePerUnit] = useState(0);
  const [fee, setFee] = useState(0);
  const [date, setDate] = useState(new Date());
  const endpoint_string = endpoint;

  const handleClose = () => {
      onClose(true);
      return;
  };

  return (
    <Dialog open onClose={() => handleClose()} maxWidth="md" fullWidth>
      <DialogTitle>New Purchase</DialogTitle>
      <DialogContent dividers>
        <p>
          If you have purchased shares in an existing investment, use this dialog to add the details of the purchase to your portfolio.
        </p>

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
              onChange={(d: Date | null) => d && setDate(d)}
            />
          </div>
        </div>
      </DialogContent>
      <DialogActions>
        <Button
          color="primary"
          onClick={(e) => {
            e.stopPropagation();
            handleClose();

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
            console.log(JSON.stringify(result));
          }}
        >
          Save
        </Button>
        <Button onClick={(e) => {e.stopPropagation(); handleClose()}}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}

export default PurchaseModal;
