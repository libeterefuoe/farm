import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Fruits from './pages/Fruits';
import Login from './pages/Login';
import NewPurchase from './pages/NewPurchase';
import NewSale from './pages/NewSale';
import NotFound from './pages/NotFound';
import Reports from './pages/Reports';
import SalesList from './pages/SalesList';
import Stock from './pages/Stock';
import Suppliers from './pages/Suppliers';
import Vendors from './pages/Vendors';
import Welcome from './pages/Welcome';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/suppliers" element={<Suppliers />} />
        <Route path="/fruits" element={<Fruits />} />
        <Route path="/stock" element={<Stock />} />
        <Route path="/vendors" element={<Vendors />} />
        <Route path="/purchases/new" element={<NewPurchase />} />
        <Route path="/sales/new" element={<NewSale />} />
        <Route path="/sales" element={<SalesList />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
