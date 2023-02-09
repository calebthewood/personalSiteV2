import { Link, useParams } from "react-router-dom";

export function BlogMenu() {
  const { showing } = useParams();

  return (
    <ul className="nav nav-pills nav-fill justify-content-evenly mb-4">
      <li class="nav-item m-2">
        <Link to="/blog/posts/recent"
        className={showing === "recent" ? "nav-link text-light bg-dark border-dark" : "nav-link text-dark"}
        aria-current="page" >Recent Posts</Link>
      </li>
      <li class="nav-item m-2">
        <Link to="/blog/posts/tweets"
        className={showing === "tweets" ? "nav-link text-light bg-dark border-dark" : "nav-link text-dark"}
        aria-current="page"><i className="fa-brands fa-twitter"></i> 100 Days of Code</Link>
      </li>
      <li class="nav-item m-2">
        <Link className="nav-link disabled" >View Tags</Link>
      </li>

      <form className="d-flex m-2" role="search">
        <input type="text" className="form-control me-2" placeholder="Search blog" aria-label="search blog" aria-describedby="search blog" />
        <button className="btn btn-outline-secondary disabled " type="button" id="button-search"><i className="search-icon fa-solid fa-magnifying-glass"></i></button>
      </form>

    </ul >
  );
};
