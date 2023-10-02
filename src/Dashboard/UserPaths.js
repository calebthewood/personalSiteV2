import { LoadingSpinner } from "../Common/LoadingSpinner";
import { DashboardAPI } from "./dashboardAPI";

export function UserPaths({ metrics, isLoading }) {
  const paths = DashboardAPI.getPaths(metrics);

  return (
    <div className="card bg-light border-dark border rounded border-3 enter-from-below">
      <div className="card-body">
        <h2>User Paths</h2>
        <hr />
        <ul className="list-group list-group-flush overflow-auto dashboard-container">
          {paths.map((item, i) => {
            return <li className="list-group-item bg-light" key={`${item.date}-${i}`}><b>Session {paths.length - i}</b> ({item.date.slice(0,10)}) - <i>{item.path}</i></li>;
          })}

        </ul>
      </div>
    </div>
  );
}
