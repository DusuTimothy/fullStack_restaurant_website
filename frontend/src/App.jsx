import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import CartDrawer from './components/CartDrawer';
import MenuPage from './pages/MenuPage';
import OrdersPage from './pages/OrdersPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProfilePage from './pages/ProfilePage';
import UsersManagementPage from './pages/UsersManagementPage';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <div className="app-layout">
            <Navbar />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<MenuPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/users" element={<UsersManagementPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <CartDrawer />
          </div>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
