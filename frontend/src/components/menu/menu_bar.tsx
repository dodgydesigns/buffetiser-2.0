import * as React from "react";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { useNavigate } from "react-router-dom";
import AdminDialog from "./admin_dialog";
import NewPurchaseModal from "../investment_cards/purchase_modal_new";
import { InvestmentModalConstants } from "../investment_cards/types";
import NewDividendModal from "./new_dividend_modal";
import NewReinvestmentModal from "./new_reinvestment_modal";
import { notifyPortfolioChanged } from "../../portfolio_events";
import { useAuth } from "../../auth";
import AccountDialog from "./account_dialog";
import NewUserDialog from "./new_user_dialog";

const HelpDialog = React.lazy(() => import("./help_dialog"));
interface BasicMenuProps {
  constants?: InvestmentModalConstants | undefined;
  buyOpen: boolean;
  onBuyOpenChange: (open: boolean) => void;
  onBuyClose: (saved: boolean) => void;
}

export default function BasicMenu({
  constants,
  buyOpen,
  onBuyOpenChange,
  onBuyClose,
}: BasicMenuProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [accountOpen, setAccountOpen] = React.useState(false);
  const [newUserOpen, setNewUserOpen] = React.useState(false);
  const [helpOpen, setHelpOpen] = React.useState(false);

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
  const handleShowNewUser = () => {
    setNewUserOpen(true);
    handleConfigClose();
  };
  const handleConfigClose = () => {
    setConfigAnchorEl(null);
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
    <div className="menu-bar">
      {user.is_admin && (
        <>
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
            <MenuItem onClick={handleShowNewUser}>New User</MenuItem>
          </Menu>
        </>
      )}
      
      <Button
        style={{ color: "white", backgroundColor: "transparent" }}
        onClick={() => onBuyOpenChange(true)}
      >
        Buy
      </Button>

      {buyOpen && (
        <NewPurchaseModal
          className="buy"
          constants={constants}
          endpoint={baseURL + "/purchase"}
          onClose={onBuyClose}
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

      <AdminDialog
        open={configOpen}
        baseURL={baseURL}
        onClose={() => setConfigOpen(false)}
      />

      <NewUserDialog
        open={newUserOpen}
        baseURL={baseURL}
        onClose={() => setNewUserOpen(false)}
      />

      <NewDividendModal
        open={dividendsOpen}
        endpoint={baseURL + "/dividends"}
        onClose={() => setDividendsOpen(false)}
      />

      <NewReinvestmentModal
        open={reinvestmentOpen}
        endpoint={baseURL + "/reinvestments"}
        onClose={(saved) => {
          setReinvestmentOpen(false);
          if (saved) notifyPortfolioChanged();
        }}
      />

      <Button
        style={{ color: "white", backgroundColor: "transparent" }}
        onClick={() => navigate("/reports/")}
      >
        Report
      </Button>

      <Button
        style={{ color: "white", backgroundColor: "transparent" }}
        onClick={() => setHelpOpen(true)}
      >
        Help
      </Button>

      <span style={{ float: "right" }}>
        <Button
          style={{ color: "white", backgroundColor: "transparent" }}
          onClick={() => setAccountOpen(true)}
        >
          {user.display_name}
        </Button>
        <Button
          style={{ color: "white", backgroundColor: "transparent" }}
          onClick={() => void logout()}
        >
          Sign out
        </Button>
      </span>

      <AccountDialog
        open={accountOpen}
        onClose={() => setAccountOpen(false)}
      />

      {helpOpen && (
        <React.Suspense fallback={null}>
          <HelpDialog open onClose={() => setHelpOpen(false)} />
        </React.Suspense>
      )}
    </div>
  );
}
