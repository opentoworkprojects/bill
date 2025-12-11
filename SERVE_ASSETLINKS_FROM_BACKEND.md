# Serve assetlinks.json from Backend

## What I Did

Added an endpoint to your backend to serve assetlinks.json:

```python
@app.get("/.well-known/assetlinks.json")
async def get_assetlinks():
    # Returns the assetlinks JSON
```

## How to Make It Work

### Option 1: Proxy from Frontend (RECOMMENDED)

Update `frontend/vercel.json` to proxy the request to your backend:

```json
{
  "rewrites": [
    {
      "source": "/.well-known/assetlinks.json",
      "destination": "https://your-backend.onrender.com/.well-known/assetlinks.json"
    }
  ]
}
```

Replace `your-backend.onrender.com` with your actual backend URL.

### Option 2: Use Backend Domain Directly

If your backend has a custom domain (like `api.billbytekot.in`), update TWA manifest:

```json
{
  "host": "api.billbytekot.in"
}
```

But this means your app will open the API, not the website (NOT RECOMMENDED).

### Option 3: CORS Proxy (Current Setup)

The backend now serves assetlinks.json with CORS headers. You can:

1. Deploy backend
2. Test: `curl https://your-backend.onrender.com/.well-known/assetlinks.json`
3. Add rewrite rule in Vercel to proxy to backend

## Next Steps

1. **Find your backend URL** (check Render dashboard)
2. **Update vercel.json** with the proxy rule
3. **Deploy frontend**
4. **Test**: `curl -I https://billbytekot.in/.well-known/assetlinks.json`
5. **Rebuild APK**

## What's Your Backend URL?

Check your Render dashboard for the backend URL, then I'll update the vercel.json for you.
