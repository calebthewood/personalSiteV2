import "./common.css";
import ContactMe from "./ContactMe"

export default function Footer() {
  const currentYear = new Date().getFullYear()
  return (
    <footer>
      <ContactMe />
      <p>&copy; {currentYear} Caleb Wood. All rights reserved.</p>
    </footer>
  )
}