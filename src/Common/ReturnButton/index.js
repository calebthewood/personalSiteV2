import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import "./ReturnButton.css";

export default function ReturnButton({ route, back }) {
  const navigate = useNavigate();
  return (
    <Link to={route} onClick={() => navigate(-1)}>
        <i id="returnBtn" className="fa-solid fa-arrow-left"></i>
    </Link>
  )
}
