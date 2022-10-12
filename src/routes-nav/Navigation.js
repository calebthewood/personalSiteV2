import { NavLink } from "react-router-dom";
import "./navigation.css";

export default function Navigation() {
  return (
    <nav className="navbar navbar-expand-sm bg-light">
      <div className="container-fluid">
        <NavLink className="navbar-brand" to="/">Caleb Wood</NavLink>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavAltMarkup" aria-controls="navbarNavAltMarkup" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNavAltMarkup">
          <div className="navbar-nav">
            <NavLink className="nav-link" aria-current="page" to="/about">About</NavLink>
            <NavLink className="nav-link" to="/portfolio">Portfolio</NavLink>
            <NavLink className="nav-link" to="/projects">Projects</NavLink>
            <NavLink className="nav-link" to="/blog/posts/recent">Blog</NavLink>
            <NavLink className="nav-link" to="/dashboard">Dashboard</NavLink>
          </div>
        </div>
      </div>
    </nav>
  );
}

