# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Template Category Validation Failures
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Focus on concrete failing cases: templates assumed UTILITY but actually MARKETING in Meta
  - Test that sending template messages to recipients outside 24-hour window fails when templates are incorrectly categorized
  - Verify `_is_utility_template()` method assumptions vs actual Meta Business Manager API responses
  - Test phone number 8051616835 with "bill_confirmation" template (known failure case)
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS with 131047/131026 errors (this is correct - it proves the bug exists)
  - Document counterexamples found: templates with utility names but MARKETING category in Meta
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Existing Successful Message Delivery
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for successful message deliveries
  - Test messages within 24-hour customer service window (should continue working)
  - Test verified UTILITY templates that currently deliver successfully
  - Test retry logic for rate limits and transient failures
  - Write property-based tests capturing observed successful delivery patterns
  - Property-based testing generates many test cases for stronger preservation guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 3. Fix WhatsApp template validation and Meta API integration

  - [x] 3.1 Create database schema for template tracking
    - Create `WhatsAppTemplate` model in `backend/database_models.py`
    - Add fields: template_name, meta_category, approval_status, last_verified, created_at, updated_at
    - Create database migration for new table
    - Add unique constraint on template_name
    - _Bug_Condition: Templates assumed UTILITY based on name patterns without Meta API verification_
    - _Expected_Behavior: Database tracks actual Meta approval status and categories_
    - _Preservation: Existing database operations remain unchanged_
    - _Requirements: 2.1, 2.2_

  - [x] 3.2 Implement Meta Business Manager API integration
    - Add `get_template_info()` method to `WhatsAppCloudAPI` class
    - Integrate with Meta Graph API to query actual template categories and approval status
    - Implement template category caching with TTL to minimize API calls
    - Add error handling for Meta API failures with fallback to cached data
    - Store API responses in database for tracking and analysis
    - _Bug_Condition: No verification of actual template approval status from Meta_
    - _Expected_Behavior: Real-time validation against Meta Business Manager API_
    - _Preservation: Existing API methods and error handling remain unchanged_
    - _Requirements: 2.1, 2.2, 2.5_

  - [x] 3.3 Replace template category validation logic
    - Replace `_is_utility_template()` method with Meta API-based validation
    - Implement `validate_template_category()` method that queries Meta API first, falls back to cache
    - Add template approval status verification before message sending
    - Implement periodic sync job to update template statuses from Meta API
    - Add specific error messages for template category mismatches
    - _Bug_Condition: Name-pattern validation incorrectly assumes template categories_
    - _Expected_Behavior: Actual Meta approval status determines template usage_
    - _Preservation: Existing template validation interface remains compatible_
    - _Requirements: 1.2, 1.3, 2.1, 2.2, 2.5_

  - [x] 3.4 Enhance phone number normalization
    - Improve `clean_phone()` method for consistent formatting
    - Ensure phone number format matches storage format exactly
    - Add validation for edge cases in country code handling
    - Implement phone number format verification before message sending
    - Add unique indexing validation for phone number storage
    - _Bug_Condition: Inconsistent phone number normalization causing lookup failures_
    - _Expected_Behavior: Consistent phone number formatting between storage and delivery_
    - _Preservation: Existing phone number processing logic remains compatible_
    - _Requirements: 1.4, 1.6, 2.4, 2.6_

  - [x] 3.5 Implement enhanced error handling and fallback mechanisms
    - Add template category validation in error handling for 24-hour window failures
    - Implement fallback to verified UTILITY templates when available
    - Add specific guidance in error messages about template requirements
    - Enhance logging to include Meta API validation results
    - Add customer consent validation before business-initiated messages
    - _Bug_Condition: Generic error handling without template category context_
    - _Expected_Behavior: Specific error messages and fallback mechanisms for template issues_
    - _Preservation: Existing error classification and retry logic remain unchanged_
    - _Requirements: 1.5, 2.3, 2.5_

  - [x] 3.6 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Template Category Validation Success
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - Verify templates are correctly validated against Meta API
    - Confirm phone number 8051616835 can now receive properly categorized UTILITY templates
    - _Requirements: 2.1, 2.2, 2.4_

  - [x] 3.7 Verify preservation tests still pass
    - **Property 2: Preservation** - Existing Successful Message Delivery
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm messages within 24-hour window still work exactly as before
    - Confirm verified UTILITY templates continue to deliver successfully
    - Confirm retry logic and error handling remain unchanged for valid scenarios

- [x] 4. Checkpoint - Ensure all tests pass
  - Run complete test suite including bug condition and preservation tests
  - Verify Meta API integration works correctly with rate limiting
  - Confirm database schema migration completed successfully
  - Test template approval status synchronization
  - Validate phone number normalization consistency
  - Ensure all existing WhatsApp functionality remains intact
  - Ask the user if questions arise about template configuration or Meta API setup