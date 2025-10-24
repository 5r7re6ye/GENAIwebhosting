# CWRS - Campus Waste Recycling System

A React-based web application for managing campus waste recycling with AI chat support.

## Features

- 🤖 **AI Chat Assistant** - Intelligent help system
- 💬 **Real-time Messaging** - Communication between buyers and sellers
- 📱 **Responsive Design** - Works on all devices
- 🔐 **User Authentication** - Secure login system
- 📊 **Dashboard Management** - Separate interfaces for buyers and sellers

## Live Demo

🌐 **[View Live Demo](https://yourusername.github.io/react-app/)**

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/react-app.git
cd react-app

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production

```bash
# Build the app
npm run build

# Preview production build
npm run preview
```

## GitHub Pages Deployment

### Automatic Deployment (Recommended)

1. **Push to GitHub:**

   ```bash
   git add .
   git commit -m "Deploy to GitHub Pages"
   git push origin main
   ```

2. **Enable GitHub Pages:**
   - Go to your repository Settings
   - Scroll to "Pages" section
   - Source: "GitHub Actions"
   - The workflow will automatically deploy on every push

### Manual Deployment

```bash
# Install gh-pages
npm install --save-dev gh-pages

# Deploy to GitHub Pages
npm run deploy
```

## Configuration

### Update Repository Name

If your repository name is different from `react-app`, update the base path in `vite.config.ts`:

```typescript
export default defineConfig({
  base: "/your-repo-name/", // Change this
  // ... rest of config
});
```

### Environment Variables

Create a `.env` file for local development:

```bash
# Server Configuration
PORT=3001

# Firebase Configuration (already configured)
# Add your Firebase config in src/firebase/config.ts
```

## Project Structure

```
src/
├── components/
│   ├── Global/           # Shared components
│   │   ├── AIChat.tsx    # AI chat feature
│   │   ├── Messages.tsx  # User messaging
│   │   └── ...
│   └── Pages/
│       ├── BuyerDashboard/
│       └── SellerDashboard/
├── firebase/
│   └── config.ts         # Firebase configuration
└── main.tsx             # App entry point
```

## Troubleshooting

### Blank Page on GitHub Pages

1. **Check repository name:** Make sure `base` in `vite.config.ts` matches your repo name
2. **Clear browser cache:** Hard refresh (Ctrl+F5)
3. **Check console:** Look for JavaScript errors
4. **Verify deployment:** Check Actions tab for build errors

### Build Errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Firebase Issues

- Ensure Firebase project is properly configured
- Check Firebase console for any errors
- Verify API keys are correct

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m "Add feature"`
4. Push to branch: `git push origin feature-name`
5. Submit a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:

- Check the [Issues](https://github.com/yourusername/react-app/issues) page
- Create a new issue with detailed description
- Include browser console errors if applicable

---

**Note:** Replace `yourusername` and `react-app` with your actual GitHub username and repository name.
