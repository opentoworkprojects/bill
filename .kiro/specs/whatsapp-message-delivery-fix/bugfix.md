# Bugfix Requirements Document

## Introduction

WhatsApp message delivery is inconsistent across different phone numbers due to improper template category validation and phone number normalization issues. The system assumes templates are UTILITY category based on name patterns rather than verifying actual Meta approval status, leading to 24-hour window restriction errors (131047/131026) for some recipients while others succeed. Research reveals that Meta's template categorization is strict: any template with mixed utility + marketing content gets classified as MARKETING, requiring the 24-hour customer service window. The current implementation lacks proper validation of template approval status via Meta's API and has inconsistent phone number normalization that may cause lookup failures.

## Bug Analysis

### Technical Context and Root Cause Analysis

**Meta Template Categories (Official Guidelines):**
- **UTILITY**: Functional, transactional messages (order updates, receipts, confirmations) - can be sent outside 24-hour window
- **MARKETING**: Promotional content, offers, general business updates - requires 24-hour customer service window  
- **AUTHENTICATION**: OTP codes, verification - most restricted category
- **Critical Rule**: Any template with mixed utility + marketing content gets classified as MARKETING by Meta

**24-Hour Customer Service Window Rules:**
- Window opens when customer sends ANY message to business
- Within window: All message types are free (templates + free-form messages)
- Outside window: Only approved UTILITY templates can be sent
- UTILITY templates sent within window are FREE (as of July 2025)
- UTILITY templates sent outside window are charged but ALLOWED

**Current Implementation Issues Identified:**
- `_is_utility_template()` method only checks template NAME patterns, not actual Meta approval status
- No verification that templates are actually approved as UTILITY category in Meta Business Manager
- Two different phone normalization approaches with potential inconsistencies
- No template approval status tracking or validation via Meta API
- Missing fallback mechanisms when template delivery fails
- Phone number indexing may not be unique, causing lookup issues
- No validation of customer consent before sending business-initiated messages

**Root Cause of Phone 835 vs 921 Inconsistency:**
- Phone 921 may have active conversation (within 24-hour window) while 835 doesn't
- Templates may not actually be UTILITY category in Meta despite code assumptions
- Phone number format inconsistencies between storage and send time
- No verification that templates are properly approved in Meta Business Manager

### Current Behavior (Defect)

1.1 WHEN sending template messages to phone number 8051616835 (835) THEN the system fails with 24-hour window restriction errors (131047/131026) despite assuming templates are UTILITY category

1.2 WHEN the system checks template category using `_is_utility_template()` method THEN it only validates template NAME patterns instead of actual Meta approval status from Business Manager

1.3 WHEN templates contain mixed utility + marketing content THEN Meta classifies them as MARKETING category but the system incorrectly assumes UTILITY based on name patterns

1.4 WHEN phone numbers are normalized using `clean_phone()` method THEN inconsistent formatting may cause recipient lookup failures between storage and send time

1.5 WHEN template delivery fails with 24-hour window errors THEN the system logs the error but does not validate actual template approval status or attempt proper UTILITY template fallback

1.6 WHEN phone number indexing occurs THEN non-unique phone number storage could cause incorrect recipient targeting

### Expected Behavior (Correct)

2.1 WHEN sending template messages to any phone number using verified UTILITY templates THEN the system SHALL deliver messages successfully without 24-hour window restrictions

2.2 WHEN the system validates template category THEN it SHALL verify actual Meta approval status via Meta Business Manager API instead of relying on name patterns

2.3 WHEN templates are classified by Meta as MARKETING category THEN the system SHALL only send them within the 24-hour customer service window and provide clear error messages when outside the window

2.4 WHEN phone numbers are normalized THEN the system SHALL use consistent formatting that matches the storage format to prevent lookup failures

2.5 WHEN template delivery fails with window restriction errors THEN the system SHALL validate the template's actual Meta approval status and provide specific guidance on template category requirements

2.6 WHEN storing and retrieving phone numbers THEN the system SHALL ensure unique indexing to prevent incorrect recipient targeting

### Unchanged Behavior (Regression Prevention)

3.1 WHEN sending messages to phone numbers that currently receive messages successfully THEN the system SHALL CONTINUE TO deliver messages without any degradation

3.2 WHEN using verified UTILITY templates within the 24-hour customer service window THEN the system SHALL CONTINUE TO deliver messages as free transactions (as of July 2025)

3.3 WHEN template validation and error classification logic processes valid templates THEN the system SHALL CONTINUE TO correctly identify template categories and error types

3.4 WHEN retry logic handles rate limits and transient failures THEN the system SHALL CONTINUE TO retry appropriately without affecting permanent failure handling

3.5 WHEN customers have active conversations (within 24-hour window) THEN the system SHALL CONTINUE TO send both templates and free-form messages successfully

3.6 WHEN processing customer consent and opt-in status THEN the system SHALL CONTINUE TO respect existing consent validation logic