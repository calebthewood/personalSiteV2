import "./Blog.css";
import BlogMenu from "./BlogMenu";
import BlogSummary from "./BlogSummary";
import { blogData } from "./mockBlogs";
import { useState, useEffect } from "react";
import BlogAPI from "./blogAPI";
import BlogPost from "./BlogPost";

export default function BlogList() {

  const [posts, setPosts] = useState(null);
  const [currentPost, setCurrentPost] = useState(null);
  useEffect(function getPostsOnMount() {
    console.debug("BlogList useEffect getPostsOnMount");
    getPosts();
  }, []);

  async function getPosts() {
    let posts = await BlogAPI.getPosts();
    setPosts(posts);
  }



  if (!posts) return <div><h2>Loading...</h2></div>

  return (
    <div className="container">

      <div className="row">
        <div className="col">
          <header>
            <div className="card mb-3">
              <div className="card-body">
                <h1 className="card-title">Project Pith</h1>
                <h5 className="card-subtitle mb-2 text-muted">A blog</h5>
                <p className="card-text"> Expect to see detailed project walkthroughs,
                  conference notes, my twitter feed, and the occasional musing on what
                  makes a good baguette.
                </p>
              </div>
            </div>
          </header>
          <div className="row">
            <div className="col-4">
              <BlogMenu />
            </div>
            <div className="col-8">
              <h4>List of Blogs to go here.</h4>
              {currentPost ?
                <BlogPost post={currentPost} />
                : posts.map(post => <BlogSummary summary={post} handleClick={()=> setCurrentPost(post)}/>)}
            </div>
          </div>
        </div>
      </div >
    </div >
  );
}