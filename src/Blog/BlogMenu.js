

export default function BlogMenu() {

  return (
    <nav className="nav flex-column">
      <div className="input-group input-group-sm mb-3">
        <input type="text" className="form-control" placeholder="Search blog" aria-label="search blog" aria-describedby="search blog" />
        <button className="btn btn-outline-secondary" type="button" id="button-search"><i className="search-icon fa-solid fa-magnifying-glass"></i></button>
      </div>
      <a className="nav-link active" aria-current="page" href="#">Recent</a>
      <a className="nav-link" href="#">Projects</a>
      <a className="nav-link" href="#">100 Days</a>
      <a className="nav-link disabled">Boulangerie</a>
      <a className="nav-link" href="#">Add Tags</a>
    </nav>
  );
};