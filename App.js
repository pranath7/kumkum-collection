// Destructure React hooks from global React object
const { useState, useEffect } = React;

// Inline SVG Icons for premium crisp visuals
const Icons = {
  WhatsApp: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.725 1.451 5.486.002 9.585-4.494 9.588-9.71.002-2.527-.979-4.903-2.762-6.689S14.538 1.51 12.012 1.51c-5.494 0-9.605 4.508-9.608 9.716-.001 1.714.471 3.39 1.363 4.881l-.999 3.65 3.791-.993zM16.518 13.9c-.3-.15-1.774-.875-2.048-.975-.274-.1-.474-.15-.674.15-.2.3-.775.975-.95 1.175-.175.2-.35.225-.65.075-1.204-.6-2.073-1.054-2.887-2.451-.213-.367-.213-.63.03-.893.217-.234.35-.4.5-.55.15-.15.2-.25.3-.45.1-.2.05-.375-.025-.525-.075-.15-.674-1.625-.925-2.225-.244-.589-.493-.51-.674-.519-.175-.008-.375-.01-.575-.01-.2 0-.525.075-.8.375-.275.3-1.05 1.025-1.05 2.5s1.075 2.9 1.225 3.1c.15.2 2.11 3.224 5.112 4.525.714.31 1.272.496 1.707.635.717.228 1.37.196 1.885.119.574-.085 1.774-.725 2.023-1.425.25-.7.25-1.3 1.175-1.425zm-2.048 2.05c-.1.15-.1.15 0 0z" />
    </svg>
  ),
  Close: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  ),
  Truck: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
      <rect x="1" y="3" width="15" height="13"></rect>
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
      <circle cx="5.5" cy="18.5" r="2.5"></circle>
      <circle cx="18.5" cy="18.5" r="2.5"></circle>
    </svg>
  ),
  Eye: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block' }}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  ),
  Search: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
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

