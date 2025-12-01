# BillByteKOT AI Frontend

## Overview

BillByteKOT AI Frontend is a modern React application that provides a comprehensive restaurant management interface. Built with React 18, it features a responsive design using Tailwind CSS and Radix UI components, offering an intuitive experience for restaurant staff and managers.

## 🚀 Quick Start

### 1. Prerequisites

- **Node.js**: Version 18 or higher
- **npm**: Version 8 or higher
- **Backend Server**: BillByteKOT AI backend running (see `../backend/README.md`)

### 2. Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Set up environment variables
npm run env:setup

# Edit your local environment file
# Update REACT_APP_BACKEND_URL and API keys
nano .env.local
```

### 3. Environment Setup

```bash
# Copy environment template
cp .env.local.template .env.local

# Edit with your actual values
# Required: REACT_APP_BACKEND_URL
# Optional: REACT_APP_RAZORPAY_KEY_ID, REACT_APP_GOOGLE_MAPS_API_KEY
```

### 4. Start Development Server

```bash
# Validate environment and start server
npm start

# Or start without validation
npm run start:direct
```

The application will open at [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
frontend/
├── public/                 # Static assets
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── ui/           # Base UI components (shadcn/ui)
│   │   └── Layout.js     # Main layout component
│   ├── pages/            # Page components
│   │   ├── LoginPage.js
│   │   ├── Dashboard.js
│   │   ├── MenuPage.js
│   │   ├── OrdersPage.js
│   │   ├── BillingPage.js
│   │   └── ...
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions
│   │   └── utils.js
│   ├── App.js            # Main app component
│   ├── App.css           # Global styles
│   └── index.js          # Entry point
├── scripts/              # Build and utility scripts
│   └── validate-env.js   # Environment validation
├── .env                  # Default environment variables
├── .env.development      # Development environment
├── .env.production       # Production environment
├── .env.staging          # Staging environment
├── .env.local.template   # Local environment template
└── package.json          # Dependencies and scripts
```

## 🔧 Environment Configuration

### Essential Variables

```bash
# Backend Connection (Required)
REACT_APP_BACKEND_URL=http://localhost:5000

# Payment Gateway (Recommended)
REACT_APP_RAZORPAY_KEY_ID=rzp_test_your_key_here
REACT_APP_RAZORPAY_ENABLED=true

# Google Maps (Optional but recommended)
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_key_here
```

### Environment Validation

```bash
# Validate current environment setup
npm run validate-env

# Get setup guidance
npm run validate-env:guide

# Create .env.local from template
npm run env:setup
```

### Environment Files Priority

1. `.env.local` (highest priority, gitignored)
2. `.env.development` (when NODE_ENV=development)
3. `.env.production` (when NODE_ENV=production)
4. `.env` (default fallback)

## 🎨 UI Components

Built with modern React patterns and components:

- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Pre-built component library
- **Lucide React**: Beautiful icons
- **React Hook Form**: Form management
- **Sonner**: Toast notifications

### Key Components

- **Layout**: Main application layout with navigation
- **Dashboard**: Overview with analytics and quick actions
- **Menu Management**: Create and manage restaurant menus
- **Order Processing**: Real-time order management
- **Kitchen Display**: Order preparation interface
- **Billing System**: Integrated payment processing
- **Inventory**: Stock management and tracking
- **Reports**: Analytics and business insights

## 🔌 API Integration

### Backend Connection

```javascript
// Automatic API base URL construction
const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Authentication handling
import { setAuthToken } from './App';
setAuthToken(localStorage.getItem('token'));
```

### Real-time Features

```javascript
// WebSocket connection for real-time updates
const wsUrl = process.env.REACT_APP_WEBSOCKET_URL;
// Features: Live orders, kitchen updates, notifications
```

## 📱 Features

### Core Restaurant Management
- **Dashboard**: Real-time metrics and quick actions
- **Menu Management**: Categories, items, pricing, variations
- **Order Processing**: Take orders, modify items, track status
- **Table Management**: Table layouts, reservations, occupancy
- **Kitchen Display**: Order queue, preparation status
- **Billing & Payments**: Invoice generation, payment processing

### Advanced Features
- **AI Recommendations**: Smart menu suggestions and insights
- **QR Code Ordering**: Customer self-service ordering
- **Inventory Management**: Stock tracking, low-stock alerts
- **Staff Management**: Employee roles, permissions, scheduling
- **Analytics & Reports**: Sales reports, performance metrics
- **Multi-location**: Support for restaurant chains

### Customer Features
- **Online Ordering**: Web-based ordering system
- **Loyalty Program**: Points, rewards, customer retention
- **Feedback System**: Reviews and rating collection

## 🔧 Development

### Available Scripts

```bash
# Development
npm start              # Start development server with validation
npm run start:direct   # Start without environment validation
npm run build          # Create production build
npm test               # Run test suite

# Environment Management
npm run validate-env         # Validate environment variables
npm run validate-env:guide   # Show setup guide
npm run env:setup           # Create .env.local from template

# Maintenance
npm run clean-install  # Clean install dependencies
npm run lint          # Run ESLint (if configured)
npm run format        # Format code (if configured)
```

### Development Workflow

