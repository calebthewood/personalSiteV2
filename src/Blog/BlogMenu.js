import { Link } from "react-router-dom";

export default function BlogMenu({ showList }) {


  return (
    <nav className="nav flex-column">
      <div className="input-group input-group-sm mb-3">
        <input type="text" className="form-control" placeholder="Search blog" aria-label="search blog" aria-describedby="search blog" />
        <button className="btn btn-outline-secondary" type="button" id="button-search"><i className="search-icon fa-solid fa-magnifying-glass"></i></button>
      </div>
      <Link to="/blog/posts/recent" className="nav-link active" aria-current="page" >Recent</Link>
      <Link to="/blog/posts/projects" className="nav-link">Projects</Link>
      <Link className="nav-link disabled" >100 Days</Link>
      <Link className="nav-link disabled">Boulangerie</Link>
      <Link className="nav-link disabled" >View Tags</Link>
    </nav>
  );
};