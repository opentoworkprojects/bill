# WebSocket Backend Implementation Required

## Status
Frontend WebSocket integration is COMPLETE. Backend WebSocket endpoint needs to be implemented.

## What's Done (Frontend)
✅ WebSocket manager with auto-reconnect and heartbeat
✅ Request batcher for efficient API calls
✅ Hybrid sync manager combining WebSockets + batching
✅ OrdersPage integrated with WebSocket events
✅ MobileCounterSalePage integrated with WebSocket events
✅ Automatic fallback to polling when WebSocket unavailable

## What's Needed (Backend)

### 1. WebSocket Endpoint
Create WebSocket endpoint at `/ws` in your FastAPI backend:

```python
from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, Set
import json

# Connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
    
    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
    
    async def broadcast_to_user(self, user_id: str, message: dict):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except:
                    pass

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str):
    # Verify token and get user_id
    user_id = verify_token(token)  # Your auth function
    
    await manager.connect(websocket, user_id)
    
    try:
        while True:
            # Receive heartbeat pings
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
```

### 2. Broadcast Events
Add these broadcasts to your existing endpoints:

```python
# When order is created
await manager.broadcast_to_user(user_id, {
    "type": "order_created",
    "data": order_dict
})

# When order is updated
await manager.broadcast_to_user(user_id, {
    "type": "order_updated",
    "data": order_dict
})

# When order status changes
await manager.broadcast_to_user(user_id, {
    "type": "order_status_changed",
    "data": order_dict
})

# When WhatsApp is sent
await manager.broadcast_to_user(user_id, {
    "type": "whatsapp_sent",
    "data": order_id
})

# When payment is completed
await manager.broadcast_to_user(user_id, {
    "type": "payment_completed",
    "data": order_dict
})

# When table is updated
await manager.broadcast_to_user(user_id, {
    "type": "table_updated",
    "data": table_dict
})

# When menu is updated
await manager.broadcast_to_user(user_id, {
    "type": "menu_updated",
    "data": menu_items_list
})
```

### 3. Integration Points
Add broadcasts to these endpoints:
- `POST /api/orders` → broadcast `order_created`
- `PUT /api/orders/{id}` → broadcast `order_updated`
- `PUT /api/orders/{id}/status` → broadcast `order_status_changed`
- WhatsApp notification completion → broadcast `whatsapp_sent`
- Payment completion → broadcast `payment_completed`
- `PUT /api/tables/{id}` → broadcast `table_updated`
- `POST /api/menu`, `PUT /api/menu/{id}`, `DELETE /api/menu/{id}` → broadcast `menu_updated`

## Expected Impact
- **90-95% reduction in server load** (from 20-30 req/min to 0-2 req/min per user)
- **Instant updates** instead of 5-10 second polling delays
- **Better user experience** with real-time notifications
- **Automatic fallback** to polling if WebSocket fails

## Testing
1. Start backend with WebSocket endpoint
2. Open frontend - should see "WebSocket connected" in console
3. Create an order - should appear instantly without polling
4. Change order status - should update instantly
5. Stop backend - should see "WebSocket disconnected, using fallback polling"

## Current Behavior (Without Backend)
Frontend will automatically use fallback polling (10 second intervals) until backend WebSocket is available. Everything works, just not as efficiently.
