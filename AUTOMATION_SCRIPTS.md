# 🤖 MARKETING AUTOMATION SCRIPTS

## 📧 Email Automation Setup

### Using SendGrid/Mailchimp

```python
# email_automation.py
import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

class EmailAutomation:
    def __init__(self):
        self.sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
    
    def send_welcome_email(self, to_email, name):
        """Send welcome email to new signups"""
        message = Mail(
            from_email='support@billbytekot.in',
            to_emails=to_email,
            subject='Welcome to BillByteKOT! 🎉',
            html_content=f'''
            <h1>Welcome {name}!</h1>
            <p>You've just joined 500+ smart restaurant owners.</p>
            
            <h2>Quick Start (5 minutes):</h2>
            <ol>
                <li><a href="https://billbytekot.in/dashboard">Complete your profile</a></li>
                <li><a href="https://billbytekot.in/menu">Add your first menu item</a></li>
                <li><a href="https://billbytekot.in/billing">Print your first bill</a></li>
            </ol>
            
            <p><a href="https://billbytekot.in/tutorial">Watch Quick Start Video</a></p>
            
            <p>Need help? Reply to this email!</p>
            
            <p>Best regards,<br>The BillByteKOT Team</p>
            '''
        )
        
        try:
            response = self.sg.send(message)
            return response.status_code
        except Exception as e:
            print(f"Error: {e}")
            return None
    
    def send_feature_discovery_email(self, to_email, name, days_since_signup):
        """Send feature discovery email after 3 days"""
        if days_since_signup == 3:
            message = Mail(
                from_email='support@billbytekot.in',
                to_emails=to_email,
                subject='You\'re missing out on these features 😮',
                html_content=f'''
                <h1>Hi {name},</h1>
                <p>I noticed you haven't explored these powerful features yet:</p>
                
                <h2>Top 5 Features You Should Try:</h2>
                <ul>
                    <li><strong>WhatsApp Bills</strong> - Send bills directly to customers</li>
                    <li><strong>KOT System</strong> - Orders go directly to kitchen</li>
                    <li><strong>Inventory Tracking</strong> - Never run out of ingredients</li>
                    <li><strong>Sales Reports</strong> - See what's selling</li>
                    <li><strong>Staff Management</strong> - Track performance</li>
                </ul>
                
                <p><a href="https://billbytekot.in/features">Explore Features</a></p>
                
                <p>Want a personalized demo? <a href="https://calendly.com/billbytekot">Book a call</a></p>
                '''
            )
            self.sg.send(message)
    
    def send_upgrade_email(self, to_email, name, bills_used):
        """Send upgrade email when approaching limit"""
        if bills_used >= 45:  # 90% of free limit
            message = Mail(
                from_email='support@billbytekot.in',
                to_emails=to_email,
                subject='You\'re almost at your free limit! 📊',
                html_content=f'''
                <h1>Hi {name},</h1>
                <p>You've used {bills_used}/50 free bills this month. Great job! 🎉</p>
                
                <h2>Upgrade to Premium (₹499/year):</h2>
                <ul>
                    <li>✅ Unlimited bills</li>
                    <li>✅ Priority support</li>
                    <li>✅ Advanced analytics</li>
                    <li>✅ Custom branding</li>
                </ul>
                
                <p>That's just ₹41/month!</p>
                
                <p><a href="https://billbytekot.in/upgrade">Upgrade Now</a></p>
                
                <p>Questions? Reply to this email!</p>
                '''
            )
            self.sg.send(message)

# Usage
automation = EmailAutomation()
automation.send_welcome_email('customer@example.com', 'Amit')
```

---

## 📱 WhatsApp Automation

### Using Twilio WhatsApp API

