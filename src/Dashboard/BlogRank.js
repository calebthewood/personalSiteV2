import { DashboardAPI } from './dashboardAPI';
import { LoadingSpinner } from '../Common/LoadingSpinner';

export function BlogRank({ metrics }) {
  let pieChartData = DashboardAPI.generateRouteChart(metrics);
  let topPages = DashboardAPI.rankPages(metrics);

  if (!metrics) return <div className="container-md"><div className="row mb-2"><LoadingSpinner /></div></div>;
  return <p>Blog Rank Page</p>;
}