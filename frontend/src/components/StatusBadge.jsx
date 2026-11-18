export default function StatusBadge({ status }) {
  const map = {
    PAID:              'badge-success',
    PARTIALLY_PAID:    'badge-warning',
    UNPAID:            'badge-danger',
    LOW:               'badge-danger',
    ACTIVE:            'badge-success',
    INACTIVE:          'badge-muted',
    SMALL:             'badge-size-small',
    MEDIUM:            'badge-size-medium',
    LARGE:             'badge-size-large'
  };
  const cls = map[status] || 'badge-muted';
  return <span className={`badge ${cls}`}>{status}</span>;
}