import SectionCard from "./SectionCard";
import "./aboutMe.css";


export default function AboutMe() {
  const sectionData = [{
    url: "/portfolio",
    title: "Portfolio",
    subtitle: "Click to see my portfolio of fullstack applications",
    description: "maybe more"
  },
  {
    url: "/projects",
    title: "Projects",
    subtitle: "Click to see a collection of projects and components",
    description: "maybe more"
  },
  {
    url: "/blog-posts",
    title: "Blog",
    subtitle: "Click to see my articles on development, and more",
    description: "maybe more"
  },
  ];
  return (
    <section id="about">
      <div className="row d-flex justify-content-evenly">
        <div className="col-xs-12 col-md-4 col-lg-4">
          <div
            className="card bg-transparent about-card my-3">
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
        </div>

        <div className="col-xs-12 col-sm-12 col-md-8 col-lg-8">
          <div
            className="card bg-transparent about-card my-3 p-4">
            <h5 className="card-title">A little about myself</h5>
            <ul className="list-group list-group-flush">
              <br />
              <li className="list-group-item bg-transparent">
                I am a software engineer with an emphasis on fullstack web development. The whole stack,
                you ask? Yes, the whole stack! I enjoy writing a clever SQL query almost as much as I
                like building a clean, interactive UI, and everything in between too. Most recently,
                I've spent a lot of time working in the Python Flask ecosystem, but I'm just as comfortable
                building in Node. See <a href="/public/Caleb_Wood_Resume.pdf">resume</a> for
                professional and personal experience.
              </li>
              <li className="list-group-item bg-transparent">
                When I'm not coding up <a href="#projects">programs</a> for mundane problems I like
                getting out in nature, baking my way towards the perfect baguette,
                and, as an avid learner, of course, reading. Fiction, non-fiction,
                blogs, articles, docs I read it all!
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
    </ section>
  );
};
