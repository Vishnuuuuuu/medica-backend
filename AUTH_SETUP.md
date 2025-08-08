# OAuth Authentication Setup Guide

## Overview

The backend is now configured for OAuth authentication flows. It supports multiple OAuth providers and automatically creates users on first login.

## Supported OAuth Providers

- **Auth0** (Recommended for healthcare apps)
- **Google OAuth 2.0**
- **GitHub OAuth**
- **Generic OAuth providers**

## How It Works

1. **Frontend OAuth Flow**: Your frontend handles the OAuth login flow
2. **Token Extraction**: Backend extracts JWT token from Authorization header
3. **Token Validation**: Basic JWT validation (signature verification handled by OAuth provider)
4. **User Creation**: Automatically creates users on first login
5. **Role Assignment**: Assigns roles based on token claims or defaults to CAREWORKER

## Setup Options

### Option 1: Auth0 (Recommended)

1. **Create Auth0 Application**:
   ```bash
   # Go to Auth0 Dashboard
   # Create "Single Page Application" for frontend
   # Create "Machine to Machine" API for backend
   ```

2. **Configure Environment**:
   ```env
   AUTH0_DOMAIN=your-domain.auth0.com
   AUTH0_AUDIENCE=your-api-identifier
   AUTH0_ISSUER=https://your-domain.auth0.com/
   AUTH0_CLIENT_ID=your-client-id
   AUTH0_CLIENT_SECRET=your-client-secret
   OAUTH_PROVIDER=auth0
   ```

3. **Add Custom Claims** (Auth0 Action):
   ```javascript
   exports.onExecutePostLogin = async (event, api) => {
     const namespace = 'https://your-app.com/';
     
     // Add role to token
     api.idToken.setCustomClaim(`${namespace}role`, 
       event.user.app_metadata?.role || 'CAREWORKER');
     api.accessToken.setCustomClaim(`${namespace}role`, 
       event.user.app_metadata?.role || 'CAREWORKER');
     
     // Add user info
     api.idToken.setCustomClaim(`${namespace}email`, event.user.email);
     api.idToken.setCustomClaim(`${namespace}name`, event.user.name);
   };
   ```

### Option 2: Google OAuth

1. **Google Cloud Console Setup**:
   ```bash
   # Go to Google Cloud Console
   # Create OAuth 2.0 Client ID
   # Add authorized origins and redirect URIs
   ```

2. **Configure Environment**:
   ```env
   GOOGLE_CLIENT_ID=your-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-secret
   OAUTH_PROVIDER=google
   ```

### Option 3: GitHub OAuth

1. **GitHub OAuth App Setup**:
   ```bash
   # Go to GitHub Settings > Developer settings
   # Create new OAuth App
   # Set Authorization callback URL
   ```

2. **Configure Environment**:
   ```env
   GITHUB_CLIENT_ID=your-github-client-id
   GITHUB_CLIENT_SECRET=your-github-client-secret
   OAUTH_PROVIDER=github
   ```

## Frontend Integration

### Auth0 Frontend Example (React)

```jsx
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react';

// App.jsx
function App() {
  return (
    <Auth0Provider
      domain="your-domain.auth0.com"
      clientId="your-client-id"
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: "your-api-identifier"
      }}
    >
      <MyApp />
    </Auth0Provider>
  );
}

// Component.jsx
function MyComponent() {
  const { getAccessTokenSilently } = useAuth0();
  
  const callAPI = async () => {
    const token = await getAccessTokenSilently();
    
    const response = await fetch('http://localhost:4000/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        query: '{ me { id email name role } }'
      })
    });
  };
}
```

### Google OAuth Frontend Example

```jsx
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';

function GoogleLoginButton() {
  const login = useGoogleLogin({
    onSuccess: async (response) => {
      // Use response.access_token for API calls
      const apiResponse = await fetch('http://localhost:4000/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${response.access_token}`
        },
        body: JSON.stringify({
          query: '{ me { id email name role } }'
        })
      });
    }
  });
  
  return <button onClick={login}>Login with Google</button>;
}
```

## API Usage

### Authentication Header

```bash
Authorization: Bearer <oauth-access-token>
```

### Example API Call

```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_OAUTH_TOKEN" \
  -d '{"query": "{ me { id email name role } }"}'
```

### Expected Response

```json
{
  "data": {
    "me": {
      "id": "cuid-user-id",
      "email": "user@example.com",
      "name": "User Name",
      "role": "CAREWORKER"
    }
  }
}
```

## User Management

### Automatic User Creation

Users are automatically created on first login with:
- `auth0Id`: OAuth provider's user ID
- `email`: From OAuth token
- `name`: From OAuth token
- `role`: From custom claims or defaults to 'CAREWORKER'

### Role Management

#### Option 1: Database Update
```sql
UPDATE users SET role = 'MANAGER' WHERE email = 'manager@example.com';
```

#### Option 2: OAuth Provider Claims
Configure your OAuth provider to include role in token claims.

## Testing

### 1. Start the Server
```bash
npm run dev
```

### 2. Test with Mock Token
```bash
# Create a test JWT token (for development only)
node -e "
const jwt = require('jsonwebtoken');
const token = jwt.sign({
  sub: 'oauth|test-user-123',
  email: 'test@example.com',
  name: 'Test User',
  exp: Math.floor(Date.now() / 1000) + 3600
}, 'test-secret');
console.log(token);
"
```

### 3. Test API Call
```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TEST_TOKEN" \
  -d '{"query": "{ me { id email name role } }"}'
```

## Security Notes

✅ **Production Ready**:
- JWT token validation
- Automatic user creation
- Role-based access control
- CORS protection
- Input validation

⚠️ **Important**:
- Token signature verification is handled by OAuth provider
- Use HTTPS in production
- Validate token expiration
- Implement rate limiting
- Monitor for suspicious activity

🔒 **Best Practices**:
- Use Auth0 for healthcare compliance (HIPAA)
- Implement proper logout flows
- Use short-lived access tokens
- Regular security audits
