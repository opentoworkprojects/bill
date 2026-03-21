# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - High Concurrent Traffic Performance Degradation
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the system degrades under 50+ concurrent order creation requests
  - **Scoped PBT Approach**: Scope the property to the concrete failing case - 50 concurrent POST /api/orders requests with valid payloads
  - Create `backend/tests/test_high_traffic_bug_exploration.py` using pytest-asyncio and httpx AsyncClient
  - Use `asyncio.gather` to fire 50 concurrent order creation requests simultaneously against the running backend
  - Assert that all responses complete within 2000ms and return HTTP 200/201 (from Expected Behavior in design)
  - isBugCondition: `concurrentRequests > singleWorkerCapacity AND endpoint IN ['/api/orders/*'] AND responseTime > 2000ms`
  - Run test on UNFIXED code (workers=1, maxPoolSize=10, no request queue)
  - **EXPECTED OUTCOME**: Test FAILS with timeouts, 5xx errors, or response times >2s (proves the bug exists)
  - Document counterexamples found (e.g., "50 concurrent requests: 30 timeout, avg response 12s")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Normal Traffic Behavior Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Create `backend/tests/test_high_traffic_preservation.py` using Hypothesis for property-based testing
  - Observe on UNFIXED code: single order creation returns correct response structure, auth endpoints work, business logic is correct
  - Write property-based test: for all single requests (NOT isBugCondition), response matches expected schema and business logic
  - Use `hypothesis` strategies to generate varied valid order payloads (different items, quantities, table numbers)
  - Assert response structure, status codes, and data accuracy are preserved for non-concurrent requests
  - isBugCondition is FALSE when: single request, low concurrency (<5), non-order endpoints
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [x] 3. Fix for high-traffic performance degradation (6-phase implementation)

  - [x] 3.1 Phase 1 - Code reorganization into modular directory structure
    - Create `backend/api/`, `backend/api/routes/`, `backend/models/`, `backend/middleware/`, `backend/config/`, `backend/utils/`, `backend/workers/` directories
    - Add `__init__.py` to each new package directory
    - Move route handlers from `server.py` into `backend/api/routes/` (orders, menu, tables, auth, etc.)
    - Move Pydantic models from `server.py` into `backend/models/`
    - Move utility functions into `backend/utils/`
    - Update all imports to use relative package imports
    - Keep `main.py` and `server.py` (as app factory) in root with clean imports
    - _Bug_Condition: isBugCondition where 74+ loose files in root impede maintainability and optimization_
    - _Preservation: All existing API routes, models, and business logic must remain functionally identical_
    - _Requirements: 1.5, 2.5_

  - [x] 3.2 Phase 2 - Multi-worker configuration with Gunicorn + UvicornWorker
    - Create `backend/gunicorn_config.py` with `workers = (2 * multiprocessing.cpu_count()) + 1`
    - Set `worker_class = "uvicorn.workers.UvicornWorker"` for async ASGI support
    - Configure `timeout = 120`, `keepalive = 5`, `graceful_timeout = 30`
    - Update `backend/main.py` to support `ENVIRONMENT` switch: development uses single uvicorn with reload, production uses gunicorn
    - Add graceful shutdown signal handlers (SIGTERM, SIGINT)
    - Add `gunicorn` to `requirements.txt` if not present
    - _Bug_Condition: isBugCondition where workers=1 creates single-process bottleneck under concurrent load_
    - _Expected_Behavior: workers=(2*cpu_count)+1 processes handle concurrent requests in parallel_
    - _Requirements: 1.4, 2.4, 2.8_

  - [x] 3.3 Phase 3 - Connection pooling optimization
    - Update `backend/core/database.py`: increase `maxPoolSize` to 50, `minPoolSize` to 10, reduce `maxIdleTimeMS` to 30000
    - Create `backend/core/connection_pool.py` with pool health check, pool warming on startup, and metrics collection (active connections, wait queue size)
    - Integrate pool metrics with existing `backend/monitoring.py`
    - Add connection pool exhaustion warning logs
    - _Bug_Condition: isBugCondition where maxPoolSize=10 exhausts connections under 50+ concurrent requests_
    - _Expected_Behavior: maxPoolSize=50 with minPoolSize=10 warm connections handles concurrent DB operations_
    - _Requirements: 1.6, 2.6_

  - [x] 3.4 Phase 4 - Request queue management middleware
    - Create `backend/middleware/request_queue.py` with async priority queue (max size 1000)
    - Implement priority tiers: HIGH (order creation, payment), MEDIUM (order updates, table status), LOW (analytics, reports)
    - Add backpressure: return HTTP 503 with `Retry-After` header when queue is full
    - Add per-request timeout handling and queue wait time tracking
    - Register middleware in `server.py` app factory
    - Integrate queue metrics (size, wait time, processing time) with `monitoring.py`
    - _Bug_Condition: isBugCondition where no queue management causes uncontrolled concurrent DB writes_
    - _Expected_Behavior: Priority queue with backpressure controls flow and returns 503 on saturation_
    - _Requirements: 1.7, 2.7_

  - [x] 3.5 Phase 5 - Load balancing strategy
    - Verify Gunicorn worker preload (`preload_app = True`) to share application code across workers
    - Create `backend/config/load_balancer.py` documenting query routing strategy: writes to primary, reads with `ReadPreference.SECONDARY_PREFERRED`
    - Add `/health` endpoint in `server.py` for load balancer health checks (returns worker PID, uptime, queue depth)
    - Create `backend/config/nginx.conf.template` documenting Nginx reverse proxy configuration with upstream worker pool and rate limiting
    - _Bug_Condition: isBugCondition where single process receives all traffic with no distribution_
    - _Expected_Behavior: Gunicorn distributes requests across workers; DB reads routed to secondaries_
    - _Requirements: 1.8, 2.8_

  - [x] 3.6 Phase 6 - Performance optimization
    - Optimize order processing: use bulk inserts for order items, add projections to DB queries to fetch only needed fields
    - Implement Redis-backed distributed cache in `backend/utils/cache.py` replacing in-memory dict (use `REDIS_URL` from settings)
    - Add cache stampede prevention (probabilistic early expiration or lock-based)
    - Configure `max_requests = 1000` and `max_requests_jitter = 100` in gunicorn config to prevent memory bloat per worker
    - Add slow query logging (>100ms) and request latency percentile tracking (p50, p95, p99) in `monitoring.py`
    - _Bug_Condition: isBugCondition where memory leaks and unoptimized queries compound under high load_
    - _Expected_Behavior: Redis cache, bulk ops, and worker memory limits maintain stable performance_
    - _Preservation: Cache invalidation must preserve data accuracy; bulk ops must produce identical results to individual ops_
    - _Requirements: 1.6, 2.1, 2.2, 2.3, 3.4, 3.5_

  - [x] 3.7 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - High Concurrent Traffic Performance Degradation
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - Run `backend/tests/test_high_traffic_bug_exploration.py` against the fixed backend
    - **EXPECTED OUTCOME**: All 50 concurrent order creation requests complete within 2000ms with HTTP 200/201
    - Confirm no timeouts, no 5xx errors, and response times meet the <2s threshold
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6, 2.7, 2.8_

  - [x] 3.8 Verify preservation tests still pass
    - **Property 2: Preservation** - Normal Traffic Behavior Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run `backend/tests/test_high_traffic_preservation.py` against the fixed backend
    - **EXPECTED OUTCOME**: All property-based tests PASS (confirms no regressions in normal traffic behavior)
    - Confirm API response formats, business logic results, auth behavior, and data accuracy are unchanged
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [x] 4. Checkpoint - Ensure all tests pass
  - Run full test suite: `cd backend && python -m pytest tests/ -v`
  - Verify `test_high_traffic_bug_exploration.py` passes (bug fixed)
  - Verify `test_high_traffic_preservation.py` passes (no regressions)
  - Run a final load test with Locust or k6 to confirm p95 latency <500ms at 100 req/s
  - Confirm monitoring metrics are being collected (connection pool, queue depth, latency percentiles)
  - Ask the user if any questions arise before closing the spec
