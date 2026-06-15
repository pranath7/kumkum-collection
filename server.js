const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = 3000;
const DB_FILE = path.join(__dirname, 'products.json');
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');
const IMAGES_DIR = path.join(__dirname, 'public', 'images');

// Ensure upload folders exist
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.jsx': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Helper: Parse multipart/form-data requests
function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('boundary=')) {
      return reject(new Error('Content-Type is not multipart/form-data or lacks boundary'));
    }

    const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
    const boundary = boundaryMatch[1] || boundaryMatch[2];
    const boundaryBuffer = Buffer.from('--' + boundary);

    let chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      const buffer = Buffer.concat(chunks);
      const parts = [];
      let start = 0;

      while (true) {
        const index = buffer.indexOf(boundaryBuffer, start);
        if (index === -1) break;
        
        const nextIndex = buffer.indexOf(boundaryBuffer, index + boundaryBuffer.length);
        if (nextIndex === -1) {
          const closingBoundary = Buffer.from('--' + boundary + '--');
          if (buffer.indexOf(closingBoundary, index) !== -1) {
            const partBuffer = buffer.slice(index + boundaryBuffer.length, buffer.length);
            if (partBuffer.length > 0) parts.push(partBuffer);
          }
          break;
        }

        const partBuffer = buffer.slice(index + boundaryBuffer.length, nextIndex);
        parts.push(partBuffer);
        start = nextIndex;
      }

      const result = { fields: {}, files: {} };

      for (const part of parts) {
        const headerEnd = part.indexOf(Buffer.from('\r\n\r\n'));
        if (headerEnd === -1) continue;

        const headersText = part.slice(0, headerEnd).toString('utf8');
        const body = part.slice(headerEnd + 4, part.length - 2); // strip leading \r\n\r\n and trailing \r\n

        const disposition = headersText.match(/Content-Disposition:\s*form-data;\s*name="([^"]+)"(?:;\s*filename="([^"]+)")?/i);
        if (disposition) {
          const name = disposition[1];
          const filename = disposition[2];

          if (filename) {
            const contentTypeMatch = headersText.match(/Content-Type:\s*([^\s;]+)/i);
            const contentType = contentTypeMatch ? contentTypeMatch[1] : 'application/octet-stream';
            result.files[name] = {
              filename,
              contentType,
              data: body
            };
          } else {
            result.fields[name] = body.toString('utf8');
          }
        }
      }
      resolve(result);
    });
    req.on('error', err => reject(err));
  });
}

// Helper: Parse JSON body
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', err => reject(err));
  });
}

// Helper: Serve static file
function serveStaticFile(filePath, res) {
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
}

