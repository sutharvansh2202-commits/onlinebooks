import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import "./App.css";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Books from "./pages/Books";
import Cart from "./pages/Cart";
import AllBooks from "./pages/AllBooks";
import Admin from "./pages/Admin";
import { UserProvider } from "./context/UserContext";

function AppRoutes() {
  const location = useLocation();
  const isAdminPage = location.pathname === "/admin";
  return (
    <div className="app-shell">
      {!isAdminPage && <Navbar />}
      <main className="app-content">
        <Routes>
          <Route path="/" element={<Books />} />
          <Route path="/all-books" element={<AllBooks />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
      {!isAdminPage && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </UserProvider>
  );
}