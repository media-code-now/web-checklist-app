# Web Checklist Application - Netlify Deployment

This directory contains the static version of the Web Checklist Application optimized for Netlify deployment.

## Deployment Configuration

### Static Version Features:
- Client-side only (no Node.js backend required)
- Uses localStorage for data persistence
- All original functionality preserved
- Optimized for static hosting on Netlify

### Files:
- `index.html` - Main application
- `styles.css` - Styling
- `script-static.js` - Client-side only JavaScript
- `netlify.toml` - Netlify build configuration

### Local Development (Full-Stack):
For local development with database functionality, use:
- `npm install` to install dependencies
- `npm start` to run the Node.js server
- Visit `http://localhost:3000`

### Static Deployment:
The static version is automatically deployed to Netlify and uses localStorage for data persistence.