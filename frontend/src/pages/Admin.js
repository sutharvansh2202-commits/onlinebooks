import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useUser } from "../context/UserContext";
import "../styles/Admin.css";
import Swal from 'sweetalert2';

export default function Admin() {
  const { user } = useUser();
  const navigate = useNavigate();
  // Redirect if not admin
  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);
  // Trending books state
  const [showTrendingBooks, setShowTrendingBooks] = useState(false);
  const [trendingBooks, setTrendingBooks] = useState([]);
  // Fetch trending books from backend
  const fetchTrendingBooks = async () => {
    try {
      const res = await api.get("/trending");
      setTrendingBooks(Array.isArray(res.data) ? res.data : []);
      localStorage.setItem('trendingBooks', JSON.stringify(res.data));
    } catch (error) {
      setTrendingBooks([]);
    }
  };

  // Handler to toggle trending book selection
  const handleTrendingSelect = (bookId) => {
    setTrendingBooks((prev) =>
      prev.includes(bookId)
        ? prev.filter((id) => id !== bookId)
        : [...prev, bookId]
    );
  };
  // ...existing code...
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    price: "",
    originalPrice: "",
    discount: "",
    rating: "5",
    category: "",
    description: "",
    image: ""
  });
  const [adminData, setAdminData] = useState({
    email: "",
    password: "",
    name: ""
  });
  const [toast, setToast] = useState("");
  const [showAddAdmin, setShowAddAdmin] = useState(true);
  const [showAddBook, setShowAddBook] = useState(false);
  const [books, setBooks] = useState([]);
  const [showBookList, setShowBookList] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [contactMessages, setContactMessages] = useState([]);
  const [showMessages, setShowMessages] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  // Fetch admins list
  const fetchAdmins = async () => {
    try {
      const res = await api.get("/auth/admins");
      setAdmins(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      // Optionally handle error
    }
  };

  useEffect(() => {
    // Check admin access using backend API or context (example: fetch user info from backend)
    // For now, assume backend handles admin authentication and redirects on login.
    // If you use a global user context, check user role here.
    // Otherwise, let backend protect admin routes.
    // Remove localStorage usage.
  }, [navigate]);

  useEffect(() => {
    fetchBooks();
    fetchAdmins();
    fetchTrendingBooks();
    
  }, []);

  // Handler for closing admin panel
  const handleCloseAdminPanel = () => {
    navigate("/");
  };

  const fetchBooks = async () => {
    try {
      const res = await api.get("/books");
      setBooks(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error fetching books:", error);
    }
  };

  const handleDeleteBook = async (bookId) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to recover this book!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    });
    if (!result.isConfirmed) {
      return;
    }
    try {
      await api.delete(`/books/${bookId}`);
      setToast("Book deleted successfully");
      setTimeout(() => setToast(""), 2500);
      fetchBooks();
    } catch (error) {
      setToast("Error deleting book");
      setTimeout(() => setToast(""), 2500);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAdminChange = (e) => {
    const { name, value } = e.target;
    setAdminData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();

    if (!adminData.email || !adminData.password || !adminData.name) {
      setToast("Please fill in all admin fields");
      setTimeout(() => setToast(""), 2500);
      return;
    }

    try {
      await api.post("/auth/add-admin", adminData);
      setToast("✓ New admin added successfully!");
      setTimeout(() => setToast(""), 2500);
      setAdminData({ email: "", password: "", name: "" });
      fetchAdmins();
    } catch (error) {
      setToast(error.response?.data?.message || "Error adding admin");
      setTimeout(() => setToast(""), 3000);
    }
  };

  // Remove admin handler (moved out of handleAddAdmin)
  const handleRemoveAdmin = async (adminId) => {
    if (!window.confirm("Are you sure you want to remove this admin?")) return;
    try {
      await api.delete(`/auth/admins/${adminId}`);
      setToast("Admin removed successfully");
      setTimeout(() => setToast(""), 2000);
      fetchAdmins();
    } catch (error) {
      setToast("Error removing admin");
      setTimeout(() => setToast(""), 2000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.title || !formData.author || !formData.price || !formData.image) {
      setToast("Please fill in all required fields");
      setTimeout(() => setToast(""), 2500);
      return;
    }

    try {
      const bookData = {
        title: formData.title,
        author: formData.author,
        price: Number(formData.price),
        originalPrice: formData.originalPrice ? Number(formData.originalPrice) : null,
        discount: formData.discount ? Number(formData.discount) : 0,
        rating: Number(formData.rating),
        category: formData.category,
        description: formData.description,
        image: formData.image
      };

      await api.post("/books", bookData);
      setToast("✓ Book added successfully!");
      setTimeout(() => setToast(""), 2500);

      // Clear form and refresh books list
      setFormData({
        title: "",
        author: "",
        price: "",
        originalPrice: "",
        discount: "",
        rating: "5",
        category: "",
        description: "",
        image: ""
      });
      fetchBooks();
    } catch (error) {
      setToast("Error adding book. Please check if you're logged in as admin.");
      setTimeout(() => setToast(""), 3000);
    }
  };
  const fetchMessages = async () => {
    try {
      const res = await api.get("/admin/messages");
      setContactMessages(res.data);
    } catch (error) {
      console.error("Error fetching messages", error);
    }
  };
  const sendReply = async (contactId) => {
    if (!replyText) return;

    try {
      await api.post("/admin/reply", {
        contactId,
        replyMessage: replyText
      });

      setToast("Reply sent successfully!");
      setReplyText("");
      setSelectedMessageId(null);
      fetchMessages();
    } catch (error) {
      setToast("Failed to send reply");
    }

    setTimeout(() => setToast(""), 2500);
  };
  // Add state for editing
  const [editingBook, setEditingBook] = useState(null);

  const handleEditBook = (book) => {
    setEditingBook(book);
    setShowAddBook(false);
    setShowBookList(false);
    setShowAddAdmin(false);
    setShowTrendingBooks(false);
    setShowMessages(false);
    setFormData({
      title: book.title,
      author: book.author,
      price: book.price,
      originalPrice: book.originalPrice,
      discount: book.discount,
      rating: book.rating,
      category: book.category,
      description: book.description,
      image: book.image
    });
  };

  const handleUpdateBook = async (e) => {
    e.preventDefault();
    if (!editingBook) return;
    try {
      const bookData = {
        title: formData.title,
        author: formData.author,
        price: Number(formData.price),
        originalPrice: formData.originalPrice ? Number(formData.originalPrice) : null,
        discount: formData.discount ? Number(formData.discount) : 0,
        rating: Number(formData.rating),
        category: formData.category,
        description: formData.description,
        image: formData.image
      };
      await api.put(`/books/${editingBook._id}`, bookData);
      setToast("✓ Book updated successfully!");
      setTimeout(() => setToast(""), 2500);
      setEditingBook(null);
      setFormData({
        title: "",
        author: "",
        price: "",
        originalPrice: "",
        discount: "",
        rating: "5",
        category: "",
        description: "",
        image: ""
      });
      fetchBooks();
      setShowBookList(true);
    } catch (error) {
      setToast("Error updating book.");
      setTimeout(() => setToast(""), 3000);
    }
  };

  return (
    <>
      <div className="creative-bg-shapes">
        <span className="shape1"></span>
        <span className="shape2"></span>
        <span className="shape3"></span>
        <span className="shape4"></span>
        <span className="shape5"></span>
      </div>
      <div className="admin-panel-layout">
        <button className="admin-back-btn" onClick={handleCloseAdminPanel} title="Close Admin Panel">
          Back to Store
        </button>
        <aside className="admin-sidebar">
          <h2>Online Book Store</h2>
          <div className="admin-sidebar-btns">
            <button
              className={`sidebar-btn${showAddAdmin ? ' active' : ''}`}
              onClick={() => {
                setShowAddAdmin(true);
                setShowAddBook(false);
                setShowBookList(false);
                setShowTrendingBooks(false);
                setShowMessages(false);
              }}
            >
              <span className="sidebar-emoji" role="img" aria-label="Add Admin">👤</span> Add Admin
            </button>
            <button
              className={`sidebar-btn${showAddBook ? ' active' : ''}`}
              onClick={() => {
                setShowAddBook(true);
                setShowAddAdmin(false);
                setShowBookList(false);
                setShowTrendingBooks(false);
                setShowMessages(false);
              }}
            >
              <span className="sidebar-emoji" role="img" aria-label="Add Book">➕</span> Add Book
            </button>
            <button
              className={`sidebar-btn${showTrendingBooks ? ' active' : ''}`}
              onClick={() => {
                setShowTrendingBooks(true);
                setShowAddAdmin(false);
                setShowAddBook(false);
                setShowBookList(false);
                setShowMessages(false);
              }}
            >
              <span className="sidebar-emoji" role="img" aria-label="Trending Books">🔥</span> Trending Books
            </button>
            <button
              className={`sidebar-btn${showBookList ? ' active' : ''}`}
              onClick={() => {
                setShowBookList(true);
                setShowAddAdmin(false);
                setShowAddBook(false);
                setShowTrendingBooks(false);
                setShowMessages(false);
              }}
            >
              <span className="sidebar-emoji" role="img" aria-label="View Books">📚</span> View Books ({books.length})
            </button>
            <button
              className={`sidebar-btn${showMessages ? ' active' : ''}`}
              onClick={() => {
                setShowMessages(true);
                setShowAddAdmin(false);
                setShowAddBook(false);
                setShowBookList(false);
                setShowTrendingBooks(false);
                fetchMessages();
              }}

            >
              <span className="sidebar-emoji">💬</span> Customer Messages
            </button>
          </div>
        </aside>
        <div className="admin-main-content-wrapper">
          <section className="admin-main-content">
            {/* Split layout for Trending Books */}
            {showTrendingBooks ? (
              <div style={{ display: 'flex', gap: '32px', minHeight: '70vh' }}>
                {/* Left: All Books */}
                <div style={{ flex: '0 0 60%', borderRight: '2px solid #f3f3f3', paddingRight: '24px' }}>
                  <h2 style={{ marginLeft: "52px" }}>All Books</h2>
                  <div className="books-grid">
                    {books.map((book) => (
                      <div
                        key={book._id}
                        className="book-item-admin draggable-book"
                        draggable
                        onDragStart={e => {
                          // Always use MongoDB _id for trendingBooks
                          e.dataTransfer.setData('bookId', book._id);
                        }}
                      >
                        <img src={book.image} alt={book.title} onError={e => e.target.src = 'https://via.placeholder.com/150'} />
                        <div className="book-info-admin">
                          <h3>{book.title}</h3>
                          <p className="author">{book.author}</p>
                          <p className="price">₹{book.price}</p>
                          <p className="category">{book.category}</p>
                        </div>
                        <button className="delete-btn" onClick={() => handleDeleteBook(book._id)}>
                          🗑️ Delete
                        </button>
                        <button className="edit-btn" style={{ marginTop: '10px' }} onClick={() => handleEditBook(book)}>
                          <span role="img" aria-label="Edit">✏️</span> Edit
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Right: Trending Books Drop Zone */}
                <div style={{ flex: '0 0 40%', paddingLeft: '24px', position: 'relative', display: 'flex', flexDirection: 'column', minHeight: '400px' }}>
                  <h2>Trending Books</h2>
                  <div
                    className="books-grid trending-drop-zone"
                    style={{ minHeight: '300px', background: '#fffbe9', border: '2px dashed #f59e0b', borderRadius: '12px', padding: '16px', transition: 'background 0.2s' }}
                    onDragOver={e => {
                      e.preventDefault();
                      e.currentTarget.style.background = '#fff3c4';
                    }}
                    onDragLeave={e => {
                      e.currentTarget.style.background = '#fffbe9';
                    }}
                    onDrop={async e => {
                      e.preventDefault();
                      e.currentTarget.style.background = '#fffbe9';
                      const bookId = e.dataTransfer.getData('bookId');
                      if (!bookId) return;
                      // Only allow valid MongoDB _id
                      if (!books.some(b => b._id === bookId)) {
                        setToast('Invalid book selected');
                        setTimeout(() => setToast(''), 2000);
                        return;
                      }
                      if (trendingBooks.includes(bookId)) {
                        setToast('Book already added to Trending');
                        setTimeout(() => setToast(''), 2000);
                        return;
                      }
                      // Filter out any undefined/invalid values (MongoDB ObjectId: 24 hex chars)
                      const newTrending = [...trendingBooks, bookId]
                        .map(id => (id ? String(id) : ''))
                        .filter(id => typeof id === 'string' && /^[a-fA-F0-9]{24}$/.test(id));
                      if (newTrending.length === 0) {
                        setToast('No valid book IDs to add');
                        setTimeout(() => setToast(''), 2000);
                        return;
                      }
                      await api.post('/trending', { bookIds: newTrending });
                      fetchTrendingBooks();
                    }}
                  >
                    {trendingBooks.length === 0 && <div style={{ color: '#f59e0b', textAlign: 'center', marginTop: '40px' }}>Drag books here to make them trending!</div>}
                    {trendingBooks.map((id) => {
                      const book = books.find(b => b._id === id);
                      if (!book) return null;
                      return (
                        <div key={id} className="book-item-admin trending-selected" style={{ position: 'relative' }}>
                          <img src={book.image} alt={book.title} onError={e => e.target.src = 'https://via.placeholder.com/150'} />
                          <div className="book-info-admin">
                            <h3>{book.title}</h3>
                            <p className="author">{book.author}</p>
                            <p className="price">₹{book.price}</p>
                            <p className="category">{book.category}</p>
                          </div>
                          <button
                            className="remove-trending-btn"
                            style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', color: '#e11d48', fontSize: '1.2rem', cursor: 'pointer' }}
                            onClick={async () => {
                              // Only allow valid MongoDB _id
                              if (!books.some(b => b._id === id)) {
                                setToast('Invalid book selected');
                                setTimeout(() => setToast(''), 2000);
                                return;
                              }
                              const updated = trendingBooks
                                .map(tid => (tid ? String(tid) : ''))
                                .filter(tid => tid !== id && /^[a-fA-F0-9]{24}$/.test(tid));
                              await api.post('/trending', { bookIds: updated });
                              fetchTrendingBooks();
                            }}
                          >❌</button>
                        </div>
                      );
                    })}
                  </div>
                  <button
                    className="more-books-btn"
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      margin: '16px',
                      background: 'var(--primary)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 22px',
                      fontWeight: 600,
                      fontSize: '1rem',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(79,70,229,0.13)',
                      zIndex: 2
                    }}
                    onClick={() => navigate('/allbooks')}
                  >
                    More Books
                  </button>
                </div>
              </div>
            ) : (
              // ...existing admin content (forms, lists, etc.) goes here...
              <>
                {showAddAdmin && (
                  <div className="add-admin-section">
                    <h2>Add New Admin</h2>
                    <form className="admin-form-inline" onSubmit={handleAddAdmin}>
                      <input
                        type="email"
                        name="email"
                        placeholder="Admin Email"
                        value={adminData.email}
                        onChange={handleAdminChange}
                        required
                      />
                      <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={adminData.password}
                        onChange={handleAdminChange}
                        required
                      />
                      <input
                        type="text"
                        name="name"
                        placeholder="Admin Name"
                        value={adminData.name}
                        onChange={handleAdminChange}
                        required
                      />
                      <button type="submit" className="submit-admin-btn">Add Admin</button>
                    </form>
                    <div className="admin-list-section">
                      <h3>Current Admins</h3>
                      <ul className="admin-list">
                        {admins.map((admin) => (
                          <li key={admin._id || admin.id} className="admin-list-item">
                            <span>{admin.name} ({admin.email})</span>
                            <button className="remove-admin-btn" onClick={() => handleRemoveAdmin(admin._id || admin.id)}>Remove</button>
                          </li>
                        ))}
                        {admins.length === 0 && <li>No admins found.</li>}
                      </ul>
                    </div>
                  </div>
                )}

                {showAddBook && (
                  <div className="admin-content">
                    <form className="admin-form" onSubmit={handleSubmit}>
                      <div className="form-grid">
                        <div className="form-group">
                          <label htmlFor="title">Book Title *</label>
                          <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="Enter book title"
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="author">Author *</label>
                          <input
                            type="text"
                            id="author"
                            name="author"
                            value={formData.author}
                            onChange={handleChange}
                            placeholder="Enter author name"
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="price">Price (₹) *</label>
                          <input
                            type="number"
                            id="price"
                            name="price"
                            value={formData.price}
                            onChange={handleChange}
                            placeholder="500"
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="originalPrice">Original Price (₹)</label>
                          <input
                            type="number"
                            id="originalPrice"
                            name="originalPrice"
                            value={formData.originalPrice}
                            onChange={handleChange}
                            placeholder="700"
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="discount">Discount (%)</label>
                          <input
                            type="number"
                            id="discount"
                            name="discount"
                            value={formData.discount}
                            onChange={handleChange}
                            placeholder="29"
                            min="0"
                            max="100"
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="rating">Rating *</label>
                          <select
                            id="rating"
                            name="rating"
                            value={formData.rating}
                            onChange={handleChange}
                            required
                          >
                            <option value="5">5 Stars</option>
                            <option value="4">4 Stars</option>
                            <option value="3">3 Stars</option>
                            <option value="2">2 Stars</option>
                            <option value="1">1 Star</option>
                          </select>
                        </div>

                        <div className="form-group full-width">
                          <label htmlFor="category">Category</label>
                          <select
                            id="category"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            required
                          >
                            <option value="">Select Category</option>
                            <option value="Fiction">Fiction</option>
                            <option value="Non-Fiction">Non-Fiction</option>
                            <option value="Programming">Programming</option>
                            <option value="Business">Business</option>
                            <option value="Self-Help">Self-Help</option>
                            <option value="Competitive Exams">Competitive Exams</option>
                            <option value="Kids">Kids</option>
                            <option value="Spiritual">Spiritual</option>
                          </select>
                        </div>

                        <div className="form-group full-width">
                          <label htmlFor="image">Image URL *</label>
                          <input
                            type="url"
                            id="image"
                            name="image"
                            value={formData.image}
                            onChange={handleChange}
                            placeholder="https://example.com/book-cover.jpg"
                            required
                          />
                        </div>

                        <div className="form-group full-width">
                          <label htmlFor="description">Description</label>
                          <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Enter book description..."
                            rows="4"
                          ></textarea>
                        </div>
                      </div>

                      <div className="form-actions">
                        <button type="submit" className="submit-btn">Add Book</button>
                        <button type="button" className="reset-btn" onClick={() => setFormData({
                          title: "", author: "", price: "", originalPrice: "", discount: "",
                          rating: "5", category: "", description: "", image: ""
                        })}>Clear Form</button>
                      </div>
                    </form>

                    {formData.image && (
                      <div className="preview-section">
                        <h3>Preview</h3>
                        <div className="book-preview">
                          <img src={formData.image} alt="Preview" onError={e => e.target.src = ''} />
                          <h4>{formData.title || "Book Title"}</h4>
                          <p>{formData.author || "Author Name"}</p>
                          <div className="preview-price">
                            <span>₹{formData.price || "0"}</span>
                            {formData.originalPrice && <span className="old-price">₹{formData.originalPrice}</span>}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Edit Book Form */}
                {editingBook && (
                  <div className="admin-content">
                    <h2>Edit Book</h2>
                    <form className="admin-form" onSubmit={handleUpdateBook}>
                      <div className="form-grid">
                        <div className="form-group">
                          <label htmlFor="title">Book Title *</label>
                          <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="Enter book title"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="author">Author *</label>
                          <input
                            type="text"
                            id="author"
                            name="author"
                            value={formData.author}
                            onChange={handleChange}
                            placeholder="Enter author name"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="price">Price (₹) *</label>
                          <input
                            type="number"
                            id="price"
                            name="price"
                            value={formData.price}
                            onChange={handleChange}
                            placeholder="500"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="originalPrice">Original Price (₹)</label>
                          <input
                            type="number"
                            id="originalPrice"
                            name="originalPrice"
                            value={formData.originalPrice}
                            onChange={handleChange}
                            placeholder="700"
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="discount">Discount (%)</label>
                          <input
                            type="number"
                            id="discount"
                            name="discount"
                            value={formData.discount}
                            onChange={handleChange}
                            placeholder="29"
                            min="0"
                            max="100"
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="rating">Rating *</label>
                          <select
                            id="rating"
                            name="rating"
                            value={formData.rating}
                            onChange={handleChange}
                            required
                          >
                            <option value="5">5 Stars</option>
                            <option value="4">4 Stars</option>
                            <option value="3">3 Stars</option>
                            <option value="2">2 Stars</option>
                            <option value="1">1 Star</option>
                          </select>
                        </div>
                        <div className="form-group full-width">
                          <label htmlFor="category">Category</label>
                          <select
                            id="category"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            required
                          >
                            <option value="">Select Category</option>
                            <option value="Fiction">Fiction</option>
                            <option value="Non-Fiction">Non-Fiction</option>
                            <option value="Programming">Programming</option>
                            <option value="Business">Business</option>
                            <option value="Self-Help">Self-Help</option>
                            <option value="Competitive Exams">Competitive Exams</option>
                            <option value="Kids">Kids</option>
                            <option value="Spiritual">Spiritual</option>
                          </select>
                        </div>
                        <div className="form-group full-width">
                          <label htmlFor="image">Image URL *</label>
                          <input
                            type="url"
                            id="image"
                            name="image"
                            value={formData.image}
                            onChange={handleChange}
                            placeholder="https://example.com/book-cover.jpg"
                            required
                          />
                        </div>
                        <div className="form-group full-width">
                          <label htmlFor="description">Description</label>
                          <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Enter book description..."
                            rows="4"
                          ></textarea>
                        </div>
                      </div>
                      <div className="form-actions">
                        <button type="submit" className="submit-btn">Update</button>
                        <button type="button" className="reset-btn" onClick={() => {
                          setEditingBook(null);
                          setFormData({
                            title: "",
                            author: "",
                            price: "",
                            originalPrice: "",
                            discount: "",
                            rating: "5",
                            category: "",
                            description: "",
                            image: ""
                          });
                          setShowBookList(true);
                        }}>Cancel</button>
                      </div>
                    </form>
                    {formData.image && (
                      <div className="preview-section">
                        <h3>Preview</h3>
                        <div className="book-preview">
                          <img src={formData.image} alt="Preview" onError={e => e.target.src = ''} />
                          <h4>{formData.title || "Book Title"}</h4>
                          <p>{formData.author || "Author Name"}</p>
                          <div className="preview-price">
                            <span>₹{formData.price || "0"}</span>
                            {formData.originalPrice && <span className="old-price">₹{formData.originalPrice}</span>}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {showBookList && (
                  <div className="books-list-section">
                    <h2 style={{ marginLeft: "52px" }}>All Books ({books.length})</h2>
                    <div className="books-grid">
                      {books.map((book) => (
                        <div key={book._id} className="book-item-admin">
                          <img src={book.image} alt={book.title} onError={e => e.target.src = 'https://via.placeholder.com/150'} />
                          <div className="book-info-admin">
                            <h3>{book.title}</h3>
                            <p className="author">{book.author}</p>
                            <p className="price">₹{book.price}</p>
                            <p className="category">{book.category}</p>
                          </div>
                          <button className="delete-btn" onClick={() => handleDeleteBook(book._id)}>
                            🗑️ Delete
                          </button>
                          <button className="edit-btn" style={{ marginTop: '10px', width: '100%', padding: '9px', }} onClick={() => handleEditBook(book)}>
                            <span role="img" aria-label="Edit">✏️</span> Edit
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                    {showMessages && !showAddAdmin && (
              <div className="admin-content">
                <h2>Customer Messages</h2>

                {contactMessages.length === 0 && <p>No messages yet.</p>}

                {contactMessages.map((msg) => (
                  <div key={msg._id} style={{
                    border: "1px solid #ddd",
                    padding: "15px",
                    marginBottom: "15px",
                    borderRadius: "8px"
                  }}>
                    <p><strong>Name:</strong> {msg.name}</p>
                    <p><strong>Email:</strong> {msg.email}</p>
                    <p><strong>Message:</strong> {msg.message}</p>
                    {/* Show all replies */}
                    {msg.replies && msg.replies.length > 0 && (
                      <div style={{marginTop: '8px', marginBottom: '8px'}}>
                        <strong>Replies:</strong>
                        <ul style={{paddingLeft: '18px'}}>
                          {msg.replies.map((rep, idx) => (
                            <li key={rep._id || `${msg._id}-${idx}`} style={{marginBottom: '4px', color: '#2563eb'}}>
                              <strong>{rep.fromAdmin ? 'Online Book Store' : msg.name}:</strong> {rep.message} <span style={{fontSize: '0.85em', color: '#888'}}>({new Date(rep.date).toLocaleString()})</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {/* Always allow reply */}
                    {selectedMessageId === msg._id ? (
                      <>
                        <textarea
                          placeholder="Write your reply..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          rows={4}
                          style={{ width: "100%", marginBottom: "10px" }}
                        />
                        <button onClick={() => sendReply(msg._id)}>
                          Send Reply
                        </button>
                      </>
                    ) : (
                      <button onClick={() => setSelectedMessageId(msg._id)}>
                        Reply
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
              </>
            )}
        

            {toast && <div className="toast toast-success">{toast}</div>}
          </section>
        </div>
      </div>
    </>
  );
}