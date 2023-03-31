import { PieChart } from "./PieChart";
import { DashboardAPI } from "./dashboardAPI";
import { useEffect, useState } from "react";
import { LoadingSpinner } from "../Common/LoadingSpinner";

export function Dashboard() {

  let [results, setResults] = useState(null);
  // TODO: parse results into session data and route data
  useEffect(() => {
    async function getMetrics() {
      let res = await DashboardAPI.fetchMetricData();
      console.log("Dashboard useEffect getMetrics", res.status);
      setResults(res.data.response);
    }
    getMetrics();
  }, []);

  if (!results) return <div className="container-md"><div className="row mb-2"><LoadingSpinner /></div></div>;

  let pieChartData = DashboardAPI.generateRouteChart(results);
  let visitorCount = DashboardAPI.uniqueVisitorCount(results);
  let topPages = DashboardAPI.rankPages(results);
  return (
    <div className="container-md">
      <div className="row mb-2">

        <div className="col col-sm-8 col-md-5 mb-4">
          <div className="card bg-light border-dark border rounded border-3">
            <div className="card-body">
              <h2 className="card-title">Route Traffic</h2>
              <hr />
              <PieChart results={pieChartData} />
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-4 col-md-3 mb-4">
          <div className="card bg-light border-dark border rounded border-3">
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

        <div className="col-12 col-md-4 mb-4">
          <div className="card bg-light border-dark border rounded border-3">
            <div className="card-body">
              <h2>Top Ten Pages</h2>
              <hr />
              <ol className="list-group list-group-flush list-group-numbered">
                {topPages
                  .filter((page, i) => i < 10)
                  .map((page, j) => <li key={"top-ten-" + j} className="bg-light list-group-item">{page.route.slice(12)}</li>)}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