// Main HTTP Server
const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // API Router
  if (pathname.startsWith('/api/')) {
    res.setHeader('Content-Type', 'application/json');

    // GET /api/products
    if (req.method === 'GET' && pathname === '/api/products') {
      fs.readFile(DB_FILE, 'utf8', (err, data) => {
        if (err) {
          res.writeHead(500);
          res.end(JSON.stringify({ error: 'Database read failed' }));
          return;
        }
        res.writeHead(200);
        res.end(data);
      });
      return;
    }

    // POST /api/admin/login
    if (req.method === 'POST' && pathname === '/api/admin/login') {
      parseJsonBody(req)
        .then(body => {
          if (body.password === 'admin123') {
            res.writeHead(200);
            res.end(JSON.stringify({ token: 'mock-session-token-kumkum-collection' }));
          } else {
            res.writeHead(401);
            res.end(JSON.stringify({ error: 'Invalid password' }));
          }
        })
        .catch(err => {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Invalid request body' }));
        });
      return;
    }

    // POST /api/upload (Multipart image upload)
    if (req.method === 'POST' && pathname === '/api/upload') {
      parseMultipart(req)
        .then(result => {
          const imageFile = result.files.image;
          if (!imageFile) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'No image file uploaded' }));
            return;
          }

          const ext = path.extname(imageFile.filename).toLowerCase() || '.png';
          if (!['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Invalid image type. Allowed: jpg, jpeg, png, webp, gif' }));
            return;
          }

          const uniqueName = `${crypto.randomUUID()}${ext}`;
          const savePath = path.join(UPLOADS_DIR, uniqueName);

          fs.writeFile(savePath, imageFile.data, err => {
            if (err) {
              console.error(err);
              res.writeHead(500);
              res.end(JSON.stringify({ error: 'Failed to save uploaded image' }));
              return;
            }
            res.writeHead(200);
            res.end(JSON.stringify({ url: `/public/uploads/${uniqueName}` }));
          });
        })
        .catch(err => {
          console.error(err);
          res.writeHead(500);
          res.end(JSON.stringify({ error: 'Failed to parse form-data: ' + err.message }));
        });
      return;
    }

    // POST /api/products (Create a product)
    if (req.method === 'POST' && pathname === '/api/products') {
      parseJsonBody(req)
        .then(newProduct => {
          if (!newProduct.name || !newProduct.price || !newProduct.image || !newProduct.code) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Missing required fields: name, price, code, image' }));
            return;
          }

          fs.readFile(DB_FILE, 'utf8', (err, data) => {
            let products = [];
            if (!err && data) {
              try { products = JSON.parse(data); } catch(e) {}
            }

            const product = {
              id: Date.now().toString(),
              code: newProduct.code,
              name: newProduct.name,
              category: newProduct.category || 'New Arrivals',
              price: newProduct.price.toString(),
              description: newProduct.description || '',
              image: newProduct.image,
              createdAt: new Date().toISOString()
            };

            products.push(product);

            fs.writeFile(DB_FILE, JSON.stringify(products, null, 2), err => {
              if (err) {
                res.writeHead(500);
                res.end(JSON.stringify({ error: 'Failed to write product' }));
                return;
              }
              res.writeHead(201);
              res.end(JSON.stringify(product));
            });
          });
        })
        .catch(err => {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Invalid JSON request body' }));
        });
      return;
    }

    // PUT /api/products/:id (Update a product)
    if (req.method === 'PUT' && pathname.startsWith('/api/products/')) {
      const productId = pathname.substring('/api/products/'.length);

      parseJsonBody(req)
        .then(updatedProduct => {
          if (!updatedProduct.name || !updatedProduct.price || !updatedProduct.image || !updatedProduct.code) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Missing required fields: name, price, code, image' }));
            return;
          }

          fs.readFile(DB_FILE, 'utf8', (err, data) => {
            if (err || !data) {
              res.writeHead(500);
              res.end(JSON.stringify({ error: 'Failed to load database' }));
              return;
            }

            let products = [];
            try { products = JSON.parse(data); } catch(e) {}

            const productIndex = products.findIndex(p => p.id === productId);
            if (productIndex === -1) {
              res.writeHead(404);
              res.end(JSON.stringify({ error: 'Product not found' }));
              return;
            }

            // Update product (keep original ID and createdAt)
            products[productIndex] = {
              ...products[productIndex],
              code: updatedProduct.code,
              name: updatedProduct.name,
              category: updatedProduct.category || 'New Arrivals',
              price: updatedProduct.price.toString(),
              description: updatedProduct.description || '',
              image: updatedProduct.image
            };

            fs.writeFile(DB_FILE, JSON.stringify(products, null, 2), err => {
              if (err) {
                res.writeHead(500);
                res.end(JSON.stringify({ error: 'Failed to save updated product to database' }));
                return;
              }
              res.writeHead(200);
              res.end(JSON.stringify(products[productIndex]));
            });
          });
        })
        .catch(err => {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Invalid JSON request body' }));
        });
      return;
    }

    // DELETE /api/products/:id (Delete a product)
    if (req.method === 'DELETE' && pathname.startsWith('/api/products/')) {
      const productId = pathname.substring('/api/products/'.length);

      fs.readFile(DB_FILE, 'utf8', (err, data) => {
        if (err || !data) {
          res.writeHead(500);
          res.end(JSON.stringify({ error: 'Failed to load database' }));
          return;
        }

        let products = [];
        try { products = JSON.parse(data); } catch(e) {}

        const productIndex = products.findIndex(p => p.id === productId);
        if (productIndex === -1) {
          res.writeHead(404);
          res.end(JSON.stringify({ error: 'Product not found' }));
          return;
        }

        const product = products[productIndex];
        products.splice(productIndex, 1);

        fs.writeFile(DB_FILE, JSON.stringify(products, null, 2), err => {
          if (err) {
            res.writeHead(500);
            res.end(JSON.stringify({ error: 'Failed to delete product from database' }));
            return;
          }

          // Also clean up uploaded file if it was uploaded (not a preloaded asset under /images/)
          if (product.image && product.image.includes('/uploads/')) {
            const filename = path.basename(product.image);
            const filePath = path.join(UPLOADS_DIR, filename);
            if (fs.existsSync(filePath)) {
              fs.unlink(filePath, err => {
                if (err) console.error('Error deleting file:', filePath, err);
              });
            }
          }

          res.writeHead(200);
          res.end(JSON.stringify({ success: true }));
        });
      });
      return;
    }

    // Unknown API
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'API not found' }));
    return;
  }

  // Static File Router
  let filePath = pathname;
  if (pathname === '/' || pathname === '/index.html') {
    filePath = '/index.html';
  } else if (pathname === '/admin' || pathname === '/admin.html') {
    filePath = '/admin.html';
  }
  
  // Map standard public folders
  if (filePath.startsWith('/public/uploads/')) {
    filePath = path.join(UPLOADS_DIR, filePath.substring('/public/uploads/'.length));
  } else if (filePath.startsWith('/public/images/')) {
    filePath = path.join(IMAGES_DIR, filePath.substring('/public/images/'.length));
  } else if (filePath.startsWith('/images/')) {
    filePath = path.join(IMAGES_DIR, filePath.substring('/images/'.length));
  } else if (filePath.startsWith('/uploads/')) {
    filePath = path.join(UPLOADS_DIR, filePath.substring('/uploads/'.length));
  } else {
    filePath = path.join(__dirname, filePath);
  }

  // Prevent directory traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  serveStaticFile(filePath, res);
});

server.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
