# Fix Digital Asset Links Redirect Error

## Error
```
ERROR_CODE_REDIRECT: Redirect encountered while fetching statements from 
https://billbytekot.in/.well-known/assetlinks.json
```

## Cause
Your website is redirecting the assetlinks.json request. Common causes:
1. HTTP → HTTPS redirect
2. Non-www → www redirect (or vice versa)
3. Trailing slash redirect
4. Hosting platform redirect rules

## Solution

### Step 1: Check Current Behavior

Test what happens when accessing the file:
```bash
curl -I https://billbytekot.in/.well-known/assetlinks.json
```

Look for:
- `HTTP/1.1 301` or `HTTP/1.1 302` = REDIRECT (BAD)
- `HTTP/1.1 200` = OK (GOOD)

### Step 2: Fix Based on Your Hosting

#### If Using Vercel:

Create `vercel.json` in frontend root:
```json
{
  "headers": [
    {
      "source": "/.well-known/assetlinks.json",
      "headers": [
        {
          "key": "Content-Type",
          "value": "application/json"
        },
        {
          "key": "Cache-Control",
          "value": "public, max-age=3600"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/.well-known/assetlinks.json",
      "destination": "/.well-known/assetlinks.json"
    }
  ]
}
```

#### If Using Netlify:

Create `netlify.toml` in root:
```toml
[[headers]]
  for = "/.well-known/assetlinks.json"
  [headers.values]
    Content-Type = "application/json"
    Cache-Control = "public, max-age=3600"

[[redirects]]
  from = "/.well-known/assetlinks.json"
  to = "/.well-known/assetlinks.json"
  status = 200
  force = true
```

#### If Using Apache (.htaccess):

Add to `.htaccess`:
```apache
<Files "assetlinks.json">
  Header set Content-Type "application/json"
  Header set Cache-Control "public, max-age=3600"
</Files>

# Prevent redirects for assetlinks
RewriteEngine On
RewriteCond %{REQUEST_URI} ^/.well-known/assetlinks.json$
RewriteRule ^ - [L]
```

#### If Using Nginx:

Add to nginx config:
```nginx
location /.well-known/assetlinks.json {
    add_header Content-Type application/json;
    add_header Cache-Control "public, max-age=3600";
    try_files $uri =404;
}
```

### Step 3: Ensure File is in Public Directory

Make sure the file structure is:
```
frontend/
  public/
    .well-known/
      assetlinks.json
```

### Step 4: Check Domain Configuration

The domain in your TWA manifest must match EXACTLY:
- If using `billbytekot.in` → assetlinks must be at `https://billbytekot.in/.well-known/assetlinks.json`
- If using `www.billbytekot.in` → assetlinks must be at `https://www.billbytekot.in/.well-known/assetlinks.json`

**Check your twa-manifest.json:**
```json
{
  "host": "billbytekot.in"  // Must match exactly
}
```

### Step 5: Test After Deploy

1. Deploy your changes
2. Test with curl:
   ```bash
   curl -I https://billbytekot.in/.well-known/assetlinks.json
   ```
   Should return `HTTP/1.1 200 OK` (no 301/302)

3. Test with Google's tool:
   ```
   https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://billbytekot.in&relation=delegate_permission/common.handle_all_urls
   ```

### Step 6: Common Issues

#### Issue: www vs non-www
If your site redirects `billbytekot.in` → `www.billbytekot.in`:

**Option A:** Update twa-manifest.json to use www:
```json
{
  "host": "www.billbytekot.in"
}
```
Then rebuild APK.

**Option B:** Configure hosting to NOT redirect for assetlinks.json

#### Issue: HTTPS redirect
Make sure assetlinks.json is accessible via HTTPS without redirect:
- ✅ Direct HTTPS: `https://billbytekot.in/.well-known/assetlinks.json`
- ❌ HTTP redirect: `http://billbytekot.in/.well-known/assetlinks.json` → redirects to HTTPS

#### Issue: Trailing slash
Some servers add/remove trailing slashes. Ensure:
- `https://billbytekot.in/.well-known/assetlinks.json` (no trailing slash)

## Quick Fix for Vercel

If you're using Vercel, add this to `frontend/vercel.json`:

```json
{
  "headers": [
    {
      "source": "/.well-known/assetlinks.json",
      "headers": [
        {
          "key": "Content-Type",
          "value": "application/json"
        }
      ]
    }
  ]
}
```

Then redeploy.

## Verification Checklist

- [ ] File exists at `frontend/public/.well-known/assetlinks.json`
- [ ] Domain in twa-manifest.json matches exactly (with or without www)
- [ ] No HTTP → HTTPS redirect for assetlinks.json
- [ ] No www redirect for assetlinks.json
- [ ] curl returns 200 OK (not 301/302)
- [ ] Google's verification tool shows no errors
- [ ] Content-Type is `application/json`

## After Fixing

1. Deploy website
2. Verify no redirects: `curl -I https://billbytekot.in/.well-known/assetlinks.json`
3. Uninstall old app
4. Rebuild APK: `cd frontend/billbytekot && bubblewrap build`
5. Install new APK
6. Wait 5-10 minutes
7. URL bar should disappear!

---

**Most Common Fix:** Add vercel.json or netlify.toml to prevent redirects
