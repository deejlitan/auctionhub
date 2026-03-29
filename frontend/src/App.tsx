import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import AuctionList from './pages/AuctionList';
import ItemDetail from './pages/ItemDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import CreateItem from './pages/CreateItem';

const CATEGORIES = ['All', 'Computers', 'Networking', 'Storage', 'Peripherals', 'Mobile & Tablets', 'Others'];

function AppShell() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <>
      <Navbar
        categories={isHome ? CATEGORIES : undefined}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        categoryCounts={isHome ? categoryCounts : undefined}
      />
      <Routes>
        <Route path="/" element={
          <AuctionList
            selectedCategory={selectedCategory}
            onCategoryCounts={setCategoryCounts}
          />
        } />
        <Route path="/items/:id" element={<ItemDetail />} />
        <Route path="/create" element={<CreateItem />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </AuthProvider>
  );
}
