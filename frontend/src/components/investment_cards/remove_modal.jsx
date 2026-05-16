import { useState, React } from "react";
import DatePicker from "react-datepicker";
import { registerLocale } from "react-datepicker";
import enAU from 'date-fns/locale/en-AU';

import "../menu/popup_styles.css";
import "react-datepicker/dist/react-datepicker.css";

registerLocale('enAU', enAU);

function RemoveModal({ investment, _, endpoint, onClose }) {
  const [symbol] = useState(investment.symbol);
  const [name] = useState(investment.name);
  const endpoint_string = endpoint;

  const HandleClose = () => {
    onClose(false);
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
          <div
            className="remove_remove"
            onClick={(e) => {
              e.stopPropagation();
              HandleClose();
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
        </div>
        <div
            className="remove_cancel"
            style={{ marginRight: "3rem" }}
            onClick={(e) => {
              e.stopPropagation();
              HandleClose();
            }}
          >
            Cancel
        </div>
      </div>
    </div>
  </div>);
}

export default RemoveModal;
