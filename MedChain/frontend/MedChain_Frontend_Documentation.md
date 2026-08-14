# MedChain Frontend Documentation

## Overview
The MedChain frontend is a simplified React-based web application focused on user login and QR code generation for medicine tracking. It has been stripped down to include only the essential UI components for authentication and QR code creation, removing all backend integrations, blockchain interactions, and scanning functionalities.

## Technologies and Libraries Used

### React
**React** is a JavaScript library for building user interfaces. It allows developers to create reusable UI components and manage application state efficiently.

- **Version**: ^19.2.4
- **Key Features Used**:
  - Functional components with hooks (useState)
  - JSX for component rendering
  - Component composition
- **Why Used**: Provides a declarative way to build interactive UIs, making it easy to manage the login form and dashboard state.

### Vite
**Vite** is a build tool and development server for modern web projects. It provides fast hot module replacement and optimized production builds.

- **Version**: ^8.0.0
- **Key Features Used**:
  - Development server (`npm run dev`)
  - Build command (`vite build`)
  - ES modules support
- **Why Used**: Offers lightning-fast development experience with instant hot reloading, ideal for React development.

### TailwindCSS
**TailwindCSS** is a utility-first CSS framework for rapidly building custom user interfaces.

- **Version**: ^4.2.1
- **Key Classes Used**:
  - `min-h-screen`: Sets minimum height to full screen
  - `bg-gray-50`: Light gray background
  - `flex`, `flex-col`: Flexbox layout
  - `p-4`, `p-6`: Padding utilities
  - `rounded-xl`: Border radius
  - `shadow-lg`: Box shadow
  - `text-center`: Text alignment
  - `hover:bg-blue-700`: Hover state for buttons
- **Why Used**: Enables rapid styling without writing custom CSS, providing a consistent design system.

### qrcode.react
**qrcode.react** is a React component for generating QR codes.

- **Version**: ^4.2.0
- **Key Component Used**: `QRCodeSVG`
  - Props:
    - `value`: The data to encode in the QR code (string)
    - `size`: Size of the QR code in pixels (number, default 128)
- **Why Used**: Provides an easy way to generate QR codes directly in the React component without external dependencies.

### Node.js and npm
**Node.js** is a JavaScript runtime built on Chrome's V8 JavaScript engine.
**npm** is the package manager for Node.js.

- **Used for**: Managing project dependencies, running scripts, and development server.
- **Commands Used**:
  - `npm install`: Installs dependencies from package.json
  - `npm run dev`: Starts the Vite development server

## Project Structure

```
MedChain/frontend/
├── src/
│   ├── App.jsx          # Main application component
│   ├── main.jsx         # Application entry point
│   ├── index.css        # Global styles
│   └── App.css          # Component-specific styles
├── public/              # Static assets
├── package.json         # Project dependencies and scripts
├── vite.config.js       # Vite configuration
├── postcss.config.js    # PostCSS configuration for TailwindCSS
├── tailwind.config.js   # TailwindCSS configuration
├── eslint.config.js     # ESLint configuration
└── index.html           # HTML template
```

## Detailed Component Analysis

### App.jsx

#### Imports
```javascript
import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
```
- `useState`: React hook for managing component state
- `QRCodeSVG`: Component from qrcode.react library for rendering QR codes

#### Hardcoded Data
```javascript
const users = [
  { email: 'manufacturer@medchain.com', password: 'password123', role: 'Manufacturer', id: 1 }
]
```
- Array of user objects for authentication simulation
- Properties: email, password, role, id

#### App Component
Main application component that manages user authentication state.

**State Variables**:
- `user`: Stores the currently logged-in user object or null

**Functions**:
- `login(email, password)`: Checks credentials against hardcoded users array
- `logout()`: Clears user state

**JSX Structure**:
- Navigation bar with branding and user info/logout button
- Conditional rendering: Login form or ManufacturerDashboard based on authentication status

