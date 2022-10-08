import "./Blog.css";
import BlogMenu from "./BlogMenu";
import BlogSummary from "./BlogSummary";
// import { blogData } from "./mockBlogs";
import { useState, useEffect } from "react";
import BlogAPI from "./blogAPI";
import BlogPost from "./BlogPost";
import { dateToNum } from "../utils";
import { useParams } from "react-router-dom";

export default function BlogList() {
  const { showing } = useParams();
  console.log("SHOWING ", showing);
  // const [listName, setListName] = useState(list);
  const [isLoading, setIsLoading] = useState(true);
  const [allPosts, setAllPosts] = useState(null);

  /** Populates allPosts state */
  useEffect(function () {
    async function getPosts() {
      let posts = await BlogAPI.fetchPosts();
      setAllPosts(posts);
      setIsLoading(false);
    }
    // console.debug("BlogList useEffect getPostsOnMount");
    getPosts(); // Recent is the default
  }, []);

  /** Sorts blog posts by date, doubles as the default on load */
  function filterRecentPosts(posts) {
    const recentPosts = posts.sort((a, b) => {
      return dateToNum(b.date) - dateToNum(a.date);
    });
    return recentPosts.map(post => <BlogSummary
      key={post._id}
      post={post} />);
  }

  /** Filters for Blog posts connected to a project, sorts by date. */
  function filterProjectPosts(posts) {
    const projectPosts = posts.filter(post => post.project_id).sort((a, b) => {
      return dateToNum(b.date) - dateToNum(a.date);
    });
    return projectPosts.map(post => <BlogSummary
      key={post._id}
      post={post} />);
  }

  /** Get all posts with a given tag.
   * Goal: be able to select many tags at the same time.
   */
  function filterTaggedPosts(posts) {
    const taggedPosts = posts.filter(post => post.tags.filter(
      t => t.name === showing)).sort((a, b) => dateToNum(b.date) - dateToNum(a.date));
    return taggedPosts.map(post => <BlogSummary
      key={post._id}
      post={post} />);
  }

  function filterPostsBySlug(posts) {
    const [post] = posts.filter(post => post.slug === showing);
    return <BlogPost post={post} previous={showing} />;
  }

  function showList(posts) {
    let postList;
    if (showing === 'project') {
      postList = filterProjectPosts(posts);
    } else if (showing === 'tag') {
      postList = filterTaggedPosts(posts);
    } else if (showing === 'recent') {
      postList = filterRecentPosts(posts);
    } else {
      postList = filterPostsBySlug(posts);
    }
    return postList;
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
              <BlogMenu />
            </div>

            <div className="col-9">
              {isLoading ?
                <div><h2>Loading...</h2></div> :
                showList([...allPosts])}
            </div>
          </div>
        </div>
      </div >
    </div >
  );
}