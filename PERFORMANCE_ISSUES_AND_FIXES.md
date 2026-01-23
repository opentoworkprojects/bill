# 🔧 Common Performance Issues & Quick Fixes

## Problem #1: Slow Page Loads (>5 seconds)

### Symptoms
- Page takes 5-10 seconds to load
- Users see blank screen initially
- Multiple API calls happening sequentially

### Root Causes
1. Large bundle size (no code splitting)
2. Sequential API calls
3. No caching strategy
4. Unoptimized images
5. Heavy computations on main thread

### Quick Fixes

#### Fix 1A: Enable Code Splitting (5 min)
```javascript
// BEFORE: All routes in one chunk
import HomePage from './pages/HomePage'
import ReportsPage from './pages/ReportsPage'

// AFTER: Routes loaded on demand
const HomePage = lazy(() => import('./pages/HomePage'))
const ReportsPage = lazy(() => import('./pages/ReportsPage'))
```
**Impact:** 50% bundle reduction

#### Fix 1B: Parallel API Calls (10 min)
```javascript
// BEFORE: Sequential calls (3+ seconds)
const orders = await axios.get('/api/orders')
const menu = await axios.get('/api/menu')
const tables = await axios.get('/api/tables')

// AFTER: Parallel calls (1 second)
const [orders, menu, tables] = await Promise.all([
  axios.get('/api/orders'),
  axios.get('/api/menu'),
  axios.get('/api/tables')
])
```
**Impact:** 60-70% faster

#### Fix 1C: Add Caching (5 min)
```python
# Backend: Cache responses
from response_optimizer import CacheDecorator

@app.get("/api/menu")
@CacheDecorator.cache_response(ttl_seconds=1800)
async def get_menu():
    return menu_data
```
**Impact:** 95% faster on repeat visits

---

## Problem #2: Slow API Responses (>1 second)

### Symptoms
- Individual API calls take 1-3 seconds
- Database queries showing in server logs
- CPU usage spikes

### Root Causes
1. No database indexes
2. N+1 query problem
3. Fetching unnecessary data
4. No response compression
5. Full collection scans

### Quick Fixes

#### Fix 2A: Create Database Indexes (15 min)
```python
# In backend/query_optimizer.py - already provides recommendations
# Just apply to MongoDB Atlas

db.orders.createIndex({ organization_id: 1, created_at: -1 })
db.orders.createIndex({ table_number: 1, status: 1 })
db.menu_items.createIndex({ organization_id: 1, category: 1 })
```
**Impact:** 40-70% faster queries

#### Fix 2B: Add Pagination (10 min)
```python
# BEFORE: Loading all 10,000 orders
orders = db.orders.find({"org_id": org_id}).to_list(None)

# AFTER: Loading only 20 items
skip = (page - 1) * 20
orders = db.orders.find({"org_id": org_id}).skip(skip).limit(20).to_list(None)
```
**Impact:** 80% faster for large datasets

#### Fix 2C: Enable GZIP Compression (5 min)
```python
# In backend/server.py
from starlette.middleware.gzip import GZipMiddleware
app.add_middleware(GZipMiddleware, minimum_size=1000)
```
**Impact:** 60-70% smaller responses

---

## Problem #3: High Memory Usage / Memory Leaks

### Symptoms
- App becomes sluggish after use
- DevTools shows memory growing
- Browser crashes with large datasets
- Multiple instances of same data in memory

### Root Causes
1. DOM elements not removed
2. Event listeners not cleaned up
3. Large arrays not paginated
4. Components not unmounting properly
5. Global state not cleared

### Quick Fixes

#### Fix 3A: Virtual Scrolling for Large Lists (20 min)
```javascript
// BEFORE: Rendering 1000 DOM nodes
<div>
  {items.map(item => <Item key={item.id} {...item} />)}
</div>

// AFTER: Rendering only visible items
import { VirtualScroller } from './utils/frontendPerformanceOptimization'

<VirtualScroller
  items={items}
  itemHeight={60}
  containerHeight={600}
  renderItem={(item) => <Item {...item} />}
/>
```
**Impact:** 90% less memory for large lists

#### Fix 3B: Cleanup Event Listeners (10 min)
```javascript
// BEFORE: Memory leak
useEffect(() => {
  window.addEventListener('scroll', handleScroll)
  // Missing cleanup!
}, [])

// AFTER: Proper cleanup
useEffect(() => {
  window.addEventListener('scroll', handleScroll)
  return () => {
    window.removeEventListener('scroll', handleScroll)
  }
}, [])
```
**Impact:** Prevents memory leaks

#### Fix 3C: Use Pagination in Frontend (15 min)
```javascript
// BEFORE: Load all 10,000 items
setOrders(await fetchAllOrders())

// AFTER: Load in chunks
const [page, setPage] = useState(1)
setOrders(await fetchOrders({ page, page_size: 20 }))
```
**Impact:** 80% less memory usage

---

## Problem #4: Repeated API Calls (Same Endpoint Called Multiple Times)

