# Cloudiverse Architect - Frontend

This is the frontend for Cloudiverse Architect, a cloud architecture decision studio that helps developers design, compare, and export cloud infrastructure using plain language.

## Tech Stack

- **Framework**: React 18 (JavaScript)
- **Routing**: react-router-dom
- **Styling**: Tailwind CSS
- **State Management**: useState, useEffect, React Context
- **Forms**: react-hook-form
- **HTTP Requests**: Axios
- **Syntax Highlighting**: react-syntax-highlighter
- **Charting**: Recharts
- **Notifications**: react-toastify
- **Icons**: Lucide React
- **Build Tool**: Vite

## Color Palette

- Canvas background: #0B0E13
- Panels / surfaces: #121621
- Elevated cards: #171C28
- Borders: #1F2433
- Primary accent (logic/actions): #4F7CFF
- Secondary accent (success): #22C55E
- Warning/variant B: #F59E0B

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Deployment

This frontend is designed to be deployed to Vercel:

1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard:
   ```
   VITE_API_BASE_URL=https://your-backend-url.railway.app
   ```

## Project Structure

```
src/
├── components/     # Reusable UI components
├── context/        # React context providers
├── pages/          # Page components
├── App.jsx         # Main app component
├── main.jsx        # Entry point
└── ...
```

## Features Implemented

1. **Authentication UI**
   - Login Page
   - Register Page

2. **App Layout**
   - Top Navigation Bar
   - Sidebar Navigation

3. **Workspace Selector**
   - Clean screen with architecture workspaces as cards
   - Each card shows project name, intent, last decision, and cost range
   - No charts, KPIs, or operator-focused metrics

4. **Architecture Workspace**
   - Three-zone layout:
     - Context Bar (top) - Project name, status, provider, variant
     - Decision Rail (left) - Progress-based navigation through design steps
     - Main Architecture Canvas (center) - Six distinct states
     - Insight Pane (right) - Contextual insights and reasoning
     - AI Command Dock (bottom) - Floating AI input

5. **Cloud Comparison View**
   - Side-by-side service comparison
   - Cost visualization
   - Provider selection

6. **Terraform Code Viewer**
   - Syntax-highlighted code display
   - Copy functionality
   - Export as ZIP

7. **Cost Estimation View**
   - Total cost estimation
   - Category breakdown
   - Cost trend visualization

8. **Settings Page**
   - User email display
   - Account deletion option

## Development Notes

- All data is fetched from the backend API
- Authentication uses JWT tokens stored in localStorage
- The UI is fully responsive and follows the specified color palette
- Charts are implemented with Recharts
- Code blocks use syntax highlighting with react-syntax-highlighter