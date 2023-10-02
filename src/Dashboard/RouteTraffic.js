import { DashboardAPI } from './dashboardAPI';
import { PieChart } from './PieChart';

export function RouteTraffic({ metrics, isLoading }) {
  let pieChartData = DashboardAPI.generateRouteChart(metrics);

  return (
    <div className="card bg-light border-dark border rounded border-3 enter-from-below">
      <div className="card-body">
        <h2 className="card-title">Route Traffic</h2>
        <hr />
        <PieChart results={pieChartData} />
      </div>
    </div>
  );
}