"""
Quick diagnostic script to check AI setup
Run: python check_ai_setup.py
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

print("=" * 60)
print("🔍 AI Setup Diagnostic")
print("=" * 60)

# Check environment variables
print("\n📋 Environment Variables:")
print(f"   AI_PROVIDER: {os.getenv('AI_PROVIDER', 'NOT SET')}")
print(f"   OPENAI_API_KEY: {'✅ Set' if os.getenv('OPENAI_API_KEY') else '❌ Not set'}")
print(f"   ANTHROPIC_API_KEY: {'✅ Set' if os.getenv('ANTHROPIC_API_KEY') else '❌ Not set'}")
print(f"   GEMINI_API_KEY: {'✅ Set' if os.getenv('GEMINI_API_KEY') else '❌ Not set'}")

# Check package installations
print("\n📦 Package Availability:")
try:
    import openai
    print("   ✅ openai installed")
except ImportError:
    print("   ❌ openai NOT installed - run: pip install openai")

try:
    import anthropic
    print("   ✅ anthropic installed")
except ImportError:
    print("   ❌ anthropic NOT installed - run: pip install anthropic")

try:
    import google.generativeai as genai
    print("   ✅ google-generativeai installed")
except ImportError:
    print("   ❌ google-generativeai NOT installed - run: pip install google-generativeai")

# Try to import AI service
print("\n🤖 AI Service:")
try:
    from ai_service import ai_service
    print(f"   ✅ AI Service imported successfully")
    print(f"   Provider: {ai_service.provider}")
    print(f"   Model: {ai_service.model if hasattr(ai_service, 'model') else 'Not set'}")
    
    # Check if provider is properly configured
    provider = ai_service.provider
    if provider == "openai":
        if ai_service.openai_key:
            print(f"   ✅ OpenAI configured")
        else:
            print(f"   ❌ OpenAI key missing")
    elif provider == "anthropic":
        if ai_service.anthropic_key:
            print(f"   ✅ Anthropic configured")
        else:
            print(f"   ❌ Anthropic key missing")
    elif provider == "gemini":
        if ai_service.gemini_key:
            print(f"   ✅ Gemini configured")
        else:
            print(f"   ❌ Gemini key missing")
    
except Exception as e:
    print(f"   ❌ AI Service import failed: {str(e)}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)
print("💡 Recommendations:")
print("=" * 60)

provider = os.getenv('AI_PROVIDER', 'openai')
if provider == "gemini":
    if not os.getenv('GEMINI_API_KEY'):
        print("❌ Set GEMINI_API_KEY in .env file")
    try:
        import google.generativeai
        print("✅ Gemini package installed")
    except:
        print("❌ Install: pip install google-generativeai")
elif provider == "openai":
    if not os.getenv('OPENAI_API_KEY'):
        print("❌ Set OPENAI_API_KEY in .env file")
    try:
        import openai
        print("✅ OpenAI package installed")
    except:
        print("❌ Install: pip install openai")
elif provider == "anthropic":
    if not os.getenv('ANTHROPIC_API_KEY'):
        print("❌ Set ANTHROPIC_API_KEY in .env file")
    try:
        import anthropic
        print("✅ Anthropic package installed")
    except:
        print("❌ Install: pip install anthropic")

print("\n✅ Setup complete! Restart your server.")