```python
# whatsapp_automation.py
from twilio.rest import Client
import os

class WhatsAppAutomation:
    def __init__(self):
        self.account_sid = os.environ['TWILIO_ACCOUNT_SID']
        self.auth_token = os.environ['TWILIO_AUTH_TOKEN']
        self.client = Client(self.account_sid, self.auth_token)
        self.from_number = 'whatsapp:+14155238886'  # Twilio Sandbox
    
    def send_welcome_message(self, to_number, name):
        """Send welcome message via WhatsApp"""
        message = self.client.messages.create(
            from_=self.from_number,
            body=f'''🎉 Welcome {name}!

You've joined BillByteKOT - India's #1 FREE restaurant billing software!

Quick Start:
1️⃣ Login: billbytekot.in
2️⃣ Add menu items
3️⃣ Start billing

Need help? Reply to this message!

🎁 Refer friends & earn ₹500!
Get link: billbytekot.in/refer''',
            to=f'whatsapp:{to_number}'
        )
        return message.sid
    
    def send_feature_update(self, to_number, feature_name):
        """Send feature update notification"""
        message = self.client.messages.create(
            from_=self.from_number,
            body=f'''🚀 NEW FEATURE: {feature_name}!

BillByteKOT just got better!

Check it out: billbytekot.in/features

Questions? Reply here!''',
            to=f'whatsapp:{to_number}'
        )
        return message.sid
    
    def send_referral_reminder(self, to_number, name, referral_link):
        """Send referral program reminder"""
        message = self.client.messages.create(
            from_=self.from_number,
            body=f'''💰 Hi {name}!

Earn ₹500 per referral!

Share your link:
{referral_link}

Refer 10 = ₹5,000
Refer 50 = ₹25,000

Start earning today! 🚀''',
            to=f'whatsapp:{to_number}'
        )
        return message.sid
    
    def send_broadcast(self, phone_numbers, message_text):
        """Send broadcast message to multiple numbers"""
        results = []
        for number in phone_numbers:
            try:
                message = self.client.messages.create(
                    from_=self.from_number,
                    body=message_text,
                    to=f'whatsapp:{number}'
                )
                results.append({'number': number, 'status': 'sent', 'sid': message.sid})
            except Exception as e:
                results.append({'number': number, 'status': 'failed', 'error': str(e)})
        return results

# Usage
whatsapp = WhatsAppAutomation()
whatsapp.send_welcome_message('+919876543210', 'Amit')
```

---

## 🤖 Social Media Automation

### Instagram Auto-Posting

```python
# instagram_automation.py
from instagrapi import Client
import schedule
import time

class InstagramAutomation:
    def __init__(self, username, password):
        self.cl = Client()
        self.cl.login(username, password)
    
    def post_reel(self, video_path, caption, hashtags):
        """Post Instagram Reel"""
        full_caption = f"{caption}\n\n{hashtags}"
        
        media = self.cl.clip_upload(
            video_path,
            caption=full_caption
        )
        return media.pk
    
    def post_image(self, image_path, caption, hashtags):
        """Post Instagram Image"""
        full_caption = f"{caption}\n\n{hashtags}"
        
        media = self.cl.photo_upload(
            image_path,
            caption=full_caption
        )
        return media.pk
    
    def post_carousel(self, image_paths, caption, hashtags):
        """Post Instagram Carousel"""
        full_caption = f"{caption}\n\n{hashtags}"
        
        media = self.cl.album_upload(
            image_paths,
            caption=full_caption
        )
        return media.pk
    
    def schedule_posts(self, posts_schedule):
        """Schedule posts for the week"""
        for post in posts_schedule:
            schedule.every().day.at(post['time']).do(
                self.post_image,
                post['image_path'],
                post['caption'],
                post['hashtags']
            )
        
        while True:
            schedule.run_pending()
            time.sleep(60)

# Usage
ig = InstagramAutomation('billbytekot', 'your_password')

# Schedule week's posts
posts = [
    {
        'time': '09:00',
        'image_path': 'images/monday_post.jpg',
        'caption': 'Start your week right! 🚀',
        'hashtags': '#RestaurantBusiness #Monday #BillByteKOT'
    },
    # Add more posts...
]

ig.schedule_posts(posts)
```

---

## 📊 Analytics Automation

### Track & Report Daily Metrics

