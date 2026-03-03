
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { sendContactMessage } from "../services/contactService";
import { useUser } from "../context/UserContext";
import "../styles/Books.css";

import Particles from "react-tsparticles";
import { loadStarsPreset } from "tsparticles-preset-stars";
import { useCallback } from "react";

export default function Books() {
  const [books, setBooks] = useState([]);
  const [trendingIds, setTrendingIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [buyerName, setBuyerName] = useState("");
  const [buyerAddress, setBuyerAddress] = useState("");
  const [toast, setToast] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailBook, setDetailBook] = useState(null);
  const [showDescription, setShowDescription] = useState(false);
  const navigate = useNavigate();
  const { user } = useUser();

  const particlesInit = useCallback(async (engine) => {
    await loadStarsPreset(engine);
  }, []);

  useEffect(() => {
    // Fetch all books
    api.get("/books")
      .then(res => {
        setBooks(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => setBooks([]));
    // Fetch trending book IDs
    api.get("/trending")
      .then(res => {
        setTrendingIds(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => setTrendingIds([]));
  }, []);

  useEffect(() => {
    if (isCheckoutOpen || isDetailOpen) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }
    return () => document.body.classList.remove("modal-open");
  }, [isCheckoutOpen, isDetailOpen]);

  const addToCart = (book) => {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    cart.push(book);
    localStorage.setItem("cart", JSON.stringify(cart));
    setToast("✓ Added to cart successfully!");
    setTimeout(() => setToast(""), 2500);
  };

  const openDetail = (book) => {
    setDetailBook(book);
    setShowDescription(false);
    setIsDetailOpen(true);
  };

  const closeDetail = () => {
    setIsDetailOpen(false);
    setDetailBook(null);
  };

  const openCheckout = (book) => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      setToast("Please login or register to buy books.");
      setTimeout(() => setToast(""), 2500);
      navigate("/login", { state: { fromBuy: book } });
      return;
    }
    setSelectedBook(book);
    setBuyerName("");
    setBuyerAddress("");
    setIsCheckoutOpen(true);
  };

  const closeCheckout = () => {
    setIsCheckoutOpen(false);
    setSelectedBook(null);
  };

  const confirmOrder = async () => {
    if (!buyerName.trim() || !buyerAddress.trim()) {
      setToast("Please enter your name and address.");
      setTimeout(() => setToast(""), 2500);
      return;
    }

    // Send order to backend
    try {
      const userId = user && user._id ? user._id : localStorage.getItem("userId");
      const orderPayload = {
        userId,
        books: [
          {
            bookId: selectedBook._id || selectedBook.id,
            title: selectedBook.title,
            price: selectedBook.price,
            quantity: 1
          }
        ],
        buyerName,
        buyerAddress,
        totalAmount: selectedBook.price
      };
      await api.post("/orders", orderPayload, {
        headers: {
          Authorization: localStorage.getItem("token")
        }
      });
    } catch (err) {
      setToast("Order failed. Please try again.");
      setTimeout(() => setToast(""), 2500);
      return;
    }

    // Remove purchased item from cart
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const bookIndex = cart.findIndex(item => item.id === selectedBook.id);
    if (bookIndex !== -1) {
      cart.splice(bookIndex, 1);
      localStorage.setItem("cart", JSON.stringify(cart));
    }

    // Create notification
    const notification = {
      title: "Order Completed!",
      message: `Your order for "${selectedBook.title}" has been placed successfully. Total: ₹${selectedBook.price}`,
      time: new Date().toLocaleString(),
      read: false,
      orderDetails: {
        books: [selectedBook],
        totalAmount: selectedBook.price,
        buyerName,
        buyerAddress
      }
    };

    const existingNotifications = JSON.parse(localStorage.getItem("notifications") || "[]");
    existingNotifications.push(notification);
    localStorage.setItem("notifications", JSON.stringify(existingNotifications));

    // Trigger navbar update
    window.dispatchEvent(new Event("notificationAdded"));

    setToast("Order placed successfully!");
    setTimeout(() => setToast(""), 2500);

    closeCheckout();
  };

  const submitContact = async () => {
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) {
      setToast("Please fill all contact fields.");
      setTimeout(() => setToast(""), 2500);
      return;
    }
    try {
      await sendContactMessage(contactName, contactEmail, contactMessage);
      setToast("Message sent! The retailer will contact you soon.");
      setContactName("");
      setContactEmail("");
      setContactMessage("");
    } catch (err) {
      setToast("Failed to send message. Please try again later.");
    }
    setTimeout(() => setToast(""), 2500);
  };

  // Only show trending books in trending section
  const trendingBooks = books.filter(book => trendingIds.includes(book._id || book.id));
  const filteredTrendingBooks = trendingBooks.filter(book => {
    const title = (book.title || "").toLowerCase();
    const author = (book.author || "").toLowerCase();
    const query = searchTerm.toLowerCase();
    return title.includes(query) || author.includes(query);
  });

  const renderStars = (rating) => {
    return (
      <div className="stars">
        {[...Array(5)].map((_, i) => (
          <span key={i} className={i < rating ? "star filled" : "star"}>
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="books-container" style={{ position: "relative", minHeight: "100vh", overflow: "hidden" }}>
      <Particles
        id="tsparticles"
        init={particlesInit}
        options={{
          preset: "stars",
          background: {
            color: "#fff",
          },
          fullScreen: { enable: false },
          style: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0 },
          interactivity: {
            events: {
              onHover: { enable: true, mode: "repulse" },
              resize: true,
            },
            modes: {
              repulse: { distance: 100, duration: 0.4 },
            },
          },
          particles: {
            color: { value: "#000" },
            number: { value: 100 },
            shape: { type: "star" },
            size: { value: 2 },
          },
        }}
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0 }}
      />
      <div style={{ position: "relative", zIndex: 1 }}>
      <div className="hero-banner" id="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Discover Your Next Great Read</h1>
          <p className="hero-subtitle">Explore thousands of books across all genres. From bestsellers to hidden gems.</p>
          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-number">12K+</span>
              <span className="stat-label">Books Available</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">5★</span>
              <span className="stat-label">Customer Rating</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">Free</span>
              <span className="stat-label">Delivery</span>
            </div>
          </div>
        </div>
      </div>

      <div className="books-header" id="books-section">
        <h1>Now Trending</h1>
        <div className="search-bar">
          {/* Add scroll margin so section is not hidden behind navbar */}
          <style>{`#books-section { scroll-margin-top: 80px; }`}</style>
          <input
            type="text"
            placeholder="Search by Title, Author, Publisher Or ISBN"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="search-btn">🔍</button>
        </div>
      </div>


      <div className="books-grid">
        {filteredTrendingBooks.length === 0 ? (
          <div style={{ color: '#f59e0b', textAlign: 'center', marginTop: '40px' }}>No trending books available.</div>
        ) : (
          filteredTrendingBooks.map(book => (
            <div key={book._id || book.id} className="book-card" onClick={() => openDetail(book)}>
              {book.discount > 0 ? (
                <div className="discount-badge">
                  {book.discount}%
                </div>
              ) : book.discount === 0 ? (
                <div className="discount-badge no-discount" style={{background: '#e0e7ef', color: '#64748b'}}>
                  No Discount
                </div>
              ) : null}
              <div className="book-image-wrapper">
                <img src={book.image} alt={book.title} className="book-image" />
              </div>
              <div className="book-details">
                <h3 className="book-title">{book.title}</h3>
                <p className="book-author">{book.author}</p>
                {renderStars(book.rating)}
                <div className="price-section">
                  <span className="current-price">₹{book.price}</span>
                  {book.originalPrice && (
                    <span className="original-price">₹{book.originalPrice}</span>
                  )}
                </div>
                <div className="card-actions">
                  <button
                    className="add-to-cart-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(book);
                    }}
                  >
                    Add to Cart
                  </button>
                  <button
                    className="buy-now-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      openCheckout(book);
                    }}
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
        {/* More Books Button for Now Trending */}
        <button
          className="more-books-btn"
          onClick={() => navigate('/all-books')}
          style={{ position: 'fixed', bottom: 32, right: 32, zIndex: 1000 }}
        >
          More Books
        </button>
      </div>

      {isDetailOpen && detailBook && (
        <div className="detail-overlay" onClick={closeDetail}>
          <div className="detail-card" onClick={(e) => e.stopPropagation()}>
            <button className="detail-close" onClick={closeDetail} aria-label="Close">
              ✕
            </button>
            <div className="detail-grid">
              <div className="detail-image">
                <img src={detailBook.image} alt={detailBook.title} />
              </div>
              <div className="detail-info">
                <h2>{detailBook.title}</h2>
                <p className="detail-author">by {detailBook.author}</p>
                {renderStars(detailBook.rating)}
                <div className="detail-price">
                  <span className="current-price">₹{detailBook.price}</span>
                  {detailBook.originalPrice && (
                    <span className="original-price">₹{detailBook.originalPrice}</span>
                  )}
                  {detailBook.discount && (
                    <span className="detail-discount">Save {detailBook.discount}%</span>
                  )}
                </div>
                <p className="detail-ship">Ships in 1-2 Days</p>
                <button
                  className="desc-toggle"
                  onClick={() => setShowDescription((prev) => !prev)}
                >
                  {showDescription ? "Hide Description" : "Description"}
                </button>
                {showDescription && (
                  <p className="detail-description">
                    {detailBook.description || "No description available."}
                  </p>
                )}
                <div className="detail-actions">
                  <button className="add-to-cart-btn" onClick={() => addToCart(detailBook)}>
                    Add to Cart
                  </button>
                  <button className="buy-now-btn" onClick={() => openCheckout(detailBook)}>
                    Buy Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isCheckoutOpen && (
        <div className="modal-overlay" onClick={closeCheckout}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Scan to Pay</h2>
                <p className="modal-subtitle">{selectedBook ? selectedBook.title : ""}</p>
                {selectedBook && (
                  <div className="pay-amount">Pay ₹{selectedBook.price}</div>
                )}
              </div>
              <button className="modal-close" onClick={closeCheckout} aria-label="Close">
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="qr-box">
                <img src="/phone-pe.jpg" alt="PhonePe QR - Vansh Ashokbhai Suthar" style={{maxWidth: '220px', borderRadius: '12px', marginBottom: '8px'}} />
                <p className="qr-note">Scan this PhonePe QR to pay directly to Vansh Ashokbhai Suthar using any UPI app.</p>
              </div>
              <div className="form-box">
                <label className="form-field">
                  Name
                  <input
                    type="text"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="Enter your full name"
                  />
                </label>
                <label className="form-field">
                  Address
                  <textarea
                    rows={4}
                    value={buyerAddress}
                    onChange={(e) => setBuyerAddress(e.target.value)}
                    placeholder="Enter your delivery address"
                  />
                </label>
                <div className="modal-actions">
                  <button className="secondary-btn" onClick={closeCheckout}>Cancel</button>
                  <button className="confirm-btn" onClick={confirmOrder}>Confirm Order</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* About Us Section */}
      <section className="about-section">
        <div className="about-container">
          <div className="about-header">
            <h2 className="about-title">About Us</h2>
            <p className="about-subtitle">Your Trusted Partner in Literary Excellence</p>
          </div>

          <div className="about-content">
            <div className="about-text">
              <p>
                Welcome to <strong>Online Book Store</strong>, where stories come alive and knowledge knows no bounds.
                Since our inception, we've been dedicated to bringing readers and books together, creating a haven
                for bibliophiles and curious minds alike.
              </p>
              <p>
                Our carefully curated collection spans across genres—from timeless classics to contemporary bestsellers,
                from gripping manga to thought-provoking non-fiction. We believe every reader deserves access to quality
                literature at affordable prices, which is why we offer competitive discounts and free delivery on all orders.
              </p>
              <p>
                With a commitment to excellence, a passion for reading, and a customer-first approach, we're not just
                selling books—we're building a community of readers. Join thousands of satisfied customers who trust us
                for their literary adventures.
              </p>
            </div>

            <div className="about-features">
              <div className="feature-box">
                <div className="feature-icon">📚</div>
                <h3>Curated Selection</h3>
                <p>Handpicked books across all genres and categories</p>
              </div>
              <div className="feature-box">
                <div className="feature-icon">💰</div>
                <h3>Best Prices</h3>
                <p>Competitive pricing with exclusive discounts up to 40%</p>
              </div>
              <div className="feature-box">
                <div className="feature-icon">🚚</div>
                <h3>Fast Delivery</h3>
                <p>Free shipping on all orders, delivered to your doorstep</p>
              </div>
              <div className="feature-box">
                <div className="feature-icon">⭐</div>
                <h3>Quality Service</h3>
                <p>5-star customer support and satisfaction guaranteed</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="contact-section" id="contact-section">
        <div className="contact-container">
          <div className="contact-header">
            <h2 className="contact-title">Contact Us</h2>
            <p className="contact-subtitle">We are here to help with your orders and questions.</p>
          </div>
          <div className="contact-grid">
            <div className="contact-info">
              <div className="contact-card">
                <h3>Call Us</h3>
                <p>+91 98765 43210</p>
                <p>Mon - Sun, 9:00 AM - 9:00 PM</p>
              </div>
              <div className="contact-card">
                <h3>Email</h3>
                <p>hello@onlinebookstore.com</p>
                <p>support@onlinebookstore.com</p>
              </div>
              <div className="contact-card">
                <h3>Visit</h3>
                <p>123 Book Street, Reading City</p>
                <p>New Delhi, India 110001</p>
              </div>
            </div>
            <div className="contact-form">
              <div className="contact-field">
                <label>Name</label>
                <input
                  type="text"
                  placeholder="Your full name"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                />
              </div>
              <div className="contact-field">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                />
              </div>
              <div className="contact-field">
                <label>Message</label>
                <textarea
                  rows={5}
                  placeholder="Write your message"
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                />
              </div>
              <button className="contact-submit" onClick={submitContact}>Send Message</button>
            </div>
          </div>
        </div>
      </section>

      {toast && <div className="toast toast-success">{toast}</div>}

      {/* Inline style for More Books button, can move to Books.css */}
      <style>{`.more-books-btn {
  background: lightgreen;
  color: #fff;
  border: none;
  border-radius: 24px;
  padding: 12px 28px;
  font-size: 1.1rem;
  font-weight: 600;
  box-shadow: 0 2px 12px rgba(37,99,235,0.25);
  cursor: pointer;
  transition: background 0.3s, box-shadow 0.3s;
}

.more-books-btn:hover {
  background: linear-gradient(145deg, #5aa0f2, #4689e8);
  box-shadow: 0 4px 18px rgba(37,99,235,0.35);
}

      `}</style>
      </div>
    </div>
  );
}