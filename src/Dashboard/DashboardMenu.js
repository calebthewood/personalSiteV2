import { NavLink } from "react-router-dom";

export function DashboardMenu() {

  return (
    <nav className="nav nav-pills nav-fill p-2 bg-light border-dark border rounded border-3" >
      <NavLink className="nav-link" to="/dashboard/visitors" aria-current="page">Visitor Count</NavLink>
      <NavLink className="nav-link" to="/dashboard/user-paths">User Paths</NavLink>
      <NavLink className="nav-link" to="/dashboard/blog-ranks">Blog Ranks</NavLink>
    </nav>
  );
}
