import { Link } from 'react-router-dom';
import TaskList from '../components/TaskList';

export default function Dashboard() {
  return (
    <div style={{ maxWidth: 900, margin: '2rem auto' }}>
      <h1>Dashboard</h1>
      <nav style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <Link to="/agents">Agents</Link>
        <Link to="/upload">Upload</Link>
      </nav>

      <section>
        <h2>Distributed Tasks</h2>
        <TaskList />
      </section>
    </div>
  );
}
