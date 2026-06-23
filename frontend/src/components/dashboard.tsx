import { useState, useEffect } from "react";
import axios from "axios";
import MenuBar from "./menu/menu_bar";
import InvestmentCard from "./investment_cards/investment_card";
import TotalsCard from "./totals_card";
import type { Investment, InvestmentModalConstants } from "./investment_cards/types";
import logo from "../assets/logo_bk.webp";
import {
  notifyPortfolioChanged,
  PORTFOLIO_CHANGED_EVENT,
} from "../portfolio_events";


type InvestmentCardsProps = {
  allInvestments: Investment[];
  constants: InvestmentModalConstants;
};

function InvestmentCards(props: InvestmentCardsProps) {
  const { allInvestments, constants } = props;

  return (
    <div className="investment_cards_container">
      {allInvestments.map(
        (item) =>
          item.visible && (
            <InvestmentCard
              key={item.id || item.symbol}
              {...item}
              constants={constants}
            />
          )
      )}
    </div>
  );
}

type EmptyPortfolioProps = {
  onBuy: () => void;
};

function EmptyPortfolio({ onBuy }: EmptyPortfolioProps) {
  return (
    <main className="empty-portfolio">
      <div className="empty-portfolio__card">
        <img
          className="empty-portfolio__logo"
          src={logo}
          alt="Buffetiser"
        />
        <button
          className="empty-portfolio__buy"
          type="button"
          onClick={onBuy}
        >
          Click Buy to begin
        </button>
      </div>
    </main>
  );
}

/*
Pull all of the required information once and feed it to
the child components.
*/
export default function Dashboard() {
  const [allInvestments, setAllInvestments] = useState<Investment[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [constants, setConstants] = useState<InvestmentModalConstants>({});
  const [buyOpen, setBuyOpen] = useState(false);

  useEffect(() => {
    const loadInvestments = () => {
      axios
      .get("/api/v1/all?include_history=false")
      .then((response) => {
        setAllInvestments(response.data.all_investment_data);
        setLoadError(false);
      })
      .catch((error) => {
        console.log(error.response);
        setLoadError(true);
      });
    };
    loadInvestments();
    window.addEventListener(PORTFOLIO_CHANGED_EVENT, loadInvestments);

    axios
      .get("/api/v1/constants")
      .then((response) => {
        setConstants(response.data);
      })
      .catch((error) => {
        console.log(error.response);
      });
    return () => {
      window.removeEventListener(PORTFOLIO_CHANGED_EVENT, loadInvestments);
    };
  }, []);

  if (loadError) {
    return (
      <main className="dashboard-status">
        Unable to load investments.
      </main>
    );
  }

  if (allInvestments === null) {
    return <main className="dashboard-status">Loading!</main>;
  }

  const handleBuyClose = (saved: boolean) => {
    setBuyOpen(false);

    if (saved) {
      notifyPortfolioChanged();
    }
  };

  return (
    <div className="dashboard-page">
      <MenuBar
        constants={constants}
        buyOpen={buyOpen}
        onBuyOpenChange={setBuyOpen}
        onBuyClose={handleBuyClose}
      />

      <div className="content">
        {allInvestments.length === 0 ? (
          <EmptyPortfolio onBuy={() => setBuyOpen(true)} />
        ) : (
          <InvestmentCards
            allInvestments={allInvestments}
            constants={constants}
          />
        )}
      </div>

      <footer className="footer">
        <TotalsCard />
      </footer>
    </div>
  );
}