### Symptoms
- Same endpoint called 3-4 times in quick succession
- Network tab shows duplicates
- Increased server load
- Slow perceived performance

### Root Causes
1. Missing request deduplication
2. Multiple components fetching same data
3. Parent + child components fetching
4. No caching strategy
5. Unnecessary re-renders triggering fetches

### Quick Fixes

#### Fix 4A: Request Deduplication (15 min)
```javascript
// In utils/apiClient.js
import { RequestDeduplicator } from './frontendPerformanceOptimization'

const deduplicator = new RequestDeduplicator()

export const optimizedAxios = {
  get: (url) => deduplicator.deduplicate(
    `GET:${url}`,
    () => axios.get(url)
  )
}

// Now multiple calls return same promise
const data1 = await optimizedAxios.get('/api/orders') // Makes request
const data2 = await optimizedAxios.get('/api/orders') // Returns same promise
```
**Impact:** 70% fewer API calls

#### Fix 4B: Add Caching Layer (10 min)
```javascript
import { expiringCache } from './utils/frontendPerformanceOptimization'

const cache = expiringCache

// In component
const fetchOrders = async () => {
  const cached = cache.get('orders-list')
  if (cached) return cached
  
  const data = await axios.get('/api/orders')
  cache.set('orders-list', data, 5 * 60) // 5 minute TTL
  return data
}
```
**Impact:** 90% faster second requests

#### Fix 4C: Use useMemo / useCallback (5 min)
```javascript
// BEFORE: Fetches on every render
function OrdersPage() {
  const handleFilter = (status) => {
    return orders.filter(o => o.status === status)
  }
  
  return <FilteredList items={handleFilter('completed')} />
}

// AFTER: Memoize to prevent unnecessary fetches
function OrdersPage() {
  const handleFilter = useCallback((status) => {
    return orders.filter(o => o.status === status)
  }, [orders])
  
  return <FilteredList items={handleFilter('completed')} />
}
```
**Impact:** 80% fewer unnecessary renders

---

## Problem #5: Slow Sorting/Filtering (on 1000+ items)

### Symptoms
- Sorting takes several seconds
- Filtering causes UI freeze
- Application becomes unresponsive
- Browser freezes during operations

### Root Causes
1. Sorting entire dataset in JavaScript
2. Filtering without indexing
3. Heavy computations on main thread
4. Large array operations
5. No memoization of expensive operations

### Quick Fixes

#### Fix 5A: Server-Side Sorting (10 min)
```javascript
// BEFORE: Fetch all, sort in JS
const orders = await axios.get('/api/orders')
setOrders(orders.sort((a, b) => b.date - a.date))

// AFTER: Server does sorting
const orders = await axios.get('/api/orders?sort_by=date&order=desc')
setOrders(orders)
```
**Impact:** 10x faster, offload from client

#### Fix 5B: Use Web Workers for Heavy Operations (20 min)
```javascript
// In utils/worker.js
self.onmessage = (e) => {
  const { data, operation } = e.data
  let result
  
  if (operation === 'sort') {
    result = data.sort((a, b) => b.value - a.value)
  }
  
  self.postMessage(result)
}

// In component
const worker = new Worker('/utils/worker.js')
worker.postMessage({ data: items, operation: 'sort' })
worker.onmessage = (e) => setItems(e.data)
```
**Impact:** No UI freeze during heavy operations

#### Fix 5C: Memoize Expensive Operations (5 min)
```javascript
// BEFORE: Recalculates every render
function OrdersPage({ orders }) {
  const expensiveCalc = orders.reduce((sum, o) => {
    // Complex calculation
    return sum + o.items.length * o.total
  }, 0)
  
  return <div>{expensiveCalc}</div>
}

// AFTER: Memoized
const expensiveCalc = useMemo(() => {
  return orders.reduce((sum, o) => {
    return sum + o.items.length * o.total
  }, 0)
}, [orders])
```
**Impact:** 80% fewer unnecessary calculations

---

## Problem #6: Large Image Files Slowing Down Pages

### Symptoms
- Pages load slowly with images
- Image files are MBs each
- Scrolling is laggy on pages with many images
- Mobile performance particularly bad

### Root Causes
1. Images not compressed
2. Loading all images immediately
3. High-resolution images for thumbnails
4. No image caching
5. Wrong image format

### Quick Fixes

#### Fix 6A: Lazy Load Images (15 min)
```javascript
// BEFORE: All images load immediately
<img src={imageUrl} alt="item" />

// AFTER: Load only when visible
import { lazyImageLoader } from '../utils/frontendPerformanceOptimization'

function Image({ src }) {
  const imgRef = useRef(null)
  
  useEffect(() => {
    lazyImageLoader.init()
    lazyImageLoader.observe(imgRef.current)
  }, [])
  
  return <img ref={imgRef} data-src={src} alt="item" />
}
```
**Impact:** 70% faster initial load

