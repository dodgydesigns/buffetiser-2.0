import * as React from "react";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import AdminDialog from "./admin_dialog";
import NewPurchaseModal from "../investment_cards/purchase_modal_new";
import { InvestmentModalConstants } from "../investment_cards/types";
import NewDividendModal from "./new_dividend_modal";
import NewReinvestmentModal from "./new_reinvestment_modal";
interface BasicMenuProps {
  constants?: InvestmentModalConstants | undefined;
}

export default function BasicMenu({ constants }: BasicMenuProps) {
  const baseURL = "/api/v1";
  const id = React.useId();

  const configButtonId = `${id}-config-button`;
  const configMenuId = `${id}-config-menu`;
  const [configAnchorEl, setConfigAnchorEl] = React.useState<null | HTMLElement>(null);
  const [configOpen, setConfigOpen] = React.useState(false);
  const configMenuOpen = Boolean(configAnchorEl);
  const handleConfigClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setConfigAnchorEl(event.currentTarget);
  };
  const handleShowConfig = () => {
    setConfigOpen(true);
    handleConfigClose();
  };
  const handleConfigClose = () => {
    setConfigAnchorEl(null);
  };
  
  const buyMenuId = `${id}-buy-button`;
  const [buyAnchorEl, setBuyAnchorEl] = React.useState<null | HTMLElement>(null);
  const [buyOpen, setBuyOpen] = React.useState(false);
  const buyMenuOpen = Boolean(buyAnchorEl);
  const handleBuyMenuClose = () => {
    setBuyAnchorEl(null);
    setBuyOpen(false);
  };

  const returnsMenuId = `${id}-returns-menu`;
  const [returnsAnchorEl, setReturnsAnchorEl] = React.useState<null | HTMLElement>(null);
  const returnsMenuOpen = Boolean(returnsAnchorEl);
  const handleReturnsClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setReturnsAnchorEl(event.currentTarget);
  };
  const handleReturnsClose = () => {
    setReturnsAnchorEl(null);
  };

  const [dividendsOpen, setDividendsOpen] = React.useState(false);
  const handleShowDividends = () => {
    setDividendsOpen(true);
    handleReturnsClose();
  };

  const [reinvestmentOpen, setReinvestmentOpen] = React.useState(false);
  const handleShowReinvestment = () => {
    setReinvestmentOpen(true);
    handleReturnsClose();
  };

  return (
    <div>
      <Button
        style={{ color: "white", backgroundColor: "transparent" }}
        id={configButtonId}
        aria-controls={configMenuOpen ? configMenuId : undefined}
        aria-haspopup="true"
        aria-expanded={configMenuOpen ? "true" : undefined}
        onClick={handleConfigClick}
      >
        Config
      </Button>
      <Menu
        id={configMenuId}
        anchorEl={configAnchorEl}
        open={configMenuOpen}
        onClose={handleConfigClose}
      >
        <MenuItem onClick={handleShowConfig}>Administrator</MenuItem>
      </Menu>
      
      <Button
        style={{ color: "white", backgroundColor: "transparent" }}
        onClick={() => { setBuyOpen(true); setBuyAnchorEl(null); }}
      >
        Buy
      </Button>

      {buyOpen && (
        <NewPurchaseModal
          className="buy"
          constants={constants}
          endpoint={baseURL + "/purchase/"}
          onClose={() => setBuyOpen(false)}
        />
      )}

      <Button
        style={{ color: "white" }}
        id={returnsMenuId}
        aria-controls={returnsMenuOpen ? returnsMenuId : undefined}
        aria-haspopup="true"
        aria-expanded={returnsMenuOpen ? "true" : undefined}
        onClick={handleReturnsClick}
      >
        Returns
      </Button>

      <Menu
        id={returnsMenuId}
        anchorEl={returnsAnchorEl}
        open={returnsMenuOpen}
        onClose={handleReturnsClose}
      >
        <MenuItem onClick={handleShowDividends}>Dividends</MenuItem>
        <MenuItem onClick={handleShowReinvestment}>Reinvestment</MenuItem>      
      </Menu>

      <Menu
        id={buyMenuId}
        anchorEl={buyAnchorEl}
        open={buyMenuOpen}
        onClose={handleBuyMenuClose}
      >
      </Menu>

      <AdminDialog
        open={configOpen}
        baseURL={baseURL}
        onClose={() => setConfigOpen(false)}
      />

      <NewDividendModal
        open={dividendsOpen}
        endpoint={baseURL}
        onClose={() => setDividendsOpen(false)}
      />

      <NewReinvestmentModal
        open={reinvestmentOpen}
        endpoint={baseURL}
        onClose={() => setReinvestmentOpen(false)}
      />
    </div>
  );
}