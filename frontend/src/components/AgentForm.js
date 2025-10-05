import axios from 'axios';
import { useState } from 'react';
import { useAuth } from '../App.jsx';
import API_BASE from '../config';

export default function AgentForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(null);
  const { user } = useAuth();

  const submit = async (e) => {
    e.preventDefault();
    setMessage(null);
    if (!user?.token) {
      setMessage({ type: 'error', text: 'Not authenticated. Please login.' });
      return;
    }
    console.log('Submitting agent form with token:', user?.token?.slice(0,10) + '...');
    try {
      const res = await axios.post(`${API_BASE}/agents`, { name, email, mobile, password }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      // notify other components to refresh
      window.dispatchEvent(new CustomEvent('agents:changed'));
      setMessage({ type: 'success', text: res.data.message });
      setName(''); setEmail(''); setMobile(''); setPassword('');
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      console.error('AgentForm error', msg);
      setMessage({ type: 'error', text: msg });
    }
  };

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 8 }}>
      <h3>Add Agent</h3>
      {message && <div style={{ color: message.type === 'error' ? 'red' : 'green' }}>{message.text}</div>}
      <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} required />
      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required type="email" />
      <input placeholder="Mobile (+91...)" value={mobile} onChange={e => setMobile(e.target.value)} required />
      <input placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required type="password" />
      <button type="submit">Add Agent</button>
    </form>
  );
}
