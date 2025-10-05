# GitHub OAuth Server API Documentation

## Overview
A Node.js Express server that handles GitHub OAuth 2.0 authentication flow. This server provides endpoints for exchanging authorization codes for access tokens and managing OAuth callbacks.

## Base URL
```
http://localhost:3001
```

## Authentication
This server handles GitHub OAuth 2.0 flow. No API key authentication required for the endpoints.

## API Endpoints

### 1. Exchange Authorization Code for Access Token

**Endpoint:** `POST /api/auth/github`

**Description:** Exchanges a GitHub authorization code for an access token.

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "code": "string" // GitHub authorization code
}
```

**Success Response (200):**
```json
{
  "access_token": "gho_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```

**Error Responses:**

**400 Bad Request - Missing Code:**
```json
{
  "error": "Authorization code is required"
}
```

**400 Bad Request - Code Already Used:**
```json
{
  "error": "Authorization code already used"
}
```

**500 Internal Server Error - Configuration Error:**
```json
{
  "error": "GitHub OAuth not configured",
  "details": "Client ID is missing"
}
```

**500 Internal Server Error - GitHub API Error:**
```json
{
  "error": "Invalid response from GitHub API",
  "details": "Server could not parse GitHub response"
}
```

**400 Bad Request - GitHub API Error:**
```json
{
  "error": "Failed to exchange code for token",
  "github_error": "bad_verification_code"
}
```

**Example Request:**
```bash
curl -X POST http://localhost:3001/api/auth/github \
  -H "Content-Type: application/json" \
  -d '{"code": "abc123def456"}'
```

---

### 2. OAuth Callback Handler

**Endpoint:** `GET /login`

**Description:** Handles GitHub OAuth callback redirects and forwards the authorization code to the frontend.

**Query Parameters:**
- `code` (string, optional): Authorization code from GitHub
- `error` (string, optional): Error message if OAuth failed

**Response:** Redirects to frontend with appropriate parameters

**Redirect Examples:**
- Success: `http://localhost:3000/login?code=abc123def456`
- Error: `http://localhost:3000/login?error=access_denied`
- No code/error: `http://localhost:3000/login`

---

### 3. Health Check

**Endpoint:** `GET /api/health`

**Description:** Returns server health status and configuration information.

**Response (200):**
```json
{
  "status": "OK",
  "timestamp": "2025-10-05T03:15:08.424Z",
  "github_client_id": "Ov23lihegNLNB6NBAGet",
  "github_client_secret_configured": true
}
```

**Example Request:**
```bash
curl http://localhost:3001/api/health
```

---

### 4. OAuth Configuration Test

**Endpoint:** `GET /api/test-oauth`

**Description:** Returns OAuth configuration details for testing purposes.

**Response (200):**
```json
{
  "client_id": "Ov23lihegNLNB6NBAGet",
  "client_secret_configured": true,
  "redirect_uri": "http://localhost:3000/login"
}
```

**Example Request:**
```bash
curl http://localhost:3001/api/test-oauth
```

---

### 5. Get User Repositories

**Endpoint:** `GET /api/github/user/repos`

**Description:** Fetches the authenticated user's repositories from GitHub.

**Request Headers:**
```
Authorization: Bearer <github-access-token>
```

**Query Parameters:**
- `sort` (string, optional): Sort repositories by `created`, `updated`, `pushed`, `full_name`. Default: `updated`
- `per_page` (number, optional): Number of repositories per page. Default: `100`

**Success Response (200):**
```json
[
  {
    "id": 123456789,
    "name": "repository-name",
    "full_name": "username/repository-name",
    "private": false,
    "html_url": "https://github.com/username/repository-name",
    "description": "Repository description",
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-12-01T00:00:00Z",
    "pushed_at": "2023-12-01T00:00:00Z"
  }
]
```

**Error Responses:**

**401 Unauthorized:**
```json
{
  "error": "Authorization header required"
}
```

**Example Request:**
```bash
curl -H "Authorization: Bearer gho_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
  "http://localhost:3001/api/github/user/repos?sort=updated&per_page=100"
```

---

### 6. Get Repository Details

**Endpoint:** `GET /api/github/repos/:owner/:repo`

**Description:** Fetches detailed information about a specific repository.

**Request Headers:**
```
Authorization: Bearer <github-access-token>
```

**Path Parameters:**
- `owner` (string, required): Repository owner username
- `repo` (string, required): Repository name

**Success Response (200):**
```json
{
  "id": 123456789,
  "name": "repository-name",
  "full_name": "owner/repository-name",
  "private": false,
  "html_url": "https://github.com/owner/repository-name",
  "description": "Repository description",
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-12-01T00:00:00Z",
  "pushed_at": "2023-12-01T00:00:00Z",
  "stargazers_count": 42,
  "forks_count": 5,
  "language": "JavaScript"
}
```

**Error Responses:**

**401 Unauthorized:**
```json
{
  "error": "Authorization header required"
}
```

**404 Not Found:**
```json
{
  "error": "Failed to fetch repository",
  "details": "GitHub API returned 404: Not Found"
}
```

**Example Request:**
```bash
curl -H "Authorization: Bearer gho_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
  "http://localhost:3001/api/github/repos/Shreyaa6/_tesseract-"
```

---

### 7. Generic GitHub API Proxy

**Endpoint:** `ALL /api/github/*`

**Description:** Proxies any GitHub API request to the GitHub API. Supports all HTTP methods and endpoints.

**Request Headers:**
```
Authorization: Bearer <github-access-token>
Content-Type: application/json (for non-GET requests)
```

**Usage:** Replace `https://api.github.com` with your server URL in any GitHub API call.

**Example Requests:**
```bash
# Get user profile
curl -H "Authorization: Bearer gho_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
  "http://localhost:3001/api/github/user"

# Get repository issues
curl -H "Authorization: Bearer gho_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
  "http://localhost:3001/api/github/repos/owner/repo/issues"

# Create a new issue (POST)
curl -X POST \
  -H "Authorization: Bearer gho_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{"title":"New Issue","body":"Issue description"}' \
  "http://localhost:3001/api/github/repos/owner/repo/issues"
```

---

### 8. Frontend Redirect (Catch-all)

**Endpoint:** `GET /*`

**Description:** Redirects all non-API routes to the React frontend application.

**Behavior:**
- API routes (`/api/*`) return 404 if not found
- All other routes redirect to frontend URL

**Response:** Redirects to `http://localhost:3000` + requested path

---

## OAuth Flow

### Complete Authentication Flow:

1. **User initiates login** on frontend
2. **Frontend redirects** to GitHub OAuth URL:
   ```
   https://github.com/login/oauth/authorize?client_id=Ov23lihegNLNB6NBAGet&redirect_uri=http://localhost:3001/login&scope=user
   ```
3. **User authorizes** the application on GitHub
4. **GitHub redirects** to callback URL:
   ```
   http://localhost:3001/login?code=abc123def456
   ```
5. **Server redirects** to frontend with code:
   ```
   http://localhost:3000/login?code=abc123def456
   ```
6. **Frontend sends code** to token exchange endpoint:
   ```bash
   POST /api/auth/github
   {"code": "abc123def456"}
   ```
7. **Server exchanges code** for access token with GitHub
8. **Server returns** access token to frontend:
   ```json
   {"access_token": "gho_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"}
   ```

## Configuration

### Current Configuration:
- **GitHub Client ID:** `Ov23lihegNLNB6NBAGet`
- **Client Secret:** Configured (hardcoded in server)
- **Redirect URI:** `http://localhost:3001/login`
- **Frontend URL:** `http://localhost:3000`
- **Server Port:** `3001`

### GitHub OAuth App Settings:
- **Authorization callback URL:** `http://localhost:3001/login`
- **Homepage URL:** `http://localhost:3000`

## Error Handling

The server includes comprehensive error handling:

- **Code validation:** Prevents empty or missing authorization codes
- **Duplicate prevention:** Prevents reuse of authorization codes
- **Configuration validation:** Ensures OAuth credentials are properly set
- **GitHub API errors:** Handles and forwards GitHub API error responses
- **Network errors:** Handles connection issues with GitHub API

## Security Features

- **Code deduplication:** Prevents authorization code reuse
- **Automatic cleanup:** Clears processed codes every 5 minutes
- **CORS support:** Configured for cross-origin requests
- **Input validation:** Validates all incoming requests
- **Error logging:** Comprehensive logging for debugging

## Rate Limiting

GitHub OAuth API has rate limits:
- **Unauthenticated requests:** 60 requests per hour per IP
- **Authenticated requests:** 5,000 requests per hour per user

## Testing

### Test OAuth Configuration:
```bash
curl http://localhost:3001/api/test-oauth
```

### Test Health Status:
```bash
curl http://localhost:3001/api/health
```

### Test Token Exchange (requires valid code):
```bash
curl -X POST http://localhost:3001/api/auth/github \
  -H "Content-Type: application/json" \
  -d '{"code": "your-authorization-code"}'
```

## Troubleshooting

### Common Issues:

1. **Port already in use:**
   ```bash
   lsof -ti:3001 | xargs kill
   ```

2. **GitHub OAuth not configured:**
   - Verify Client ID and Secret are set correctly
   - Check GitHub OAuth App settings

3. **CORS errors:**
   - Ensure frontend URL is correct
   - Check CORS configuration

4. **Invalid authorization code:**
   - Codes expire after 10 minutes
   - Codes can only be used once
   - Ensure code is from correct GitHub OAuth App

## Support

For issues or questions:
1. Check server logs for detailed error messages
2. Verify GitHub OAuth App configuration
3. Test endpoints using the provided curl examples
4. Ensure all required environment variables are set
