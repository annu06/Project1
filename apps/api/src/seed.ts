import bcrypt from 'bcryptjs';
import { connectDatabase, disconnectDatabase } from './db.js';
import { Order } from './models/Order.js';
import { User } from './models/User.js';

const demoEmails = ['customer@routeflow.dev', 'agent@routeflow.dev', 'agent2@routeflow.dev', 'admin@routeflow.dev'];
const hoursFromNow = (hours: number) => new Date(Date.now() + hours * 3_600_000);

async function seed() {
  await connectDatabase();
  await Order.deleteMany({});
  await User.deleteMany({ email: { $in: demoEmails } });
  const passwordHash = await bcrypt.hash('Password123!', 12);
  const [customer, agent, agent2, admin] = await User.create([
    { name: 'Aarav Mehta', email: demoEmails[0], phone: '+91 98110 22001', role: 'CUSTOMER', passwordHash },
    { name: 'Rohan Kumar', email: demoEmails[1], phone: '+91 98110 22002', role: 'AGENT', passwordHash },
    { name: 'Meera Singh', email: demoEmails[2], phone: '+91 98110 22003', role: 'AGENT', passwordHash },
    { name: 'Nisha Verma', email: demoEmails[3], phone: '+91 98110 22004', role: 'ADMIN', passwordHash },
  ]);
  if (!customer || !agent || !agent2 || !admin) throw new Error('Could not create demo users');

  const route = [
    { lat: 28.6139, lng: 77.209, accuracy: 8, speed: 9, heading: 238, recordedAt: hoursFromNow(-1.2) },
    { lat: 28.6018, lng: 77.184, accuracy: 7, speed: 11, heading: 240, recordedAt: hoursFromNow(-0.8) },
    { lat: 28.5831, lng: 77.151, accuracy: 9, speed: 10, heading: 238, recordedAt: hoursFromNow(-0.3) },
  ];
  const base = {
    customer: customer._id,
    pickup: { address: 'Connaught Place, New Delhi', lat: 28.6315, lng: 77.2167 },
    recipientPhone: '+91 98999 11223',
    weightKg: 1.4,
  };

  await Order.create([
    {
      ...base,
      trackingId: 'RF260924A1B2C3', agent: agent._id,
      dropoff: { address: 'Cyber City, Gurugram', lat: 28.495, lng: 77.089 },
      recipientName: 'Kavya Iyer', packageDescription: 'Design samples', status: 'IN_TRANSIT', expectedDeliveryAt: hoursFromNow(3),
      statusLogs: [
        { status: 'PLACED', note: 'Order placed', updatedBy: customer._id, createdAt: hoursFromNow(-4) },
        { status: 'PICKED_UP', note: 'Package collected from sender', updatedBy: agent._id, createdAt: hoursFromNow(-2) },
        { status: 'IN_TRANSIT', note: 'Vehicle is heading to destination', updatedBy: agent._id, createdAt: hoursFromNow(-1.2) },
      ], locationHistory: route, currentLocation: route.at(-1), createdAt: hoursFromNow(-4),
    },
    {
      ...base,
      trackingId: 'RF260924D4E5F6',
      dropoff: { address: 'Sector 62, Noida', lat: 28.627, lng: 77.372 },
      recipientName: 'Aditya Bose', packageDescription: 'Business documents', weightKg: 0.4, status: 'PLACED', expectedDeliveryAt: hoursFromNow(20),
      statusLogs: [{ status: 'PLACED', note: 'Order is ready for assignment', updatedBy: customer._id, createdAt: hoursFromNow(-1) }],
    },
    {
      ...base,
      trackingId: 'RF260924G7H8J9', agent: agent2._id,
      pickup: { address: 'Hauz Khas, New Delhi', lat: 28.5494, lng: 77.2001 },
      dropoff: { address: 'Vasant Kunj, New Delhi', lat: 28.5209, lng: 77.1596 },
      recipientName: 'Sana Khan', packageDescription: 'Apparel parcel', weightKg: 2.1, status: 'PICKED_UP', expectedDeliveryAt: hoursFromNow(5),
      statusLogs: [
        { status: 'PLACED', note: 'Order placed', updatedBy: customer._id, createdAt: hoursFromNow(-3) },
        { status: 'PICKED_UP', note: 'Parcel scanned at pickup', updatedBy: agent2._id, createdAt: hoursFromNow(-0.5) },
      ],
    },
    {
      ...base,
      trackingId: 'RF260923K1L2M3', agent: agent._id,
      pickup: { address: 'Karol Bagh, New Delhi', lat: 28.6519, lng: 77.1909 },
      dropoff: { address: 'Lajpat Nagar, New Delhi', lat: 28.5677, lng: 77.2433 },
      recipientName: 'Vikram Rao', packageDescription: 'Home accessories', weightKg: 3.5, status: 'DELIVERED', expectedDeliveryAt: hoursFromNow(-4), deliveredAt: hoursFromNow(-5), createdAt: hoursFromNow(-28),
      statusLogs: [
        { status: 'PLACED', note: 'Order placed', updatedBy: customer._id, createdAt: hoursFromNow(-28) },
        { status: 'PICKED_UP', note: 'Package collected', updatedBy: agent._id, createdAt: hoursFromNow(-12) },
        { status: 'IN_TRANSIT', note: 'Out for delivery', updatedBy: agent._id, createdAt: hoursFromNow(-7) },
        { status: 'DELIVERED', note: 'Delivered to recipient', updatedBy: agent._id, createdAt: hoursFromNow(-5) },
      ],
    },
  ]);

  console.log('Seed complete. Demo password: Password123!');
  console.table(demoEmails.map((email) => ({ email, password: 'Password123!' })));
}

seed().catch((error) => { console.error(error); process.exitCode = 1; }).finally(disconnectDatabase);
