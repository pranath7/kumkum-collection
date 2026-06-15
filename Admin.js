// Destructure React hooks from global React object
const { useState, useEffect, useRef } = React;

// Inline SVG Icons for premium crisp visuals
const Icons = {
  Lock: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block' }}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  ),
  Upload: () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block' }}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="17 8 12 3 7 8"></polyline>
      <line x1="12" y1="3" x2="12" y2="15"></line>
    </svg>
  ),
  Trash: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block' }}>
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      <line x1="10" y1="11" x2="10" y2="17"></line>
      <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
  ),
  Edit: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block' }}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
  )
};

// Check if credentials are configured
const isConfigured = window.CONFIG && 
                     window.CONFIG.firebase && 
                     window.CONFIG.firebase.apiKey && 
                     !window.CONFIG.firebase.apiKey.startsWith('YOUR_');

// Initialize Firebase if configured
let db = null;
if (isConfigured) {
  if (!firebase.apps.length) {
    firebase.initializeApp(window.CONFIG.firebase);
  }
  db = firebase.firestore();
}

// Standalone Admin Portal Component
window.Admin = function Admin() {
  const [products, setProducts] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const [activeTab, setActiveTab] = useState('upload');
  const [editingProduct, setEditingProduct] = useState(null);
  const fileInputRef = useRef(null);

  const [newProduct, setNewProduct] = useState({
    name: '',
    code: '',
    price: '',
    category: 'New Arrivals',
    description: ''
  });

  const categories = ['New Arrivals', 'Premium Combos', 'Hot Sellers', 'Trending'];

  // Fetch products database
  const fetchProducts = async () => {
    try {
      if (isConfigured && db) {
        // Query Firestore Database
        const snapshot = await db.collection("products").orderBy("createdAt", "desc").get();
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProducts(list);
      } else {
        // Local Server API Fallback
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          const sorted = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setProducts(sorted);
        }
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  };

  useEffect(() => {
    fetchProducts();
    if (localStorage.getItem('adminToken') === 'mock-session-token-kumkum-collection') {
      setIsLoggedIn(true);
    }
  }, []);

  // Handle Admin Password Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      if (isConfigured && db) {
        // Fetch passcode from config collection in Firestore
        const adminDoc = await db.collection("config").doc("admin").get();
        let correctPassword = "admin123"; // Default initial fallback
        
        if (adminDoc.exists) {
          correctPassword = adminDoc.data().password;
        } else {
          // First run initialization
          await db.collection("config").doc("admin").set({ password: "admin123" });
        }

        if (loginPassword === correctPassword) {
          localStorage.setItem('adminToken', 'mock-session-token-kumkum-collection');
          setIsLoggedIn(true);
          setLoginPassword('');
        } else {
          setLoginError('Invalid admin password.');
        }
      } else {
        // Local Server Mock Login check
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: loginPassword })
        });
        const data = await res.json();
        if (res.ok) {
          localStorage.setItem('adminToken', data.token);
          setIsLoggedIn(true);
          setLoginPassword('');
        } else {
          setLoginError(data.error || 'Login failed');
        }
      }
    } catch (err) {
      setLoginError('Authentication failed. Database connection offline.');
      console.error(err);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsLoggedIn(false);
  };

  // Drag and Drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  const processFile = (file) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Submit product upload / update
  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!editingProduct && !selectedFile) {
      alert('Please select or drag a product photo.');
      return;
    }
    if (!newProduct.name || !newProduct.price || !newProduct.code) {
      alert('Please fill out Name, Code, and Price.');
      return;
    }

    try {
      setUploading(true);

      let imageUrl = editingProduct ? editingProduct.image : '';

      // Only upload a new image if the user selected a new file
      if (selectedFile) {
        if (isConfigured) {
          // 1. Upload Direct to Cloudinary (unsigned preset)
          const cloudName = window.CONFIG.cloudinary.cloudName;
          const uploadPreset = window.CONFIG.cloudinary.uploadPreset;

          if (cloudName.startsWith('YOUR_') || uploadPreset.startsWith('YOUR_')) {
            throw new Error('Please configure your Cloudinary cloudName and uploadPreset in config.js');
          }

          const formData = new FormData();
          formData.append('file', selectedFile);
          formData.append('upload_preset', uploadPreset);

          const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: 'POST',
            body: formData
          });
          
          const uploadData = await uploadRes.json();
          if (!uploadRes.ok) {
            throw new Error(uploadData.error?.message || 'Cloudinary image upload failed');
          }

          imageUrl = uploadData.secure_url;
        } else {
          // Local Server Mock fallback mode
          const formData = new FormData();
          formData.append('image', selectedFile);

          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: formData
          });
          const uploadData = await uploadRes.json();
          if (!uploadRes.ok) {
            throw new Error(uploadData.error || 'Mock upload failed');
          }

          imageUrl = uploadData.url;
        }
      }

      if (isConfigured) {
        if (editingProduct) {
          // 2a. Update Firebase Firestore database document
          await db.collection("products").doc(editingProduct.id).update({
            code: newProduct.code,
            name: newProduct.name,
            category: newProduct.category,
            price: newProduct.price.toString(),
            description: newProduct.description || '',
            image: imageUrl
          });
        } else {
          // 2b. Add new document to Firebase Firestore database
          await db.collection("products").add({
            code: newProduct.code,
            name: newProduct.name,
            category: newProduct.category,
            price: newProduct.price.toString(),
            description: newProduct.description || '',
            image: imageUrl,
            createdAt: new Date().toISOString()
          });
        }
      } else {
        if (editingProduct) {
          // 2c. Update via local server PUT fallback API
          const productRes = await fetch(`/api/products/${editingProduct.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...newProduct,
              image: imageUrl
            })
          });

          const productData = await productRes.json();
          if (!productRes.ok) {
            throw new Error(productData.error || 'Mock update failed');
          }
        } else {
          // 2d. Create via local server POST fallback API
          const productRes = await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...newProduct,
              image: imageUrl
            })
          });

          const productData = await productRes.json();
          if (!productRes.ok) {
            throw new Error(productData.error || 'Mock save failed');
          }
        }
      }

      alert(editingProduct ? 'Product details updated successfully!' : 'Product uploaded successfully and stored permanently on the Cloud!');
      setNewProduct({
        name: '',
        code: '',
        price: '',
        category: 'New Arrivals',
        description: ''
      });
      setSelectedFile(null);
      setPreviewUrl(null);
      setEditingProduct(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      fetchProducts();
      setActiveTab('view');

    } catch (err) {
      alert('Error saving product: ' + err.message);
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  // Handle Edit Click - Load product details into Form
  const handleEditProductClick = (product) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      code: product.code,
      price: product.price,
      category: product.category,
      description: product.description || ''
    });
    setPreviewUrl(product.image);
    setSelectedFile(null);
    setActiveTab('upload');
  };

  // Handle Delete Product listing
  const handleDeleteProduct = async (id, name) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action is permanent.`)) {
      return;
    }
    try {
      if (isConfigured && db) {
        // Delete document from Firestore database
        await db.collection("products").doc(id).delete();
        alert('Product deleted successfully from the cloud database.');
        fetchProducts();
      } else {
        // Local Server Deletion fallback
        const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
        if (res.ok) {
          alert('Product deleted successfully.');
          fetchProducts();
        } else {
          const data = await res.json();
          alert('Failed to delete: ' + (data.error || 'Unknown error'));
        }
      }
    } catch (err) {
      alert('Delete request failed.');
      console.error(err);
    }
  };

  return (
    <div>
      {/* Demo Warning Banner if config is missing */}
      {!isConfigured && (
        <div style={{ background: 'linear-gradient(135deg, #aa8619 0%, #d4af37 100%)', color: '#000', padding: '0.5rem 1rem', fontSize: '0.8rem', fontWeight: '600', textAlign: 'center', letterSpacing: '0.05em' }}>
          ⚠️ PREVIEW MODE: Cloud credentials are not configured. Edit 'config.js' to connect your live Firebase and Cloudinary storage.
        </div>
      )}

      {/* Translucent Glassmorphic Header */}
      <header className="header" style={{ top: isConfigured ? 0 : '30px' }}>
        <nav className="navbar">
          <div className="logo-container" onClick={() => window.location.href = './index.html'} style={{ cursor: 'pointer' }}>
            <img src="./public/images/logo.jpg" alt="Kumkum Collection Logo" className="logo-img" />
            <div>
              <span className="logo-text">KUMKUM</span>
              <div className="logo-subtext">COLLECTION</div>
            </div>
          </div>

          <ul className="nav-links">
            <li>
              <span className="nav-link active">Admin Panel</span>
            </li>
            <li>
              <a href="./index.html" className="nav-link">View Main Site</a>
            </li>
          </ul>
        </nav>
      </header>

      <section className="admin-section" style={{ paddingTop: isConfigured ? '8rem' : '10rem' }}>
        {!isLoggedIn ? (
          /* Secure Login Gate */
          <div className="admin-login-card">
            <div className="admin-login-icon">
              <Icons.Lock />
            </div>
            <h2 className="admin-login-title">Admin Access</h2>
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="Enter admin password"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              {loginError && <p style={{ color: '#ef4444', fontSize: '0.8rem', marginBottom: '1rem' }}>{loginError}</p>}
              <button type="submit" className="admin-submit-btn">Unlock Portal</button>
            </form>
          </div>
        ) : (
          /* Admin Dashboard Panel */
          <div>
            <div className="admin-header-row">
              <div className="admin-title-container">
                <h2 className="admin-list-title">Admin Dashboard</h2>
                <p className="admin-list-subtitle">
                  {isConfigured 
                    ? 'Your uploads are sent directly to Cloudinary and cataloged in Google Firebase Firestore.'
                    : 'Permanently upload product listings and photos to local database storage.'
                  }
                </p>
              </div>
              <button className="admin-logout-btn" onClick={handleLogout}>Log Out</button>
            </div>

            {/* Tabs Navigation */}
            <div className="admin-tabs">
              <button 
                className={`admin-tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
                onClick={() => setActiveTab('upload')}
              >
                📤 Upload Product
              </button>
              <button 
                className={`admin-tab-btn ${activeTab === 'view' ? 'active' : ''}`}
                onClick={() => setActiveTab('view')}
              >
                📋 View Listings ({products.length})
              </button>
            </div>

            <div className="admin-dashboard-content">
              {activeTab === 'upload' ? (
                /* Product Creation Form */
                <div className="admin-form-panel" style={{ maxWidth: '650px', margin: '0 auto' }}>
                  <h3 className="admin-form-title">{editingProduct ? 'Edit Product Details' : 'Upload New Product'}</h3>
                  <form onSubmit={handleAddProduct}>
                    <div className="form-group">
                      <label className="form-label">Product Name</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="e.g. Kundan Emerald Necklace"
                        value={newProduct.name}
                        onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                        required
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Product Code</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="e.g. KC-N202"
                          value={newProduct.code}
                          onChange={e => setNewProduct({...newProduct, code: e.target.value})}
                          required
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Price (INR)</label>
                        <input 
                          type="number" 
                          className="form-input" 
                          placeholder="e.g. 1999"
                          value={newProduct.price}
                          onChange={e => setNewProduct({...newProduct, price: e.target.value})}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Category</label>
                      <select 
                        className="form-input"
                        value={newProduct.category}
                        onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                        style={{ background: 'rgba(0,0,0,0.8)' }}
                      >
                        {categories.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <textarea 
                        className="form-textarea" 
                        placeholder="Detail the stones, work, polishing, size, combo contents, etc."
                        value={newProduct.description}
                        onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Product Image</label>
                      <div 
                        className={`file-upload-zone ${dragOver ? 'dragover' : ''}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current.click()}
                      >
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={handleFileChange} 
                          style={{ display: 'none' }} 
                          accept="image/*"
                        />
                        <div className="file-upload-icon"><Icons.Upload /></div>
                        <p className="file-upload-text">Drag & drop your product photo here or click to browse</p>
                        
                        {previewUrl && (
                          <div className="file-upload-preview" onClick={e => e.stopPropagation()}>
                            <img src={previewUrl} alt="Preview" />
                            <div style={{ textAlign: 'left' }}>
                              <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '500' }}>{selectedFile?.name}</p>
                              <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{(selectedFile?.size / 1024).toFixed(1)} KB</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      className="admin-submit-btn" 
                      disabled={uploading}
                    >
                      {uploading 
                        ? (editingProduct ? 'Updating Details...' : 'Uploading Product...') 
                        : (editingProduct ? 'Update Product Details' : 'Upload Product Permanently')
                      }
                    </button>
                    {editingProduct && (
                      <button 
                        type="button" 
                        className="admin-cancel-btn"
                        onClick={() => {
                          setEditingProduct(null);
                          setNewProduct({
                            name: '',
                            code: '',
                            price: '',
                            category: 'New Arrivals',
                            description: ''
                          });
                          setSelectedFile(null);
                          setPreviewUrl(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                          setActiveTab('view');
                        }}
                        style={{ marginTop: '1rem' }}
                      >
                        Cancel Editing
                      </button>
                    )}
                  </form>
                </div>
              ) : (
                /* Active Listings / Deletion */
                <div className="admin-list-panel" style={{ maxWidth: '850px', margin: '0 auto' }}>
                  <h3 className="admin-list-title">Active Product Listings ({products.length})</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {products.length === 0 ? (
                      <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>No products found in the database catalog.</p>
                    ) : (
                      products.map(product => (
                        <div className="admin-product-item" key={product.id}>
                          <img src={product.image} alt={product.name} className="admin-product-thumb" />
                          <div className="admin-product-details">
                            <h4 className="admin-product-name">{product.name}</h4>
                            <div className="admin-product-meta">
                              <span>Code: {product.code}</span>
                              <span>Price: {product.price && product.price !== "0" && product.price !== "" ? `₹${parseFloat(product.price).toLocaleString('en-IN')}` : 'Price on Request'}</span>
                              <span>Category: {product.category}</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button 
                              type="button"
                              className="admin-product-edit-btn"
                              onClick={() => handleEditProductClick(product)}
                              title="Edit Listing details"
                            >
                              <Icons.Edit />
                            </button>
                            <button 
                              type="button"
                              className="admin-product-delete-btn"
                              onClick={() => handleDeleteProduct(product.id, product.name)}
                              title="Delete Listing permanently"
                            >
                              <Icons.Trash />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Footer Section */}
      <footer className="footer">
        <div className="footer-bottom" style={{ border: 'none', paddingTop: 0 }}>
          <p>&copy; 2026 Kumkum Collection. Admin Portal.</p>
          <div className="footer-bottom-links">
            <a href="./index.html">Main Website</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
