import { useState, useEffect } from "react";
import axios from "axios";
import MenuBar from "./menu/menu_bar";
import InvestmentCard from "./investment_cards/investment_card";
import TotalsCard from "./totals_card";
import type { Investment, InvestmentModalConstants } from "./investment_cards/types";
import logo from "../assets/logo_bk.webp";


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
    axios
      .get("/api/v1/all")
      .then((response) => {
        setAllInvestments(response.data.all_investment_data);
      })
      .catch((error) => {
        console.log(error.response);
        setLoadError(true);
      });

    axios
      .get("/api/v1/constants")
      .then((response) => {
        setConstants(response.data);
      })
      .catch((error) => {
        console.log(error.response);
      });
  }, []);

  if (loadError) {
    return <div>Unable to load investments.</div>;
  }

  if (allInvestments === null) {
    return <div>Loading!</div>;
  }

  const handleBuyClose = (saved: boolean) => {
    setBuyOpen(false);

    if (saved) {
      window.location.reload();
    }
  };

  return (
    <>
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
    </>
  );
}
