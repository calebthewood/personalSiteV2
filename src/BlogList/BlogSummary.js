import { Link } from "react-router-dom";

export function BlogSummary({ post }) {
  // <Link to={"/blog-posts/" + summary.id}></Link>
  const description = post.blocks[0].content.rich_text[0].plain_text.slice(0,120)
  return (
    <li className="bg-light list-group-item">
      <div className="card bg-light blog-summary">
        <div className="card-body">
          <Link className="navigation-link" to={`/blog/posts/${post.slug}`}>
            <h5 className="card-title">{post.title}</h5>
            <h6 className="card-subtitle mb-2 text-muted">{post.author} - {post.date}</h6>
            <p className="card-text mb-3">{description}...</p>
          </Link>

          {post.tags.map(tag => <Link
            key={tag.id}
            to={`/blog/posts/${tag.name}`}
            className={`tags badge rounded-pill text-bg-secondary mx-1`}> {tag.name} </Link>)}

        </div>
      </div>
    </li>
  );
}
