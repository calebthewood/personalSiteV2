import { blogData } from "./mockBlogs";
import { useParams } from "react-router-dom";

export default function BlogPost({ post }) {
  // let { id } = useParams();
  // <h1>{currentPost.title}</h1>
  // <p>{currentPost.body}</p>
  // const currentPost = blogData.filter(b => b.id === id)[0];

  return (
    <div className="card">
      <div className="card-body">
        <h5 className="card-title">Card title</h5>
        <h6 className="card-subtitle mb-2 text-muted">Card subtitle</h6>
        <p className="card-text">parse block data here</p>
        <a href="#" className="card-link">tags</a>
      </div>
    </div>
  );
}