```python
# analytics_automation.py
import requests
from datetime import datetime, timedelta

class AnalyticsAutomation:
    def __init__(self, api_url):
        self.api_url = api_url
    
    def get_daily_metrics(self):
        """Get daily metrics from backend"""
        response = requests.get(f'{self.api_url}/analytics/daily')
        return response.json()
    
    def send_daily_report(self, metrics):
        """Send daily report via email"""
        report = f'''
        📊 DAILY REPORT - {datetime.now().strftime('%Y-%m-%d')}
        
        🎯 SIGNUPS:
        - New signups: {metrics['new_signups']}
        - Total users: {metrics['total_users']}
        - Growth: {metrics['growth_rate']}%
        
        💰 REVENUE:
        - Premium conversions: {metrics['premium_conversions']}
        - Revenue: ₹{metrics['revenue']}
        - MRR: ₹{metrics['mrr']}
        
        📱 ENGAGEMENT:
        - Active users: {metrics['active_users']}
        - Bills created: {metrics['bills_created']}
        - Avg session: {metrics['avg_session']} mins
        
        🔗 REFERRALS:
        - New referrals: {metrics['new_referrals']}
        - Referral revenue: ₹{metrics['referral_revenue']}
        
        🎯 GOALS:
        - Signup goal: {metrics['signup_goal_progress']}%
        - Revenue goal: {metrics['revenue_goal_progress']}%
        '''
        
        # Send via email
        send_email('team@billbytekot.in', 'Daily Report', report)
    
    def track_viral_metrics(self):
        """Track viral growth metrics"""
        metrics = {
            'viral_coefficient': self.calculate_viral_coefficient(),
            'referral_rate': self.calculate_referral_rate(),
            'share_rate': self.calculate_share_rate(),
            'growth_rate': self.calculate_growth_rate()
        }
        return metrics
    
    def calculate_viral_coefficient(self):
        """K = (invites sent per user) × (conversion rate)"""
        invites_per_user = 5  # Average invites sent
        conversion_rate = 0.2  # 20% conversion
        return invites_per_user * conversion_rate
    
    def send_weekly_summary(self):
        """Send weekly summary report"""
        # Implementation here
        pass

# Usage
analytics = AnalyticsAutomation('https://billbytekot.in/api')
metrics = analytics.get_daily_metrics()
analytics.send_daily_report(metrics)
```

---

## 🎯 Lead Generation Automation

### Auto-collect Restaurant Leads

```python
# lead_generation.py
import requests
from bs4 import BeautifulSoup
import pandas as pd

class LeadGeneration:
    def scrape_zomato_restaurants(self, city):
        """Scrape restaurant data from Zomato"""
        # Note: Use Zomato API instead of scraping
        # This is just an example
        url = f'https://www.zomato.com/{city}/restaurants'
        response = requests.get(url)
        soup = BeautifulSoup(response.content, 'html.parser')
        
        restaurants = []
        # Parse restaurant data
        # Add to restaurants list
        
        return restaurants
    
    def scrape_google_maps(self, city, query='restaurants'):
        """Scrape restaurant data from Google Maps"""
        # Use Google Places API
        api_key = 'YOUR_API_KEY'
        url = f'https://maps.googleapis.com/maps/api/place/textsearch/json'
        
        params = {
            'query': f'{query} in {city}',
            'key': api_key
        }
        
        response = requests.get(url, params=params)
        data = response.json()
        
        restaurants = []
        for place in data['results']:
            restaurants.append({
                'name': place['name'],
                'address': place['formatted_address'],
                'rating': place.get('rating'),
                'phone': place.get('formatted_phone_number')
            })
        
        return restaurants
    
    def enrich_lead_data(self, restaurants):
        """Enrich lead data with additional info"""
        enriched = []
        for restaurant in restaurants:
            # Add email, social media, etc.
            enriched.append(restaurant)
        return enriched
    
    def export_to_csv(self, restaurants, filename):
        """Export leads to CSV"""
        df = pd.DataFrame(restaurants)
        df.to_csv(filename, index=False)
        return filename

# Usage
lead_gen = LeadGeneration()
restaurants = lead_gen.scrape_google_maps('Mumbai')
lead_gen.export_to_csv(restaurants, 'mumbai_restaurants.csv')
```

---

## 🤖 Chatbot Automation

