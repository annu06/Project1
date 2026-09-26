import { Search, ShieldCheck, Truck, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, errorMessage } from '../lib/api';
import type { User } from '../types';

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([]); const [query, setQuery] = useState(''); const [error, setError] = useState('');
  useEffect(() => { api.get<{ users: User[] }>('/users').then(({ data }) => setUsers(data.users)).catch((err) => setError(errorMessage(err))); }, []);
  const toggle = async (user: User) => { try { const { data } = await api.patch<{ user: User }>(`/users/${user._id}/active`, { active: !user.active }); setUsers((current) => current.map((item) => item._id === user._id ? data.user : item)); } catch (err) { setError(errorMessage(err)); } };
  const shown = users.filter((user) => `${user.name} ${user.email} ${user.role}`.toLowerCase().includes(query.toLowerCase()));
  return <><header className="page-header"><div><span className="eyebrow">ACCESS & CAPACITY</span><h1>People</h1><p>Manage customers, delivery agents, and administrators.</p></div></header><div className="toolbar"><label className="search-box"><Search size={18} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search people" /></label></div>{error && <div className="form-error">{error}</div>}<div className="table-card"><table><thead><tr><th>Person</th><th>Role</th><th>Phone</th><th>Status</th><th /></tr></thead><tbody>{shown.map((user) => { const Icon = user.role === 'ADMIN' ? ShieldCheck : user.role === 'AGENT' ? Truck : UserRound; return <tr key={user._id}><td><div className="person"><span>{user.name.charAt(0)}</span><div><strong>{user.name}</strong><small>{user.email}</small></div></div></td><td><span className="role-label"><Icon size={15} />{user.role.toLowerCase()}</span></td><td>{user.phone}</td><td><span className={`availability ${user.active ? 'active' : ''}`}><i />{user.active ? 'Active' : 'Inactive'}</span></td><td><button className="text-button" onClick={() => toggle(user)}>{user.active ? 'Deactivate' : 'Activate'}</button></td></tr>; })}</tbody></table></div></>;
}
