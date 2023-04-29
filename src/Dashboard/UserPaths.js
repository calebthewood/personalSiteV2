import { LoadingSpinner } from "../Common/LoadingSpinner";
import { DashboardAPI } from "./dashboardAPI";

export function UserPaths({ metrics }) {
  if (!metrics) return <div className="container-md"><div className="row mb-2"><LoadingSpinner /></div></div>;
  const paths = DashboardAPI.getPaths(metrics);

  return (
    <div className="card bg-light border-dark border rounded border-3 overflow-auto dashboard-container">
      <div className="card-body overflow-auto">
        <h2>User Paths</h2>
        <hr />
        <ul className="list-group list-group-flush">
          {paths.map((item, i) => {
            return <li className="list-group-item bg-light" key={`${item.date}-${i}`}><b>Session {paths.length - i}</b> ({item.date}) - <i>{item.path}</i></li>;
          })}

        </ul>
      </div>
    </div>
  );
}