### Auto-respond to Common Questions

```python
# chatbot_automation.py
from flask import Flask, request, jsonify

app = Flask(__name__)

class ChatbotAutomation:
    def __init__(self):
        self.responses = {
            'pricing': '''
                💰 PRICING:
                - FREE: 50 bills/month
                - Premium: ₹499/year
                
                Try free: billbytekot.in
            ''',
            'features': '''
                ✅ FEATURES:
                - Thermal Printing
                - KOT System
                - WhatsApp Integration
                - Inventory Management
                - Reports & Analytics
                
                See all: billbytekot.in/features
            ''',
            'demo': '''
                🎥 DEMO:
                Watch: billbytekot.in/demo
                
                Or book a call: calendly.com/billbytekot
            ''',
            'support': '''
                📞 SUPPORT:
                Email: support@billbytekot.in
                WhatsApp: +91-XXXXXXXXXX
                Live Chat: billbytekot.in
                
                We're here 24/7!
            '''
        }
    
    def get_response(self, message):
        """Get automated response based on message"""
        message_lower = message.lower()
        
        if any(word in message_lower for word in ['price', 'cost', 'pricing', 'how much']):
            return self.responses['pricing']
        elif any(word in message_lower for word in ['feature', 'what can', 'capabilities']):
            return self.responses['features']
        elif any(word in message_lower for word in ['demo', 'show', 'tutorial']):
            return self.responses['demo']
        elif any(word in message_lower for word in ['help', 'support', 'contact']):
            return self.responses['support']
        else:
            return '''
                Thanks for your message! 
                
                Quick links:
                - Pricing: billbytekot.in/pricing
                - Features: billbytekot.in/features
                - Demo: billbytekot.in/demo
                
                Or chat with us: billbytekot.in
            '''

@app.route('/chatbot', methods=['POST'])
def chatbot():
    data = request.json
    message = data.get('message')
    
    bot = ChatbotAutomation()
    response = bot.get_response(message)
    
    return jsonify({'response': response})

if __name__ == '__main__':
    app.run(debug=True)
```

---

## 📧 Drip Campaign Automation

### 7-Day Onboarding Sequence

```python
# drip_campaign.py
from datetime import datetime, timedelta
import schedule

class DripCampaign:
    def __init__(self):
        self.campaigns = {
            'onboarding': [
                {
                    'day': 0,
                    'subject': 'Welcome to BillByteKOT! 🎉',
                    'template': 'welcome_email'
                },
                {
                    'day': 1,
                    'subject': 'Quick Start Guide 📚',
                    'template': 'quick_start'
                },
                {
                    'day': 3,
                    'subject': 'You\'re missing these features 😮',
                    'template': 'feature_discovery'
                },
                {
                    'day': 5,
                    'subject': 'Success Story: Cafe Delight 💰',
                    'template': 'social_proof'
                },
                {
                    'day': 7,
                    'subject': 'Upgrade & Save ₹50,000/year 🚀',
                    'template': 'upgrade_offer'
                }
            ]
        }
    
    def start_campaign(self, user_email, user_name, signup_date):
        """Start drip campaign for new user"""
        for email in self.campaigns['onboarding']:
            send_date = signup_date + timedelta(days=email['day'])
            
            # Schedule email
            schedule_email(
                to=user_email,
                subject=email['subject'],
                template=email['template'],
                data={'name': user_name},
                send_at=send_date
            )
    
    def track_engagement(self, user_email):
        """Track email engagement"""
        # Track opens, clicks, conversions
        pass

# Usage
campaign = DripCampaign()
campaign.start_campaign(
    'customer@example.com',
    'Amit',
    datetime.now()
)
```

---

## 🎯 Retargeting Automation

### Facebook Pixel & Google Ads

