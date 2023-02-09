import { useParams } from "react-router-dom";


export function Bio() {
  const { param } = useParams();
  console.log("Param: ", param);

  return (
    <div className="col-12 col-md-3 gx-4">
      <div className="row justify-content-around">

        <div className="col-5 col-md-12">
          <div
            className="card text-bg-dark gy-4 gx-4 mb-4">
            <img className="card-img" src="https://s3.us-west-1.amazonaws.com/pix.ly/selfie.jpg" alt="Caleb's Selfie" />
          </div>
        </div>

        <div className="col-7 col-md-12 gx-4">
          <div className="card text-bg-dark mb-4">

            <div className="card-body">
              <h5 className="card-title">
                Caleb Wood
              </h5>
              <h6 className="card-subtitle text-muted">
                San Francisco, CA
              </h6>
            </div>

            <ul className="list-group text-center list-group-flush flex-column">
              <li id="about-btns" className="list-group-item btn-group text-bg-dark ">
                <a type="button" className="btn btn-dark" href="https://www.linkedin.com/in/caleb-wood-440b37168/">
                  <i className="fa-brands fa-linkedin"></i>
                </a>
                <a type="button" className="btn btn-dark" href="https://github.com/calebthewood">
                  <i className="fa-brands fa-github"></i>
                </a>
                <a type="button" className="btn btn-dark" href="https://www.instagram.com/calebthewood/?hl=en">
                  <i className="fa-brands fa-instagram"></i>
                </a>
                <a type="button" className="btn btn-dark" href="https://s3.us-west-1.amazonaws.com/pix.ly/Caleb_Wood_Resume.pdf">
                <i class="fa-regular fa-file"></i>
                </a>
              </li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