// Main App Component
window.App = function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // New States: Search and FAQ
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFaq, setActiveFaq] = useState(null);

  const categories = ['All', 'New Arrivals', 'Premium Combos', 'Hot Sellers', 'Trending'];
  const WHATSAPP_NUMBER = '916383260570';

  const faqs = [
    {
      q: "How do I place an order?",
      a: "Ordering is simple! Browse our catalog, select a design you like, and click the green 'Order via WhatsApp' button. This opens WhatsApp with a prefilled message containing the item details and photos. Send it to connect directly with our sales team and complete your booking."
    },
    {
      q: "What are the shipping charges and timelines?",
      a: "We offer 100% Free Shipping all over India! Every order is securely bubble-wrapped in hardboard boxes to prevent transit damage. Shipping takes 2-4 business days to Southern India and 3-5 days to other regions."
    },
    {
      q: "How do I maintain imitation jewelry?",
      a: "To keep your pieces shining like new: keep them away from water, perfumes, soaps, and sweat. Always store each ornament individually in dry, airtight zip-lock bags after use."
    },
    {
      q: "Can I visit your showroom in Chennai?",
      a: "Yes! You are welcome to visit our boutique at 2nd Floor, 160 Mint Street, opposite Kakada Sweets, Sowcarpet, Chennai, Tamil Nadu 600001."
    }
  ];

  // Fallback: Fetch products from local server API
  const fetchProductsFallback = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        const sorted = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setProducts(sorted);
      }
    } catch (err) {
      console.error('Failed to load local fallback products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConfigured && db) {
      // Live Cloud Firestore Database Subscription with Auto-Seeding
      const unsubscribe = db.collection("products").orderBy("createdAt", "desc").onSnapshot(
        (snapshot) => {
          if (snapshot.empty) {
            // Firestore is empty - automatically seed database with 5 default items
            const initialProducts = [
              {
                code: "KC-N201",
                name: "Kundan Choker & Jhumkas Bridal Set",
                category: "New Arrivals",
                price: "3499",
                description: "Exquisite luxury Kundan choker necklace adorned with radiant ruby emerald stones and detailed pearl drop hanging strings. Includes a pair of matching royal jhumka earrings. Perfect for bridal and wedding wear.",
                image: "./public/images/kundan_necklace.png",
                createdAt: new Date(Date.now() - 5000).toISOString()
              },
              {
                code: "KC-C504",
                name: "Antique Matte Gold Bridal Combo Set",
                category: "Premium Combos",
                price: "4999",
                description: "Grand traditional South Indian wedding combo set featuring a long royal haram necklace, a matching medium choker necklace, matching grand jhumka earrings, and a maang tikka. Beautiful premium matte gold finishing.",
                image: "./public/images/bridal_combo.png",
                createdAt: new Date(Date.now() - 4000).toISOString()
              },
              {
                code: "KC-N309",
                name: "Sparkling Ruby AD Stone Choker",
                category: "Trending",
                price: "1899",
                description: "Stunning premium quality American Diamond (AD) stone choker necklace featuring royal ruby red center stones, crafted on a brilliant silver-plated base. Comes with matching sparkling stud earrings.",
                image: "./public/images/ruby_choker.png",
                createdAt: new Date(Date.now() - 3000).toISOString()
              },
              {
                code: "KC-B402",
                name: "Intricate Antique Gold Bangles (Set of 4)",
                category: "Hot Sellers",
                price: "1299",
                description: "Set of four royal antique gold plated bangles with exquisite handcrafted filigree details, accented with small ruby and emerald green stone placements. Ideal for pairing with sarees and ethnic wear.",
                image: "./public/images/antique_bangles.png",
                createdAt: new Date(Date.now() - 2000).toISOString()
              },
              {
                code: "KC-E102",
                name: "Brilliant AD Jhumka Earrings",
                category: "Trending",
                price: "899",
                description: "Sparkling contemporary American Diamond (AD) jhumka earrings featuring royal pearl drop embellishments. Designed to capture and reflect light at every angle, adding premium brilliance to your look.",
                image: "./public/images/ad_earrings.png",
                createdAt: new Date(Date.now() - 1000).toISOString()
              }
            ];

            initialProducts.forEach(p => {
              db.collection("products").add(p);
            });
          } else {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProducts(list);
            setLoading(false);
          }
        },
        (err) => {
          console.error("Firestore database subscription error:", err);
          fetchProductsFallback();
        }
      );
      return () => unsubscribe();
    } else {
      fetchProductsFallback();
    }
  }, []);

  // WhatsApp Order URL Builder
  const getWhatsAppLink = (product) => {
    const priceText = product.price && product.price !== "0" && product.price !== "" ? `₹${product.price}` : 'Price on Request';
    const message = `Hi Kumkum Collection, I am interested in ordering:

*Product:* ${product.name}
*Code:* ${product.code}
*Price:* ${priceText}

Please let me know if it is available!`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  };

  // Toggle FAQ items
  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  // Multi-level Filtering (Category AND Search input term)
  const filteredProducts = products.filter(p => {
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.code.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Find the featured choker KC-1545 to display in Hero Showcase
  const featuredProduct = products.find(p => p.code === 'KC-1545') || products[0];

  return (
    <div>
      {/* Demo Warning Banner if config is missing */}
      {!isConfigured && (
        <div style={{ background: 'linear-gradient(135deg, #aa8619 0%, #d4af37 100%)', color: '#000', padding: '0.5rem 1rem', fontSize: '0.8rem', fontWeight: '600', textAlign: 'center', letterSpacing: '0.05em', position: 'fixed', top: 0, width: '100%', zIndex: 1001 }}>
          ⚠️ PREVIEW MODE: Cloud credentials are not configured. Edit 'config.js' to connect your live Firebase and Cloudinary storage.
        </div>
      )}

      {/* Translucent Glassmorphic Header */}
      <header className="header" style={{ top: isConfigured ? 0 : '30px' }}>
        <nav className="navbar">
          <div className="logo-container" onClick={() => { setCategoryFilter('All'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={{ cursor: 'pointer' }}>
            <img src="./public/images/logo.jpg" alt="Kumkum Collection Logo" className="logo-img" />
            <div>
              <span className="logo-text">KUMKUM</span>
              <div className="logo-subtext">COLLECTION</div>
            </div>
          </div>

          <ul className="nav-links">
            <li>
              <span 
                className="nav-link active"
                onClick={() => { setCategoryFilter('All'); document.getElementById('collections').scrollIntoView({ behavior: 'smooth' }); }}
              >
                Collections
              </span>
            </li>
            <li>
              <span 
                className="nav-link"
                onClick={() => { document.getElementById('story').scrollIntoView({ behavior: 'smooth' }); }}
              >
                Our Story
              </span>
            </li>
            <li className="hide-mobile">
              <span 
                className="nav-link"
                onClick={() => { document.getElementById('locator').scrollIntoView({ behavior: 'smooth' }); }}
              >
                Store Locator
              </span>
            </li>
            <li>
              <span 
                className="nav-link"
                onClick={() => { document.getElementById('reviews').scrollIntoView({ behavior: 'smooth' }); }}
              >
                Reviews
              </span>
            </li>
            <li>
              <span 
                className="nav-link"
                onClick={() => { document.getElementById('faqs').scrollIntoView({ behavior: 'smooth' }); }}
              >
                FAQs
              </span>
            </li>
          </ul>
        </nav>
      </header>

      <div style={{ paddingTop: isConfigured ? '0' : '30px' }}>
        
        {/* Luxury Split Hero Section */}
        <section className="hero">
          <div className="hero-glow"></div>
          <div className="hero-container">
            <div className="hero-content">
              <p className="hero-tagline">✨ Best Imitation Jewellery in Chennai</p>
              <h1 className="hero-title">
                Crafted to Shine.<br />
                Designed to <span>Inspire.</span>
              </h1>
              <p className="hero-description">
                Experience royal heritage craftsmanship in our premium Kempu stones, American Diamond sets, and matte gold combinations. Curated to wow at first glance with zero compromises on quality.
              </p>
              <div className="hero-buttons">
                <button 
                  className="btn-primary"
                  onClick={() => document.getElementById('collections').scrollIntoView({ behavior: 'smooth' })}
                >
                  Explore Collection
                </button>
                <a 
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hi%20Kumkum%20Collection%2C%20I%27d%20like%20to%20enquire%20about%20your%20latest%20jewellery%20designs!`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary"
                >
                  WhatsApp Consultation
                </a>
              </div>
            </div>

            {/* Glowing Featured Showcase Frame */}
            <div className="hero-showcase">
              <div className="showcase-glow-ring"></div>
              {featuredProduct && (
                <div 
                  className="showcase-card"
                  onClick={() => setSelectedProduct(featuredProduct)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="showcase-image-container">
                    <img src={featuredProduct.image} alt={featuredProduct.name} />
                    <span className="showcase-tag">Featured Masterpiece</span>
                  </div>
                  <div className="showcase-details">
                    <h3 className="showcase-title">{featuredProduct.name}</h3>
                    <span className="showcase-code">{featuredProduct.code}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* USP / Value Proposition Section */}
        <section className="usp-section">
          <div className="usp-grid">
            <div className="usp-card">
              <div className="usp-icon">👑</div>
              <h4 className="usp-title">Authentic Craft</h4>
              <p className="usp-description">Real Kempu stones, CZ stones, and premium matte polishing that mimics real 22k gold ornaments.</p>
            </div>
            <div className="usp-card">
              <div className="usp-icon">🚚</div>
              <h4 className="usp-title">India-Wide Shipping</h4>
              <p className="usp-description">Fast, insured door-to-door courier service across India with live tracking provided for every order.</p>
            </div>
            <div className="usp-card">
              <div className="usp-icon">✨</div>
              <h4 className="usp-title">Premium Quality</h4>
              <p className="usp-description">Handpicked collections inspected for details, polish durability, and metal sturdiness.</p>
            </div>
            <div className="usp-card">
              <div className="usp-icon">💬</div>
              <h4 className="usp-title">Personal Shopping</h4>
              <p className="usp-description">Direct-to-WhatsApp enquiries for customized sizes, close-up videos, and quick order booking.</p>
            </div>
          </div>
        </section>

        {/* Catalog Section */}
        <section className="catalog-section" id="collections">
          <div className="section-header">
            <p className="section-subtitle">Exquisite Ornaments</p>
            <h2 className="section-title">Our <span>Collections</span></h2>
          </div>

          {/* New Search Bar Component */}
          <div className="search-container">
            <div className="search-input-wrapper">
              <span className="search-icon"><Icons.Search /></span>
              <input 
                type="text" 
                className="search-input" 
                placeholder="Search jhumka, choker, necklace, or code..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Filter Bar */}
          <div className="filter-bar">
            {categories.map(cat => (
              <button
                key={cat}
                className={`filter-chip ${categoryFilter === cat ? 'active' : ''}`}
                onClick={() => { setCategoryFilter(cat); setSearchTerm(''); }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Loading Grid State */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--color-gold)' }}>
              <div style={{ fontSize: '1.2rem', fontFamily: 'var(--font-serif)', letterSpacing: '0.1em' }}>
                Loading Premium Catalog...
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)' }}>
              <p>No products found matching your filter.</p>
            </div>
          ) : (
            /* Product Grid */
            <div className="product-grid">
              {filteredProducts.map(product => (
                <div className="product-card" key={product.id}>
                  <div 
                    className="product-image-container"
                    onClick={() => setSelectedProduct(product)}
                  >
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="product-image"
                      loading="lazy"
                    />
                    <div className="product-badge">{product.category}</div>
                  </div>

                  <div className="product-info">
                    <div className="product-meta">
                      <span className="product-code">{product.code}</span>
                      {product.price && product.price !== "0" && product.price !== "" ? (
                        <span className="product-price">{parseFloat(product.price).toLocaleString('en-IN')}</span>
                      ) : (
                        <span className="product-price-on-request">Price on Request</span>
                      )}
                    </div>

                    <h3 
                      className="product-title"
                      onClick={() => setSelectedProduct(product)}
                    >
                      {product.name}
                    </h3>
                    
                    <p className="product-description">{product.description}</p>

                    <div className="card-actions">
                      <a 
                        href={getWhatsAppLink(product)} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="whatsapp-btn"
                      >
                        <Icons.WhatsApp /> Order via WhatsApp
                      </a>
                      <button 
                        className="detail-btn"
                        onClick={() => setSelectedProduct(product)}
                        title="View Details"
                      >
                        <Icons.Eye />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Brand Story / About the Craft Section */}
        <section className="story-section" id="story">
          <div className="story-container">
            <div className="story-image-frame">
              <img 
                src="https://res.cloudinary.com/dqerktcrk/image/upload/v1781504810/ndmrzrlb6guyevu41hbe.jpg" 
                alt="Intricate jewelry crafting detail" 
                className="story-image"
              />
            </div>
            <div className="story-content">
              <p className="section-subtitle">Heritage and Passion</p>
              <h2 className="story-title">The Art of <span>Matte Gold Finishing</span></h2>
              <p className="story-text">
                Nestled in the bustling heart of Mint Street, Sowcarpet, Kumkum Creation is your premier source for exquisite imitation jewellery in Chennai. Our boutique has established a reputation for crafting premium ornaments that represent royal heritage. Our artisans specialize in creating detailed temple motifs, goddess carvings, and peacock patterns set with authentic Kempu stones.
              </p>
              <p className="story-text">
                Every American Diamond (AD) stone and cubic zirconia is carefully bezel-set on a sturdy brass alloy base, finished with our signature matte gold plating. The result is a piece of jewelry that carries the heavy weight, rich luster, and exquisite detail of genuine heritage gold at a fraction of the cost.
              </p>
            </div>
          </div>
        </section>

        {/* Store Locator Section */}
        <section className="locator-section" id="locator">
          <div className="locator-container">
            <div className="locator-info">
              <div className="locator-card">
                <h3 className="locator-title">Visit Our Boutique</h3>
                <p className="locator-address">
                  <strong>Kumkum Collection</strong><br />
                  2nd Floor, 160 Mint Street,<br />
                  Opposite to Kakada Sweets,<br />
                  Sowcarpet, Chennai,<br />
                  Tamil Nadu 600001
                </p>
                <div className="locator-meta-item">
                  <strong>Hours:</strong> Mon - Sat: 11:00 AM - 8:30 PM
                </div>
                <div className="locator-meta-item">
                  <strong>WhatsApp:</strong> +91 6383260570
                </div>
                <div className="locator-meta-item">
                  <strong>Email:</strong> support@kumkumcollection.com
                </div>
              </div>
            </div>
            <div className="map-frame-container">
              <iframe 
                className="map-iframe" 
                src="https://maps.google.com/maps?q=160%20Mint%20Street,%20Sowcarpet,%20Chennai,%20Tamil%20Nadu%20600001&t=&z=15&ie=UTF8&iwloc=&output=embed" 
                allowFullScreen="" 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                title="Google Map Location for Kumkum Collection"
              ></iframe>
            </div>
          </div>
        </section>

        {/* Customer Reviews Section */}
        <section className="review-section" id="reviews">
          <div className="section-header">
            <p className="section-subtitle">Loved by Brides</p>
            <h2 className="section-title">Customer <span>Reviews</span></h2>
          </div>
          <div className="review-grid">
            <div className="review-card">
              <div className="review-quote-mark">“</div>
              <div className="review-stars">★★★★★</div>
              <p className="review-text">
                "I ordered the Antique Matte Gold Bridal Combo Set for my wedding reception. Honestly, no one could tell it wasn't real gold! The peacock pendant detail and the weight of the necklace were perfect. Packing was very safe."
              </p>
              <div className="review-author">
                <span className="review-name">Sanjana Sharma</span>
                <span className="review-location">Hyderabad</span>
              </div>
            </div>
            <div className="review-card">
              <div className="review-quote-mark">“</div>
              <div className="review-stars">★★★★★</div>
              <p className="review-text">
                "The Kempu stone Jhumkas look absolutely gorgeous with my silk sarees. The finish is exactly what is shown in their photos. Direct WhatsApp ordering was fast and the courier arrived in Bangalore in just 2 days!"
              </p>
              <div className="review-author">
                <span className="review-name">Priya Nair</span>
                <span className="review-location">Bangalore</span>
              </div>
            </div>
            <div className="review-card">
              <div className="review-quote-mark">“</div>
              <div className="review-stars">★★★★★</div>
              <p className="review-text">
                "Superb quality! I bought the AD Stone Choker and the stones sparkle like real diamonds under the light. Very premium packaging. I will definitely purchase from Kumkum Collection again."
              </p>
              <div className="review-author">
                <span className="review-name">Divya Balaji</span>
                <span className="review-location">Chennai</span>
              </div>
            </div>
          </div>
        </section>

        {/* New FAQ Section Accordion */}
        <section className="faq-section" id="faqs">
          <div className="faq-container">
            <div className="section-header">
              <p className="section-subtitle">Common Enquiries</p>
              <h2 className="section-title">Frequently Asked <span>Questions</span></h2>
            </div>
            <div className="faq-list">
              {faqs.map((faq, index) => (
                <div 
                  key={index} 
                  className={`faq-item ${activeFaq === index ? 'active' : ''}`}
                >
                  <button 
                    className="faq-question" 
                    onClick={() => toggleFaq(index)}
                  >
                    <span>{faq.q}</span>
                    <span className="faq-toggle-icon">+</span>
                  </button>
                  <div className="faq-answer">
                    <div className="faq-answer-content">
                      {faq.a}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Product Detail Modal */}
        {selectedProduct && (
          <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
            <div className="modal-container" onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setSelectedProduct(null)}>
                <Icons.Close />
              </button>

              <div className="modal-image-side">
                <img src={selectedProduct.image} alt={selectedProduct.name} />
              </div>

              <div className="modal-info-side">
                <span className="modal-category">{selectedProduct.category}</span>
                <h2 className="modal-title">{selectedProduct.name}</h2>
                
                <div className="modal-meta">
                  {selectedProduct.price && selectedProduct.price !== "0" && selectedProduct.price !== "" ? (
                    <span className="modal-price">{parseFloat(selectedProduct.price).toLocaleString('en-IN')}</span>
                  ) : (
                    <span className="modal-price-on-request">Price on Request</span>
                  )}
                  <span className="modal-code">CODE: {selectedProduct.code}</span>
                </div>

                <p className="modal-description">{selectedProduct.description}</p>

                <div className="modal-shipping">
                  <Icons.Truck /> Free Shipping all over India 🇮🇳
                </div>

                <a 
                  href={getWhatsAppLink(selectedProduct)} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="modal-whatsapp-btn"
                >
                  <Icons.WhatsApp /> Order on WhatsApp
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Floating WhatsApp Button */}
        <a 
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hi%20Kumkum%20Collection%2C%20I%20have%20a%20general%20enquiry%20about%20your%20jewellery%20collection!`}
          target="_blank"
          rel="noreferrer"
          className="whatsapp-floating"
          title="Chat on WhatsApp"
        >
          <Icons.WhatsApp />
        </a>

      </div>

      {/* Footer Section */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-brand">
            <div className="logo-container" style={{ marginBottom: '1.25rem' }}>
              <img src="./public/images/logo.jpg" alt="Kumkum Collection Logo" className="logo-img" />
              <div>
                <span className="logo-text">KUMKUM</span>
                <div className="logo-subtext">COLLECTION</div>
              </div>
            </div>
            <p>Premium quality imitation ornaments shipping all over India. Hand-crafted designs made to shine for a lifetime.</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-gold)' }}>
              📍 2nd Floor, 160 Mint Street, opposite to Kakada Sweets, Chennai, India 600001
            </p>
          </div>

          <div className="footer-links">
            <h5>Quick Links</h5>
            <ul>
              <li><a href="#collections" onClick={() => setCategoryFilter('All')}>All Collections</a></li>
              <li><a href="#story" onClick={() => document.getElementById('story').scrollIntoView({ behavior: 'smooth' })}>Our Heritage</a></li>
              <li><a href="#locator" onClick={() => document.getElementById('locator').scrollIntoView({ behavior: 'smooth' })}>Store Locator</a></li>
              <li><a href="#reviews" onClick={() => document.getElementById('reviews').scrollIntoView({ behavior: 'smooth' })}>Reviews</a></li>
              <li><a href="#faqs" onClick={() => document.getElementById('faqs').scrollIntoView({ behavior: 'smooth' })}>FAQs</a></li>
            </ul>
          </div>

          <div className="footer-contact">
            <h5>Order & Contact</h5>
            <p><strong>WhatsApp:</strong> +91 6383260570</p>
            <p><strong>Hours:</strong> Mon - Sat: 11:00 AM - 8:30 PM</p>
            <p><strong>Shipping:</strong> India-wide courier (tracking provided)</p>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2026 Kumkum Collection. All rights reserved. Premium Imitation Jewellery Chennai.</p>
        </div>
      </footer>
    </div>
  );
};
