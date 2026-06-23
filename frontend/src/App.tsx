import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./components/dashboard";
import InvestmentTransactions from "./components/menu/reports";
import { AuthProvider } from "./auth";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/reports/" element={<InvestmentTransactions />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
 
