import { SectionCard } from "./SectionCard";
import { sectionData } from "./sectionData";
import "./AboutMe.css";


export function AboutMe() {
  return (
    <section id="about">
      <div className="col">
        <div
          className="card text-bg-dark p-4 mb-4">
          <h5 className="card-title">A little about myself, and the site</h5>
          <ul className="list-group list-group-flush">
            <li className="list-group-item text-bg-dark">
            I'm Caleb, a full-stack web developer and software engineer. This site is a bit of a workshop for me. In its current iteration, it is a React App with a Node-Express server to support the blog and dashboard features. I've had a lot of fun building it; I hope you enjoy it.
            </li>
            <li className="list-group-item text-bg-dark">
            When I'm not coding up programs for mundane problems, I spend my time biking up and down the San Francisco hills, baking my way towards the perfect baguette, and enjoying a good book, movie, or game.
            </li>
            <li className="list-group-item text-bg-dark">
              See <a className="plain-link" href="https://s3.us-west-1.amazonaws.com/pix.ly/Caleb_Wood_Resume.pdf">resumé</a> for
              professional experience.
            </li>
          </ul>
        </div>
        <div className="row text-center">
          {sectionData.map((section, i) => <SectionCard key={`${section.title}-${i}`} section={section} />)}
        </div>
      </div>
    </ section>
  );
};
