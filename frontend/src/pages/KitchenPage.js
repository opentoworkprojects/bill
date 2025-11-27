import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API } from '../App';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { 
  Clock, 
  CheckCircle, 
  Printer, 
  AlertTriangle, 
  ChefHat,
  Timer,
  Bell,
  RefreshCw,
  Volume2,
  VolumeX,
  Filter,
  Flame,
  Snowflake,
  Utensils,
  Eye,
  X
} from 'lucide-react';

const KitchenPage = ({ user }) => {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [kotPreview, setKotPreview] = useState(null);
  const [businessSettings, setBusinessSettings] = useState(null);
  const [stats, setStats] = useState({ pending: 0, preparing: 0, ready: 0, avgTime: 0 });
