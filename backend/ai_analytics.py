"""
Ultra-Performance AI Analytics Engine
Predictive insights for restaurant optimization
"""

import asyncio
import json
import logging
import numpy as np
import pandas as pd
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from collections import defaultdict
import statistics
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

@dataclass
class PredictionResult:
    prediction: float
    confidence: float
    factors: Dict[str, float]
    recommendation: str
    timestamp: datetime

@dataclass
class BusyHourPrediction:
    hour: int
    predicted_orders: int
    confidence: float
    day_of_week: str
    factors: Dict[str, float]

@dataclass
class MenuOptimization:
    item_id: str
    item_name: str
    current_performance: float
    predicted_performance: float
    recommendation: str
    action: str  # promote, demote, optimize_price, remove
    confidence: float

class AIAnalyticsEngine:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.cache = {}
        self.cache_ttl = {}
        self.models = {}
        
        # Performance thresholds
        self.thresholds = {
            'busy_hour_confidence': 0.7,
            'menu_optimization_confidence': 0.6,
            'fraud_detection_threshold': 0.8,
            'revenue_forecast_confidence': 0.75
        }
        
        # Feature weights for different predictions
        self.feature_weights = {
            'busy_hours': {
                'day_of_week': 0.3,
                'hour_of_day': 0.4,
                'weather': 0.1,
                'historical_trend': 0.2
            },
            'menu_optimization': {
                'order_frequency': 0.4,
                'profit_margin': 0.3,
                'customer_rating': 0.2,
                'preparation_time': 0.1
            }
        }

    async def predict_busy_hours(self, 
                                organization_id: str, 
                                days_ahead: int = 7) -> List[BusyHourPrediction]:
        """Predict busy hours for the next N days"""
        
        cache_key = f"busy_hours_{organization_id}_{days_ahead}"
        if self._is_cached(cache_key):
            return self.cache[cache_key]
        
        try:
            # Get historical order data
            historical_data = await self._get_historical_orders(organization_id, days=30)
            
            if len(historical_data) < 50:  # Need minimum data
                return []
            
            # Analyze patterns
            hourly_patterns = self._analyze_hourly_patterns(historical_data)
            daily_patterns = self._analyze_daily_patterns(historical_data)
            
            predictions = []
            
            for day_offset in range(days_ahead):
                target_date = datetime.now(timezone.utc) + timedelta(days=day_offset)
                day_of_week = target_date.strftime('%A')
                
                for hour in range(24):
                    # Calculate prediction based on patterns
                    base_prediction = hourly_patterns.get(hour, 0)
                    day_multiplier = daily_patterns.get(day_of_week, 1.0)
                    
                    predicted_orders = int(base_prediction * day_multiplier)
                    
                    # Calculate confidence based on data consistency
                    confidence = self._calculate_confidence(
                        historical_data, hour, day_of_week
                    )
                    
                    if predicted_orders > 0 and confidence > self.thresholds['busy_hour_confidence']:
                        factors = {
                            'historical_average': base_prediction,
                            'day_multiplier': day_multiplier,
                            'data_points': len(historical_data),
                            'consistency_score': confidence
                        }
                        
                        predictions.append(BusyHourPrediction(
                            hour=hour,
                            predicted_orders=predicted_orders,
                            confidence=confidence,
                            day_of_week=day_of_week,
                            factors=factors
                        ))
            
            # Cache results
            self._cache_result(cache_key, predictions, ttl=3600)  # 1 hour
            
            logger.info(f"🔮 Generated {len(predictions)} busy hour predictions for {organization_id}")
            return predictions
            
        except Exception as e:
            logger.error(f"❌ Error predicting busy hours: {e}")
            return []

    async def optimize_menu(self, organization_id: str) -> List[MenuOptimization]:
        """Analyze menu performance and suggest optimizations"""
        
        cache_key = f"menu_optimization_{organization_id}"
        if self._is_cached(cache_key):
            return self.cache[cache_key]
        
        try:
            # Get menu items and their performance data
            menu_items = await self._get_menu_performance(organization_id)
            
            if not menu_items:
                return []
            
            optimizations = []
            
            for item in menu_items:
                # Calculate performance metrics
                performance_score = self._calculate_item_performance(item)
                
                # Predict future performance
                predicted_performance = self._predict_item_performance(item)
                
                # Generate recommendation
                recommendation, action = self._generate_menu_recommendation(
                    item, performance_score, predicted_performance
                )
                
                # Calculate confidence
                confidence = self._calculate_menu_confidence(item)
                
                if confidence > self.thresholds['menu_optimization_confidence']:
                    optimizations.append(MenuOptimization(
                        item_id=item['id'],
                        item_name=item['name'],
                        current_performance=performance_score,
                        predicted_performance=predicted_performance,
                        recommendation=recommendation,
                        action=action,
                        confidence=confidence
                    ))
            
            # Sort by potential impact
            optimizations.sort(key=lambda x: x.predicted_performance - x.current_performance, reverse=True)
            
            # Cache results
            self._cache_result(cache_key, optimizations, ttl=7200)  # 2 hours
            
            logger.info(f"🍽️ Generated {len(optimizations)} menu optimizations for {organization_id}")
            return optimizations
            
        except Exception as e:
            logger.error(f"❌ Error optimizing menu: {e}")
            return []

    async def detect_fraud_patterns(self, organization_id: str) -> List[Dict[str, Any]]:
        """Detect potential fraud patterns in orders and transactions"""
        
        try:
            # Get recent orders and transactions
            recent_orders = await self._get_recent_orders(organization_id, days=7)
            
            fraud_alerts = []
            
            # Pattern 1: Unusual order volumes
            volume_anomalies = self._detect_volume_anomalies(recent_orders)
            fraud_alerts.extend(volume_anomalies)
            
            # Pattern 2: Suspicious discount usage
            discount_anomalies = self._detect_discount_anomalies(recent_orders)
            fraud_alerts.extend(discount_anomalies)
            
            # Pattern 3: Unusual payment patterns
            payment_anomalies = self._detect_payment_anomalies(recent_orders)
            fraud_alerts.extend(payment_anomalies)
            
            # Pattern 4: Time-based anomalies
            time_anomalies = self._detect_time_anomalies(recent_orders)
            fraud_alerts.extend(time_anomalies)
            
            # Filter by confidence threshold
            high_confidence_alerts = [
                alert for alert in fraud_alerts 
                if alert['confidence'] > self.thresholds['fraud_detection_threshold']
            ]
            
            logger.info(f"🚨 Detected {len(high_confidence_alerts)} potential fraud patterns")
            return high_confidence_alerts
            
        except Exception as e:
            logger.error(f"❌ Error detecting fraud patterns: {e}")
            return []

    async def forecast_revenue(self, 
                              organization_id: str, 
                              days_ahead: int = 30) -> Dict[str, Any]:
        """Forecast revenue for the next N days"""
        
        cache_key = f"revenue_forecast_{organization_id}_{days_ahead}"
        if self._is_cached(cache_key):
            return self.cache[cache_key]
        
        try:
            # Get historical revenue data
            historical_revenue = await self._get_historical_revenue(organization_id, days=90)
            
            if len(historical_revenue) < 30:  # Need minimum data
                return {}
            
            # Calculate trends
            daily_revenue = self._calculate_daily_revenue(historical_revenue)
            trend = self._calculate_trend(daily_revenue)
            seasonality = self._calculate_seasonality(daily_revenue)
            
            # Generate forecast
            forecast_data = []
            base_revenue = statistics.mean(daily_revenue[-7:])  # Last week average
            
            for day in range(days_ahead):
                # Apply trend and seasonality
                day_of_week = (datetime.now().weekday() + day) % 7
                seasonal_factor = seasonality.get(day_of_week, 1.0)
                trend_factor = 1 + (trend * day / 30)  # Monthly trend
                
                predicted_revenue = base_revenue * seasonal_factor * trend_factor
                
                # Add some realistic variance
                variance = predicted_revenue * 0.1  # 10% variance
                confidence = max(0.5, 1.0 - (day / days_ahead) * 0.3)  # Decreasing confidence
                
                forecast_data.append({
                    'date': (datetime.now() + timedelta(days=day)).strftime('%Y-%m-%d'),
                    'predicted_revenue': round(predicted_revenue, 2),
                    'confidence': round(confidence, 3),
                    'variance': round(variance, 2)
                })
            
            # Calculate summary statistics
            total_forecast = sum(d['predicted_revenue'] for d in forecast_data)
            avg_confidence = statistics.mean(d['confidence'] for d in forecast_data)
            
            result = {
                'forecast_period_days': days_ahead,
                'total_predicted_revenue': round(total_forecast, 2),
                'average_daily_revenue': round(total_forecast / days_ahead, 2),
                'overall_confidence': round(avg_confidence, 3),
                'trend': 'increasing' if trend > 0 else 'decreasing' if trend < 0 else 'stable',
                'trend_percentage': round(trend * 100, 2),
                'daily_forecast': forecast_data,
                'generated_at': datetime.now(timezone.utc).isoformat()
            }
            
            # Cache results
            self._cache_result(cache_key, result, ttl=3600)  # 1 hour
            
            logger.info(f"📈 Generated revenue forecast for {days_ahead} days: ₹{total_forecast:.2f}")
            return result
            
        except Exception as e:
            logger.error(f"❌ Error forecasting revenue: {e}")
            return {}

    # Helper methods for data analysis
    
    async def _get_historical_orders(self, organization_id: str, days: int = 30) -> List[Dict]:
        """Get historical order data"""
        start_date = datetime.now(timezone.utc) - timedelta(days=days)
        
        cursor = self.db.orders.find({
            'organization_id': organization_id,
            'created_at': {'$gte': start_date},
            'status': {'$in': ['completed', 'paid']}
        }, {
            'created_at': 1,
            'total': 1,
            'items': 1,
            'table_number': 1,
            'payment_method': 1,
            'discount': 1
        })
        
        return await cursor.to_list(length=None)

    async def _get_menu_performance(self, organization_id: str) -> List[Dict]:
        """Get menu items with performance metrics"""
        # Get menu items
        menu_items = await self.db.menu_items.find({
            'organization_id': organization_id
        }).to_list(length=None)
        
        # Get order data for performance calculation
        orders = await self._get_historical_orders(organization_id, days=30)
        
        # Calculate performance for each item
        item_performance = defaultdict(lambda: {
            'order_count': 0,
            'total_revenue': 0,
            'avg_rating': 0,
            'preparation_time': 0
        })
        
        for order in orders:
            for item in order.get('items', []):
                item_id = item.get('menu_item_id')
                if item_id:
                    perf = item_performance[item_id]
                    perf['order_count'] += item.get('quantity', 1)
                    perf['total_revenue'] += item.get('price', 0) * item.get('quantity', 1)
        
        # Combine menu items with performance data
        result = []
        for item in menu_items:
            item_id = item['id']
            perf = item_performance[item_id]
            
            result.append({
                'id': item_id,
                'name': item['name'],
                'price': item['price'],
                'category': item.get('category', ''),
                'order_count': perf['order_count'],
                'total_revenue': perf['total_revenue'],
                'avg_rating': perf['avg_rating'],
                'preparation_time': item.get('preparation_time', 15)
            })
        
        return result

    async def _get_recent_orders(self, organization_id: str, days: int = 7) -> List[Dict]:
        """Get recent orders for fraud detection"""
        start_date = datetime.now(timezone.utc) - timedelta(days=days)
        
        cursor = self.db.orders.find({
            'organization_id': organization_id,
            'created_at': {'$gte': start_date}
        })
        
        return await cursor.to_list(length=None)

    async def _get_historical_revenue(self, organization_id: str, days: int = 90) -> List[Dict]:
        """Get historical revenue data"""
        start_date = datetime.now(timezone.utc) - timedelta(days=days)
        
        pipeline = [
            {
                '$match': {
                    'organization_id': organization_id,
                    'created_at': {'$gte': start_date},
                    'status': {'$in': ['completed', 'paid']}
                }
            },
            {
                '$group': {
                    '_id': {
                        '$dateToString': {
                            'format': '%Y-%m-%d',
                            'date': '$created_at'
                        }
                    },
                    'daily_revenue': {'$sum': '$total'},
                    'order_count': {'$sum': 1}
                }
            },
            {'$sort': {'_id': 1}}
        ]
        
        cursor = self.db.orders.aggregate(pipeline)
        return await cursor.to_list(length=None)

    def _analyze_hourly_patterns(self, orders: List[Dict]) -> Dict[int, float]:
        """Analyze hourly order patterns"""
        hourly_counts = defaultdict(list)
        
        for order in orders:
            hour = order['created_at'].hour
            hourly_counts[hour].append(1)
        
        # Calculate average orders per hour
        hourly_averages = {}
        for hour, counts in hourly_counts.items():
            hourly_averages[hour] = statistics.mean(counts) if counts else 0
        
        return hourly_averages

    def _analyze_daily_patterns(self, orders: List[Dict]) -> Dict[str, float]:
        """Analyze daily order patterns"""
        daily_counts = defaultdict(list)
        
        for order in orders:
            day_name = order['created_at'].strftime('%A')
            daily_counts[day_name].append(1)
        
        # Calculate multipliers relative to average
        all_counts = [len(counts) for counts in daily_counts.values()]
        overall_avg = statistics.mean(all_counts) if all_counts else 1
        
        daily_multipliers = {}
        for day, counts in daily_counts.items():
            day_avg = statistics.mean(counts) if counts else 0
            daily_multipliers[day] = day_avg / overall_avg if overall_avg > 0 else 1.0
        
        return daily_multipliers

    def _calculate_confidence(self, data: List[Dict], hour: int, day: str) -> float:
        """Calculate prediction confidence based on data consistency"""
        # This is a simplified confidence calculation
        # In production, you'd use more sophisticated statistical methods
        
        relevant_data = [
            d for d in data 
            if d['created_at'].hour == hour and d['created_at'].strftime('%A') == day
        ]
        
        if len(relevant_data) < 3:
            return 0.3  # Low confidence with little data
        
        # Calculate coefficient of variation as inverse of confidence
        values = [1 for _ in relevant_data]  # Simplified
        if len(values) > 1:
            cv = statistics.stdev(values) / statistics.mean(values) if statistics.mean(values) > 0 else 1
            confidence = max(0.1, 1.0 - cv)
        else:
            confidence = 0.5
        
        return min(confidence, 0.95)  # Cap at 95%

    def _calculate_item_performance(self, item: Dict) -> float:
        """Calculate overall performance score for menu item"""
        weights = self.feature_weights['menu_optimization']
        
        # Normalize metrics to 0-1 scale
        order_freq_score = min(item['order_count'] / 100, 1.0)  # Normalize to max 100 orders
        profit_score = min(item['price'] / 1000, 1.0)  # Normalize to max ₹1000
        rating_score = item['avg_rating'] / 5.0 if item['avg_rating'] > 0 else 0.5
        time_score = max(0, 1.0 - (item['preparation_time'] / 60))  # Faster = better
        
        performance = (
            weights['order_frequency'] * order_freq_score +
            weights['profit_margin'] * profit_score +
            weights['customer_rating'] * rating_score +
            weights['preparation_time'] * time_score
        )
        
        return round(performance, 3)

    def _predict_item_performance(self, item: Dict) -> float:
        """Predict future performance of menu item"""
        # Simplified prediction based on current trends
        current_performance = self._calculate_item_performance(item)
        
        # Add some trend analysis (simplified)
        trend_factor = 1.0
        if item['order_count'] > 50:  # Popular items tend to stay popular
            trend_factor = 1.1
        elif item['order_count'] < 10:  # Unpopular items may decline
            trend_factor = 0.9
        
        return round(current_performance * trend_factor, 3)

    def _generate_menu_recommendation(self, item: Dict, current: float, predicted: float) -> Tuple[str, str]:
        """Generate recommendation and action for menu item"""
        improvement = predicted - current
        
        if improvement > 0.2:
            return "Promote this high-potential item", "promote"
        elif improvement < -0.2:
            return "Consider removing or redesigning this item", "remove"
        elif current < 0.3:
            return "Optimize pricing or ingredients", "optimize_price"
        elif current > 0.7:
            return "Maintain current strategy", "maintain"
        else:
            return "Monitor performance closely", "monitor"

    def _calculate_menu_confidence(self, item: Dict) -> float:
        """Calculate confidence in menu recommendation"""
        # Base confidence on data availability
        if item['order_count'] > 50:
            return 0.9
        elif item['order_count'] > 20:
            return 0.7
        elif item['order_count'] > 5:
            return 0.5
        else:
            return 0.3

    def _detect_volume_anomalies(self, orders: List[Dict]) -> List[Dict]:
        """Detect unusual order volumes"""
        # Group orders by hour
        hourly_volumes = defaultdict(int)
        for order in orders:
            hour_key = order['created_at'].strftime('%Y-%m-%d-%H')
            hourly_volumes[hour_key] += 1
        
        volumes = list(hourly_volumes.values())
        if len(volumes) < 10:
            return []
        
        # Calculate statistical thresholds
        mean_volume = statistics.mean(volumes)
        std_volume = statistics.stdev(volumes) if len(volumes) > 1 else 0
        threshold = mean_volume + (2 * std_volume)  # 2 standard deviations
        
        anomalies = []
        for hour_key, volume in hourly_volumes.items():
            if volume > threshold:
                anomalies.append({
                    'type': 'volume_anomaly',
                    'timestamp': hour_key,
                    'volume': volume,
                    'expected_volume': mean_volume,
                    'confidence': min(0.95, (volume - threshold) / threshold),
                    'severity': 'high' if volume > threshold * 1.5 else 'medium'
                })
        
        return anomalies

    def _detect_discount_anomalies(self, orders: List[Dict]) -> List[Dict]:
        """Detect suspicious discount usage"""
        discount_orders = [o for o in orders if o.get('discount', 0) > 0]
        
        if len(discount_orders) < 5:
            return []
        
        anomalies = []
        
        # Check for unusually high discounts
        discounts = [o['discount'] for o in discount_orders]
        mean_discount = statistics.mean(discounts)
        std_discount = statistics.stdev(discounts) if len(discounts) > 1 else 0
        high_threshold = mean_discount + (2 * std_discount)
        
        for order in discount_orders:
            if order['discount'] > high_threshold:
                anomalies.append({
                    'type': 'discount_anomaly',
                    'order_id': order.get('id'),
                    'discount_amount': order['discount'],
                    'expected_discount': mean_discount,
                    'confidence': 0.8,
                    'severity': 'medium'
                })
        
        return anomalies

    def _detect_payment_anomalies(self, orders: List[Dict]) -> List[Dict]:
        """Detect unusual payment patterns"""
        # This is a simplified implementation
        # In production, you'd analyze payment method distributions, timing, etc.
        
        payment_methods = defaultdict(int)
        for order in orders:
            method = order.get('payment_method', 'unknown')
            payment_methods[method] += 1
        
        total_orders = len(orders)
        anomalies = []
        
        # Check for unusual payment method usage
        for method, count in payment_methods.items():
            percentage = (count / total_orders) * 100
            
            # Flag if cash usage is extremely high (potential tax evasion)
            if method == 'cash' and percentage > 90:
                anomalies.append({
                    'type': 'payment_anomaly',
                    'payment_method': method,
                    'usage_percentage': percentage,
                    'confidence': 0.7,
                    'severity': 'medium',
                    'description': 'Unusually high cash usage'
                })
        
        return anomalies

    def _detect_time_anomalies(self, orders: List[Dict]) -> List[Dict]:
        """Detect unusual timing patterns"""
        # Check for orders at unusual hours
        unusual_hours = []
        
        for order in orders:
            hour = order['created_at'].hour
            
            # Flag orders between 2 AM and 5 AM as potentially suspicious
            if 2 <= hour <= 5:
                unusual_hours.append({
                    'type': 'time_anomaly',
                    'order_id': order.get('id'),
                    'hour': hour,
                    'confidence': 0.6,
                    'severity': 'low',
                    'description': 'Order placed at unusual hour'
                })
        
        return unusual_hours

    def _calculate_daily_revenue(self, revenue_data: List[Dict]) -> List[float]:
        """Extract daily revenue values"""
        return [item['daily_revenue'] for item in revenue_data]

    def _calculate_trend(self, daily_revenue: List[float]) -> float:
        """Calculate revenue trend (simplified linear regression)"""
        if len(daily_revenue) < 7:
            return 0.0
        
        # Simple trend calculation using first and last week averages
        first_week = daily_revenue[:7]
        last_week = daily_revenue[-7:]
        
        first_avg = statistics.mean(first_week)
        last_avg = statistics.mean(last_week)
        
        if first_avg == 0:
            return 0.0
        
        # Return percentage change per day
        days_diff = len(daily_revenue) - 7
        return (last_avg - first_avg) / first_avg / days_diff if days_diff > 0 else 0.0

    def _calculate_seasonality(self, daily_revenue: List[float]) -> Dict[int, float]:
        """Calculate day-of-week seasonality factors"""
        # This is a simplified implementation
        # In production, you'd use more sophisticated time series analysis
        
        if len(daily_revenue) < 14:  # Need at least 2 weeks
            return {i: 1.0 for i in range(7)}
        
        # Group by day of week (assuming data starts from a Monday)
        day_revenues = defaultdict(list)
        for i, revenue in enumerate(daily_revenue):
            day_of_week = i % 7
            day_revenues[day_of_week].append(revenue)
        
        # Calculate average for each day
        overall_avg = statistics.mean(daily_revenue)
        seasonality = {}
        
        for day in range(7):
            if day in day_revenues and day_revenues[day]:
                day_avg = statistics.mean(day_revenues[day])
                seasonality[day] = day_avg / overall_avg if overall_avg > 0 else 1.0
            else:
                seasonality[day] = 1.0
        
        return seasonality

    def _is_cached(self, key: str) -> bool:
        """Check if result is cached and not expired"""
        if key not in self.cache:
            return False
        
        if key in self.cache_ttl:
            if datetime.now(timezone.utc).timestamp() > self.cache_ttl[key]:
                del self.cache[key]
                del self.cache_ttl[key]
                return False
        
        return True

    def _cache_result(self, key: str, result: Any, ttl: int = 3600):
        """Cache result with TTL"""
        self.cache[key] = result
        self.cache_ttl[key] = datetime.now(timezone.utc).timestamp() + ttl

    def clear_cache(self):
        """Clear all cached results"""
        self.cache.clear()
        self.cache_ttl.clear()
        logger.info("🗑️ AI analytics cache cleared")

    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        return {
            'cached_items': len(self.cache),
            'cache_keys': list(self.cache.keys()),
            'memory_usage_mb': sum(len(str(v)) for v in self.cache.values()) / 1024 / 1024
        }

# Global AI analytics instance
ai_analytics: Optional[AIAnalyticsEngine] = None

async def init_ai_analytics(db: AsyncIOMotorDatabase):
    """Initialize AI analytics engine"""
    global ai_analytics
    ai_analytics = AIAnalyticsEngine(db)
    logger.info("🤖 AI Analytics engine initialized")

async def get_ai_analytics() -> Optional[AIAnalyticsEngine]:
    """Get AI analytics engine instance"""
    return ai_analytics