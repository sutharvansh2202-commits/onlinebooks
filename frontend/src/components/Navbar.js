import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { api } from "../services/api";

export default function Navbar() {

  const navigate = useNavigate();
  const { user, login, logout } = useUser();
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeLink, setActiveLink] = useState("home");

  
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    async function fetchUser() {
      try {
        const res = await api.get(`/auth/user/${userId}`);
        const data = res.data;

        if (data) {
          login(data);
        } else {
          localStorage.removeItem("userId");
        }
      } catch (err) {
        console.log("User sync failed");
      }
    }

    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    // Load notifications from localStorage
    const stored = localStorage.getItem("notifications");
    if (stored) {
      try {
        setNotifications(JSON.parse(stored));
      } catch {
        setNotifications([]);
      }
    } else {
      setNotifications([]);
    }

    // Listen for notificationAdded event to update notifications
    const handleNotificationAdded = () => {
      const updated = localStorage.getItem("notifications");
      if (updated) {
        try {
          setNotifications(JSON.parse(updated));
        } catch {
          setNotifications([]);
        }
      } else {
        setNotifications([]);
      }
    };
    window.addEventListener("notificationAdded", handleNotificationAdded);

    if (window.location.pathname === "/all-books") {
      setActiveLink("all-books");
    } else if (window.location.pathname === "/cart") {
      setActiveLink("cart");
    } else if (window.location.pathname === "/") {
      setActiveLink("home");
    } else {
      setActiveLink("home");
    }

    return () => {
      window.removeEventListener("notificationAdded", handleNotificationAdded);
    };
  }, []);

  // No localStorage notification sync needed; notifications come from backend

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfile(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
        setShowOrderModal(false);
      }
    };

    if (showProfile || showNotifications || showOrderModal) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showProfile, showNotifications, showOrderModal]);

  const scrollToHome = (e) => {
    e.preventDefault();
    setActiveLink("home");
    if (window.location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollToAbout = (e) => {
    e.preventDefault();
    setActiveLink("about");
    // Navigate to home if not already there
    if (window.location.pathname !== '/') {
      navigate('/');
      // Wait for navigation then scroll
      setTimeout(() => {
        const aboutSection = document.querySelector('.about-section');
        if (aboutSection) {
          aboutSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
      // Already on home, just scroll
      const aboutSection = document.querySelector('.about-section');
      if (aboutSection) {
        aboutSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const scrollToTrending = (e) => {
    e.preventDefault();
    setActiveLink("trending");
    if (window.location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const booksSection = document.querySelector('#books-section');
        if (booksSection) {
          booksSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
      const booksSection = document.querySelector('#books-section');
      if (booksSection) {
        booksSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const scrollToContact = (e) => {
    e.preventDefault();
    setActiveLink("contact");
    if (window.location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const contactSection = document.querySelector('#contact-section');
        if (contactSection) {
          contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
      const contactSection = document.querySelector('#contact-section');
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleLogout = () => {
    logout();
    setShowProfile(false);
    localStorage.removeItem("userId");
    navigate("/login");
  };

  const clearNotifications = () => {
    setNotifications([]);
    localStorage.setItem("notifications", JSON.stringify([]));
  };

  const removeNotification = (index, e) => {
    e.stopPropagation();
    const updatedNotifications = [...notifications];
    updatedNotifications.splice(index, 1);
    setNotifications(updatedNotifications);
    localStorage.setItem("notifications", JSON.stringify(updatedNotifications));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const openOrderDetails = (notification) => {
    if (notification.orderDetails) {
      setSelectedOrder(notification);
      setShowOrderModal(true);
      setShowNotifications(false);
    }
  };

  const closeOrderModal = () => {
    setShowOrderModal(false);
    setSelectedOrder(null);
  };

  // Add state for password change
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordToast, setPasswordToast] = useState("");

  // Add state for show/hide current password
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);

  // Handler for password change
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordToast("Please fill all fields.");
      setTimeout(() => setPasswordToast("") , 2500);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordToast("New password and confirm password must match.");
      setTimeout(() => setPasswordToast("") , 2500);
      return;
    }
    try {
      const res = await api.post("/auth/change-password", {
        email: user.email,
        currentPassword,
        newPassword,
        confirmPassword
      });
      if (res.data.success) {
        setPasswordToast("Password changed successfully.");
        setShowChangePassword(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordToast(res.data.message || "Password change failed.");
      }
      setTimeout(() => setPasswordToast("") , 2500);
    } catch (err) {
      setPasswordToast("Password change failed.");
      setTimeout(() => setPasswordToast("") , 2500);
    }
  };

  return (
    <nav className="site-nav">
      <div className="nav-inner">
        <Link to="/" className="nav-brand">
          <span className="brand-mark">OB</span>
          <span className="brand-text">Online Book Store</span>
        </Link>
        <div className="nav-links">
          <a
            href="#home"
            className={`nav-link ${activeLink === "home" ? "active" : ""}`}
            onClick={scrollToHome}
          >
            Home
          </a>
          <a
            href="#trending"
            className={`nav-link ${activeLink === "trending" ? "active" : ""}`}
            onClick={scrollToTrending}
          >
            Trending
          </a>
          <a
            href="#about"
            className={`nav-link ${activeLink === "about" ? "active" : ""}`}
            onClick={scrollToAbout}
          >
            About Us
          </a>
          <a
            href="#contact"
            className={`nav-link ${activeLink === "contact" ? "active" : ""}`}
            onClick={scrollToContact}
          >
            Contact Us
          </a>

          <Link
            to="/cart"
            className={`nav-link ${activeLink === "cart" ? "active" : ""}`}
            onClick={() => setActiveLink("cart")}
          >
            Cart
          </Link>

          {/* Show Admin link if user is admin */}
          {user?.role === 'admin' && (
            <Link
              to="/admin"
              className={`nav-link ${activeLink === "admin" ? "active" : ""}`}
              onClick={() => setActiveLink("admin")}
            >
              Admin
            </Link>
          )}

          {!user ? (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="nav-link">Register</Link>
            </>
          ) : (
            <>
              <div className="notification-wrapper" ref={notificationRef}>
                <button
                  className="notification-btn"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount}</span>
                  )}
                </button>
                {showNotifications && (
                  <div className="notification-dropdown">
                    <div className="notification-header">
                      <h3>Notifications</h3>
                      {notifications.length > 0 && (
                        <button className="clear-btn" onClick={clearNotifications}>Clear All</button>
                      )}
                    </div>
                    <div className="notification-list">
                      {notifications.length === 0 ? (
                        <div className="no-notifications">
                          <svg width="48" height="48" fill="#cbd5e1" viewBox="0 0 24 24">
                            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                          </svg>
                          <p>No notifications yet</p>
                        </div>
                      ) : (
                        notifications.map((notification, index) => {
                          const actualIndex = notifications.length - 1 - index;
                          return (
                            <div
                              key={index}
                              className="notification-item"
                              onClick={() => openOrderDetails(notification)}
                              style={{ cursor: 'pointer' }}
                            >
                              <div className="notification-icon">✓</div>
                              <div className="notification-content">
                                <h4>{notification.title}</h4>
                                <p>{notification.message}</p>
                                <span className="notification-time">{notification.time}</span>
                              </div>
                              <button
                                className="notification-close-btn"
                                onClick={(e) => removeNotification(actualIndex, e)}
                                title="Remove notification"
                              >
                                ×
                              </button>
                            </div>
                          );
                        }).reverse()
                      )}
                    </div>
                  </div>
                )}
                {/* Order Details Modal */}
                {showOrderModal && selectedOrder && selectedOrder.orderDetails && (
                  <div className="order-details-panel">
                    <button className="modal-close-btn" onClick={closeOrderModal}>×</button>
                    <h2>Order Details</h2>
                    <div className="order-info">
                      <p><strong>Buyer Name:</strong> {selectedOrder.orderDetails.buyerName}</p>
                      <p><strong>Address:</strong> {selectedOrder.orderDetails.buyerAddress}</p>
                      <p><strong>Order Time:</strong> {selectedOrder.time}</p>
                    </div>
                    <h3>Products Ordered</h3>
                    <div className="order-products">
                      {selectedOrder.orderDetails.books.map((book, index) => (
                        <div key={index} className="order-product-card">
                          <img src={book.image} alt={book.title} className="order-product-image" />
                          <div className="order-product-details">
                            <h4>{book.title}</h4>
                            <p className="order-product-author">by {book.author}</p>
                            <p className="order-product-category">{book.category}</p>
                            {book.description && (
                              <p className="order-product-description">{book.description}</p>
                            )}
                            <div className="order-product-rating">
                              {[...Array(5)].map((_, i) => (
                                <span key={i} className={i < Math.floor(book.rating) ? "star filled" : "star"}>
                                  ★
                                </span>
                              ))}
                              <span className="rating-value">({book.rating})</span>
                            </div>
                            <div className="order-product-price">
                              {book.originalPrice && (
                                <span className="original-price">₹{book.originalPrice}</span>
                              )}
                              <span className="current-price">₹{book.price}</span>
                              {book.discount && (
                                <span className="discount-tag">{book.discount}% OFF</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="order-total">
                      <h3>Total Amount: ₹{selectedOrder.orderDetails.totalAmount}</h3>
                    </div>
                  </div>
                )}
              </div>
              <div className="profile-wrapper" ref={dropdownRef}>
                <button className="profile-btn" onClick={() => setShowProfile(!showProfile)}>
                  <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                  </svg>
                </button>
                {showProfile && (
                  <div className="profile-dropdown">
                    <button
                      className="profile-close"
                      onClick={() => setShowProfile(false)}
                      aria-label="Close profile"
                    >
                      ×
                    </button>
                    {/* Profile Modal Content with vertical scroll */}
                    <div style={{ maxHeight: '70vh', overflowY: 'auto', padding: '0 8px' }}>
                      <div className="profile-avatar" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '16px' }}>
                        {/* Avatar and close button */}
                        <div className="profile-avatar" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                          <svg width="60" height="60" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                          </svg>
                        </div>
                      </div>
                      <div className="profile-field" style={{width: '100%'}}>
                        <label style={{fontWeight: 600, color: '#6366f1', fontSize: '0.93rem', marginBottom: '3px', display: 'block', letterSpacing: '0.5px', textTransform: 'uppercase'}}>NAME</label>
                        <input style={{width: '92%', padding: '10px 12px', borderRadius: '7px', border: '1.5px solid #d1d5db', fontSize: '1rem', background: '#f4f6fb', marginBottom: '10px', color: '#222', outline: 'none', transition: 'border 0.2s', boxShadow: '0 1px 2px rgba(99,102,241,0.04)'}} value={user?.name || "Customer"} readOnly />
                      </div>
                      <div className="profile-field" style={{width: '100%'}}>
                        <label style={{fontWeight: 600, color: '#6366f1', fontSize: '0.93rem', marginBottom: '3px', display: 'block', letterSpacing: '0.5px', textTransform: 'uppercase'}}>EMAIL</label>
                        <input style={{width: '92%', padding: '10px 12px', borderRadius: '7px', border: '1.5px solid #d1d5db', fontSize: '1rem', background: '#f4f6fb', marginBottom: '10px', color: '#222', outline: 'none', transition: 'border 0.2s', boxShadow: '0 1px 2px rgba(99,102,241,0.04)'}} value={user?.email || ""} readOnly />
                      </div>
                      <div className="profile-field" style={{width: '100%'}}>
                        <label style={{fontWeight: 600, color: '#6366f1', fontSize: '0.93rem', marginBottom: '3px', display: 'block', letterSpacing: '0.5px', textTransform: 'uppercase'}}>MOBILE NO</label>
                        <input style={{width: '92%', padding: '10px 12px', borderRadius: '7px', border: '1.5px solid #d1d5db', fontSize: '1rem', background: '#f4f6fb', marginBottom: '10px', color: '#222', outline: 'none', transition: 'border 0.2s', boxShadow: '0 1px 2px rgba(99,102,241,0.04)'}} value={user?.mobile || "Not provided"} readOnly />
                      </div>
                      <div className="profile-field" style={{width: '100%'}}>
                        <label style={{fontWeight: 600, color: '#6366f1', fontSize: '0.93rem', marginBottom: '3px', display: 'block', letterSpacing: '0.5px', textTransform: 'uppercase'}}>ROLE</label>
                        <input style={{width: '92%', padding: '10px 12px', borderRadius: '7px', border: '1.5px solid #d1d5db', fontSize: '1rem', background: '#f4f6fb', marginBottom: '10px', color: '#222', outline: 'none', transition: 'border 0.2s', boxShadow: '0 1px 2px rgba(99,102,241,0.04)'}} value={user?.role || "customer"} readOnly />
                      </div>
                      <button
                        className="change-password-btn"
                        style={{width: '100%', margin: '16px 0', background: '#10b981', color: '#fff', fontWeight: 600, borderRadius: '8px', padding: '10px 0', fontSize: '1rem'}}
                        onClick={() => setShowChangePassword(true)}
                      >
                        Change Password
                      </button>
                      <button className="logout-btn" style={{width: '100%', background: '#ef4444', color: '#fff', fontWeight: 600, borderRadius: '8px', padding: '12px 0', fontSize: '1rem', marginTop: '0'}} onClick={handleLogout}>Logout</button>
                      {showChangePassword && (
                        <div className="change-password-section" style={{
                          marginTop: '24px',
                          padding: '16px',
                          background: '#f8fafc',
                          borderRadius: '12px',
                          boxShadow: '0 2px 8px #e0e7ef',
                          position: 'relative',
                          maxHeight: '60vh',
                          overflowY: 'auto', // Enable vertical scroll only
                          overflowX: 'hidden', // Remove horizontal scroll again
                          minWidth: 0 // Prevents overflow from flexbox children
                        }}>
                          {/* Close icon */}
                          <button
                            className="modal-close-btn"
                            style={{position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', fontSize: '1.3rem', color: '#64748b', cursor: 'pointer' }}
                            onClick={() => setShowChangePassword(false)}
                            aria-label="Close"
                          >
                            ✕
                          </button>
                          <h3 style={{marginBottom: '12px', color: '#334155'}}>Change Password</h3>
                          <div style={{marginBottom: '12px'}}>
                            <label style={{display: 'block', fontWeight: 500, marginBottom: '4px'}}>Current Password</label>
                            <div style={{display: 'flex', alignItems: 'center'}}>
                              <input
                                type={showCurrentPassword ? 'text' : 'password'}
                                value={currentPassword}
                                onChange={e => setCurrentPassword(e.target.value)}
                                placeholder="Enter current password"
                                style={{width: '96%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                              />
                              <button
                                type="button"
                                style={{marginLeft: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '1.1rem' }}
                                onClick={() => setShowCurrentPassword(prev => !prev)}
                              >
                                {showCurrentPassword ? '🙈' : '👁️'}
                              </button>
                            </div>
                          </div>
                          <div style={{marginBottom: '12px'}}>
                            <label style={{display: 'block', fontWeight: 500, marginBottom: '4px'}}>New Password</label>
                            <input
                              type="password"
                              value={newPassword}
                              onChange={e => setNewPassword(e.target.value)}
                              placeholder="Enter new password"
                              style={{width: '96%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                            />
                          </div>
                          <div style={{marginBottom: '16px'}}>
                            <label style={{display: 'block', fontWeight: 500, marginBottom: '4px'}}>Confirm Password</label>
                            <input
                              type="password"
                              value={confirmPassword}
                              onChange={e => setConfirmPassword(e.target.value)}
                              placeholder="Confirm new password"
                              style={{width: '96%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                            />
                          </div>
                          <div style={{display: 'flex', gap: '12px'}}>
                            <button className="confirm-btn" style={{flex: 1, background: '#10b981', color: '#fff', fontWeight: 600, borderRadius: '8px', padding: '10px 0'}} onClick={handleChangePassword}>Update Password</button>
                            <button className="secondary-btn" style={{flex: 1, background: '#e0e7ef', color: '#334155', fontWeight: 600, borderRadius: '8px', padding: '10px 0'}} onClick={() => setShowChangePassword(false)}>Cancel</button>
                          </div>
                          {passwordToast && <div className="toast toast-success" style={{marginTop: '12px'}}>{passwordToast}</div>}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}