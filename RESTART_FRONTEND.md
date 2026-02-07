# ✅ Fix Applied - Restart Required

## Changes Made:
1. ✅ Added `import { useNavigate } from 'react-router-dom';`
2. ✅ Added `const navigate = useNavigate();` hook
3. ✅ Changed `window.open('/tables', '_blank')` to `navigate('/tables')`

## Next Step - RESTART FRONTEND:

### Option 1: If running with npm/yarn
```bash
# Stop the current server (Ctrl+C)
# Then restart:
cd frontend
npm start
```

### Option 2: If running with build
```bash
cd frontend
npm run build
```

### Option 3: Quick restart
1. Press `Ctrl+C` in your terminal running the frontend
2. Run `npm start` again

## After Restart:
1. Go to Orders page
2. Click "New Order"
3. Click "Create New Table" button
4. Should navigate smoothly without Windows dialog

---
**Important**: The code changes are saved, but React needs to reload to apply them. Please restart your frontend server now.
