"""
Advanced AI Service for BillByteKOT
Supports multiple AI providers: OpenAI, Anthropic Claude, Google Gemini
"""

import os
import json
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
import asyncio

# AI Provider imports
try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

try:
    import anthropic
    ANTHROPIC_AVAILABLE = True
except ImportError:
    ANTHROPIC_AVAILABLE = False

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False


class AIService:
    """Advanced AI Service with multi-provider support"""
    
    def __init__(self):
        self.provider = os.getenv("AI_PROVIDER", "openai").lower()
        self.openai_key = os.getenv("OPENAI_API_KEY")
        self.anthropic_key = os.getenv("ANTHROPIC_API_KEY")
        self.gemini_key = os.getenv("GEMINI_API_KEY")
        
        # Initialize clients
        if self.provider == "openai" and OPENAI_AVAILABLE and self.openai_key:
            openai.api_key = self.openai_key
            self.model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
            
        elif self.provider == "anthropic" and ANTHROPIC_AVAILABLE and self.anthropic_key:
            self.client = anthropic.Anthropic(api_key=self.anthropic_key)
            self.model = os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022")
            
        elif self.provider == "gemini" and GEMINI_AVAILABLE and self.gemini_key:
            genai.configure(api_key=self.gemini_key)
            # Use gemini-2.0-flash-lite for higher free tier limits (1500 requests/day)
            self.model = os.getenv("GEMINI_MODEL", "gemini-2.0-flash-lite")
            self.gemini_model = genai.GenerativeModel(self.model)
    
    async def chat(self, message: str, system_prompt: str = None, context: Dict = None) -> str:
        """Universal chat method supporting all providers"""
        try:
            # Silent logging - no provider details exposed
            if self.provider == "openai" and OPENAI_AVAILABLE and self.openai_key:
                return await self._openai_chat(message, system_prompt, context)
            elif self.provider == "anthropic" and ANTHROPIC_AVAILABLE and self.anthropic_key:
                return await self._anthropic_chat(message, system_prompt, context)
            elif self.provider == "gemini" and GEMINI_AVAILABLE and self.gemini_key:
                return await self._gemini_chat(message, system_prompt, context)
            else:
                # Generic error - no API details
                return "AI assistant is currently unavailable. Please contact support."
        except Exception as e:
            # Generic error message - no technical details exposed
            return "I'm having trouble processing your request right now. Please try again in a moment."
    
    async def _openai_chat(self, message: str, system_prompt: str, context: Dict) -> str:
        """OpenAI GPT chat"""
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        if context:
            messages.append({"role": "system", "content": f"Context: {json.dumps(context)}"})
        messages.append({"role": "user", "content": message})
        
        # Use the new OpenAI client API
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=self.openai_key)
        
        response = await client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=0.7,
            max_tokens=1000
        )
        return response.choices[0].message.content

    
    async def _anthropic_chat(self, message: str, system_prompt: str, context: Dict) -> str:
        """Anthropic Claude chat"""
        system_content = system_prompt or "You are BillByteKOT's intelligent assistant."
        if context:
            system_content += f"\n\nContext: {json.dumps(context)}"
        
        response = await asyncio.to_thread(
            self.client.messages.create,
            model=self.model,
            max_tokens=1000,
            system=system_content,
            messages=[{"role": "user", "content": message}]
        )
        return response.content[0].text
    
    async def _gemini_chat(self, message: str, system_prompt: str, context: Dict) -> str:
        """Google Gemini chat"""
        prompt = ""
        if system_prompt:
            prompt += f"{system_prompt}\n\n"
        if context:
            prompt += f"Context: {json.dumps(context)}\n\n"
        prompt += message
        
        response = await asyncio.to_thread(
            self.gemini_model.generate_content,
            prompt,
            generation_config={"max_output_tokens": 300, "temperature": 0.7}
        )
        return response.text
    
    async def analyze_sales(self, sales_data: Dict) -> str:
        """Analyze sales data and provide insights"""
        system_prompt = """You are BillByteKOT's expert business analyst. 
        Provide CONCISE, ACTIONABLE insights in 3-4 bullet points.
        Each point should be ONE sentence with a clear action.
        Focus on: revenue trends, popular items, peak hours, and ONE key recommendation.
        Keep total response under 150 words."""
        
        message = f"""Analyze this sales data:
        Total Sales: ₹{sales_data.get('total_sales', 0)}
        Total Orders: {sales_data.get('total_orders', 0)}
        Average Order Value: ₹{sales_data.get('avg_order_value', 0)}
        Top Items: {sales_data.get('top_items', [])}
        Peak Hours: {sales_data.get('peak_hours', [])}
        
        Provide 3-4 SHORT bullet points with actionable insights."""
        
        return await self.chat(message, system_prompt, sales_data)

    
    async def menu_recommendations(self, menu_data: Dict, order_history: List) -> str:
        """Generate menu recommendations based on order history"""
        system_prompt = """You are BillByteKOT's menu consultant. 
        Provide CONCISE recommendations in 3-4 bullet points.
        Each point should be ONE clear, actionable suggestion.
        Focus on: popular combos, upselling opportunities, and menu optimization.
        Keep total response under 150 words."""
        
        message = f"""Based on this data:
        Menu Items: {len(menu_data.get('items', []))}
        Recent Orders: {len(order_history)}
        Popular Items: {menu_data.get('popular_items', [])}
        
        Provide 3-4 SHORT, actionable suggestions for:
        1. Items that pair well
        2. Upselling opportunities
        3. Menu optimization"""
        
        return await self.chat(message, system_prompt, {"menu": menu_data, "orders": order_history[:10]})
    
    async def customer_support(self, query: str, context: Dict = None) -> str:
        """Handle customer support queries"""
        system_prompt = """You are BillByteKOT's friendly assistant.
        Provide BRIEF, helpful answers in 2-3 sentences maximum.
        Be direct and actionable. No long explanations.
        Help with: menu questions, order status, dietary info, general inquiries."""
        
        return await self.chat(query, system_prompt, context)
    
    async def inventory_insights(self, inventory_data: Dict) -> str:
        """Provide inventory management insights"""
        system_prompt = """You are BillByteKOT's inventory expert.
        Provide CONCISE insights in 3-4 bullet points.
        Each point should be ONE clear action item.
        Focus on: reorder alerts, waste reduction, cost optimization.
        Keep total response under 150 words."""
        
        message = f"""Analyze this inventory:
        Low Stock Items: {inventory_data.get('low_stock', [])}
        Out of Stock: {inventory_data.get('out_of_stock', [])}
        Total Items: {inventory_data.get('total_items', 0)}
        
        Provide 3-4 SHORT, actionable recommendations."""
        
        return await self.chat(message, system_prompt, inventory_data)


# Global AI service instance
ai_service = AIService()
