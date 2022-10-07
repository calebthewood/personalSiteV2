// import { Link } from "react-router-dom";

export default function BlogSummary({ post, handleClick }) {
  // <Link to={"/blog-posts/" + summary.id}></Link>

  // const description = post.blocks[1].paragraph.plain_text[0].slice(0,50)

  return (
    <div className="card mb-3">
      <div className="card-body">
        <div onClick={handleClick}>
        <h5 className="card-title">{post.title}</h5>
        <h6 className="card-subtitle mb-2 text-muted">{post.author} - {post.date}</h6>
        <p className="card-text">Filler description, will either add a field to the blog, or find a nice way to show the first x chars from content</p>
        </div>
        { post.tags.map( tag => <a key={tag.id} href="#" className="card-link"> {tag.name} </a> )}
      </div>
    </div>
  );
}