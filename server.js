const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3001;

// Simple cache to prevent duplicate OAuth code processing
const processedCodes = new Set();

// Clean up old codes every 5 minutes
setInterval(() => {
  processedCodes.clear();
  console.log('Cleared processed codes cache');
}, 5 * 60 * 1000);

// Middleware
app.use(cors());
app.use(express.json());

// GitHub OAuth configuration
const GITHUB_CLIENT_ID = 'Ov23lihegNLNB6NBAGet';
const GITHUB_CLIENT_SECRET = 'your-actual-github-client-secret';

console.log('=== GitHub OAuth Configuration ===');
console.log('Client ID:', GITHUB_CLIENT_ID);
console.log('Client Secret:', GITHUB_CLIENT_SECRET ? '***' + GITHUB_CLIENT_SECRET.slice(-4) : 'NOT SET');

// Exchange code for access token
app.post('/api/auth/github', async (req, res) => {
  try {
    const { code } = req.body;
    
    console.log('=== OAuth Token Exchange Request ===');
    console.log('Received code:', code);
    console.log('Client ID:', GITHUB_CLIENT_ID);
    console.log('Client Secret:', GITHUB_CLIENT_SECRET ? '***' + GITHUB_CLIENT_SECRET.slice(-4) : 'NOT SET');

    if (!code) {
      console.log('ERROR: No authorization code provided');
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    // Check if this code has already been processed
    if (processedCodes.has(code)) {
      console.log('ERROR: Code already processed:', code);
      return res.status(400).json({ error: 'Authorization code already used' });
    }

    // Mark code as being processed immediately
    processedCodes.add(code);

    if (!GITHUB_CLIENT_ID) {
      console.log('ERROR: GitHub Client ID not configured');
      return res.status(500).json({ 
        error: 'GitHub OAuth not configured',
        details: 'Client ID is missing'
      });
    }

    if (!GITHUB_CLIENT_SECRET) {
      console.log('ERROR: GitHub Client Secret not configured');
      return res.status(500).json({ 
        error: 'GitHub OAuth not configured',
        details: 'Client Secret is missing'
      });
    }

    console.log('Making request to GitHub OAuth API...');
    
    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code: code,
      }),
    });

    console.log('GitHub API Response Status:', tokenResponse.status);
    console.log('GitHub API Response Headers:', Object.fromEntries(tokenResponse.headers.entries()));

    let tokenData;
    try {
      tokenData = await tokenResponse.json();
    } catch (parseError) {
      console.log('ERROR: Failed to parse GitHub API response:', parseError);
      const responseText = await tokenResponse.text();
      console.log('Raw GitHub API response:', responseText);
      return res.status(500).json({ 
        error: 'Invalid response from GitHub API',
        details: 'Server could not parse GitHub response'
      });
    }
    
    console.log('GitHub API Response Data:', tokenData);

    if (tokenData.error) {
      console.log('ERROR: GitHub API returned error:', tokenData.error);
      return res.status(400).json({ 
        error: tokenData.error_description || 'Failed to exchange code for token',
        github_error: tokenData.error
      });
    }

    if (!tokenData.access_token) {
      console.log('ERROR: No access token in response');
      return res.status(400).json({ 
        error: 'No access token received from GitHub',
        details: 'GitHub OAuth response missing access_token'
      });
    }

    console.log('SUCCESS: Access token received');
    res.json({ access_token: tokenData.access_token });
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message || 'Unknown error occurred'
    });
  }
});

// Handle OAuth callback
app.get('/login', (req, res) => {
  const { code, error } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || 'https://tesseract-indol.vercel.app';
  
  if (error) {
    console.log('OAuth error:', error);
    res.redirect(`${frontendUrl}/login?error=${error}`);
    return;
  }
  
  if (code) {
    console.log('OAuth callback received, redirecting to React app with code');
    res.redirect(`${frontendUrl}/login?code=${code}`);
    return;
  }
  
  // If no code or error, redirect to React app
  res.redirect(`${frontendUrl}/login`);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    github_client_id: GITHUB_CLIENT_ID,
    github_client_secret_configured: !!GITHUB_CLIENT_SECRET
  });
});

// Test endpoint for OAuth configuration
app.get('/api/test-oauth', (req, res) => {
  res.json({
    client_id: GITHUB_CLIENT_ID,
    client_secret_configured: !!GITHUB_CLIENT_SECRET,
    redirect_uri: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`
  });
});

// Serve React app for all other routes (excluding API routes)
app.get('*', (req, res) => {
  // Don't redirect API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  // For production (Vercel), serve a simple page instead of redirecting
  if (process.env.NODE_ENV === 'production' || req.hostname.includes('vercel.app')) {
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>GitHub OAuth Server</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #333; }
            .endpoint { background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 4px; border-left: 4px solid #007bff; }
            .method { color: #007bff; font-weight: bold; }
            .url { color: #28a745; font-family: monospace; }
            .description { color: #666; margin-top: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🚀 GitHub OAuth Server</h1>
            <p>This server handles GitHub OAuth authentication. Available endpoints:</p>
            
            <div class="endpoint">
              <span class="method">POST</span> <span class="url">/api/auth/github</span>
              <div class="description">Exchange authorization code for access token</div>
            </div>
            
            <div class="endpoint">
              <span class="method">GET</span> <span class="url">/login</span>
              <div class="description">OAuth callback handler</div>
            </div>
            
            <div class="endpoint">
              <span class="method">GET</span> <span class="url">/api/health</span>
              <div class="description">Health check endpoint</div>
            </div>
            
            <div class="endpoint">
              <span class="method">GET</span> <span class="url">/api/test-oauth</span>
              <div class="description">OAuth configuration test</div>
            </div>
            
            <p><strong>Status:</strong> Server is running and ready to handle OAuth requests!</p>
          </div>
        </body>
      </html>
    `);
  }
  
  // For development, redirect to React app
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  res.redirect(frontendUrl + req.path);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
