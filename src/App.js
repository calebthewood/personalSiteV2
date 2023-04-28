import "./App.css";
import { useState, useEffect } from "react";
import { BlogAPI } from "./BlogList/BlogAPI";
import { TwitterAPI } from "./TwitterAPI";
import { Navigation } from "./RoutesNav/Navigation";
import { useLocation } from "react-router-dom";
import { RoutesList } from "./RoutesNav/RoutesList";
import { Footer } from "./Common/Footer";
import { Header } from "./Common/Header";
import { Metrics } from "./Common/Metric";
import { Bio } from "./Common/Bio/Bio";


export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [allPosts, setAllPosts] = useState(null);
  const [tweets, setTweets] = useState(null);
  const { pathname } = useLocation();
  const hideBio = pathname === '/' || pathname.split('/').includes('dashboard');


  /** Populates Blog Posts & Tweets state */
  useEffect(function () {
    async function getPosts() {
      let posts = await BlogAPI.fetchPosts();
      setAllPosts(posts);
      let tweets = await TwitterAPI.getTweetsByTag("hundredDays");
      setTweets(tweets);
      setIsLoading(false);
    }
    console.debug("BlogList useEffect getPostsOnMount");
    getPosts(); // Recent is the default
  }, []);

  return (
    <div className="App">
      <Navigation />
      <Header />
      <div className="container">
        {
          hideBio ?
            <RoutesList isLoading={isLoading} allPosts={allPosts} tweets={tweets} />
            :
            <div className="row">
              <Bio />
              <div className="col-12 col-md-9">
                <RoutesList isLoading={isLoading} allPosts={allPosts} tweets={tweets} />
              </div>
            </div>
        }
      </div>

      <Footer />
      <Metrics />
    </div>
  );
}
