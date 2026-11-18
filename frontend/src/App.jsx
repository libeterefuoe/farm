import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Suppliers from './pages/Suppliers';
import Fruits from './pages/Fruits';
import Stock from './pages/Stock';
import Vendors from './pages/Vendors';
import NewPurchase from './pages/NewPurchase';
import NewSale from './pages/NewSale';
import SalesList from './pages/SalesList';
import Reports from './pages/Reports';

// Root component — sets up routing and layout.
// Each page handles its own data fetching and error states.
export default function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-main">
        <Routes>
          <Route path="/"               element={<Dashboard />} />
          <Route path="/suppliers"      element={<Suppliers />} />
          <Route path="/fruits"         element={<Fruits />} />
          <Route path="/stock"          element={<Stock />} />
          <Route path="/vendors"        element={<Vendors />} />
          <Route path="/purchases/new"  element={<NewPurchase />} />
          <Route path="/sales/new"      element={<NewSale />} />
          <Route path="/sales"          element={<SalesList />} />
          <Route path="/reports"        element={<Reports />} />
          <Route path="*"               element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="app-footer">
        Batloung Farm Distribution Management System 
      </footer>
    </div>
  );
}