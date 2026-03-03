import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import "../styles/Books.css";

export default function AllBooks() {
  const [books, setBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [buyerName, setBuyerName] = useState("");
  const [buyerAddress, setBuyerAddress] = useState("");
  const [toast, setToast] = useState("");
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailBook, setDetailBook] = useState(null);
  const [showDescription, setShowDescription] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/books")
      .then((res) => {
        console.log("Books fetched:", res.data);
        setBooks(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => {
        console.error("Error fetching books:", err);
        setBooks([]);
      });
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
    const token = localStorage.getItem("token");
    if (!token) {
      setToast("Please login or register to buy books.");
      setTimeout(() => setToast(""), 2500);
      navigate("/login");
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

  const confirmOrder = () => {
    if (!buyerName.trim() || !buyerAddress.trim()) {
      setToast("Please enter your name and address.");
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
    
    // Add notification with full order details
    const notification = {
      title: "Order Completed!",
      message: `Your order for "${selectedBook.title}" has been placed successfully. Total: ₹${selectedBook.price}`,
      time: new Date().toLocaleString(),
      read: false,
      orderDetails: {
        books: [selectedBook],
        totalAmount: selectedBook.price,
        buyerName: buyerName,
        buyerAddress: buyerAddress
      }
    };
    
    const existingNotifications = JSON.parse(localStorage.getItem("notifications") || "[]");
    existingNotifications.push(notification);
    localStorage.setItem("notifications", JSON.stringify(existingNotifications));
    
    // Trigger event for navbar to update
    window.dispatchEvent(new Event("notificationAdded"));
    
    setToast("Order placed! We will verify the payment and contact you.");
    setTimeout(() => setToast(""), 2500);
    closeCheckout();
  };

  const filteredBooks = books.filter((book) => {
    const title = (book.title || "").toLowerCase();
    const author = (book.author || "").toLowerCase();
    const query = searchTerm.toLowerCase();
    return title.includes(query) || author.includes(query);
  });

  // Group books by category
  const booksByCategory = filteredBooks.reduce((acc, book) => {
    const cat = book.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(book);
    return acc;
  }, {});

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
    <div className="books-container">
      <div className="books-header all-books-header" id="all-books-section">
        <h1 style={{color: '#0f172a', fontFamily: 'Playfair Display, serif', fontSize: '6.5rem'}}>All Books</h1>
        <div className="search-bar">
          <style>{`#all-books-section { scroll-margin-top: 80px; }`}</style>
          <input
            type="text"
            placeholder="Search by Title, Author, Publisher Or ISBN"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="search-btn">🔍</button>
        </div>
      </div>

      {/* Show books grouped by category */}
      {Object.keys(booksByCategory).length === 0 && (
        <div style={{ textAlign: "center", margin: "2rem 0" }}>No books found.</div>
      )}
      {Object.entries(booksByCategory).map(([category, books]) => (
        <div key={category} className="category-section">
          <div className="category-header">
            <span className="category-icon" role="img" aria-label="Category">📚</span>
            {category}
          </div>
          <div className="books-grid">
            {books.map((book) => (
              <div key={book._id || book.id} className="book-card" onClick={() => openDetail(book)}>
                {book.discount > 0 ? (
                  <div className="discount-badge">{book.discount}%</div>
                ) : book.discount === 0 ? (
                  <div className="discount-badge no-discount" style={{background: '#e0e7ef', color: '#64748b'}}>No Discount</div>
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
            ))}
          </div>
        </div>
      ))}

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
                <img src="/qr.png" alt="UPI QR" />
                <p className="qr-note">Scan with any UPI app to complete payment.</p>
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

      {toast && <div className="toast toast-success">{toast}</div>}
    </div>
  );
}
