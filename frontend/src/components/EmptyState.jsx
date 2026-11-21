import { Inbox } from 'lucide-react';

export default function EmptyState({ title = 'Nothing here yet', message = '', action = null }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon"><Inbox size={24} /></div>
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {action}
    </div>
  );
}