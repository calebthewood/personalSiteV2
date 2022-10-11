import PieChart from "./PieChart";
import DashboardAPI from "./dashboardAPI";
import { useEffect, useState } from "react";

export default function Dashboard() {

  let [results, setResults] = useState(null);
  // TODO: parse results into session data and route data
  useEffect(() => {
    async function getMetrics() {
      let res = await DashboardAPI.fetchMetricData();
      console.log("Dashboard useEffect getMetrics", res);

      setResults(res.data.response);
    }
    getMetrics();
  }, []);

  if (!results) return <div>Loading...</div>;
  let pieChartData = DashboardAPI.generateRouteChart(results);
  let visitorCount = DashboardAPI.uniqueVisitorCount(results);
  let topPages = DashboardAPI.rankPages(results);
  return (
    <div className="row">
      <div className="col-4">
        <h2>Route Traffic</h2>
        <PieChart results={pieChartData} />
      </div>

      <div className="col-4">
        <h2>
          Unique Visitors
        </h2>
        <h2 id="visitor-count">
          {visitorCount}
        </h2>
      </div>

      <div className="col-4">
        <h2>Top Ten Pages</h2>
        <ol>
          {topPages.filter((page, i) => i < 10).map(page => <li>{page.route.slice(12)}</li>)}
        </ol>
      </div>
    </div>
  );
}