# Desktop Browser with Headless Chrome

A web-based desktop simulation featuring a fully functional Safari browser powered by headless Chrome for complete website compatibility.

## Features

- **Full Website Compatibility**: Uses headless Chrome for 100% website compatibility
- **Interactive Browsing**: Click on links, fill forms, and interact with websites naturally
- **Real Browser Engine**: Powered by Chromium for authentic web rendering
- **Screenshot-based Display**: Shows real website screenshots with click interaction
- **Complete Navigation**: Back, forward, refresh, and address bar functionality
- **Session Management**: Each browser instance has its own isolated session
- **Modern UI**: Clean, Safari-like interface with Chrome engine badge

## Architecture

```
Frontend (Safari App) → Chrome Server (Puppeteer) → Headless Chrome → Websites
```

The Chrome server:
1. Manages headless Chrome browser instances
2. Creates isolated sessions for each browser window
3. Captures screenshots and handles user interactions
4. Provides full JavaScript execution and modern web features

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

This will install all required dependencies including Puppeteer (which downloads Chromium automatically).

### 2. Start the Chrome Server

```bash
npm run chrome
```

Or for development with auto-restart:

```bash
npm run chrome-dev
```

The Chrome server will start on `http://localhost:3001`

### 3. Open the Desktop

Open your browser and navigate to:
```
http://localhost:3001
```

### 4. Use the Safari Browser

1. Click on the Safari icon in the dock
2. Wait for Chrome session to initialize
3. Enter a URL in the address bar (e.g., `github.com`, `stackoverflow.com`)
4. Click "Go" or press Enter
5. Click on the screenshot to interact with websites!

**Note**: The browser displays screenshots of real websites. Click anywhere on the screenshot to interact with that location on the actual webpage.

## How It Works

### Chrome Server (`chrome-server.js`)

- **Puppeteer Integration**: Controls headless Chrome browser instances
- **Session Management**: Creates isolated browser sessions for each user
- **Screenshot Capture**: Takes real-time screenshots of web pages
- **Interaction Handling**: Processes clicks, navigation, and form interactions
- **Full JavaScript Support**: Executes all JavaScript just like a real browser

### Frontend Browser (`src/apps/safari-webapp.js`)

- **Modern Web Component**: Built as a custom HTML element
- **Chrome Integration**: Communicates with headless Chrome backend
- **Interactive Screenshots**: Click on screenshots to interact with websites
- **Real-time Updates**: Live screenshot updates as you browse
- **Session Lifecycle**: Manages Chrome sessions automatically
- **Error Handling**: Graceful fallback when Chrome server is unavailable

## API Endpoints

### `POST /api/chrome/new-session`
Creates a new Chrome browser session.

**Response:**
```json
{
  "sessionId": "unique_session_id"
}
```

### `POST /api/chrome/navigate`
Navigates to a URL in the specified session.

**Body:**
```json
{
  "sessionId": "session_id",
  "url": "target_url"
}
```

**Response:**
```json
{
  "success": true,
  "url": "actual_url",
  "title": "page_title",
  "screenshot": "base64_image_data"
}
```

### `POST /api/chrome/click`
Clicks at specified coordinates.

**Body:**
```json
{
  "sessionId": "session_id",
  "x": 100,
  "y": 200
}
```

### `POST /api/chrome/back` / `POST /api/chrome/forward` / `POST /api/chrome/refresh`
Navigation actions.

**Body:**
```json
{
  "sessionId": "session_id"
}
```

### `GET /api/health`
Health check endpoint.

**Response:**
```json
{
  "status": "OK",
  "message": "Chrome headless browser server is running",
  "activeSessions": 2
}
```

## Security Features

- **IP Filtering**: Blocks requests to localhost, 127.0.0.1, and private IP ranges
- **URL Validation**: Validates URLs before processing
- **Content Sanitization**: Processes and modifies content for safe display
- **User Agent**: Uses realistic browser user agent strings

## Supported Features

- **Full JavaScript Execution**: Complete JavaScript support including modern frameworks
- **CSS and Styling**: Perfect rendering of all CSS, animations, and responsive design
- **Interactive Elements**: Forms, buttons, dropdowns, and all interactive components
- **Media Content**: Images, videos, and audio content
- **Modern Web APIs**: WebSockets, localStorage, and other browser APIs
- **Authentication**: Login flows and session management work normally

## Limitations

- **Screenshot-based Interaction**: Interaction is through clicking on screenshots (not direct DOM manipulation)
- **Performance**: Slightly slower than direct browsing due to screenshot capture
- **Resource Usage**: Uses more memory due to running headless Chrome instances
- **File Downloads**: Downloads are handled by the headless browser (not directly accessible)

## Troubleshooting

### "Failed to initialize Chrome browser" Error
- Make sure the Chrome server is running (`npm run chrome`)
- Check that Puppeteer installed correctly (`npm install`)
- Verify Chrome/Chromium is available on your system

### Pages Not Loading
- Check the Chrome server console for error messages
- Some websites may have anti-automation measures
- Try different websites (GitHub, Stack Overflow work well for testing)

### Slow Performance
- Screenshots take time to capture and transmit
- Complex websites may take longer to load
- Consider the network connection speed

## Development

### Project Structure
```
├── chrome-server.js        # Headless Chrome server
├── server.js              # Legacy proxy server (for reference)
├── package.json           # Dependencies and scripts
├── src/
│   └── apps/
│       ├── safari-webapp.js      # Chrome-based Safari browser
│       └── safari-chrome-webapp.js  # Alternative implementation
├── index.html             # Main desktop interface
└── README.md             # This file
```

### Adding Features

To extend the browser functionality:

1. **Chrome Server**: Modify `chrome-server.js` to add new Puppeteer capabilities
2. **Frontend**: Enhance `safari-webapp.js` with new UI elements or interaction methods
3. **Session Management**: Add new session-based features like tabs or bookmarks
4. **Performance**: Optimize screenshot capture and transmission

### Available Scripts

- `npm run chrome` - Start the Chrome headless server
- `npm run chrome-dev` - Start Chrome server with auto-restart
- `npm start` - Start legacy proxy server
- `npm run dev` - Start legacy proxy server with auto-restart

## License

MIT License - feel free to use and modify as needed.