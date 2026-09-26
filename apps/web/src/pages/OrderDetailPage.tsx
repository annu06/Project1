import { ArrowLeft, Calendar, Check, Clock3, MapPin, Navigation, Package, Phone, Radio, Truck, UserRound } from 'lucide-react';
import { format } from 'date-fns';
import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { io, type Socket } from 'socket.io-client';
import { StatusBadge, statusLabel } from '../components/StatusBadge';
import { TrackingMap } from '../components/TrackingMap';
import { useAuth } from '../context/AuthContext';
import { api, errorMessage } from '../lib/api';
import type { Location, Order, OrderStatus, User } from '../types';

const flow: OrderStatus[] = ['PLACED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'];

export function OrderDetailPage() {
  const { id = '' } = useParams();
  const { user, token } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [agents, setAgents] = useState<User[]>([]);
  const [agentId, setAgentId] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sharing, setSharing] = useState(false);
  const watchId = useRef<number | null>(null);

  useEffect(() => {
    api.get<{ order: Order }>(`/orders/${id}`).then(({ data }) => { setOrder(data.order); setAgentId(data.order.agent?._id ?? ''); }).catch((err) => setError(errorMessage(err)));
    if (user?.role === 'ADMIN') api.get<{ users: User[] }>('/users?role=AGENT').then(({ data }) => setAgents(data.users.filter((agent) => agent.active)));
  }, [id, user?.role]);

  useEffect(() => {
    if (!token || !id) return;
    const socket: Socket = io(import.meta.env.VITE_SOCKET_URL ?? '/', { auth: { token } });
    socket.emit('order:join', id);
    const replace = (next: Order) => { if (next._id === id) setOrder(next); };
    const move = ({ orderId, location }: { orderId: string; location: Location }) => {
      if (orderId === id) setOrder((current) => current ? { ...current, currentLocation: location, locationHistory: [...current.locationHistory, location] } : current);
    };
    socket.on('order:status', replace); socket.on('order:assigned', replace); socket.on('order:location', move);
    return () => { socket.emit('order:leave', id); socket.disconnect(); };
  }, [id, token]);

  useEffect(() => () => { if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current); }, []);

  const assign = async () => {
    if (!agentId) return; setBusy(true); setError('');
    try { const { data } = await api.post<{ order: Order }>(`/orders/${id}/assign`, { agentId }); setOrder(data.order); }
    catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  };

  const advance = async () => {
    if (!order) return; const next = flow[flow.indexOf(order.status) + 1]; if (!next) return;
    setBusy(true); setError('');
    try { const { data } = await api.patch<{ order: Order }>(`/orders/${id}/status`, { status: next, note: `${statusLabel[next]} confirmed by ${user?.name}` }); setOrder(data.order); }
    catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  };

  const toggleLocation = () => {
    if (sharing && watchId.current !== null) { navigator.geolocation.clearWatch(watchId.current); watchId.current = null; setSharing(false); return; }
    if (!navigator.geolocation) { setError('Location sharing is not supported by this browser'); return; }
    setError('');
    watchId.current = navigator.geolocation.watchPosition(
      ({ coords }) => { void api.post(`/orders/${id}/location`, { lat: coords.latitude, lng: coords.longitude, accuracy: coords.accuracy, speed: coords.speed ?? undefined, heading: coords.heading ?? undefined }).catch((err) => setError(errorMessage(err))); },
      (geoError) => { setError(geoError.message); setSharing(false); },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );
    setSharing(true);
  };

  if (!order) return <div className="empty-state">{error ? <><h3>Unable to open order</h3><p>{error}</p></> : <p>Loading delivery…</p>}</div>;
  const next = flow[flow.indexOf(order.status) + 1];
  const canShare = user?.role === 'AGENT' && ['PICKED_UP', 'IN_TRANSIT'].includes(order.status);

  return <><Link to="/orders" className="back-link"><ArrowLeft size={16} /> Back to orders</Link>
    <header className="detail-header"><div><span className="eyebrow">{order.trackingId}</span><h1>{order.pickup.address.split(',')[0]} <span>→</span> {order.dropoff.address.split(',')[0]}</h1><p>Created {format(new Date(order.createdAt), 'dd MMM yyyy, h:mm a')}</p></div><StatusBadge status={order.status} /></header>
    {error && <div className="form-error">{error}</div>}
    <div className="detail-grid"><section className="detail-main"><article className="map-card"><TrackingMap order={order} /><div className="map-meta"><div><Radio size={18} /><span><strong>{order.currentLocation ? 'Live location received' : 'Waiting for agent location'}</strong><small>{order.currentLocation ? `Updated ${format(new Date(order.currentLocation.recordedAt), 'h:mm:ss a')}` : 'Tracking starts after pickup'}</small></span></div><div><Clock3 size={18} /><span><strong>Expected delivery</strong><small>{format(new Date(order.expectedDeliveryAt), 'dd MMM, h:mm a')}</small></span></div></div></article>
      <article className="panel"><div className="panel__title"><div><span className="eyebrow">JOURNEY</span><h2>Delivery timeline</h2></div></div><div className="timeline">{flow.map((status, index) => { const log = order.statusLogs.find((item) => item.status === status); const done = flow.indexOf(order.status) >= index; return <div className={`timeline__item ${done ? 'done' : ''}`} key={status}><span className="timeline__marker">{done ? <Check size={14} /> : index + 1}</span><div><strong>{statusLabel[status]}</strong><p>{log?.note || (status === 'DELIVERED' ? 'Package handed to recipient' : 'Pending milestone')}</p>{log && <small>{format(new Date(log.createdAt), 'dd MMM, h:mm a')} · {log.updatedBy?.name ?? 'System'}</small>}</div></div>; })}</div></article></section>
      <aside className="detail-aside"><article className="panel action-panel"><span className="eyebrow">DELIVERY CONTROL</span>{user?.role === 'ADMIN' && <><label>Assigned agent<select value={agentId} onChange={(e) => setAgentId(e.target.value)}><option value="">Select an agent</option>{agents.map((agent) => <option key={agent._id} value={agent._id}>{agent.name}</option>)}</select></label><button className="secondary-button" disabled={!agentId || busy} onClick={assign}><UserRound size={17} /> Assign delivery</button></>}{user?.role === 'AGENT' && next && <button className="primary-button" disabled={busy} onClick={advance}><Check size={17} /> Mark as {statusLabel[next]}</button>}{canShare && <button className={sharing ? 'danger-button' : 'secondary-button'} onClick={toggleLocation}><Navigation size={17} /> {sharing ? 'Stop live location' : 'Share live location'}</button>}{user?.role === 'CUSTOMER' && <p className="muted-copy">Updates from the assigned delivery agent appear here automatically.</p>}</article>
      <article className="panel info-list"><span className="eyebrow">SHIPMENT</span><div><Package /><span><small>Package</small><strong>{order.packageDescription} · {order.weightKg} kg</strong></span></div><div><UserRound /><span><small>Recipient</small><strong>{order.recipientName}</strong></span></div><div><Phone /><span><small>Phone</small><strong>{order.recipientPhone}</strong></span></div><div><Truck /><span><small>Delivery agent</small><strong>{order.agent?.name ?? 'Not assigned yet'}</strong></span></div><div><Calendar /><span><small>Promise date</small><strong>{format(new Date(order.expectedDeliveryAt), 'dd MMM yyyy')}</strong></span></div></article>
      <article className="panel address-list"><div><span className="address-dot pickup" /><span><small>Pickup</small><strong>{order.pickup.address}</strong></span></div><div className="address-line" /><div><MapPin /><span><small>Drop-off</small><strong>{order.dropoff.address}</strong></span></div></article></aside></div></>;
}
