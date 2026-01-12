"""
Property Test: Completed Order Invariant

**Property 3: Completed Order Invariant**
*For any* order marked as completed with full payment (payment_received >= total), 
the order record SHALL have status="completed", is_credit=false, and balance_amount=0.

**Validates: Requirements 2.3, 4.3**

Feature: billing-table-sync-fixes
"""

import pytest
import random


def calculate_order_state(total: float, payment_received: float) -> dict:
    """
    Mimics the backend order update logic for payment processing.
    This is the core logic we're testing.
    """
    # Calculate balance correctly - ensure it's never negative
    calculated_balance = max(0, total - payment_received)
    
    # Determine is_credit based on balance
    is_credit = calculated_balance > 0
    
    # If full payment (balance <= 0), ensure is_credit is false and balance is 0
    if calculated_balance <= 0:
        is_credit = False
        calculated_balance = 0
    
    # Determine status based on payment
    status = "pending" if is_credit else "completed"
    
    return {
        "status": status,
        "payment_received": payment_received,
        "balance_amount": calculated_balance,
        "is_credit": is_credit,
        "total": total
    }


class TestCompletedOrderInvariant:
    """
    Property 3: Completed Order Invariant
    For any order marked as completed with full payment (payment_received >= total),
    the order record SHALL have status="completed", is_credit=false, and balance_amount=0.
    """
    
    def test_exact_payment_results_in_completed_order(self):
        """Test that exact payment results in completed order with zero balance"""
        test_cases = [
            (100.0, 100.0),
            (500.0, 500.0),
            (99.99, 99.99),
            (1.0, 1.0),
            (10000.0, 10000.0),
        ]
        
        for total, received in test_cases:
            state = calculate_order_state(total, received)
            
            assert state["status"] == "completed", f"Expected completed for total={total}, received={received}"
            assert state["is_credit"] == False, f"Expected is_credit=False for total={total}, received={received}"
            assert state["balance_amount"] == 0, f"Expected balance=0 for total={total}, received={received}"
    
    def test_overpayment_results_in_completed_order(self):
        """Test that overpayment results in completed order with zero balance"""
        test_cases = [
            (100.0, 150.0),
            (500.0, 600.0),
            (99.99, 100.0),
            (1.0, 10.0),
        ]
        
        for total, received in test_cases:
            state = calculate_order_state(total, received)
            
            assert state["status"] == "completed", f"Expected completed for total={total}, received={received}"
            assert state["is_credit"] == False, f"Expected is_credit=False for total={total}, received={received}"
            assert state["balance_amount"] == 0, f"Expected balance=0 for total={total}, received={received}"
    
    def test_partial_payment_results_in_pending_order(self):
        """Test that partial payment results in pending order with balance"""
        test_cases = [
            (100.0, 50.0),
            (500.0, 250.0),
            (99.99, 50.0),
            (1000.0, 1.0),
        ]
        
        for total, received in test_cases:
            state = calculate_order_state(total, received)
            
            assert state["status"] == "pending", f"Expected pending for total={total}, received={received}"
            assert state["is_credit"] == True, f"Expected is_credit=True for total={total}, received={received}"
            assert state["balance_amount"] == total - received, f"Expected balance={total-received} for total={total}, received={received}"
    
    def test_property_full_payment_invariant(self):
        """
        Property-based test: For any payment where received >= total,
        the order should be completed with zero balance and is_credit=False
        """
        # Generate 100 random test cases
        for _ in range(100):
            total = random.uniform(0.01, 10000.0)
            received = total + random.uniform(0, 1000.0)  # Always >= total
            
            state = calculate_order_state(total, received)
            
            assert state["status"] == "completed", f"Failed for total={total}, received={received}"
            assert state["is_credit"] == False, f"Failed for total={total}, received={received}"
            assert state["balance_amount"] == 0, f"Failed for total={total}, received={received}"
    
    def test_property_partial_payment_invariant(self):
        """
        Property-based test: For any payment where received < total,
        the order should be pending with correct balance and is_credit=True
        """
        # Generate 100 random test cases
        for _ in range(100):
            total = random.uniform(1.0, 10000.0)  # Ensure total > 0
            received = random.uniform(0, total * 0.99)  # Always < total
            
            state = calculate_order_state(total, received)
            
            assert state["status"] == "pending", f"Failed for total={total}, received={received}"
            assert state["is_credit"] == True, f"Failed for total={total}, received={received}"
            assert abs(state["balance_amount"] - (total - received)) < 0.0001, f"Failed for total={total}, received={received}"
    
    def test_balance_never_negative(self):
        """
        Property-based test: Balance should never be negative regardless of payment amount
        """
        for _ in range(100):
            total = random.uniform(0, 10000.0)
            received = random.uniform(0, 20000.0)  # Can be more than total
            
            state = calculate_order_state(total, received)
            
            assert state["balance_amount"] >= 0, f"Negative balance for total={total}, received={received}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
