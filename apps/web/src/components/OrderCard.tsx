import { ArrowRight, CalendarDays, MapPin, Package } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import type { Order } from '../types';
import { StatusBadge } from './StatusBadge';

export function OrderCard({ order }: { order: Order }) {
  return (
    <Link to={`/orders/${order._id}`} className="order-card">
      <div className="order-card__top">
        <div className="package-icon"><Package size={20} /></div>
        <div><span className="eyebrow">Tracking ID</span><strong>{order.trackingId}</strong></div>
        <StatusBadge status={order.status} />
      </div>
      <div className="route-line">
        <span className="route-dot route-dot--start" />
        <div><small>From</small><p>{order.pickup.address}</p></div>
        <span className="route-path" />
        <MapPin size={16} />
        <div><small>To</small><p>{order.dropoff.address}</p></div>
      </div>
      <div className="order-card__foot">
        <span><CalendarDays size={15} /> Expected {format(new Date(order.expectedDeliveryAt), 'dd MMM, h:mm a')}</span>
        <span className="view-link">View details <ArrowRight size={15} /></span>
      </div>
    </Link>
  );
}
