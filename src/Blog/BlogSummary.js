import { Link } from "react-router-dom";

export default function BlogSummary({ summary, handleClick }) {
  // <Link to={"/blog-posts/" + summary.id}></Link>
  return (
    <div className="card mb-3">
      <div className="card-body">
        <div onClick={handleClick}>
        <h5 className="card-title">{summary.title}</h5>
        <h6 className="card-subtitle mb-2 text-muted">{summary.author} - {summary.date}</h6>
        <p class="card-text">{summary.description}</p>
        </div>
        { summary.tags.map( tag => <a href="#" className="card-link"> {tag} </a> )}
      </div>
    </div>
  );
}