import "./Blog.css";
import BlogMenu from "./BlogMenu";
import BlogSummary from "./BlogSummary";
import BlogAPI from "./blogAPI";
import BlogPost from "./BlogPost";
import { useParams } from "react-router-dom";
import Tweet from "../common/Tweet";


export default function BlogList({ isLoading, allPosts, tweets }) {
  const { showing } = useParams();

  /** Is this a bit like a reducer? Note to self, I moved all the
   * filtering functions mentioned below out to the BlogAPI class.
   * I think that's a big win, but we'll see once it starts scaling.
   */
  function showList(posts, tweets, showing) {
    let postList;
    const tags = new Set(["React", "Node", "JavaScript"]);
    if (showing === 'projects') {
      postList = BlogAPI.filterProjectPosts(posts, showing);
    } else if (tags.has(showing)) {
      postList = BlogAPI.filterTaggedPosts(posts, showing);
    } else if (showing === 'recent') {
      postList = BlogAPI.filterRecentPosts(posts, showing);
    } else if (showing === 'tweets') {
      return tweets.map (tweet => <Tweet tweet={tweet}/>)
    } else {
      let post = BlogAPI.filterPostsBySlug(posts, showing);
      return <BlogPost post={post} previous={showing} />;
    }
    return postList.map(post => <BlogSummary key={post._id} post={post} />);
  }

  return (
    <div>
      <div className="row">
        <div className="col-3">
          <BlogMenu />
        </div>

        <div className="col-9">
          {isLoading ?
            <div><h2>Loading...</h2></div> :
            showList([...allPosts], tweets, showing)}
        </div>
      </div>
    </div >
  );
}