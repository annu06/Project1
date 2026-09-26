import type { OrderStatus } from '../types';

export const statusLabel: Record<OrderStatus, string> = {
  PLACED: 'Placed',
  PICKED_UP: 'Picked up',
  IN_TRANSIT: 'In transit',
  DELIVERED: 'Delivered',
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`status status--${status.toLowerCase()}`}><i />{statusLabel[status]}</span>;
}
