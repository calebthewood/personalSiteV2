import { Link } from "react-router-dom";
import "./ReturnButton.css";

export default function ReturnButton({ route }) {
  return (
    <Link to={route}>

        <i id="returnBtn" class="fa-solid fa-arrow-left"></i>

    </Link>
  )
}