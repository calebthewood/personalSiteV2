import { NavLink } from "react-router-dom";
import "./navigation.css";

export function Navigation() {

  return (
    <nav className="navbar navbar-expand-sm navbar-outline-dark bg-light border-dark border-bottom border-3">
      <div className="container-fluid">
        <NavLink className="navbar-brand" to="/"><img style={{ "width": "35px" }} src="/favicon_io/android-chrome-192x192.png" alt="CW" /></NavLink>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav">
              <li className="nav-item">
                <NavLink className="nav-link" aria-current="page" to="/about">About</NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to="/portfolio">Portfolio</NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to="/projects">Projects</NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to="/blog/posts/recent">Blog</NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to="/dashboard/visitors">Dashboard</NavLink>
              </li>
            </ul>
          </div>
        </div>
    </nav>
  );
}

