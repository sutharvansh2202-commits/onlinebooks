import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useUser } from "../context/UserContext";
import "../styles/Cart.css";

export default function Cart() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [items, setItems] = useState(() => JSON.parse(localStorage.getItem("cart") || "[]"));
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [buyerName, setBuyerName] = useState("");
  const [buyerAddress, setBuyerAddress] = useState("");
  const [toast, setToast] = useState("");

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.price || 0), 0),
    [items]
  );

  const saveItems = (nextItems) => {
    setItems(nextItems);
    localStorage.setItem("cart", JSON.stringify(nextItems));
  };

  const removeItem = (index) => {
    const nextItems = items.filter((_, itemIndex) => itemIndex !== index);
    saveItems(nextItems);
  };

  const clearCart = () => {
    saveItems([]);
  };

  const openCheckout = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setToast("Please login first.");
      setTimeout(() => setToast(""), 2500);
      navigate("/login");
      return;
    }

    if (items.length === 0) {
      setToast("Your cart is empty.");
      setTimeout(() => setToast(""), 2500);
      return;
    }

    setBuyerName("");
    setBuyerAddress("");
    setIsCheckoutOpen(true);
  };

  const confirmOrder = async () => {
    if (!buyerName.trim() || !buyerAddress.trim()) {
      setToast("Please enter your name and address.");
      setTimeout(() => setToast(""), 2500);
      return;
    }

    try {
      const userId = user && user._id ? user._id : localStorage.getItem("userId");
      const orderPayload = {
        userId,
        books: items.map((book) => ({
          bookId: book._id || book.id,
          title: book.title,
          price: Number(book.price || 0),
          quantity: 1,
        })),
        buyerName,
        buyerAddress,
        totalAmount: subtotal,
      };

      await api.post("/orders", orderPayload, {
        headers: {
          Authorization: localStorage.getItem("token"),
        },
      });

      const notification = {
        title: "Order Completed!",
        message: `Your order has been placed successfully. Total: ₹${subtotal}`,
        time: new Date().toLocaleString(),
        read: false,
        orderDetails: {
          books: items,
          totalAmount: subtotal,
          buyerName,
          buyerAddress,
        },
      };

      const existingNotifications = JSON.parse(localStorage.getItem("notifications") || "[]");
      existingNotifications.push(notification);
      localStorage.setItem("notifications", JSON.stringify(existingNotifications));
      window.dispatchEvent(new Event("notificationAdded"));

      clearCart();
      setIsCheckoutOpen(false);
      setToast("Order placed successfully!");
      setTimeout(() => setToast(""), 2500);
    } catch (error) {
      setToast("Order failed. Please try again.");
      setTimeout(() => setToast(""), 2500);
    }
  };

  return (
    <div className="cart-container">
      <div className="cart-header">
        <div>
          <h1>Your Cart</h1>
          <p>{items.length} item(s)</p>
        </div>
        <div className="cart-header-actions">
          <button className="clear-btn" onClick={clearCart} disabled={items.length === 0}>
            Clear Cart
          </button>
        </div>
      </div>

      <div className="cart-grid">
        <div className="cart-items">
          {items.length === 0 ? (
            <div className="empty-cart">Your cart is empty. Add books from the home page.</div>
          ) : (
            items.map((item, index) => (
              <div className="cart-card" key={`${item._id || item.id || item.title}-${index}`}>
                <div className="cart-image">
                  <img src={item.image} alt={item.title} />
                </div>
                <div className="cart-info">
                  <h3>{item.title}</h3>
                  <p>{item.author}</p>
                  <div className="cart-price">₹{item.price}</div>
                  <button className="delete-btn" onClick={() => removeItem(index)}>
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="cart-summary">
          <h3>Order Summary</h3>
          <div className="summary-row">
            <span>Items</span>
            <span>{items.length}</span>
          </div>
          <div className="summary-row">
            <span>Subtotal</span>
            <span>₹{subtotal}</span>
          </div>
          <div className="summary-total">
            <span>Total</span>
            <span>₹{subtotal}</span>
          </div>
          <button className="checkout-btn" onClick={openCheckout} disabled={items.length === 0}>
            Checkout
          </button>
        </div>
      </div>

      {isCheckoutOpen && (
        <div className="modal-overlay" onClick={() => setIsCheckoutOpen(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Confirm Order</h2>
                <p className="modal-subtitle">Complete details to place your order</p>
                <div className="pay-amount">Pay ₹{subtotal}</div>
              </div>
              <button className="modal-close" onClick={() => setIsCheckoutOpen(false)} aria-label="Close">
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="qr-box">
                <img src="/phone-pe.jpg" alt="Payment" />
                <p className="qr-note">Complete payment with your UPI app.</p>
              </div>
              <div className="form-box">
                <label className="form-field">
                  Name
                  <input
                    type="text"
                    value={buyerName}
                    onChange={(event) => setBuyerName(event.target.value)}
                    placeholder="Enter your full name"
                  />
                </label>
                <label className="form-field">
                  Address
                  <textarea
                    rows={4}
                    value={buyerAddress}
                    onChange={(event) => setBuyerAddress(event.target.value)}
                    placeholder="Enter your delivery address"
                  />
                </label>
                <div className="modal-actions">
                  <button className="secondary-btn" onClick={() => setIsCheckoutOpen(false)}>
                    Cancel
                  </button>
                  <button className="confirm-btn" onClick={confirmOrder}>
                    Confirm Order
                  </button>
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
