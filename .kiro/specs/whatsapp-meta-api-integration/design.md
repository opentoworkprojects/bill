# WhatsApp Meta API Integration Bugfix Design

## Overview

This design addresses WhatsApp message delivery inconsistencies by replacing name-pattern-based template validation with actual Meta Business Manager API validation. The fix ensures only verified UTILITY templates are used for business-initiated messages outside the 24-hour customer service window, implements proper phone number normalization, and provides robust error handling with fallback mechanisms.

## Glossary

- **Bug_Condition (C)**: Template delivery failures due to incorrect category validation and phone number normalization issues
- **Property (P)**: Successful message delivery using verified UTILITY templates with proper phone number handling
- **Preservation**: Existing successful message delivery patterns and retry logic that must remain unchanged
- **_is_utility_template()**: The current method in `backend/whatsapp_cloud_api.py` that validates template category using name patterns only
- **Meta Business Manager API**: Facebook's Graph API for retrieving actual template approval status and category information
- **24-hour Customer Service Window**: Meta's policy allowing free-form messages only within 24 hours of customer-initiated contact
- **UTILITY Template**: Meta-approved template category for transactional messages (receipts, order updates) that can be sent outside the 24-hour window
- **MARKETING Template**: Meta template category requiring 24-hour customer service window for delivery

## Bug Details

### Bug Condition

The bug manifests when the system attempts to send template messages to recipients outside the 24-hour customer service window using templates that are not actually approved as UTILITY category by Meta, despite the code assuming they are based on name patterns.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type TemplateMessageRequest
  OUTPUT: boolean
  
  RETURN input.template_name IN assumed_utility_templates
         AND actual_meta_category(input.template_name) != "UTILITY"
         AND recipient_outside_24h_window(input.to_phone)
         AND delivery_fails_with_window_restriction_error()
