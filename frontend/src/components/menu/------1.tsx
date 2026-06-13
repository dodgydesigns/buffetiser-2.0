import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import NewInvestmentModal from "./new_investment_dialog";
import NewReinvestmentModal from "./new_reinvestment_modal";
import NewDividendModal from "./new_dividend_modal";
import ConfigModal from "./admin_dialog";
import axios from "axios";
import "../../index.css";

const baseURL = "/api/v1";

function MenuBar() {
  const [showNewInvestment, setShowNewInvestment] = useState(false);
  const [showNewReinvestment, setShowNewReinvestment] = useState(false);
  const [showNewDividend, setShowNewDividend] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [newDropdownOpen, setNewDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleNewDropdownOpen = () => {
    setNewDropdownOpen(!newDropdownOpen);
  };

  const handleNewInvestment = () => {
    setShowNewInvestment(true);
  }
  const handleNewInvestmentClose = () => {
    setShowNewInvestment(false);
  };
  const handleNewReinvestment = () => {
    setShowNewReinvestment(true);
  }
  const handleNewReinvestmentClose = () => {
    setShowNewReinvestment(false);
  };
  const handleNewDividend = () => {
    setShowNewDividend(true);
  }
  const handleNewDividendClose = () => {
    setShowNewDividend(false);
  }

  const handleConfigClose = () => {
    setShowConfig(false);
  };

  return (
    <div className="header">
      <button
        type="button"
        className="header_bar_div"
        onClick={() => {
          setShowConfig(true);
        }}
      >
        {showConfig && (
          <ConfigModal
            baseURL={baseURL}
            onClose={() => handleConfigClose()}
          ></ConfigModal>
        )}
        Admin
      </button>
      <button
        type="button"
        className="header_bar_div"
        onClick={() => {
          handleNewDropdownOpen();
        }}
      >
        {newDropdownOpen && (
          <ul className="menu">
            <li className="menu-item">
              <button onClick={handleNewInvestment}>Investment</button>
            </li>
            <li className="menu-item">
              <button onClick={handleNewReinvestment}>Reinvestment</button>
            </li>
            <li className="menu-item">
              <button onClick={handleNewDividend}>Dividend</button>
            </li>
          </ul>
        )}
        {showNewInvestment && (
          <NewInvestmentModal
            endpoint={baseURL + "/new_investment/"}
            onClose={() => handleNewInvestmentClose()}
          ></NewInvestmentModal>
        )}
        {showNewReinvestment && (
          <NewReinvestmentModal
            endpoint={baseURL + "/add_reinvestment/"}
            onClose={() => handleNewReinvestmentClose()}
          ></NewReinvestmentModal>
        )}
        {showNewDividend && (
          <NewDividendModal
            endpoint={baseURL + "/add_dividend_payment/"}
            onClose={() => handleNewDividendClose()}
          ></NewDividendModal>
        )}
        Add New
      </button>
      <button
        type="button"
        className="header_bar_div"
        onClick={() => {
          navigate("/reports/");
        }}
      >
        Reports
      </button>
      <button
        type="button"
        className="header_bar_div"
        onClick={() => {
          axios.post(baseURL + "/help/");
        }}
      >
        Help
      </button>
      <button
        type="button"
        className="header_bar_div"
        onClick={() => {
          const refreshToken = localStorage.getItem("refresh_token");
          if (!refreshToken) {
            alert("No refresh token found. Please log in again.");
            navigate('/login/');
            return;
          }

          axios.post(baseURL + "/logout/", { refresh_token: refreshToken }, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("access_token")}`
            }
          }).then(() => {
            localStorage.removeItem("access_token"); // Remove access token
            localStorage.removeItem("refresh_token"); // Remove refresh token
            navigate('/login/');
          }).catch((error) => {
            if (error.response && error.response.status === 400) {
              alert("Invalid or expired refresh token. Please log in again.");
            } else {
              console.error("Logout failed:", error);
              alert("Are you sure you want to leave this awesome App?");
            }
            navigate('/login/');
          });
        }}
      >
        Logout
      </button>
    </div>
  );
}

export default MenuBar;
