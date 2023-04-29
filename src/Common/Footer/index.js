import { useLocation } from "react-router-dom";
import './footer.css'

export function Footer() {
  const currentYear = new Date().getFullYear();
  const { pathname } = useLocation();

  if (pathname === "/") return <></>;

  return (
    <footer className="py-3 text-bg-dark text-center container-flex">
      <div className="container pt-2">
        <h5>Contact me by email with any questions</h5>
        <p><a type="button" className="email-btn btn btn-dark" href="mailto:calebwood.cs@gmail.com">calebwood.cs@gmail.com</a></p>
        <hr className="border border-light" />

        <ul id="about-btns" className="nav justify-content-center my-3">
          <li className="list-group-item btn-group text-bg-dark">
            <a type="button" className="btn btn-dark" href="mailto:calebwood.cs@gmail.com">
              <i className="about-icons fa-solid fa-envelope"></i>
            </a>
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

        <p className="text-center text-muted">
          &copy; {currentYear} Caleb Wood. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
