import { BarChart3, Box, LayoutDashboard, LogOut, Menu, PackagePlus, Users, X } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { io, type Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

export function Logo() {
  return <div className="logo"><span className="logo__mark">R</span><span>Route<b>Flow</b></span></div>;
}

export function Layout({ children }: { children: ReactNode }) {
  const { user, token, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!token) return;
    const socket: Socket = io(import.meta.env.VITE_SOCKET_URL ?? '/', { auth: { token } });
    const notify = () => {
      setNotice('Live delivery data was updated');
      window.setTimeout(() => setNotice(''), 3200);
    };
    socket.on('order:assigned', notify);
    socket.on('order:status', notify);
    return () => { socket.disconnect(); };
  }, [token]);

  const links = [
    { to: '/', label: 'Overview', icon: LayoutDashboard },
    { to: '/orders', label: user?.role === 'AGENT' ? 'My deliveries' : 'Orders', icon: Box },
    ...(user?.role === 'CUSTOMER' ? [{ to: '/orders/new', label: 'Create order', icon: PackagePlus }] : []),
    ...(user?.role === 'ADMIN' ? [{ to: '/users', label: 'People', icon: Users }, { to: '/reports', label: 'Reports', icon: BarChart3 }] : []),
  ];

  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? 'sidebar--open' : ''}`}>
        <div className="sidebar__head"><Logo /><button className="icon-button sidebar__close" onClick={() => setOpen(false)}><X /></button></div>
        <nav>{links.map(({ to, label, icon: Icon }) => <NavLink end={to === '/'} key={to} to={to} onClick={() => setOpen(false)}><Icon size={19} />{label}</NavLink>)}</nav>
        <div className="sidebar__foot">
          <div className="user-chip"><span>{user?.name.charAt(0)}</span><div><strong>{user?.name}</strong><small>{user?.role.toLowerCase()}</small></div></div>
          <button className="logout-button" onClick={logout}><LogOut size={18} /> Sign out</button>
        </div>
      </aside>
      <main className="main-area">
        <header className="mobile-header"><button className="icon-button" onClick={() => setOpen(true)}><Menu /></button><Logo /><span /></header>
        {notice && <div className="live-notice"><i />{notice}</div>}
        <div className="page-wrap">{children}</div>
      </main>
      {open && <button aria-label="Close menu" className="scrim" onClick={() => setOpen(false)} />}
    </div>
  );
}
