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
        <div className="card text-bg-dark">
          <div className="card-body">
            <h2 className="card-title">Route Traffic</h2>
            <hr />
            <PieChart results={pieChartData} />
          </div>
        </div>
      </div>

      <div className="col-4">
        <div className="card text-bg-dark">
          <div className="card-body">
            <h2>
              Unique Visitors
            </h2>
            <hr />
            <h2 id="visitor-count">
              {visitorCount}
            </h2>
          </div>
        </div>
      </div>

      <div className="col-4">
        <div className="card text-bg-dark">
          <div className="card-body">
            <h2>Top Ten Pages</h2>
            <hr />
            <ol className="list-group list-group-flush list-group-numbered">
              {topPages.filter((page, i) => i < 10).map(page => <li className="text-bg-dark list-group-item">{page.route.slice(12)}</li>)}
            </ol>
          </div>
        </div>
      </div>

    </div>
  );
}