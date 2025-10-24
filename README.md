# Web Checklist Application

A pre-launch website checklist application with database functionality built with Node.js, Express, and SQLite.

## Features

- ✅ Organized checklist sections with customizable items
- 🗄️ SQLite database for persistent data storage
- 🔍 Search functionality across sections and items
- 📝 Editable sections and items (double-click to edit)
- 📋 Duplicate and delete functionality
- 📤 Export/Import checklist data as JSON
- 🖨️ Print-friendly layout
- 📱 Responsive design for all devices
- 🎨 Modern dark theme UI

## Project Structure

```
web checklist/
├── index.html          # Main HTML file
├── styles.css          # CSS styles
├── script.js           # Frontend JavaScript
├── server.js           # Express server
├── database.js         # Database operations
├── package.json        # Node.js dependencies
├── checklist.db        # SQLite database (created automatically)
└── README.md           # This file
```

## Installation & Setup

1. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```
   
   Or for production:
   ```bash
   npm start
   ```

3. **Open your browser:**
   Navigate to `http://localhost:3000`

## Usage

### Basic Operations
- **Add Section**: Click "Add Section" button in the header
- **Edit Section Title**: Double-click on any section title to edit
- **Add Item**: Use the input field at the bottom of each section
- **Edit Item**: Double-click on any item text to edit
- **Check/Uncheck**: Click the checkbox to mark items as done
- **Duplicate Item**: Click the duplicate icon next to any item
- **Delete Item**: Click the delete icon next to any item
- **Delete Section**: Click the delete icon in the section header

### Advanced Features
- **Search**: Use the search bar to filter sections and items
- **Export**: Download your checklist as JSON
- **Import**: Upload a JSON file to replace your current checklist
- **Reset**: Restore the default template
- **Print**: Use the print button for a clean printout

### Keyboard Shortcuts
- `Cmd/Ctrl + S`: Quick save (data saves automatically)
- `Enter`: Add new item when typing in the add item field

## API Endpoints

The application provides a REST API for integration with other tools:

### Sections
- `GET /api/sections` - Get all sections with items
- `POST /api/sections` - Create new section
- `PUT /api/sections/:id` - Update section title
- `DELETE /api/sections/:id` - Delete section

### Items
- `POST /api/sections/:sectionId/items` - Create new item
- `PUT /api/items/:id` - Update item text or completion status
- `DELETE /api/items/:id` - Delete item
- `POST /api/items/:id/duplicate` - Duplicate item

### Utility
- `POST /api/init` - Reset to default template
- `POST /api/import` - Import data from JSON

## Database Schema

### Sections Table
- `id` (TEXT, PRIMARY KEY)
- `title` (TEXT, NOT NULL)
- `created_at` (DATETIME)
- `updated_at` (DATETIME)

### Items Table
- `id` (TEXT, PRIMARY KEY)
- `section_id` (TEXT, FOREIGN KEY)
- `text` (TEXT, NOT NULL)
- `done` (BOOLEAN)
- `created_at` (DATETIME)
- `updated_at` (DATETIME)

## Development

### Dependencies
- **express**: Web framework
- **sqlite3**: Database driver
- **cors**: Cross-origin resource sharing
- **body-parser**: Parse JSON request bodies
- **nodemon**: Development auto-restart (dev only)

### Scripts
- `npm start`: Start production server
- `npm run dev`: Start development server with auto-restart

## Default Sections

The application comes with these pre-configured sections:
1. Strategy & Setup
2. Design & User Experience
3. Technical Functionality
4. SEO Optimization
5. eCommerce
6. Legal & Compliance
7. Performance & Security
8. Launch & Monitoring

## Browser Support

- Chrome/Edge (modern versions)
- Firefox (modern versions)
- Safari (modern versions)
- Mobile browsers with modern JavaScript support

## Data Persistence

All data is automatically saved to a SQLite database (`checklist.db`) in real-time. No manual saving is required.

## License

MIT License - feel free to use this project for personal or commercial purposes.