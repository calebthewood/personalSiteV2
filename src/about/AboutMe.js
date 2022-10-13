import SectionCard from "./SectionCard";
import "./aboutMe.css";


export default function AboutMe() {
  const sectionData = [{
    url: "/portfolio",
    title: "View Portfolio",
    subtitle: "Click to see my portfolio of fullstack applications",
    description: "maybe more"
  },
  {
    url: "/projects",
    title: "View Projects",
    subtitle: "Click to see a collection of projects and components",
    description: "maybe more"
  },
  {
    url: "/blog-posts",
    title: "View Blog",
    subtitle: "Click to see my articles on development, and more",
    description: "maybe more"
  },
  ];
  return (
    <section id="about">
      <div className="container-md">
        <div className="row d-flex justify-content-evenly">
          <div className="col-xs-12 col-md-4 col-lg-4">
            <div
              className="card text-bg-dark about-card my-3">
              <img className="card-img-top" src="https://s3.us-west-1.amazonaws.com/pix.ly/selfie.jpg" alt="Caleb's Selfie" />
              <div className="card-body text-center">
                <div><i className="fas fa-map-marker-alt"></i> San Francisco, CA</div>

                <a className="contactLinks" href="https://www.linkedin.com/in/caleb-wood-440b37168/">
                  <i className="fa-brands fa-linkedin"></i></a>
                <a className="contactLinks" href="https://github.com/calebthewood">
                  <i className="fa-brands fa-github"></i></a>
                <a className="contactLinks" href="https://www.instagram.com/calebthewood/?hl=en">
                  <i className="fa-brands fa-instagram"></i></a>
              </div>
            </div>

            <div className="card text-bg-dark">
            <div className="card-body">
              <h5 className="card-title">
                View Resume <i class="fa-solid fa-arrow-up-right-from-square"></i>
              </h5>
            </div>
          </div>

          </div>

          <div className="col-xs-12 col-sm-12 col-md-8 col-lg-8">
            <div
              className="card text-bg-dark my-3 p-4">
              <h5 className="card-title">A little about myself, and the site</h5>
              <ul className="list-group list-group-flush">
                <br />
                <li className="list-group-item text-bg-dark">
                  I'm a fullstack web developer and software engineer. This site is
                  my current workshop. You should see new features and projects being
                  added each week, along with blog posts to walk through implementation
                  details. I've had a lot of fun building it, I hope you enjoy it!

                </li>
                <li className="list-group-item text-bg-dark">
                  When I'm not coding up programs for mundane problems I like
                  biking around the city, baking my way towards the perfect baguette
                  and, as an avid learner, of course, reading.
                </li>
                <li className="list-group-item text-bg-dark">
                  See <a className="plain-link" href="/public/Caleb_Wood_Resume.pdf">resume</a> for
                  professional experience.
                </li>
              </ul>
            </div>

          </div>
        </div>




        <hr />
        <div className="row d-flex justify-content-evenly">
          <div className="col-xs-12 col-sm-12 col-md-12 col-lg-12">
            <div className="row">
              {sectionData.map((section, i) => <SectionCard key={`${section.title}-${i}`} section={section} />)}
            </div>
          </div>
        </div>
        <hr />
      </div>
    </ section>
  );
};
