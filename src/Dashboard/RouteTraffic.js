import { DashboardAPI } from './dashboardAPI';
import { LoadingSpinner } from '../Common/LoadingSpinner';
import { PieChart } from './PieChart';

export function RouteTraffic({ metrics, isLoading }) {
  let pieChartData = DashboardAPI.generateRouteChart(metrics);

  // if (isLoading) return <div className="container-md"><div className="row mb-2"><LoadingSpinner /></div></div>;
  return (
    <div className="card bg-light border-dark border rounded border-3">
      <div className="card-body">
        <h2 className="card-title">Route Traffic</h2>
        <hr />
        <PieChart results={pieChartData} />
      </div>
    </div>
  );
}