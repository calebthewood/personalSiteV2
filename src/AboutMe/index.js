import { SectionCard } from "./SectionCard";
import { sectionData } from "./sectionData";
import "./AboutMe.css";


export function AboutMe() {
  return (
    <section id="about">
      <div className="container-md col">

        <div className="row">

          <div className="col-12 col-md-4 col-lg-3">
            <div className="row ">

              <div className="col-xs-12 col-sm-4 col-md-12 mb-4">
                <div
                  className="card text-bg-dark about-card">
                  <img className="card-img-top" src="https://s3.us-west-1.amazonaws.com/pix.ly/selfie.jpg" alt="Caleb's Selfie" />
                </div>
              </div>

              <div className="col-xs-12 col-sm-8 col-md-12 mb-4">
                <div className="card text-bg-dark">
                  <div className="card-body">
                    <h5 className="card-title">
                      Caleb Wood
                    </h5>
                    <h6 className="card-subtitle text-muted">
                      San Francisco, CA
                    </h6>
                  </div>
                  <ul className="list-group text-center list-group-flush flex-column">
                    <li className="list-group-item d-grid gap-2 text-bg-dark">
                      <a type="button" className="btn btn-dark" href="https://s3.us-west-1.amazonaws.com/pix.ly/Caleb_Wood_Resume_12_17.pdf">
                        <h6 className="card-subtitle">View Resume  <i className="fa-solid fa-arrow-up-right-from-square"></i></h6>
                      </a>
                    </li>
                    <li id="about-btns" className="list-group-item btn-group text-bg-dark ">
                      <a type="button" className="btn btn-dark" href="https://www.linkedin.com/in/caleb-wood-440b37168/">
                        <i className="about-icons fa-brands fa-linkedin"></i>
                      </a>
                      <a type="button" className="btn btn-dark" href="https://github.com/calebthewood">
                        <i className="about-icons fa-brands fa-github"></i>
                      </a>
                      <a type="button" className="btn btn-dark" href="https://www.instagram.com/calebthewood/?hl=en">
                        <i className="about-icons fa-brands fa-instagram"></i>
                      </a>
                    </li>
                  </ul>
                </div>
              </div>

            </div>
          </div>


          <div className="col-12 col-md-8 col-lg-9">
            <div
              className="card text-bg-dark p-4 mb-4">
              <h5 className="card-title">A little about myself, and the site</h5>
              <ul className="list-group list-group-flush">
                <br />
                <li className="list-group-item text-bg-dark">
                  I'm a fullstack web developer and software engineer. This site is
                  bit of a workshop for me. Check back to see new features,
                  projects, and blog posts being added weekly. I've had a lot of
                  fun building it, I hope you enjoy it.
                </li>
                <li className="list-group-item text-bg-dark">
                  When I'm not coding up programs for mundane problems I like
                  biking to parks and cafes around the city, baking my way towards
                  the perfect baguette, and, as an avid learner, of course, reading.
                </li>
                <li className="list-group-item text-bg-dark">
                  See <a className="plain-link" href="https://s3.us-west-1.amazonaws.com/pix.ly/Caleb_Wood_Resume_12_17.pdf">resume</a> for
                  professional experience.
                </li>
              </ul>
            </div>
            <div className="row text-center">
              {sectionData.map((section, i) => <SectionCard key={`${section.title}-${i}`} section={section} />)}
            </div>
          </div>

        </div>
      </div>

    </ section>
  );
};
