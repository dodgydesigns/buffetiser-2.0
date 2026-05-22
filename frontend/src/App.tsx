import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import Dashboard from "./components/dashboard";
import InvestmentTransactions from "./components/menu/reports";

export default function App() {
  return (
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/reports/" element={<InvestmentTransactions />} />
        </Routes>
      </Router>
  );
}
 
