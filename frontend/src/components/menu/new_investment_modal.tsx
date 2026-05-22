import { useState } from "react";
import "./popup_styles.css";

type NewInvestmentModalProps = {
  endpoint: string;
  onClose: () => void;
};

function NewInvestmentModal({ endpoint, onClose }: NewInvestmentModalProps) {
  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");

  const handleClose = () => {
    onClose();
  };

  return (
    <div className="popup_overlay">
      <div className="popup_modal new_investment_modal">
        <h2 className="popup_heading">New Investment Purchase</h2>
        <p>
          If you need to add a new investment to your portfolio, use this
          dialog. It will incorporate a new investment and purchase (of 0) and
          add to the investment list.
        </p>
        <table className="popup_modal_table">
          <tbody>
            <tr>
              <td className="popup_modal_table_label">Symbol</td>
              <td className="popup_modal_table_input">
                <input
                  className="popup_modal_table_text"
                  id={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                />
              </td>
            </tr>
            <tr>
              <td className="popup_modal_table_label">Name</td>
              <td className="popup_modal_table_input">
                <input
                  className="popup_modal_table_text"
                  id={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </td>
            </tr>
          </tbody>
        </table>
          <button
            type="button"
            className="save"
            onClick={(e) => {
              e.stopPropagation();
              handleClose();

              const result = {
                symbol: symbol,
                name: name,
              };
              fetch(endpoint, {
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
          </button>
          <button
            type="button"
            className="cancel"
            style={{ marginRight: "3rem" }}
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
          >
            Cancel
        </button>
      </div>
    </div>
  );
}

export default NewInvestmentModal;
