import { ArrowRight, Box, CheckCircle2, Clock3, PackageCheck, Radio, Truck, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { OrderCard } from '../components/OrderCard';
import { useAuth } from '../context/AuthContext';
import { api, errorMessage } from '../lib/api';
import type { Metrics, Order } from '../types';

export function DashboardPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<{ orders: Order[] }>('/orders').then(({ data }) => setOrders(data.orders)).catch((err) => setError(errorMessage(err)));
    if (user?.role === 'ADMIN') api.get<{ metrics: Metrics }>('/analytics').then(({ data }) => setMetrics(data.metrics)).catch(() => undefined);
  }, [user?.role]);

  const active = orders.filter((order) => order.status !== 'DELIVERED');
  const delivered = orders.filter((order) => order.status === 'DELIVERED');
  const cards = user?.role === 'ADMIN' ? [
    { label: 'Total orders', value: metrics?.totalOrders ?? '—', icon: Box, detail: 'All time' },
    { label: 'Active deliveries', value: metrics?.activeDeliveries ?? '—', icon: Radio, detail: 'Live right now' },
    { label: 'Active agents', value: metrics?.activeAgents ?? '—', icon: Users, detail: 'Available network' },
    { label: 'On-time rate', value: metrics ? `${metrics.onTimeRate}%` : '—', icon: CheckCircle2, detail: 'Delivered in SLA' },
  ] : user?.role === 'AGENT' ? [
    { label: 'Assigned', value: active.length, icon: Truck, detail: 'Need your attention' },
    { label: 'In transit', value: orders.filter((o) => o.status === 'IN_TRANSIT').length, icon: Radio, detail: 'Sharing live progress' },
    { label: 'Completed', value: delivered.length, icon: PackageCheck, detail: 'Successful deliveries' },
  ] : [
    { label: 'Active orders', value: active.length, icon: Radio, detail: 'Moving through network' },
    { label: 'Delivered', value: delivered.length, icon: PackageCheck, detail: 'Completed orders' },
    { label: 'Total orders', value: orders.length, icon: Box, detail: 'Your delivery history' },
  ];

  return <><header className="page-header"><div><span className="eyebrow">{user?.role === 'ADMIN' ? 'CONTROL CENTRE' : user?.role === 'AGENT' ? 'DELIVERY RUN' : 'MY SHIPMENTS'}</span><h1>Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {user?.name.split(' ')[0]}</h1><p>{user?.role === 'ADMIN' ? 'Here is what is moving across your network.' : user?.role === 'AGENT' ? 'Keep today’s deliveries moving.' : 'Follow every package from pickup to doorstep.'}</p></div>{user?.role === 'CUSTOMER' && <Link to="/orders/new" className="primary-button">Create order <ArrowRight size={18} /></Link>}</header>
    {error && <div className="form-error">{error}</div>}
    <section className="stats-grid">{cards.map(({ label, value, icon: Icon, detail }) => <article className="stat-card" key={label}><div className="stat-card__icon"><Icon size={21} /></div><div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></article>)}</section>
    <section className="section-block"><div className="section-title"><div><span className="eyebrow">LATEST ACTIVITY</span><h2>{user?.role === 'AGENT' ? 'Your next deliveries' : 'Recent orders'}</h2></div><Link to="/orders">View all <ArrowRight size={16} /></Link></div>
      <div className="order-grid">{orders.slice(0, 4).map((order) => <OrderCard key={order._id} order={order} />)}{!orders.length && <div className="empty-state"><Clock3 /><h3>No orders yet</h3><p>New deliveries will appear here as soon as they are created.</p></div>}</div>
    </section></>;
}
