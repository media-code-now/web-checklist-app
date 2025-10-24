const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('crypto');

class Database {
  constructor() {
    this.db = new sqlite3.Database('./checklist.db', (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
      } else {
        console.log('Connected to SQLite database.');
        this.initializeTables();
      }
    });
  }

  initializeTables() {
    const sectionsTable = `
      CREATE TABLE IF NOT EXISTS sections (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const itemsTable = `
      CREATE TABLE IF NOT EXISTS items (
        id TEXT PRIMARY KEY,
        section_id TEXT NOT NULL,
        text TEXT NOT NULL,
        done BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (section_id) REFERENCES sections (id) ON DELETE CASCADE
      )
    `;

    this.db.serialize(() => {
      this.db.run(sectionsTable);
      this.db.run(itemsTable);
      
      // Check if we need to initialize with default data
      this.db.get("SELECT COUNT(*) as count FROM sections", (err, row) => {
        if (err) {
          console.error('Error checking sections count:', err);
        } else if (row.count === 0) {
          console.log('Initializing database with default template...');
          this.initializeWithTemplate();
        }
      });
    });
  }

  // Generate UUID (fallback for older Node versions)
  generateId() {
    try {
      return require('crypto').randomUUID();
    } catch {
      // Fallback for older Node versions
      return 'xxxx-xxxx-4xxx-yxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
  }

  // Get all sections with their items
  getAllSections() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          s.id as section_id, 
          s.title as section_title,
          i.id as item_id,
          i.text as item_text,
          i.done as item_done
        FROM sections s
        LEFT JOIN items i ON s.id = i.section_id
        ORDER BY s.created_at, i.created_at
      `;

      this.db.all(query, (err, rows) => {
        if (err) {
          reject(err);
          return;
        }

        const sectionsMap = new Map();
        
        rows.forEach(row => {
          if (!sectionsMap.has(row.section_id)) {
            sectionsMap.set(row.section_id, {
              id: row.section_id,
              title: row.section_title,
              items: []
            });
          }

          if (row.item_id) {
            sectionsMap.get(row.section_id).items.push({
              id: row.item_id,
              text: row.item_text,
              done: Boolean(row.item_done)
            });
          }
        });

        resolve(Array.from(sectionsMap.values()));
      });
    });
  }

  // Create a new section
  createSection(title) {
    return new Promise((resolve, reject) => {
      const id = this.generateId();
      const query = "INSERT INTO sections (id, title) VALUES (?, ?)";
      
      this.db.run(query, [id, title], function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve({ id, title, items: [] });
      });
    });
  }

  // Update section title
  updateSection(id, title) {
    return new Promise((resolve, reject) => {
      const query = "UPDATE sections SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
      
      this.db.run(query, [title, id], function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }

  // Delete a section and all its items
  deleteSection(id) {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run("DELETE FROM items WHERE section_id = ?", [id]);
        this.db.run("DELETE FROM sections WHERE id = ?", [id], function(err) {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        });
      });
    });
  }

  // Create a new item
  createItem(sectionId, text) {
    return new Promise((resolve, reject) => {
      const id = this.generateId();
      const query = "INSERT INTO items (id, section_id, text, done) VALUES (?, ?, ?, 0)";
      
      this.db.run(query, [id, sectionId, text], function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve({ id, text, done: false });
      });
    });
  }

  // Update an item
  updateItem(id, text, done) {
    return new Promise((resolve, reject) => {
      let query = "UPDATE items SET updated_at = CURRENT_TIMESTAMP";
      const params = [];
      
      if (text !== undefined) {
        query += ", text = ?";
        params.push(text);
      }
      
      if (done !== undefined) {
        query += ", done = ?";
        params.push(done ? 1 : 0);
      }
      
      query += " WHERE id = ?";
      params.push(id);
      
      this.db.run(query, params, function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }

  // Delete an item
  deleteItem(id) {
    return new Promise((resolve, reject) => {
      const query = "DELETE FROM items WHERE id = ?";
      
      this.db.run(query, [id], function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }

  // Duplicate an item
  duplicateItem(id) {
    return new Promise((resolve, reject) => {
      // First get the original item
      this.db.get("SELECT * FROM items WHERE id = ?", [id], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (!row) {
          reject(new Error('Item not found'));
          return;
        }

        // Create duplicate
        const newId = this.generateId();
        const query = "INSERT INTO items (id, section_id, text, done) VALUES (?, ?, ?, 0)";
        
        this.db.run(query, [newId, row.section_id, row.text], function(err) {
          if (err) {
            reject(err);
            return;
          }
          resolve({ id: newId, text: row.text, done: false });
        });
      });
    });
  }

  // Initialize database with default template
  initializeWithTemplate() {
    const defaultTemplate = [
      {
        title: "Strategy & Setup",
        items: [
          "Domain is live, connected, and SSL certificate is active (HTTPS)",
          "All DNS records (A, CNAME, MX, SPF, DKIM, DMARC) are verified",
          "Website hosting is stable and loading time < 3 seconds",
          "CMS and plugins are updated to latest versions",
          "Backup and restore points are configured"
        ]
      },
      {
        title: "Design & User Experience",
        items: [
          "Responsive design tested on desktop, tablet, and mobile",
          "All fonts and images render correctly on all browsers",
          "Navigation is intuitive and consistent across pages",
          "Favicon and site logo appear correctly",
          "Buttons, CTAs, and forms are visually distinct and functional",
          "Accessibility basics (alt text, ARIA labels, color contrast) are met"
        ]
      },
      {
        title: "Technical Functionality",
        items: [
          "All internal links work (no 404 or redirect loops)",
          "Forms send data correctly (test all contact/newsletter/checkout forms)",
          "Error pages (404, 500) are branded and helpful",
          "Sitemap.xml is generated and accessible",
          "Robots.txt is configured and allows proper crawling",
          "Canonical tags are correctly set",
          "Structured data (JSON-LD schema) is validated with Rich Results Test",
          "Redirects from old URLs are mapped (301 redirects)"
        ]
      },
      {
        title: "SEO Optimization",
        items: [
          "Meta titles and descriptions are unique and optimized",
          "H1-H3 structure is consistent per page",
          "Alt text added for all images",
          "Keyword density is natural and well-distributed",
          "Internal linking follows a logical structure",
          "Google Analytics 4 and Google Search Console are connected",
          "Bing Webmaster Tools connected (optional)",
          "No-index tags only on staging or draft pages"
        ]
      },
      {
        title: "eCommerce",
        items: [
          "Add to Cart, Checkout, and Payment flows fully tested",
          "Shipping, taxes, and discount logic verified",
          "Transactional emails tested",
          "Inventory management linked to products",
          "Abandoned cart recovery configured"
        ]
      },
      {
        title: "Legal & Compliance",
        items: [
          "Privacy Policy and Terms of Service pages added",
          "Cookie consent banner enabled (if targeting EU/CA)",
          "Refund, return, or cancellation policy visible",
          "Accessibility statement (if required)",
          "GDPR / CCPA compliance confirmed if collecting user data"
        ]
      },
      {
        title: "Performance & Security",
        items: [
          "Image compression and lazy loading enabled",
          "Caching and CDN configured",
          "Minified CSS/JS/HTML",
          "No mixed-content warnings (HTTPS only)",
          "Website scanned for malware or vulnerabilities",
          "Login credentials and admin access secured (2FA enabled)"
        ]
      },
      {
        title: "Launch & Monitoring",
        items: [
          "Final QA review completed",
          "Uptime monitoring configured",
          "Analytics tracking verified live",
          "Post-launch redirect test run",
          "Submit sitemap to Google Search Console",
          "Announce launch via email or social media"
        ]
      }
    ];

    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run("BEGIN TRANSACTION");
        
        let completed = 0;
        const total = defaultTemplate.length;
        
        defaultTemplate.forEach((section) => {
          const sectionId = this.generateId();
          
          this.db.run("INSERT INTO sections (id, title) VALUES (?, ?)", [sectionId, section.title], (err) => {
            if (err) {
              this.db.run("ROLLBACK");
              reject(err);
              return;
            }
            
            let itemsCompleted = 0;
            section.items.forEach((itemText) => {
              const itemId = this.generateId();
              this.db.run("INSERT INTO items (id, section_id, text, done) VALUES (?, ?, ?, 0)", 
                [itemId, sectionId, itemText], (err) => {
                  if (err) {
                    this.db.run("ROLLBACK");
                    reject(err);
                    return;
                  }
                  
                  itemsCompleted++;
                  if (itemsCompleted === section.items.length) {
                    completed++;
                    if (completed === total) {
                      this.db.run("COMMIT", (err) => {
                        if (err) {
                          reject(err);
                        } else {
                          resolve();
                        }
                      });
                    }
                  }
                });
            });
          });
        });
      });
    });
  }

  // Import data (replace all existing data)
  importData(data) {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run("BEGIN TRANSACTION");
        
        // Clear existing data
        this.db.run("DELETE FROM items");
        this.db.run("DELETE FROM sections");
        
        let completed = 0;
        const total = data.length;
        
        if (total === 0) {
          this.db.run("COMMIT", (err) => {
            if (err) reject(err);
            else resolve();
          });
          return;
        }
        
        data.forEach((section) => {
          const sectionId = section.id || this.generateId();
          
          this.db.run("INSERT INTO sections (id, title) VALUES (?, ?)", [sectionId, section.title], (err) => {
            if (err) {
              this.db.run("ROLLBACK");
              reject(err);
              return;
            }
            
            if (!section.items || section.items.length === 0) {
              completed++;
              if (completed === total) {
                this.db.run("COMMIT", (err) => {
                  if (err) reject(err);
                  else resolve();
                });
              }
              return;
            }
            
            let itemsCompleted = 0;
            section.items.forEach((item) => {
              const itemId = item.id || this.generateId();
              this.db.run("INSERT INTO items (id, section_id, text, done) VALUES (?, ?, ?, ?)", 
                [itemId, sectionId, item.text, item.done ? 1 : 0], (err) => {
                  if (err) {
                    this.db.run("ROLLBACK");
                    reject(err);
                    return;
                  }
                  
                  itemsCompleted++;
                  if (itemsCompleted === section.items.length) {
                    completed++;
                    if (completed === total) {
                      this.db.run("COMMIT", (err) => {
                        if (err) reject(err);
                        else resolve();
                      });
                    }
                  }
                });
            });
          });
        });
      });
    });
  }

  // Uncheck all items
  uncheckAllItems() {
    return new Promise((resolve, reject) => {
      const query = "UPDATE items SET done = 0, updated_at = CURRENT_TIMESTAMP";
      
      this.db.run(query, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve({ message: 'All items unchecked successfully', changes: this.changes });
        }
      });
    });
  }

  // Close database connection
  close() {
    this.db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('Database connection closed.');
      }
    });
  }
}

module.exports = Database;