const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
const { URL } = require('url');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Serve static files from the current directory
app.use(express.static('.'));

// Function to rewrite URLs in HTML content
function rewriteUrls(html, baseUrl) {
    try {
        const base = new URL(baseUrl);
        
        // Rewrite relative URLs to absolute URLs through our proxy
        html = html.replace(/href="([^"]*)"/g, (match, url) => {
            if (url.startsWith('http://') || url.startsWith('https://')) {
                return `href="/api/proxy?url=${encodeURIComponent(url)}"`;
            } else if (url.startsWith('//')) {
                return `href="/api/proxy?url=${encodeURIComponent('https:' + url)}"`;
            } else if (url.startsWith('/')) {
                return `href="/api/proxy?url=${encodeURIComponent(base.origin + url)}"`;
            } else if (!url.startsWith('#') && !url.startsWith('javascript:') && !url.startsWith('mailto:')) {
                const absoluteUrl = new URL(url, baseUrl).href;
                return `href="/api/proxy?url=${encodeURIComponent(absoluteUrl)}"`;
            }
            return match;
        });

        // Rewrite src attributes for images, scripts, etc.
        html = html.replace(/src="([^"]*)"/g, (match, url) => {
            if (url.startsWith('http://') || url.startsWith('https://')) {
                return `src="/api/proxy?url=${encodeURIComponent(url)}"`;
            } else if (url.startsWith('//')) {
                return `src="/api/proxy?url=${encodeURIComponent('https:' + url)}"`;
            } else if (url.startsWith('/')) {
                return `src="/api/proxy?url=${encodeURIComponent(base.origin + url)}"`;
            } else if (!url.startsWith('data:') && !url.startsWith('javascript:')) {
                const absoluteUrl = new URL(url, baseUrl).href;
                return `src="/api/proxy?url=${encodeURIComponent(absoluteUrl)}"`;
            }
            return match;
        });

        // Rewrite CSS url() references
        html = html.replace(/url\(["']?([^"')]*)["']?\)/g, (match, url) => {
            if (url.startsWith('http://') || url.startsWith('https://')) {
                return `url("/api/proxy?url=${encodeURIComponent(url)}")`;
            } else if (url.startsWith('//')) {
                return `url("/api/proxy?url=${encodeURIComponent('https:' + url)}")`;
            } else if (url.startsWith('/')) {
                return `url("/api/proxy?url=${encodeURIComponent(base.origin + url)}")`;
            } else if (!url.startsWith('data:')) {
                const absoluteUrl = new URL(url, baseUrl).href;
                return `url("/api/proxy?url=${encodeURIComponent(absoluteUrl)}")`;
            }
            return match;
        });

        return html;
    } catch (error) {
        console.error('Error rewriting URLs:', error);
        return html;
    }
}

// Proxy endpoint
app.get('/api/proxy', async (req, res) => {
    const targetUrl = req.query.url;
    
    if (!targetUrl) {
        return res.status(400).json({ error: 'URL parameter is required' });
    }

    try {
        // Validate URL
        const url = new URL(targetUrl);
        
        // Security: Block local/private IPs
        if (url.hostname === 'localhost' || 
            url.hostname === '127.0.0.1' || 
            url.hostname.startsWith('192.168.') ||
            url.hostname.startsWith('10.') ||
            url.hostname.startsWith('172.')) {
            return res.status(403).json({ error: 'Access to local resources is not allowed' });
        }

        console.log(`Proxying request to: ${targetUrl}`);

        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            }
        });

        const contentType = response.headers.get('content-type') || '';
        
        // Handle different content types
        if (contentType.includes('text/html')) {
            let html = await response.text();
            
            // Rewrite URLs in the HTML
            html = rewriteUrls(html, targetUrl);
            
            // Add base tag to help with relative URLs
            const baseTag = `<base href="${targetUrl}">`;
            html = html.replace('<head>', `<head>${baseTag}`);
            
            // Add script to handle form submissions and link clicks
            const browserScript = `
                <script>
                    // Intercept form submissions
                    document.addEventListener('submit', function(e) {
                        e.preventDefault();
                        const form = e.target;
                        const formData = new FormData(form);
                        const params = new URLSearchParams(formData);
                        const action = form.action || window.location.href;
                        const method = form.method || 'GET';
                        
                        if (method.toLowerCase() === 'get') {
                            const url = action + '?' + params.toString();
                            window.parent.postMessage({type: 'navigate', url: url}, '*');
                        } else {
                            // Handle POST requests
                            fetch('/api/proxy', {
                                method: 'POST',
                                headers: {'Content-Type': 'application/json'},
                                body: JSON.stringify({url: action, method: method, data: params.toString()})
                            });
                        }
                    });
                    
                    // Intercept link clicks
                    document.addEventListener('click', function(e) {
                        const link = e.target.closest('a');
                        if (link && link.href && !link.href.startsWith('javascript:') && !link.href.startsWith('#')) {
                            e.preventDefault();
                            window.parent.postMessage({type: 'navigate', url: link.href}, '*');
                        }
                    });
                </script>
            `;
            html = html.replace('</body>', `${browserScript}</body>`);
            
            res.setHeader('Content-Type', 'text/html');
            res.send(html);
        } else if (contentType.includes('text/css')) {
            let css = await response.text();
            // Rewrite URLs in CSS
            css = css.replace(/url\(["']?([^"')]*)["']?\)/g, (match, url) => {
                if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('data:')) {
                    const absoluteUrl = new URL(url, targetUrl).href;
                    return `url("/api/proxy?url=${encodeURIComponent(absoluteUrl)}")`;
                }
                return match;
            });
            res.setHeader('Content-Type', 'text/css');
            res.send(css);
        } else {
            // For other content types (images, etc.), just proxy as-is
            const buffer = await response.buffer();
            res.setHeader('Content-Type', contentType);
            res.send(buffer);
        }
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch the requested URL',
            details: error.message 
        });
    }
});

// Handle POST requests for form submissions
app.post('/api/proxy', async (req, res) => {
    const { url, method, data } = req.body;
    
    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            },
            body: data
        });
        
        const html = await response.text();
        const processedHtml = rewriteUrls(html, url);
        
        res.setHeader('Content-Type', 'text/html');
        res.send(processedHtml);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Proxy server is running' });
});

app.listen(PORT, () => {
    console.log(`Proxy server running on http://localhost:${PORT}`);
    console.log(`Frontend available at http://localhost:${PORT}`);
});