#### Fix 6B: Use Appropriate Image Sizes (10 min)
```javascript
// BEFORE: Loading 2MB image for 100px thumbnail
<img src="menu-item-2mb.jpg" style={{ width: '100px' }} />

// AFTER: Use appropriately sized image
<img src="menu-item-100px.jpg" alt="item" />
```
**Impact:** 90% smaller image files

#### Fix 6C: Compress Images (5 min per image)
```bash
# Use online tools or ImageMagick
convert large-image.jpg -resize 800x600 -quality 80 optimized.jpg

# Results:
# Before: 2.5MB
# After: 120KB (95% reduction)
```
**Impact:** Same visual quality, 95% smaller

---

## Problem #7: Network Issues / Slow Server

### Symptoms
- APIs take 3+ seconds from browser but <500ms locally
- Inconsistent response times
- Timeouts on slow networks
- Some regions slower than others

### Root Causes
1. Server in wrong region
2. No CDN for static assets
3. No connection pooling
4. Unoptimized database queries
5. Network congestion

### Quick Fixes

#### Fix 7A: Increase Request Timeout (2 min)
```javascript
// BEFORE: 10 second timeout
axios.defaults.timeout = 10000

// AFTER: 60 second timeout for Render free tier
axios.defaults.timeout = 60000
```
**Impact:** Prevent premature timeouts

#### Fix 7B: Add Retry Logic (10 min)
```javascript
import { withRetry } from './utils/frontendPerformanceOptimization'

// Retry failed requests with exponential backoff
const fetchOrdersWithRetry = withRetry(
  () => axios.get('/api/orders'),
  3, // max 3 retries
  1000 // 1 second base delay
)

const orders = await fetchOrdersWithRetry()
```
**Impact:** 70% fewer failed requests

#### Fix 7C: Prefetch Critical Resources (5 min)
```javascript
import { ResourcePrefetcher } from '../utils/frontendPerformanceOptimization'

useEffect(() => {
  // Prefetch DNS
  ResourcePrefetcher.prefetchDNS('billbytekot-backend.onrender.com')
  
  // Preconnect to server
  ResourcePrefetcher.preconnect('billbytekot-backend.onrender.com')
}, [])
```
**Impact:** 15-20% faster first request

---

## 🧪 Quick Diagnostics

### Check 1: Bundle Size
```bash
npm run build
# Check dist/ folder size
# Should be <200KB gzipped
```

### Check 2: API Response Times
```bash
curl -i https://billbytekot-backend.onrender.com/api/orders
# Look for response time header
# Should be <500ms
```

### Check 3: Cache Effectiveness
```bash
curl -i -H "Cache-Control: no-cache" https://billbytekot-backend.onrender.com/api/menu
# First request: 500-1000ms
# Second request: <100ms (cache hit)
```

### Check 4: Database Indexes
```
# MongoDB Atlas > Collections
# Should see indexes on:
# - orders (organization_id, created_at)
# - menu_items (organization_id, category)
```

### Check 5: Memory Usage
```javascript
// In browser console
performance.memory.usedJSHeapSize / 1048576 // MB
// Should be <50MB on first load
// Should stay <100MB with normal usage
```

---

## 📋 One-Time Setup Checklist

- [ ] Enable GZIP compression in backend
- [ ] Add database indexes
- [ ] Configure Redis caching
- [ ] Setup Service Worker
- [ ] Enable code splitting
- [ ] Configure response caching headers
- [ ] Setup performance monitoring
- [ ] Configure lazy image loading

**Total Time: 45 minutes | Impact: 40-50% improvement**

---

## 🔍 Continuous Monitoring

Track these metrics weekly:

```javascript
// Create a simple monitoring dashboard
{
  pageLoadTime: < 3s ✅
  apiResponseTime: < 500ms ✅
  cacheHitRate: > 70% ✅
  bundleSize: < 200KB ✅
  memoryUsage: < 100MB ✅
  concurrentUsers: > 500 ✅
  errorRate: < 1% ✅
}
```

---

## 💡 Pro Tips

1. **Profile Early**: Use Lighthouse before optimizing
2. **Measure Often**: Check metrics after each change
3. **Focus on P95**: Optimize for worst-case users
4. **Cache Wisely**: Different TTLs for different data
5. **Test on Slow Networks**: Use Chrome throttling
6. **Monitor Production**: Track real user metrics
7. **Optimize Progressively**: Don't try everything at once
8. **Involve Team**: Share metrics and celebrate wins

---

## ❓ When to Implement Each Fix

| Performance Issue | Severity | Fix Time | Priority |
|-------------------|----------|----------|----------|
| Page load > 5s | 🔴 Critical | 5-15 min | 1 |
| API response > 1s | 🔴 Critical | 10-20 min | 2 |
| Memory leak | 🟠 High | 10-30 min | 3 |
| Repeated API calls | 🟠 High | 15-20 min | 4 |
| Slow sorting | 🟡 Medium | 10-20 min | 5 |
| Large images | 🟡 Medium | 10-20 min | 6 |
| No offline support | 🔵 Low | 20-30 min | 7 |

---

**Next Steps:** Pick the top 2-3 problems affecting your app and apply the quick fixes!
