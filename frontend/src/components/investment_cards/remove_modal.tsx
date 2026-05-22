import { useState } from "react";
import type { Investment } from "./types";

import "../menu/popup_styles.css";
import "react-datepicker/dist/react-datepicker.css";

type RemoveModalProps = {
  investment: Pick<Investment, "symbol" | "name">;
  endpoint: string;
  onClose: (saved: boolean) => void;
};

function RemoveModal({ investment, endpoint, onClose }: RemoveModalProps) {
  const [symbol] = useState(investment.symbol);
  const [name] = useState(investment.name);
  const endpoint_string = endpoint;

  const handleClose = (saved: boolean) => {
    onClose(saved);
  };

  return (
    <div className="popup_overlay">
      <div className="popup_modal remove_modal">
        <h2 className="popup_heading">Remove Investment</h2>
        <div>
          Are you sure you want to remove <p>{name} ({symbol})</p> from Buffetiser?
        </div>
        <p>
          The data for {symbol} will be retained but the investment will not be shown.
        </p>
        <p>
        You will have to modify the Investment in the DB to show it again.
        </p>
        <div>
          <button
            type="button"
            className="remove_remove"
            onClick={(e) => {
              e.stopPropagation();
              handleClose(true);
              const result = {
                symbol: symbol,
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
          REMOVE
        </button>
        <button
            type="button"
            className="remove_cancel"
            style={{ marginRight: "3rem" }}
            onClick={(e) => {
              e.stopPropagation();
              handleClose(false);
            }}
          >
            Cancel
        </button>
      </div>
    </div>
  </div>);
}

export default RemoveModal;
