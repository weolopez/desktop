const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3002;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Serve static files from the current directory
app.use(express.static('.'));

// Store browser instances
let browser = null;
const pages = new Map(); // Store pages by session ID

// Initialize browser
async function initBrowser() {
    if (!browser) {
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        });
        console.log('Headless Chrome browser initialized');
    }
    return browser;
}

// Create new page session
app.post('/api/chrome/new-session', async (req, res) => {
    try {
        await initBrowser();
        const page = await browser.newPage();
        
        // Set viewport
        await page.setViewport({ width: 1200, height: 800 });
        
        // Set user agent
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        
        // Generate session ID
        const sessionId = Date.now().toString();
        pages.set(sessionId, page);
        
        res.json({ sessionId });
    } catch (error) {
        console.error('Error creating new session:', error);
        res.status(500).json({ error: error.message });
    }
});

// Navigate to URL
app.post('/api/chrome/navigate', async (req, res) => {
    try {
        const { sessionId, url } = req.body;
        const page = pages.get(sessionId);
        
        if (!page) {
            return res.status(404).json({ error: 'Session not found' });
        }
        
        // Validate URL
        let targetUrl = url.trim();
        if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
            if (targetUrl.includes('.') && !targetUrl.includes(' ')) {
                targetUrl = 'https://' + targetUrl;
            } else {
                targetUrl = `https://www.google.com/search?q=${encodeURIComponent(targetUrl)}`;
            }
        }
        
        console.log(`Navigating to: ${targetUrl}`);
        
        // Navigate with timeout
        await page.goto(targetUrl, { 
            waitUntil: 'networkidle2', 
            timeout: 30000 
        });
        
        // Get page content and screenshot
        const content = await page.content();
        const screenshot = await page.screenshot({ 
            encoding: 'base64',
            fullPage: false
        });
        
        // Get page title and URL
        const title = await page.title();
        const currentUrl = page.url();
        
        res.json({
            success: true,
            url: currentUrl,
            title,
            content,
            screenshot: `data:image/png;base64,${screenshot}`
        });
        
    } catch (error) {
        console.error('Navigation error:', error);
        res.status(500).json({ 
            error: 'Failed to navigate to URL',
            details: error.message 
        });
    }
});

// Click element
app.post('/api/chrome/click', async (req, res) => {
    try {
        const { sessionId, x, y } = req.body;
        const page = pages.get(sessionId);
        
        if (!page) {
            return res.status(404).json({ error: 'Session not found' });
        }
        
        await page.mouse.click(x, y);
        
        // Wait a bit for any navigation or changes
        await page.waitForTimeout(1000);
        
        // Get updated content and screenshot
        const content = await page.content();
        const screenshot = await page.screenshot({ 
            encoding: 'base64',
            fullPage: false
        });
        
        const title = await page.title();
        const currentUrl = page.url();
        
        res.json({
            success: true,
            url: currentUrl,
            title,
            content,
            screenshot: `data:image/png;base64,${screenshot}`
        });
        
    } catch (error) {
        console.error('Click error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Type text
app.post('/api/chrome/type', async (req, res) => {
    try {
        const { sessionId, text } = req.body;
        const page = pages.get(sessionId);
        
        if (!page) {
            return res.status(404).json({ error: 'Session not found' });
        }
        
        await page.keyboard.type(text);
        
        res.json({ success: true });
        
    } catch (error) {
        console.error('Type error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Press key
app.post('/api/chrome/key', async (req, res) => {
    try {
        const { sessionId, key } = req.body;
        const page = pages.get(sessionId);
        
        if (!page) {
            return res.status(404).json({ error: 'Session not found' });
        }
        
        await page.keyboard.press(key);
        
        // Wait a bit for any changes
        await page.waitForTimeout(500);
        
        // Get updated content and screenshot
        const content = await page.content();
        const screenshot = await page.screenshot({ 
            encoding: 'base64',
            fullPage: false
        });
        
        const title = await page.title();
        const currentUrl = page.url();
        
        res.json({
            success: true,
            url: currentUrl,
            title,
            content,
            screenshot: `data:image/png;base64,${screenshot}`
        });
        
    } catch (error) {
        console.error('Key press error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Go back
app.post('/api/chrome/back', async (req, res) => {
    try {
        const { sessionId } = req.body;
        const page = pages.get(sessionId);
        
        if (!page) {
            return res.status(404).json({ error: 'Session not found' });
        }
        
        await page.goBack({ waitUntil: 'networkidle2' });
        
        const content = await page.content();
        const screenshot = await page.screenshot({ 
            encoding: 'base64',
            fullPage: false
        });
        
        const title = await page.title();
        const currentUrl = page.url();
        
        res.json({
            success: true,
            url: currentUrl,
            title,
            content,
            screenshot: `data:image/png;base64,${screenshot}`
        });
        
    } catch (error) {
        console.error('Back error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Go forward
app.post('/api/chrome/forward', async (req, res) => {
    try {
        const { sessionId } = req.body;
        const page = pages.get(sessionId);
        
        if (!page) {
            return res.status(404).json({ error: 'Session not found' });
        }
        
        await page.goForward({ waitUntil: 'networkidle2' });
        
        const content = await page.content();
        const screenshot = await page.screenshot({ 
            encoding: 'base64',
            fullPage: false
        });
        
        const title = await page.title();
        const currentUrl = page.url();
        
        res.json({
            success: true,
            url: currentUrl,
            title,
            content,
            screenshot: `data:image/png;base64,${screenshot}`
        });
        
    } catch (error) {
        console.error('Forward error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Refresh page
app.post('/api/chrome/refresh', async (req, res) => {
    try {
        const { sessionId } = req.body;
        const page = pages.get(sessionId);
        
        if (!page) {
            return res.status(404).json({ error: 'Session not found' });
        }
        
        await page.reload({ waitUntil: 'networkidle2' });
        
        const content = await page.content();
        const screenshot = await page.screenshot({ 
            encoding: 'base64',
            fullPage: false
        });
        
        const title = await page.title();
        const currentUrl = page.url();
        
        res.json({
            success: true,
            url: currentUrl,
            title,
            content,
            screenshot: `data:image/png;base64,${screenshot}`
        });
        
    } catch (error) {
        console.error('Refresh error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get screenshot
app.post('/api/chrome/screenshot', async (req, res) => {
    try {
        const { sessionId } = req.body;
        const page = pages.get(sessionId);
        
        if (!page) {
            return res.status(404).json({ error: 'Session not found' });
        }
        
        const screenshot = await page.screenshot({ 
            encoding: 'base64',
            fullPage: false
        });
        
        const title = await page.title();
        const currentUrl = page.url();
        
        res.json({
            success: true,
            url: currentUrl,
            title,
            screenshot: `data:image/png;base64,${screenshot}`
        });
        
    } catch (error) {
        console.error('Screenshot error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Close session
app.post('/api/chrome/close-session', async (req, res) => {
    try {
        const { sessionId } = req.body;
        const page = pages.get(sessionId);
        
        if (page) {
            await page.close();
            pages.delete(sessionId);
        }
        
        res.json({ success: true });
        
    } catch (error) {
        console.error('Close session error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Chrome headless browser server is running',
        activeSessions: pages.size
    });
});

// Cleanup on exit
process.on('SIGINT', async () => {
    console.log('Shutting down...');
    if (browser) {
        await browser.close();
    }
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('Shutting down...');
    if (browser) {
        await browser.close();
    }
    process.exit(0);
});

app.listen(PORT, () => {
    console.log(`Chrome headless browser server running on http://localhost:${PORT}`);
    console.log(`Frontend available at http://localhost:${PORT}`);
});