1. **Setup**: Clone repo, install dependencies, configure environment
2. **Development**: Use `npm start` for hot-reload development
3. **Testing**: Write and run tests for new features
4. **Building**: Use `npm run build` for production builds
5. **Deployment**: Deploy to hosting platform (Vercel, Render, etc.)

### Code Style

- **ES6+**: Modern JavaScript features
- **Functional Components**: React hooks over class components
- **Custom Hooks**: Reusable stateful logic
- **Component Composition**: Small, focused components
- **Tailwind Classes**: Utility-first styling approach

## 🔐 Authentication & Security

### Authentication Flow

```javascript
// Login process
const login = async (credentials) => {
  const response = await axios.post(`${API}/auth/login`, credentials);
  setAuthToken(response.data.token);
  localStorage.setItem('user', JSON.stringify(response.data.user));
};

// Protected routes
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};
```

### Security Features

- **JWT Token Management**: Secure token storage and refresh
- **Role-based Access**: Different permissions for staff roles
- **Route Protection**: Authenticated routes and role checks
- **CORS Configuration**: Secure cross-origin requests
- **Input Validation**: Form validation and sanitization

## 📦 Dependencies

### Core Dependencies

```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^7.5.1",
  "axios": "^1.8.4",
  "react-hook-form": "^7.56.2"
}
```

### UI Framework

```json
{
  "@radix-ui/react-*": "Latest",
  "tailwindcss": "^3.4.17",
  "lucide-react": "^0.507.0",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "tailwind-merge": "^3.2.0"
}
```

### Build Tools

```json
{
  "@craco/craco": "^7.1.0",
  "react-scripts": "5.0.1",
  "postcss": "^8.4.49",
  "autoprefixer": "^10.4.20"
}
```

## 🚀 Deployment

### Build for Production

```bash
# Create optimized production build
npm run build

# The build folder contains the production-ready files
```

### Environment Variables for Production

```bash
# Update these for your production environment
REACT_APP_BACKEND_URL=https://your-backend-prod.onrender.com
REACT_APP_RAZORPAY_KEY_ID=rzp_live_your_live_key
REACT_APP_ENVIRONMENT=production
GENERATE_SOURCEMAP=false
```

### Deployment Platforms

#### Render
```bash
# Build Command
npm run build

# Environment Variables
Set in Render dashboard:
- REACT_APP_BACKEND_URL
- REACT_APP_RAZORPAY_KEY_ID
- NODE_ENV=production
```

#### Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

#### Netlify
```bash
# Build settings
Build command: npm run build
Publish directory: build
```

### Docker Deployment

```dockerfile
# Multi-stage build
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🔍 Troubleshooting

### Common Issues

#### Backend Connection Failed
```bash
# Check backend URL format
REACT_APP_BACKEND_URL=http://localhost:5000  # ✅ Correct
REACT_APP_BACKEND_URL=http://localhost:5000/ # ❌ Wrong

# Verify backend is running
curl http://localhost:5000/api/health

# Check CORS settings in backend
```

#### Environment Variables Not Loading
```bash
# Ensure variables have REACT_APP_ prefix
REACT_APP_API_URL=...  # ✅ Available in React
API_URL=...            # ❌ Not available

# Restart development server after changes
npm start
```

#### Payment Integration Issues
```bash
# Check Razorpay key format
REACT_APP_RAZORPAY_KEY_ID=rzp_test_...  # Test environment
REACT_APP_RAZORPAY_KEY_ID=rzp_live_...  # Production

# Verify payment gateway is enabled
REACT_APP_RAZORPAY_ENABLED=true
```

#### Build Failures
```bash
# Clear cache and reinstall
npm run clean-install

# Check Node.js version
node --version  # Should be 18+

# Update dependencies
npm update
```

### Debug Tools

```javascript
// Environment debugging (development only)
if (process.env.NODE_ENV === 'development') {
  console.log('Environment:', {
    BACKEND_URL: process.env.REACT_APP_BACKEND_URL,
    ENVIRONMENT: process.env.REACT_APP_ENVIRONMENT,
    RAZORPAY_ENABLED: process.env.REACT_APP_RAZORPAY_ENABLED
  });
}
```

### Performance Monitoring

- **React DevTools**: Browser extension for React debugging
- **Web Vitals**: Built-in performance metrics
- **Bundle Analyzer**: Analyze build size (`npm run build -- --analyze`)

## 🧪 Testing

### Test Structure

```bash
src/
├── components/__tests__/
├── pages/__tests__/
├── hooks/__tests__/
└── __tests__/
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

## 📖 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Restaurant Management
- `GET /api/menu` - Get menu items
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get orders list
- `POST /api/payments/create-order` - Process payment

For complete API documentation, see the backend README.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style and patterns
- Write tests for new features
- Update documentation as needed
- Test on multiple devices and browsers
- Validate environment setup works correctly

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Documentation**: See `FRONTEND_ENV_SETUP.md` for detailed environment setup
- **Issues**: Report bugs and feature requests on GitHub
- **Environment Help**: Run `npm run validate-env:guide` for setup guidance

## 📞 Contact

- **Developer**: BillByteKOT AI Team
- **Email**: support@BillByteKOT-ai.com
- **Website**: https://BillByteKOT-ai.com

---

**Made with ❤️ by the BillByteKOT AI Team**

*Transforming restaurant management with intelligent technology*
