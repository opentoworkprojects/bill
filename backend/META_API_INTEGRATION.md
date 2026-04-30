# WhatsApp Meta Business Manager API Integration

## Overview

This document describes the implementation of Task 3.2: Meta Business Manager API integration for WhatsApp template validation. This integration replaces name-pattern based template validation with actual Meta API verification to fix the core issue where templates are assumed UTILITY based on name patterns without Meta API verification.

## Implementation Details

### New Methods Added to WhatsAppCloudAPI Class

#### 1. `get_template_info(template_name, language_code)`
- Queries Meta Business Manager API for actual template categories and approval status
- Implements caching with TTL (24 hours by default) to minimize API calls
- Provides error handling with database fallback when Meta API is unavailable
- Returns comprehensive template information including category, status, and quality score

#### 2. `validate_template_category(template_name, language_code)`
- Validates template category using Meta API with fallback to cached data
- Replaces the old `_is_utility_template()` name-pattern validation
- Returns detailed validation results with source information (meta_api, cache, fallback)
- Provides specific error context for debugging

#### 3. `get_bill_template_name_validated()`
- Async version of `get_bill_template_name()` that uses Meta API validation
- Automatically overrides risky templates with safe alternatives
- Provides detailed logging of validation decisions

### Enhanced Error Handling

The error handling in `send_template_message()` now includes:
- Meta API validation context in error messages
- Specific root cause analysis for 24-hour window errors
- Template category and approval status information
- Validation source tracking (Meta API vs fallback)

### Caching Strategy

- **TTL-based caching**: Templates are cached for 24 hours by default
- **Graceful degradation**: Falls back to cached data when Meta API is unavailable
- **Database integration ready**: Placeholder methods for MongoDB integration
- **Smart refresh**: Only queries Meta API when cache is stale

### Backward Compatibility

All existing methods are preserved:
- `_is_utility_template()` - Original name-pattern validation (kept as fallback)
- `get_bill_template_name()` - Synchronous version for backward compatibility
- All existing error handling and retry logic

## Configuration

### Environment Variables

Add these environment variables for Meta API integration:

```bash
# Required for Meta API queries
WHATSAPP_BUSINESS_ACCOUNT_ID=your_waba_id

# Existing variables (still required)
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
```

### Template Cache TTL

The cache TTL can be adjusted by modifying the `TEMPLATE_CACHE_TTL_HOURS` constant in the WhatsAppCloudAPI class.

## Usage Examples

### Basic Template Validation

```python
from whatsapp_cloud_api import WhatsAppCloudAPI

api = WhatsAppCloudAPI()

# Validate template using Meta API
result = await api.validate_template_category("payment_receipt", "en_US")

if result["is_utility"]:
    print(f"Template can be sent outside 24h window")
else:
    print(f"Template requires 24h customer service window")
    print(f"Category: {result['category']}, Status: {result['status']}")
```

### Get Template Information

```python
# Get detailed template info from Meta API
template_info = await api.get_template_info("bill_confirmation", "en_US")

if template_info:
    print(f"Template: {template_info['template_name']}")
    print(f"Category: {template_info['meta_category']}")
    print(f"Status: {template_info['approval_status']}")
    print(f"Quality Score: {template_info['quality_score']}")
else:
    print("Template not found in Meta Business Manager")
```

### Send Messages with Meta API Validation

```python
# The send_template_message method now automatically uses Meta API validation
result = await api.send_template_message(
    to_phone="918051616835",
    template_name="payment_receipt",
    params=["John Doe", "INR 100.00", "ORD123"],
    language="en_US"
)
```

## Testing

Comprehensive test suite in `backend/tests/test_whatsapp_meta_api_integration.py`:

- **18 test cases** covering all functionality
- **Mock Meta API responses** for different scenarios
- **Error handling tests** with fallback validation
- **Caching behavior tests** with TTL validation
- **Integration tests** with existing WhatsApp functionality

Run tests:
```bash
python -m pytest backend/tests/test_whatsapp_meta_api_integration.py -v
```

## Benefits

1. **Accurate Template Validation**: Uses actual Meta approval status instead of name patterns
2. **Reduced API Failures**: Prevents 131047/131026 errors by validating templates before sending
3. **Better Error Context**: Provides specific guidance when template issues occur
4. **Performance Optimized**: Caching reduces Meta API calls during high-volume periods
5. **Robust Fallback**: Graceful degradation when Meta API is unavailable
6. **Backward Compatible**: Existing code continues to work without changes

## Migration Path

1. **Immediate**: The integration is backward compatible - existing code works unchanged
2. **Recommended**: Update receipt and status sending to use the new validated methods:
   - Replace `get_bill_template_name()` with `await get_bill_template_name_validated()`
   - Monitor logs for Meta API validation results
3. **Future**: Implement database caching for production environments

## Troubleshooting

### Common Issues

1. **Meta API Authentication**: Ensure `WHATSAPP_ACCESS_TOKEN` has template management permissions
2. **WABA ID Configuration**: Set `WHATSAPP_BUSINESS_ACCOUNT_ID` or ensure phone_number_id format is correct
3. **Template Not Found**: Verify template exists and is approved in Meta Business Manager
4. **Cache Issues**: Check database connectivity for template caching

### Debug Logging

The implementation includes extensive logging:
- Template validation results with source information
- Meta API call details and responses
- Cache hit/miss information
- Fallback activation reasons

Monitor logs for validation source:
- `meta_api`: Fresh data from Meta API
- `cache`: Using cached data within TTL
- `fallback`: Meta API returned no data, using cached fallback
- `emergency_fallback`: Meta API failed, using name-pattern validation