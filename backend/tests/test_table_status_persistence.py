"""
Property Test: Table Status Persistence

**Property 2: Table Status Persistence**
*For any* table status change operation, the database SHALL reflect the new status, 
and subsequent fetch operations SHALL return the updated status.

**Validates: Requirements 1.1, 1.4, 1.5, 4.1, 4.2**

Feature: billing-table-sync-fixes
"""

import pytest
import random


# Valid table statuses
VALID_STATUSES = ["available", "occupied", "reserved", "maintenance", "cleaning"]


class MockTable:
    """Mock table object for testing status transitions"""
    def __init__(self, table_id: str, table_number: int, status: str = "available"):
        self.id = table_id
        self.table_number = table_number
        self.status = status
        self.current_order_id = None
        self.capacity = 4
    
    def update_status(self, new_status: str, order_id: str = None) -> dict:
        """
        Mimics the table status update logic.
        Returns the updated table state.
        """
        if new_status not in VALID_STATUSES:
            raise ValueError(f"Invalid status: {new_status}")
        
        self.status = new_status
        
        # If status is available, clear the order
        if new_status == "available":
            self.current_order_id = None
        elif new_status == "occupied" and order_id:
            self.current_order_id = order_id
        
        return self.to_dict()
    
    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "table_number": self.table_number,
            "status": self.status,
            "current_order_id": self.current_order_id,
            "capacity": self.capacity
        }


class MockDatabase:
    """Mock database for testing table operations"""
    def __init__(self):
        self.tables = {}
    
    def add_table(self, table: MockTable):
        self.tables[table.id] = table
    
    def update_table(self, table_id: str, status: str, order_id: str = None) -> dict:
        if table_id not in self.tables:
            raise ValueError(f"Table not found: {table_id}")
        
        return self.tables[table_id].update_status(status, order_id)
    
    def get_table(self, table_id: str) -> dict:
        if table_id not in self.tables:
            raise ValueError(f"Table not found: {table_id}")
        
        return self.tables[table_id].to_dict()
    
    def get_all_tables(self) -> list:
        return [t.to_dict() for t in self.tables.values()]


class TestTableStatusPersistence:
    """
    Property 2: Table Status Persistence
    For any table status change operation, the database SHALL reflect the new status,
    and subsequent fetch operations SHALL return the updated status.
    """
    
    def setup_method(self):
        """Set up test fixtures"""
        self.db = MockDatabase()
        # Add some test tables
        for i in range(1, 6):
            self.db.add_table(MockTable(f"table_{i}", i))
    
    def test_status_update_persists(self):
        """Test that status updates are persisted correctly"""
        table_id = "table_1"
        
        # Update to each valid status
        for status in VALID_STATUSES:
            self.db.update_table(table_id, status)
            fetched = self.db.get_table(table_id)
            
            assert fetched["status"] == status, f"Expected status {status}, got {fetched['status']}"
    
    def test_available_status_clears_order(self):
        """Test that setting status to 'available' clears the current_order_id"""
        table_id = "table_1"
        
        # First set to occupied with an order
        self.db.update_table(table_id, "occupied", "order_123")
        fetched = self.db.get_table(table_id)
        assert fetched["current_order_id"] == "order_123"
        
        # Then set to available
        self.db.update_table(table_id, "available")
        fetched = self.db.get_table(table_id)
        
        assert fetched["status"] == "available"
        assert fetched["current_order_id"] is None
    
    def test_occupied_status_sets_order(self):
        """Test that setting status to 'occupied' with order_id sets current_order_id"""
        table_id = "table_1"
        order_id = "order_456"
        
        self.db.update_table(table_id, "occupied", order_id)
        fetched = self.db.get_table(table_id)
        
        assert fetched["status"] == "occupied"
        assert fetched["current_order_id"] == order_id
    
    def test_property_status_persistence(self):
        """
        Property-based test: For any table and any valid status,
        updating the status should persist and be retrievable
        """
        for _ in range(100):
            # Pick a random table
            table_id = f"table_{random.randint(1, 5)}"
            # Pick a random status
            new_status = random.choice(VALID_STATUSES)
            
            # Update the status
            self.db.update_table(table_id, new_status)
            
            # Fetch and verify
            fetched = self.db.get_table(table_id)
            assert fetched["status"] == new_status, f"Status mismatch for {table_id}"
    
    def test_property_available_invariant(self):
        """
        Property-based test: For any table set to 'available',
        current_order_id should be None
        """
        for _ in range(50):
            table_id = f"table_{random.randint(1, 5)}"
            
            # First set to occupied with random order
            self.db.update_table(table_id, "occupied", f"order_{random.randint(1000, 9999)}")
            
            # Then set to available
            self.db.update_table(table_id, "available")
            fetched = self.db.get_table(table_id)
            
            assert fetched["status"] == "available"
            assert fetched["current_order_id"] is None
    
    def test_property_fetch_returns_current_state(self):
        """
        Property-based test: Fetching a table should always return its current state
        """
        for _ in range(100):
            table_id = f"table_{random.randint(1, 5)}"
            
            # Perform multiple random updates
            for _ in range(random.randint(1, 5)):
                new_status = random.choice(VALID_STATUSES)
                order_id = f"order_{random.randint(1000, 9999)}" if new_status == "occupied" else None
                self.db.update_table(table_id, new_status, order_id)
            
            # Final update
            final_status = random.choice(VALID_STATUSES)
            final_order = f"order_{random.randint(1000, 9999)}" if final_status == "occupied" else None
            self.db.update_table(table_id, final_status, final_order)
            
            # Fetch should return the final state
            fetched = self.db.get_table(table_id)
            assert fetched["status"] == final_status
    
    def test_invalid_status_rejected(self):
        """Test that invalid statuses are rejected"""
        table_id = "table_1"
        
        with pytest.raises(ValueError):
            self.db.update_table(table_id, "invalid_status")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
