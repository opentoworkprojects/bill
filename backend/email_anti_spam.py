"""
Email Anti-Spam Configuration
Best practices to ensure emails don't go to spam
"""

# ============ DNS RECORDS FOR ANTI-SPAM ============

DNS_RECORDS = """
# Add these DNS records to your domain (billbytekot.in) to prevent spam

# 1. SPF Record (Sender Policy Framework)
# Authorizes GoDaddy to send emails on your behalf
Type: TXT
Name: @
Value: v=spf1 include:secureserver.net ~all
TTL: 1 Hour

# 2. DKIM Record (DomainKeys Identified Mail)
# Contact GoDaddy support to enable DKIM and get the record
# Or use SendGrid/Mailgun which provide DKIM automatically

# 3. DMARC Record (Domain-based Message Authentication)
# Tells email providers how to handle failed authentication
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:admin@billbytekot.in
TTL: 1 Hour

# 4. Reverse DNS (PTR Record)
# Automatically configured by GoDaddy/SendGrid/Mailgun
"""

# ============ EMAIL BEST PRACTICES ============

BEST_PRACTICES = """
✅ EMAIL CONTENT BEST PRACTICES:

1. AVOID SPAM TRIGGER WORDS:
   ❌ FREE, URGENT, ACT NOW, LIMITED TIME, CLICK HERE
   ✅ Use professional, clear language

2. PROPER HTML STRUCTURE:
   ✅ Valid HTML with proper DOCTYPE
   ✅ Include plain text version
   ✅ Responsive design
   ✅ Alt text for images

3. SENDER REPUTATION:
   ✅ Use consistent "From" name and email
   ✅ Include physical address in footer
   ✅ Add unsubscribe link (for marketing emails)
   ✅ Authenticate with SPF, DKIM, DMARC

4. CONTENT QUALITY:
   ✅ Personalize with user's name
   ✅ Clear subject lines (no ALL CAPS)
   ✅ Balanced text-to-image ratio
   ✅ No excessive links
   ✅ Professional formatting

5. SENDING PRACTICES:
   ✅ Warm up new email addresses gradually
   ✅ Don't send too many emails at once
   ✅ Monitor bounce rates
   ✅ Remove invalid email addresses
   ✅ Respect unsubscribe requests

6. TECHNICAL SETUP:
   ✅ Use TLS/SSL encryption
   ✅ Valid SSL certificate on domain
   ✅ Proper email headers
   ✅ Consistent sending IP address
"""

# ============ EMAIL RATE LIMITS ============

RATE_LIMITS = {
    "godaddy_smtp": {
        "hourly": 250,
        "daily": 500,
        "monthly": 10000
    },
    "sendgrid_free": {
        "daily": 100,
        "monthly": 3000
    },
    "sendgrid_essentials": {
        "daily": 1333,  # 40k/month
        "monthly": 40000
    },
    "mailgun_free": {
        "monthly": 5000
    },
    "aws_ses_free": {
        "monthly": 62000
    }
}

# ============ SPAM SCORE CHECKER ============

def check_spam_score(subject: str, content: str) -> dict:
    """
    Check email for spam triggers
    Returns spam score and suggestions
    """
    spam_words = [
        "free", "urgent", "act now", "limited time", "click here",
        "buy now", "order now", "special promotion", "winner",
        "congratulations", "you've won", "claim now", "risk-free",
        "money back", "guarantee", "no cost", "100% free"
    ]
    
    score = 0
    triggers = []
    
    # Check subject line
    subject_lower = subject.lower()
    if subject.isupper():
        score += 2
        triggers.append("Subject line is all caps")
    
    for word in spam_words:
        if word in subject_lower:
            score += 1
            triggers.append(f"Spam word in subject: '{word}'")
    
    # Check content
    content_lower = content.lower()
    for word in spam_words:
        if word in content_lower:
            score += 0.5
            triggers.append(f"Spam word in content: '{word}'")
    
    # Check for excessive exclamation marks
    if subject.count('!') > 1:
        score += 1
        triggers.append("Too many exclamation marks in subject")
    
    # Determine spam risk
    if score >= 5:
        risk = "HIGH"
    elif score >= 3:
        risk = "MEDIUM"
    elif score >= 1:
        risk = "LOW"
    else:
        risk = "SAFE"
    
    return {
        "score": score,
        "risk": risk,
        "triggers": triggers,
        "safe": score < 3
    }


# ============ EMAIL WARMUP SCHEDULE ============

WARMUP_SCHEDULE = """
📧 EMAIL WARMUP SCHEDULE (For New Email Addresses)

Day 1-2:   Send 10-20 emails/day
Day 3-5:   Send 30-50 emails/day
Day 6-10:  Send 75-100 emails/day
Day 11-15: Send 150-200 emails/day
Day 16-20: Send 250-300 emails/day
Day 21+:   Full volume

Tips:
- Start with engaged users (those who opened previous emails)
- Monitor bounce rates and spam complaints
- Gradually increase volume
- Maintain consistent sending patterns
"""

# ============ UNSUBSCRIBE MANAGEMENT ============

UNSUBSCRIBE_TEMPLATE = """
<div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
    <p style="font-size: 12px; color: #999;">
        Don't want to receive these emails? 
        <a href="https://billbytekot.in/unsubscribe?email={email}&token={token}" 
           style="color: #667eea;">Unsubscribe</a>
    </p>
    <p style="font-size: 11px; color: #999;">
        BillByteKOT, [Your Address], India
    </p>
</div>
"""

if __name__ == "__main__":
    # Test spam checker
    test_subject = "Welcome to BillByteKOT!"
    test_content = "Thank you for joining BillByteKOT. Get started with your free trial."
    
    result = check_spam_score(test_subject, test_content)
    print(f"Spam Score: {result['score']}")
    print(f"Risk Level: {result['risk']}")
    print(f"Safe to Send: {result['safe']}")
    if result['triggers']:
        print("Triggers:")
        for trigger in result['triggers']:
            print(f"  - {trigger}")
