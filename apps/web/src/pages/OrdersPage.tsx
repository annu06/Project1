import { Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { OrderCard } from '../components/OrderCard';
import { useAuth } from '../context/AuthContext';
import { api, errorMessage } from '../lib/api';
import type { Order, OrderStatus } from '../types';

export function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'ALL' | OrderStatus>('ALL');
  const [error, setError] = useState('');
  useEffect(() => { api.get<{ orders: Order[] }>('/orders').then(({ data }) => setOrders(data.orders)).catch((err) => setError(errorMessage(err))); }, []);
  const shown = useMemo(() => orders.filter((order) => {
    const matchesStatus = status === 'ALL' || order.status === status;
    const haystack = `${order.trackingId} ${order.recipientName} ${order.dropoff.address}`.toLowerCase();
    return matchesStatus && haystack.includes(search.toLowerCase());
  }), [orders, search, status]);

  return <><header className="page-header"><div><span className="eyebrow">ORDER MANAGEMENT</span><h1>{user?.role === 'AGENT' ? 'My deliveries' : 'All orders'}</h1><p>{orders.length} orders in this view</p></div></header>
    <div className="toolbar"><label className="search-box"><Search size={18} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tracking ID, recipient or destination" /></label><div className="filter-tabs">{(['ALL', 'PLACED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'] as const).map((value) => <button key={value} className={status === value ? 'active' : ''} onClick={() => setStatus(value)}>{value === 'ALL' ? 'All' : value.replace('_', ' ').toLowerCase()}</button>)}</div></div>
    {error && <div className="form-error">{error}</div>}<div className="order-grid">{shown.map((order) => <OrderCard key={order._id} order={order} />)}{!shown.length && <div className="empty-state"><Search /><h3>No matching orders</h3><p>Try changing the search or status filter.</p></div>}</div></>;
}