```javascript
// retargeting.js

// Facebook Pixel
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');

fbq('init', 'YOUR_PIXEL_ID');
fbq('track', 'PageView');

// Track signup
function trackSignup() {
    fbq('track', 'CompleteRegistration');
    gtag('event', 'sign_up', {
        'method': 'Email'
    });
}

// Track purchase
function trackPurchase(value) {
    fbq('track', 'Purchase', {
        value: value,
        currency: 'INR'
    });
    gtag('event', 'purchase', {
        'transaction_id': Date.now(),
        'value': value,
        'currency': 'INR'
    });
}

// Google Ads Conversion
gtag('config', 'AW-CONVERSION_ID');

function trackConversion() {
    gtag('event', 'conversion', {
        'send_to': 'AW-CONVERSION_ID/CONVERSION_LABEL'
    });
}
```

---

## 🚀 Growth Hacking Scripts

### Viral Loop Automation

```python
# viral_loop.py

class ViralLoop:
    def __init__(self):
        self.referral_bonus = 500  # ₹500 per referral
        self.referee_bonus = 3  # 3 months free
    
    def generate_referral_link(self, user_id):
        """Generate unique referral link"""
        import hashlib
        hash_object = hashlib.md5(str(user_id).encode())
        code = hash_object.hexdigest()[:8]
        return f'https://billbytekot.in/ref/{code}'
    
    def track_referral(self, referrer_id, referee_email):
        """Track referral signup"""
        # Save to database
        referral = {
            'referrer_id': referrer_id,
            'referee_email': referee_email,
            'status': 'pending',
            'created_at': datetime.now()
        }
        # Save referral
        return referral
    
    def process_referral_reward(self, referrer_id):
        """Process referral reward"""
        # Credit ₹500 to referrer
        # Give 3 months free to referee
        pass
    
    def send_referral_reminder(self, user_id):
        """Send referral reminder"""
        link = self.generate_referral_link(user_id)
        message = f'''
        💰 Earn ₹500 per referral!
        
        Share your link:
        {link}
        
        Refer 10 = ₹5,000
        Refer 50 = ₹25,000
        '''
        # Send via email/WhatsApp
        pass

# Usage
viral = ViralLoop()
link = viral.generate_referral_link(user_id=123)
print(link)
```

---

## 📊 A/B Testing Automation

### Test Landing Page Variations

```python
# ab_testing.py
import random

class ABTesting:
    def __init__(self):
        self.variants = {
            'A': {
                'headline': 'Free Restaurant Billing Software',
                'cta': 'Start Free Trial',
                'color': '#7c3aed'
            },
            'B': {
                'headline': 'Save ₹50,000/Year on Restaurant Software',
                'cta': 'Get Started Free',
                'color': '#10b981'
            }
        }
        self.results = {'A': [], 'B': []}
    
    def assign_variant(self, user_id):
        """Assign user to variant"""
        return 'A' if user_id % 2 == 0 else 'B'
    
    def track_conversion(self, variant, converted):
        """Track conversion for variant"""
        self.results[variant].append(1 if converted else 0)
    
    def get_winner(self):
        """Calculate winning variant"""
        conv_a = sum(self.results['A']) / len(self.results['A'])
        conv_b = sum(self.results['B']) / len(self.results['B'])
        
        return 'A' if conv_a > conv_b else 'B'

# Usage
ab_test = ABTesting()
variant = ab_test.assign_variant(user_id=123)
# Show variant to user
# Track conversion
ab_test.track_conversion(variant, converted=True)
```

---

## 🎯 IMPLEMENTATION CHECKLIST

### Week 1 Setup
- [ ] Set up SendGrid/Mailchimp
- [ ] Configure Twilio WhatsApp
- [ ] Install Instagram automation
- [ ] Set up analytics tracking
- [ ] Configure Facebook Pixel
- [ ] Set up Google Ads conversion
- [ ] Create chatbot responses
- [ ] Set up drip campaigns
- [ ] Configure referral system
- [ ] Set up A/B testing

### Daily Automation
- [ ] Send welcome emails
- [ ] Send WhatsApp broadcasts
- [ ] Post social media content
- [ ] Track analytics
- [ ] Send daily reports
- [ ] Process referrals
- [ ] Respond to chats

### Weekly Automation
- [ ] Send weekly summary
- [ ] Update A/B tests
- [ ] Analyze viral metrics
- [ ] Optimize campaigns
- [ ] Generate leads

---

**All scripts ready! Start automating! 🚀**
