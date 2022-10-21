import { Link } from "react-router-dom";

export default function BlogSummary({ post }) {
  // <Link to={"/blog-posts/" + summary.id}></Link>
  // const description = post.blocks[1].paragraph.plain_text[0].slice(0,50)
  return (
    <li className="list-group-item text-bg-dark">
      <div className="card blog-summary text-bg-dark">
        <div className="card-body">
          <Link className="navigation-link" to={`/blog/posts/${post.slug}`}>
            <h5 className="card-title">{post.title}</h5>
            <h6 className="card-subtitle mb-2 text-muted">{post.author} - {post.date}</h6>
            <p className="card-text mb-3">Filler description, will either add a field to the blog, or find a nice way to show the first x chars from content</p>
          </Link>

          {post.tags.map(tag => <Link
            key={tag.id}
            to={`/blog/posts/${tag.name}`}
            className={`tags ${tag.color} mx-1`}> {tag.name} </Link>)}

        </div>
      </div>
    </li>
  );
}
