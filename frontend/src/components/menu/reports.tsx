import React, { useEffect, useState } from "react";
import axios from "axios";
import "./reports.css";

const baseURL = "/api/v1";

type Transaction = {
  date?: string;
  reinvestment_date?: string;
  payment_date?: string;
  type: string;
  units?: number;
  fee?: number;
  price_per_unit?: number;
  realised_profit_per_unit?: number;
  value?: number;
};

type ReportInvestment = {
  symbol: string;
  name: string;
  archived?: boolean;
  transactions: Transaction[];
};

type SortColumn = "date" | "type" | "units" | "price" | "fee";
type SortOrder = "asc" | "desc";

const InvestmentTransactions = () => {
  const [investments, setInvestments] = useState<ReportInvestment[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  function getDate(transaction: Transaction) {
    const dateStr = transaction.date || transaction.reinvestment_date || transaction.payment_date;
    if (!dateStr) return "";
    const [day, month, year] = dateStr.split('/');
    return `${year}/${month}/${day}`;
  }

  function getTransactionType(transaction: Transaction) {
    return String(transaction.type).charAt(0).toUpperCase() + String(transaction.type).slice(1);
  }

  function getUnits(transaction: Transaction) {
    return transaction.units !== undefined ? transaction.units : "-";
  }

  function getFee(transaction: Transaction) {
    return transaction.fee !== undefined ? transaction.fee : "-";
  }

  function getPrice(transaction: Transaction) {
    if (transaction.price_per_unit) {
      return transaction.price_per_unit.toFixed(2);
    } else if (transaction.value) {
      return transaction.value.toFixed(2);
    }
    return "-";
  }

  const sortTransactions = (transactions: Transaction[]) => {
    if (!sortColumn) return transactions;

    return [...transactions].sort((a, b) => {
      let valA: string | number = "";
      let valB: string | number = "";

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

  const handleSort = (column: SortColumn) => {
    setSortOrder(prevOrder => (sortColumn === column && prevOrder === "asc" ? "desc" : "asc"));
    setSortColumn(column);
  };

  useEffect(() => {
    axios.get(baseURL + "/reports/")
      .then((response) => {
        const data = response.data;
        const values = Object.values(data) as ReportInvestment[];
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
            <h3>
              ({investment.symbol}) {investment.name}
              {investment.archived ? " — Archived" : ""}
            </h3>
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
