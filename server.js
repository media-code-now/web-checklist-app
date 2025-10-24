const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const Database = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
const db = new Database();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// API Routes

// Get all sections with items
app.get('/api/sections', async (req, res) => {
  try {
    const sections = await db.getAllSections();
    res.json(sections);
  } catch (error) {
    console.error('Error fetching sections:', error);
    res.status(500).json({ error: 'Failed to fetch sections' });
  }
});

// Create a new section
app.post('/api/sections', async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    const section = await db.createSection(title);
    res.status(201).json(section);
  } catch (error) {
    console.error('Error creating section:', error);
    res.status(500).json({ error: 'Failed to create section' });
  }
});

// Update section title
app.put('/api/sections/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    await db.updateSection(id, title);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating section:', error);
    res.status(500).json({ error: 'Failed to update section' });
  }
});

// Delete a section
app.delete('/api/sections/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.deleteSection(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting section:', error);
    res.status(500).json({ error: 'Failed to delete section' });
  }
});

// Create a new item
app.post('/api/sections/:sectionId/items', async (req, res) => {
  try {
    const { sectionId } = req.params;
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    const item = await db.createItem(sectionId, text);
    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// Update an item
app.put('/api/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { text, done } = req.body;
    
    await db.updateItem(id, text, done);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// Delete an item
app.delete('/api/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.deleteItem(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// Duplicate an item
app.post('/api/items/:id/duplicate', async (req, res) => {
  try {
    const { id } = req.params;
    const item = await db.duplicateItem(id);
    res.status(201).json(item);
  } catch (error) {
    console.error('Error duplicating item:', error);
    res.status(500).json({ error: 'Failed to duplicate item' });
  }
});

// Initialize database with default template
app.post('/api/init', async (req, res) => {
  try {
    await db.initializeWithTemplate();
    res.json({ success: true });
  } catch (error) {
    console.error('Error initializing database:', error);
    res.status(500).json({ error: 'Failed to initialize database' });
  }
});

// Import data (replace all existing data)
app.post('/api/import', async (req, res) => {
  try {
    const { data } = req.body;
    await db.importData(data);
    res.json({ success: true });
  } catch (error) {
    console.error('Error importing data:', error);
    res.status(500).json({ error: 'Failed to import data' });
  }
});

// Serve the backend HTML file for local development
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index-backend.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});