#### Login Component
Functional component for user authentication.

**State Variables**:
- `email`: Stores email input value
- `password`: Stores password input value

**JSX Elements**:
- Form with email and password inputs
- Submit button that calls parent `login` function
- TailwindCSS classes for styling

#### ManufacturerDashboard Component
Component for generating QR codes for medicines.

**State Variables**:
- `name`: Medicine name input
- `batch`: Batch number input
- `createdMed`: Stores generated medicine data with QR code

**Functions**:
- `registerMedicine()`: Generates mock blockchain ID, creates QR data, and sets createdMed state

**Methods Used**:
- `Math.floor(Math.random() * 1000000).toString()`: Generates random 6-digit ID
- `JSON.stringify()`: Converts object to JSON string for QR encoding
- `alert()`: Browser API for displaying notifications

**JSX Structure**:
- Input fields for medicine name and batch
- Generate QR button
- Conditional display of generated QR code with medicine details

### main.jsx
Entry point for the React application.

**Imports**:
- `StrictMode`: React component for highlighting potential problems
- `createRoot`: React 18 API for rendering
- `./index.css`: Global styles
- `App`: Main application component

**Rendering**:
```javascript
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

### index.css
Contains global CSS styles and TailwindCSS directives.

**Directives**:
- `@tailwind base;`: Includes Tailwind's base styles
- `@tailwind components;`: Includes Tailwind's component styles
- `@tailwind utilities;`: Includes Tailwind's utility classes

### Configuration Files

#### package.json
Defines project metadata, dependencies, and scripts.

**Key Sections**:
- `name`, `version`: Project identification
- `scripts`: Available npm commands
- `dependencies`: Runtime dependencies
- `devDependencies`: Development-only dependencies

#### vite.config.js
Configuration for Vite build tool.

**Typical Content**:
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

#### postcss.config.js
Configuration for PostCSS, used by TailwindCSS.

**Content**:
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

#### tailwind.config.js
Configuration for TailwindCSS.

**Content**:
```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

#### eslint.config.js
Configuration for ESLint code linting.

**Typical Rules**:
- React-specific linting rules
- Code style enforcement

## How to Run the Application

1. **Prerequisites**:
   - Node.js installed (version 16 or higher)
   - npm package manager

2. **Installation**:
   ```bash
   cd MedChain/frontend
   npm install
   ```

3. **Development**:
   ```bash
   npm run dev
   ```
   - Starts development server at http://localhost:5173
   - Hot reloading enabled

4. **Build for Production**:
   ```bash
   npm run build
   ```
   - Creates optimized build in `dist/` folder

5. **Preview Production Build**:
   ```bash
   npm run preview
   ```

## Usage Instructions

1. **Login**:
   - Email: manufacturer@medchain.com
   - Password: password123

2. **Generate QR Code**:
   - Enter medicine name
   - Enter batch number
   - Click "Generate QR"
   - QR code displays with medicine details

## Browser APIs Used

- `document.getElementById()`: DOM manipulation for React root
- `alert()`: User notifications
- `Math.random()`: Random number generation
- `JSON.stringify()`: Object serialization

## Security Considerations

- Passwords are hardcoded (not suitable for production)
- No actual authentication or authorization
- No input validation or sanitization
- No HTTPS enforcement

## Performance Notes

- Lightweight bundle due to minimal dependencies
- Fast rendering with React's virtual DOM
- Optimized CSS with TailwindCSS purging
- QR code generation is client-side only

## Future Enhancements

- Add proper authentication system
- Implement input validation
- Add more user roles
- Integrate with backend APIs
- Add QR code scanning functionality
- Implement responsive design improvements

---

This documentation covers all technologies, libraries, methods, and components used in the MedChain frontend application. For production use, additional security measures and backend integration would be required.</content>
<parameter name="filePath">c:\Users\rushi\OneDrive\Desktop\Final Year Project\MedChain\frontend\MedChain_Frontend_Documentation.md