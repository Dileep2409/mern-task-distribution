import AgentForm from '../components/AgentForm';
import AgentList from '../components/AgentList';

import { useAuth } from '../App.jsx';

export default function AgentsPage() {
  const { user } = useAuth();

  if (!user) {
    return <div>Please log in</div>;
  }

  return (
    <div style={{ maxWidth: 800, margin: '2rem auto' }}>
      <h1>Agents Management</h1>
      <AgentForm />
      <hr style={{ margin: '1rem 0' }} />
      <AgentList />
    </div>
  );
}
