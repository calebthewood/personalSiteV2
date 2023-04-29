import { NavLink } from "react-router-dom";

/**
 * DashboardMenu Component: renders a horizontal nav bar with links to dashboard views
 *
 * @returns JSX element with nav bar containing links to different dashboard views
 */
export function DashboardMenu() {
  return (
    <nav className="nav nav-pills nav-fill flex-column p-2 bg-light border-dark border rounded border-3" >
      <NavLink className="nav-link" to="/dashboard/visitors" aria-current="page">Visitor Count</NavLink>
      <NavLink className="nav-link" to="/dashboard/user-paths">User Paths</NavLink>
      <NavLink className="nav-link" to="/dashboard/blog-ranks">Blog Ranks</NavLink>
      <NavLink className="nav-link" to="/dashboard/route-traffic">Route Traffic</NavLink>
    </nav>
  );
}
