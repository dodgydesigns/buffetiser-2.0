import React, { useState, useEffect } from "react";
import axios from "axios";

import MenuBar from "./menu/menu_bar";
import InvestmentCard from "./investment_cards/investment_card";
import TotalsCard from "./totals_card";
import type { Investment, InvestmentModalConstants } from "./investment_cards/types";

import "../index.css";


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

/*
Pull all of the required information once and feed it to
the child components.
*/
export default function Dashboard() {
  const [allInvestments, setAllInvestments] = useState<Investment[]>([]);
  const [constants, setConstants] = useState<InvestmentModalConstants>({});

  useEffect(() => {
    axios
      .get("api/v1/all")
      .then((response) => {
        console.log(response.data.all_investment_data);
        setAllInvestments(response.data.all_investment_data);
      })
      .catch((error) => {
        console.log(error.response);
      });

    axios
      .get("api/v1/constants")
      .then((response) => {
        setConstants(response.data);
      })
      .catch((error) => {
        console.log(error.response);
      });
  }, []);

  if (allInvestments.length === 0) {
    return <div>Loading!</div>;
  }

  return (
    <>
      <MenuBar />

      <div className="content">
        <InvestmentCards
          allInvestments={allInvestments}
          constants={constants}
        />
      </div>

      <footer className="footer">
        <TotalsCard />
      </footer>
    </>
  );
}
