import "./App.css";
import { useState, useEffect } from "react";
import { BlogAPI } from "./BlogList/BlogAPI";
import { TwitterAPI } from "./TwitterAPI";
import { Navigation } from "./RoutesNav/Navigation";
import { RoutesList } from "./RoutesNav/RoutesList";
import { Footer } from "./Common/Footer";
import { Header } from "./Common/Header";
import { Metrics } from "./Common/Metric";
import { Bio } from "./Common/Bio/Bio";
import { NonBioRoutesList } from "./RoutesNav/NonBioRoutes";
import { useLocation } from "react-router-dom";


export default function App() {

  const [isLoading, setIsLoading] = useState(true);
  const [allPosts, setAllPosts] = useState(null);
  const [tweets, setTweets] = useState(null);
  const path = useLocation().pathname

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


  console.log(path)

  return (
    <div className="App">
      <Navigation />
      <Header />
      {path === "/" || path === "/dashboard" ? <NonBioRoutesList />
      :
      (<div className="container">
        <div className="row">
          <Bio />
          <div className="col-12 col-md-9">
            <RoutesList isLoading={isLoading} allPosts={allPosts} tweets={tweets} />
          </div>
        </div>
      </div>)}

      <Footer />
      <Metrics />
    </div>
  );
}
