import SectionCard from "./SectionCard";


export default function AboutMe() {
  const sectionData = [{
    url: "/portfolio",
    title: "Portfolio",
    subtitle: "Click to see my fullstack portfolio",
    description: "maybe more"
  },
  {
    url: "/projects",
    title: "Projects",
    subtitle: "Click to see a collection of projects and components",
    description: "maybe more"
  },
  {
    url: "/blog",
    title: "My Blog",
    subtitle: "Click to see my blog where I write about my apps, breads, and whatever else.",
    description: "maybe more"
  },
  ];
  return (
    <section id="about">
      <div class="container">

        <div class="row">
          <div class="col">
            <header>
              <h1>About</h1>
            </header>
          </div>
        </div>

        <div class="row d-flex justify-content-evenly">
          <div class="col-xs-12 col-md-10 col-lg-4">
            <div
              class="card bg-transparent about-card my-5">
              <img class="card-img-top" src="https://s3.us-west-1.amazonaws.com/pix.ly/selfie.jpg" alt="Caleb's Selfie" />
              <div class="card-body text-center">
                <div><i class="fas fa-map-marker-alt"></i> San Francisco, CA</div>

                <a class="contactLinks" href="https://www.linkedin.com/in/caleb-wood-440b37168/">
                  <i class="fa-brands fa-linkedin"></i></a>
                <a class="contactLinks" href="https://github.com/calebthewood">
                  <i class="fa-brands fa-github"></i></a>
                <a class="contactLinks" href="https://www.instagram.com/calebthewood/?hl=en">
                  <i class="fa-brands fa-instagram"></i></a>

              </div>
            </div>
          </div>

          <div class="col-xs-12 col-sm-12 col-md-10 col-lg-7">
            <div
              class="card bg-transparent about-card my-5 p-4">
              <h5 class="card-title">A little about myself</h5>
              <ul class="list-group list-group-flush">
                <br />
                <li class="list-group-item bg-transparent">
                  I am a software engineer with an emphasis on fullstack web development. The whole stack,
                  you ask? Yes, the whole stack! I enjoy writing a clever SQL query almost as much as I
                  like building a clean, interactive UI, and everything in between too. Most recently,
                  I've spent a lot of time working in the Python Flask ecosystem, but I'm just as comfortable
                  building in Node. See <a href="/public/Caleb_Wood_Resume.pdf">resume</a> for
                  professional and personal experience.
                </li>
                <li class="list-group-item bg-transparent">
                  When I'm not coding up <a href="#projects">programs</a> for mundane problems I like
                  getting out in nature, baking my way towards the perfect baguette,
                  and, as an avid learner, of course, reading. Fiction, non-fiction,
                  blogs, articles, docs I read it all!
                </li>

              </ul>
            </div>
          </div>
        </div>

        <div className="row d-flex justify-content-evenly">
          <div class="col-xs-12 col-sm-12 col-md-10 col-lg-11">
            <div className="row">
              {sectionData.map(section => <SectionCard section={section} />)}
            </div>
          </div>
        </div>

      </div>
    </ section>
  );
};