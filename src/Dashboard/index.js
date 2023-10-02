
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
      <div className="col-xs-12 col-md-3 mb-4 enter-from-below">
        <DashboardMenu />
      </div>
      <div className="col-xs-12 col-md-9 mb-4 enter-from-below">
        {isLoading ?  <LoadingSpinner /> : <Outlet />}
      </div>
    </div>
  );
}