END FUNCTION
```

### Examples

- **Phone 8051616835**: Template "bill_confirmation" fails with error 131047 because Meta classifies it as MARKETING due to mixed content, but code assumes UTILITY based on name pattern
- **Phone normalization**: Phone stored as "+91 8051616835" but sent as "918051616835" causing recipient lookup failures
- **Template validation**: System sends "order_ready" template assuming UTILITY category without verifying actual Meta approval status
- **Edge case**: Template approved as UTILITY in Meta but contains promotional footer, causing inconsistent delivery based on Meta's content analysis

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Messages to recipients within 24-hour customer service window must continue to work exactly as before
- Verified UTILITY templates that currently deliver successfully must remain unaffected
- Retry logic for rate limits and transient failures must continue to function properly
- Error classification and logging mechanisms must remain unchanged for valid scenarios

**Scope:**
All template messages that currently deliver successfully should be completely unaffected by this fix. This includes:
- Messages sent within the 24-hour customer service window
- Templates that are actually approved as UTILITY category in Meta
- Phone numbers with consistent normalization between storage and delivery
- Existing retry and error handling for legitimate failures

## Hypothesized Root Cause

Based on the bug description and code analysis, the most likely issues are:

1. **Incorrect Template Category Validation**: The `_is_utility_template()` method only checks name patterns instead of actual Meta approval status
   - Method assumes templates with "bill", "order", "receipt" patterns are UTILITY
   - Meta may classify templates as MARKETING if they contain any promotional content
   - No verification against Meta Business Manager API for actual approval status

2. **Phone Number Normalization Inconsistencies**: The `clean_phone()` method may not match storage format
   - Different normalization between storage and send time
   - Potential issues with country code handling for edge cases

3. **Missing Meta API Integration**: No integration with Meta's Graph API to validate template status
   - Cannot verify actual template category from Meta Business Manager
   - No tracking of template approval status changes over time

4. **Insufficient Error Context**: When 24-hour window errors occur, no validation of actual template category
   - System assumes template category issue without verification
   - Missing guidance on proper UTILITY template requirements

## Correctness Properties

Property 1: Bug Condition - Meta API Template Validation

_For any_ template message request where the template is assumed to be UTILITY category based on name patterns, the fixed system SHALL verify the actual template category via Meta Business Manager API and only send messages using templates that are genuinely approved as UTILITY category by Meta.

**Validates: Requirements 2.1, 2.2**

Property 2: Preservation - Existing Successful Delivery Patterns

_For any_ template message that currently delivers successfully (within 24-hour window or using verified UTILITY templates), the fixed system SHALL produce exactly the same delivery behavior as the original system, preserving all existing successful message flows and retry logic.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `backend/whatsapp_cloud_api.py`

**Function**: `WhatsAppCloudAPI` class

**Specific Changes**:
1. **Meta Business Manager API Integration**: Add methods to query actual template approval status
   - Implement `get_template_info()` method using Meta Graph API
   - Add template category caching with TTL to avoid excessive API calls
   - Store template approval status in database for tracking

2. **Replace _is_utility_template() Method**: Replace name-pattern validation with Meta API validation
   - Query Meta Business Manager API for actual template category
   - Cache results to minimize API calls during high-volume periods
   - Fallback to name patterns only if Meta API is unavailable

3. **Enhanced Phone Number Normalization**: Improve `clean_phone()` method consistency
   - Ensure consistent formatting between storage and delivery
   - Add validation for edge cases in country code handling
   - Implement phone number format verification before sending

4. **Template Approval Status Database Schema**: Add database tracking for template status
   - Create `whatsapp_templates` table with approval status, category, last_verified fields
   - Implement periodic sync with Meta API to detect approval status changes
   - Add template validation before message sending

5. **Enhanced Error Handling and Fallback**: Improve error context and recovery mechanisms
   - When 24-hour window errors occur, validate actual template category via Meta API
   - Provide specific guidance on template requirements in error messages
   - Implement fallback to verified UTILITY templates when available

**File**: `backend/database_models.py` (new)

**New Database Schema**:
```python
class WhatsAppTemplate(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    template_name = db.Column(db.String(100), unique=True, nullable=False)
    meta_category = db.Column(db.String(20), nullable=True)  # UTILITY, MARKETING, AUTHENTICATION
    approval_status = db.Column(db.String(20), nullable=True)  # APPROVED, PENDING, REJECTED
    last_verified = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that simulate template message sending to recipients outside the 24-hour window using templates with different Meta approval statuses. Run these tests on the UNFIXED code to observe failures and understand the root cause.

**Test Cases**:
1. **Template Category Mismatch Test**: Send "bill_confirmation" template to phone 8051616835 (will fail on unfixed code with 131047 error)
2. **Meta API Validation Test**: Query Meta Business Manager API for actual template categories vs. name-pattern assumptions (will show discrepancies on unfixed code)
3. **Phone Normalization Test**: Send messages using different phone number formats to same recipient (may fail on unfixed code due to lookup issues)
4. **Mixed Content Template Test**: Test templates with utility + marketing content to verify Meta classification (will show MARKETING category despite utility name patterns)

**Expected Counterexamples**:
- Templates assumed to be UTILITY based on names are actually classified as MARKETING by Meta
- Possible causes: mixed content in templates, Meta's strict categorization rules, lack of Meta API validation

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := send_template_message_fixed(input)
  ASSERT successful_delivery_with_verified_utility_template(result)
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT send_template_message_original(input) = send_template_message_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for successful message deliveries, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Within-Window Message Preservation**: Verify messages sent within 24-hour customer service window continue to work exactly as before
2. **Verified UTILITY Template Preservation**: Verify templates that are actually approved as UTILITY by Meta continue to deliver successfully
3. **Retry Logic Preservation**: Verify retry mechanisms for rate limits and transient failures continue working
4. **Error Classification Preservation**: Verify error handling and classification logic continues to work for legitimate failures

### Unit Tests

- Test Meta Business Manager API integration for template category retrieval
- Test enhanced phone number normalization with edge cases
- Test template approval status database operations and caching
- Test error handling improvements with specific template validation scenarios

### Property-Based Tests

- Generate random template names and verify Meta API validation vs. name-pattern assumptions
- Generate random phone number formats and verify consistent normalization
- Test template message delivery across many recipient scenarios with different window statuses
- Verify preservation of existing successful delivery patterns across various input combinations

### Integration Tests

- Test full message delivery flow with Meta API template validation
- Test template approval status synchronization with Meta Business Manager
- Test fallback mechanisms when Meta API is unavailable
- Test database schema integration with existing WhatsApp message workflows