import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext.jsx";
// import LoginPage from "./components/LoginPage";
// import PrivateRoute from "./components/PrivateRoute";

import Dashboard from "./components/dashboard";
import InvestmentTransactions from "./components/menu/reports";
import "./index.css";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* <Route path="/login" element={<LoginPage />} /> */}
          Protected Routes
          {/* <Route element={<PrivateRoute />}> */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/reports/" element={<InvestmentTransactions />} />
          {/* </Route> */}
        </Routes>
      </Router>
    </AuthProvider>
  );
}
