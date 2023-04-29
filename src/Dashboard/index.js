
import { Outlet } from "react-router-dom";
import { DashboardMenu } from "./DashboardMenu";
import { LoadingSpinner } from "../Common/LoadingSpinner";
import './dashboard.css';
/** Dashboard
 *
 * My current metrics dashboard strategy is a travesty. It ought to be moved
 * to the server, the front end should either hit an endpoint for each piece
 * of data, or one with packet of various metrics: count, paginated
 * path data, and blog rank order. Currently I'm sending 700 records to the client.
 *
 * @param {boolean} isLoading - true while fetching dashboard data
 * Renders the Metrics Dashboard or a loading spinner
 *  - DashboardMenu
 *  - Outlet
 *    - VisitorCount
 *    - UserPaths
 *    - BlogRanks
 */
export function Dashboard({ isLoading }) {

  return (
    <div className="row">
      <div className="col-xs-12 col-md-3 mb-4">
        <DashboardMenu />
      </div>
      <div className="col-xs-12 col-md-9 mb-4">
        {isLoading ?  <LoadingSpinner /> : <Outlet />}
      </div>
    </div>
  );
}


/* The old dashboard, hold for now...
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
          </div> */
