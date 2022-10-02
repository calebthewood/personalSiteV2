import { NavLink } from "react-router-dom";
import "./Navigation.css";

export default function Navigation() {

  return (
    <nav class="navbar navbar-expand-lg bg-light">
      <div class="container-fluid">
        <NavLink class="navbar-brand" href="#">Caleb Wood</NavLink>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavAltMarkup" aria-controls="navbarNavAltMarkup" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNavAltMarkup">
          <div class="navbar-nav">
            <NavLink class="nav-link active" aria-current="page" href="#">About</NavLink>
            <NavLink class="nav-link" href="#">Portfolio</NavLink>
            <NavLink class="nav-link" href="#">Projects</NavLink>
            <NavLink class="nav-link">Blog</NavLink>
          </div>
        </div>
      </div>
    </nav>
  );
}

