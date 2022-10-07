import "./Blog.css";
import BlogMenu from "./BlogMenu";
import BlogSummary from "./BlogSummary";
// import { blogData } from "./mockBlogs";
import { useState, useEffect } from "react";
import BlogAPI from "./blogAPI";
import BlogPost from "./BlogPost";
import { dateToNum } from "../utils";

export default function BlogList() {

  const [allPosts, setAllPosts] = useState(null);
  const [displayedPosts, setDisplayedPosts] = useState(null);
  const [currentPost, setCurrentPost] = useState(null);

  /** Populates allPosts state */
  useEffect(function () {
    console.debug("BlogList useEffect getPostsOnMount");
    getPosts(); // Recent is the default
  }, []);

  async function getPosts() {
    let posts = await BlogAPI.fetchPosts();
    setAllPosts(posts);
    console.log("BlogList line 25:   ", posts);
  }

  /** Sorts blog posts by date, doubles as the default on load */
  function filterRecentPosts() {
    const recentPosts = allPosts.sort((a, b) => {
      return dateToNum(b.date) - dateToNum(a.date);
    });
    return recentPosts;
  }

  /** Filters for Blog posts connected to a project, sorts by date. */
  function filterProjectPosts() {
    const projectPosts = allPosts.filter(post => post.project_id).sort((a, b) => {
      return dateToNum(b.date) - dateToNum(a.date);
    });
    return projectPosts;
  }

  /** Get all posts with a given tag.
   * Goal: be able to select many tags at the same time.
   */
  function filterTaggedPosts(tag) {
    const taggedPosts = allPosts.filter(post => post.tags.filter(
      t => t.name === tag )).sort((a, b) => dateToNum(b.date) - dateToNum(a.date));
    return taggedPosts;
  }

  function showList(listName, tag = "") {
    let postList;
    if (listName === 'project') {
      postList = filterProjectPosts();
    } else if (listName === 'tag' && tag) {
      postList = filterTaggedPosts(tag);
    } else {
      postList = filterRecentPosts();
    }
    setCurrentPost(null);
    setDisplayedPosts(postList);
  }

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
            <div className="col-3">
              <BlogMenu showList={showList} />
            </div>

            <div className="col-9">
              {!allPosts ?
                <div><h2>Loading...</h2></div> :
                currentPost ?
                  <BlogPost post={currentPost} showList={showList} /> :
                  allPosts.map(post => <BlogSummary
                                                key={post._id}
                                                post={post}
                                                showList={showList}
                                                viewPost={() => setCurrentPost(post)} />)}
            </div>
          </div>
        </div>
      </div >
    </div >
  );
}