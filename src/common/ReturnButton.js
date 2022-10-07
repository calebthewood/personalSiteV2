import { Link } from "react-router-dom";
import "./ReturnButton.css";

export default function ReturnButton({ route, back }) {
  return (
    <Link to={route} onClick={back}>

        <i id="returnBtn" className="fa-solid fa-arrow-left"></i>

    </Link>
  )
}