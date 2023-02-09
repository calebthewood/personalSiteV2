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
              I'm Caleb, a full stack web developer and software engineer. This site is
              bit of a workshop for me. Check back to see new features,
              projects, and blog posts being added occasionally. I've had a lot of
              fun building it, I hope you enjoy it.
            </li>
            <li className="list-group-item text-bg-dark">
              When I'm not coding up programs for mundane problems I like
              biking to parks and cafes around the city, baking my way towards
              the perfect baguette, and, as an avid learner, of course, reading.
            </li>
            <li className="list-group-item text-bg-dark">
              See <a className="plain-link" href="https://s3.us-west-1.amazonaws.com/pix.ly/Caleb_Wood_Resume.pdf">resume</a> for
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
