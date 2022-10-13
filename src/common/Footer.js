import { useLocation } from "react-router-dom";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { pathname } = useLocation();

  if (pathname) return <></>;

  return (
    <footer className="py-3 text-bg-dark text-center container-flex">
      <div className="container pt-2">
        <h5>Contact Me by email with any questions:</h5>
        <p><a class="contactLinks" href="mailto:calebwood.cs@gmail.com">calebwood.cs@gmail.com</a></p>
        <hr className="border border-light" />
        <ul className="nav justify-content-center my-3">

          <li>
            <a className="contact-icon" href="mailto:calebwood.cs@gmail.com">
              <i className="fa-solid fa-envelope"></i>
            </a>
          </li>
          <li>
            <a className="contact-icon" href="https://www.linkedin.com/in/caleb-wood-440b37168/">
              <i className="fa-brands fa-linkedin"></i>
            </a>
          </li>
          <li>
            <a className="contact-icon" href="https://github.com/calebthewood">
              <i className="fa-brands fa-github"></i>
            </a>
          </li>
          <li>
            <a className="contact-icon" href="https://www.instagram.com/calebthewood/?hl=en">
              <i className="fa-brands fa-instagram"></i>
            </a>
          </li>
        </ul>

        <p className="text-center text-muted">
          <p>&copy; {currentYear} Caleb Wood. All rights reserved.</p>
        </p>
      </div>
    </footer>
  );
}