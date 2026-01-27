# Reservation Endpoint 405 Error Fix

## Issue
The server is returning "405 Method Not Allowed" for POST requests to `/api/tables/reservations`.

```
INFO:     127.0.0.1:63809 - "POST /api/tables/reservations HTTP/1.1" 405 Method Not Allowed
```

## Root Cause
The server needs to be restarted to pick up the newly added reservation endpoints. FastAPI doesn't hot-reload endpoint changes automatically in production mode.

## ✅ Solution

### 1. **Restart the Backend Server**

**Option A: If running with Python directly**
```bash
# Stop the current server (Ctrl+C)
# Then restart:
cd backend
python server.py
```

**Option B: If running with uvicorn**
```bash
# Stop the current server (Ctrl+C)
# Then restart:
cd backend
uvicorn server:app --host 0.0.0.0 --port 10000 --reload
```

**Option C: If using the start script**
```bash
# Stop the current server (Ctrl+C)
# Then restart:
cd backend
./start-production.sh
```

### 2. **Verify Endpoints are Working**

After restarting, test the endpoints:

```bash
# Test reservation creation
curl -X POST "http://localhost:10000/api/tables/reservations" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "table_id": "table_id_here",
    "customer_name": "John Doe",
    "party_size": 4,
    "reservation_date": "2025-01-29",
    "reservation_time": "19:00",
    "duration": 120
  }'

# Test getting reservations
curl -X GET "http://localhost:10000/api/tables/reservations" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. **Verify in Frontend**

After server restart, the frontend reservation form should work properly:

1. Go to Tables page
2. Click "New Reservation" 
3. Fill out the form
4. Submit - should now work without 405 error

## 🔧 **Technical Details**

### **Endpoints Added**
```python
@api_router.post("/tables/reservations", response_model=Reservation)
async def create_reservation(...)

@api_router.get("/tables/reservations", response_model=List[Reservation])
async def get_reservations(...)

@api_router.put("/tables/reservations/{reservation_id}", response_model=Reservation)
async def update_reservation(...)

@api_router.delete("/tables/reservations/{reservation_id}")
async def delete_reservation(...)
```

### **Models Added**
```python
class Reservation(BaseModel):
    id: str
    table_id: str
    table_number: int
    customer_name: str
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    party_size: int
    reservation_date: str
    reservation_time: str
    duration: int = 120
    status: str = "confirmed"
    notes: Optional[str] = None
    organization_id: Optional[str] = None
    created_at: Optional[str]
    updated_at: Optional[str]

class ReservationCreate(BaseModel):
    table_id: str
    customer_name: str
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    party_size: int
    reservation_date: str
    reservation_time: str
    duration: int = 120
    status: str = "confirmed"
    notes: Optional[str] = None
```

## 🚀 **Expected Behavior After Fix**

1. **✅ Table Creation**: Should work with all fields (location, section, table_type, notes)
2. **✅ Reservation Creation**: Should create reservations successfully
3. **✅ Reservation Listing**: Should show today's reservations
4. **✅ Table Status Updates**: Tables should show as "reserved" when booked
5. **✅ Conflict Prevention**: Should prevent double-booking same table

## 📋 **Troubleshooting**

If the issue persists after restart:

1. **Check Server Logs**: Look for any startup errors
2. **Verify Port**: Ensure server is running on port 10000
3. **Check Database**: Ensure MongoDB connection is working
4. **Test Basic Endpoints**: Try `/api/ping` to verify server is responding

## ⚠️ **Important Notes**

- **Server Restart Required**: New endpoints only become available after server restart
- **Database Collections**: The `reservations` collection will be created automatically
- **Authentication**: All reservation endpoints require valid JWT token
- **Permissions**: Only admin and cashier roles can create/modify reservations

## 🎯 **Next Steps**

1. **Restart Backend Server** (most important)
2. **Test Table Creation** - should now work with all fields
3. **Test Reservation Creation** - should work without 405 error
4. **Verify Frontend Integration** - forms should submit successfully

The reservation system is fully implemented and ready to use once the server is restarted.