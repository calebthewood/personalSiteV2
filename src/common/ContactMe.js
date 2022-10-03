import "./common.css";

export default function ContactMe() {
  return (
    <section id="contact">
      <p>
        Please reach out via email with any questions.
        <br />
        <a className="" href="https://www.instagram.com/calebthewood/?hl=en">calebwood.cs@gmail.com</a>
      </p>
      <p>
        <a className="" href="mailto:calebwood.cs@gmail.com">
          <i className="fa-solid fa-envelope"></i></a>
        <a className="" href="https://www.linkedin.com/in/caleb-wood-440b37168/">
          <i className="fa-brands fa-linkedin"></i></a>
        <a className="" href="https://github.com/calebthewood">
          <i className="fa-brands fa-github"></i></a>
        <a className="" href="https://www.instagram.com/calebthewood/?hl=en">
          <i className="fa-brands fa-instagram"></i></a>
      </p>
    </section>
  );
}