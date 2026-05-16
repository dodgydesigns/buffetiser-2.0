import React, { useEffect, useState } from "react";
import axios from "axios";
import "./reports.css";

const baseURL = "/api/v1";

const InvestmentTransactions = () => {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortColumn, setSortColumn] = useState(null); // Column to sort by
  const [sortOrder, setSortOrder] = useState("asc"); // "asc" or "desc"

  function getDate(transaction) {
    const dateStr = transaction.date || transaction.reinvestment_date || transaction.payment_date;
    const [day, month, year] = dateStr.split('/');
    return `${year}/${month}/${day}`;
  }

  function getTransactionType(transaction) {
    return String(transaction.type).charAt(0).toUpperCase() + String(transaction.type).slice(1);
  }

  function getUnits(transaction) {
    return transaction.units !== undefined ? transaction.units : "-";
  }

  function getFee(transaction) {
    return transaction.fee !== undefined ? transaction.fee : "-";
  }

  function getPrice(transaction) {
    if (transaction.price_per_unit) {
      return transaction.price_per_unit.toFixed(2);
    } else if (transaction.value) {
      return transaction.value.toFixed(2);
    }
    return "-";
  }

  const sortTransactions = (transactions) => {
    if (!sortColumn) return transactions;

    return transactions.sort((a, b) => {
      let valA = null;
      let valB = null;

      switch (sortColumn) {
        case "date":
          valA = getDate(a);
          valB = getDate(b);
          break;
        case "type":
          valA = getTransactionType(a);
          valB = getTransactionType(b);
          break;
        case "units":
          valA = getUnits(a);
          valB = getUnits(b);
          break;
        case "price":
          valA = getPrice(a);
          valB = getPrice(b);
          break;
        case "fee":
          valA = getFee(a);
          valB = getFee(b);
          break;
        default:
          return 0;
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  };

  const handleSort = (column) => {
    setSortOrder(prevOrder => (sortColumn === column && prevOrder === "asc" ? "desc" : "asc"));
    setSortColumn(column);
  };

  useEffect(() => {
    axios.get(baseURL + "/reports/")
      .then((response) => {
        const data = response.data;
        const values = Object.values(data);
        setInvestments(values);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading transactions...</p>;

  return (
    <>
        <div>
            <button className="cancel-button" onClick={() => window.history.back()}>Cancel</button>
            <button className="print-button" onClick={() => window.print()}>Print</button>
        </div>
        <div className="reports">
        <h1>Investment Transactions</h1>
        {investments.map((investment, index) => (
            <div key={`investment-${index}`}>
            <h3>({investment.symbol}) {investment.name}</h3>
            <table>
                <thead>
                <tr>
                    <th onClick={() => handleSort("date")}>
                      Date {sortColumn === "date" && (sortOrder === "asc" ? "↓" : "↑")}
                    </th>
                    <th onClick={() => handleSort("type")}>
                      Type {sortColumn === "type" && (sortOrder === "asc" ? "↓" : "↑")}
                    </th>
                    <th onClick={() => handleSort("units")}>
                      Units {sortColumn === "units" && (sortOrder === "asc" ? "↓" : "↑")}
                    </th>
                    <th onClick={() => handleSort("price")}>
                      Price {sortColumn === "price" && (sortOrder === "asc" ? "↓" : "↑")}
                    </th>
                    <th onClick={() => handleSort("fee")}>
                      Fee {sortColumn === "fee" && (sortOrder === "asc" ? "↓" : "↑")}
                    </th>
                </tr>
                </thead>
                <tbody>
                {sortTransactions(investment.transactions).map((transaction, tIndex) => (
                    <tr key={`transaction-${index}-${tIndex}`}>
                    <td>{getDate(transaction)}</td>
                    <td>{getTransactionType(transaction)}</td>
                    <td>{getUnits(transaction)}</td>
                    <td>{getPrice(transaction)}</td>
                    <td>{getFee(transaction)}</td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
        ))}
        </div>
    </>
  );
};

export default InvestmentTransactions;
