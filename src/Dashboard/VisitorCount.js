import { DashboardAPI } from './dashboardAPI';

export function VisitorCount({ metrics, isLoading }) {
  const visitorCount = DashboardAPI.uniqueVisitorCount(metrics);
  const { first, last } = DashboardAPI.getFirstLast(metrics);
  const firstVisit = first.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const lastVisit = last.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="card bg-light border-dark border rounded border-3 enter-from-below">
      <div className="card-body">
        <h2>Unique Visitors</h2>
        <hr />
        <div className="row">
          <div className="col-xs-12 col-md-4 no-wrap">
            <h2 id="visitor-count">
              {visitorCount}
            </h2>
          </div>
          <div className="col-xs-12 col-md-8">
            <div className="card  border-0">
              <ul className="list-group list-group-flush">
                <li className="list-group-item bg-light"><h5><b>First Visitor:</b> {firstVisit}</h5></li>
                <li className="list-group-item bg-light"><h5><b>Last Visitor:</b> {lastVisit}</h5></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
