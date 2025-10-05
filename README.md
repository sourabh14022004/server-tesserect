# GitHub OAuth Server

A Node.js Express server that handles GitHub OAuth authentication flow.

## Features

- GitHub OAuth 2.0 authentication
- Token exchange endpoint
- OAuth callback handling
- Health check endpoint
- CORS support
- Environment variable configuration
- Code deduplication to prevent duplicate processing

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

1. Copy the environment template:
   ```bash
   cp env.example .env
   ```

2. Edit `.env` file with your GitHub OAuth credentials:
   ```env
   PORT=3001
   GITHUB_CLIENT_ID=your-github-client-id
   GITHUB_CLIENT_SECRET=your-github-client-secret
   FRONTEND_URL=http://localhost:3000
   ```

### 3. GitHub OAuth App Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/applications/new)
2. Create a new OAuth App with:
   - **Application name**: Your app name
   - **Homepage URL**: `http://localhost:3000` (or your frontend URL)
   - **Authorization callback URL**: `http://localhost:3001/login` (your server URL + `/login`)
3. Copy the Client ID and Client Secret to your `.env` file

### 4. Run the Server

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

The server will start on port 3001 (or the port specified in your `.env` file).

## API Endpoints

### POST `/api/auth/github`
Exchanges GitHub authorization code for access token.

**Request Body:**
```json
{
  "code": "github-authorization-code"
}
```

**Response:**
```json
{
  "access_token": "github-access-token"
}
```

### GET `/login`
OAuth callback endpoint that handles GitHub redirects.

### GET `/api/health`
Health check endpoint.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "github_client_id": "your-client-id",
  "github_client_secret_configured": true
}
```

### GET `/api/test-oauth`
Test endpoint to verify OAuth configuration.

**Response:**
```json
{
  "client_id": "your-client-id",
  "client_secret_configured": true,
  "redirect_uri": "http://localhost:3000/login"
}
```

## OAuth Flow

1. User clicks "Login with GitHub" on your frontend
2. Frontend redirects to GitHub OAuth URL with your client ID
3. User authorizes your app on GitHub
4. GitHub redirects to `http://localhost:3001/login` with authorization code
5. Server redirects to frontend with the code
6. Frontend sends code to `/api/auth/github` endpoint
7. Server exchanges code for access token and returns it to frontend

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `GITHUB_CLIENT_ID` | GitHub OAuth Client ID | Required |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth Client Secret | Required |
| `FRONTEND_URL` | Frontend application URL | `http://localhost:3000` |
| `REACT_APP_GITHUB_CLIENT_ID` | Client ID for React app | Optional |

## Security Features

- Code deduplication prevents reuse of authorization codes
- Automatic cache cleanup every 5 minutes
- Comprehensive error handling and logging
- Environment variable validation

## Dependencies

- `express`: Web framework
- `cors`: Cross-origin resource sharing
- `node-fetch`: HTTP client for GitHub API
- `dotenv`: Environment variable loading
- `nodemon`: Development auto-restart (dev dependency)
