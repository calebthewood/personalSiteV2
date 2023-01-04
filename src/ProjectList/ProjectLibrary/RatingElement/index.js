import { useState } from "react";
import { starIcons } from "../../../utils";
import "./ratingElement.css";

export function RatingElement() {
  const [score, setScore] = useState(0);
  const [ratings, setRatings] = useState(
    [false, false, false, false, false]
  );

  function handleMouseEnter(evt) {
    const rating = Number(evt.target.id[1]);
    const newRatings = [];
    for (let i = 0; i < 5; i++) {
      if (i < rating) {
        newRatings.push(true);
      } else {
        newRatings.push(false);
      }
    }
    setRatings(newRatings);
  }

  function handleClick(evt) {
    if (evt.target.nodeName === 'BUTTON') {
      const score = Number(evt.target.id[1]);
      setScore(score);
    }
  }

  function handleMouseLeave(evt) {
    const newRatings = [];
    for (let i = 0; i < 5; i++) {
      if (i < score) {
        newRatings.push(true);
      } else {
        newRatings.push(false);
      }
    }
    setRatings(newRatings);
  }

  return (
    <div className="btn-group" role="group">
      {ratings.map(
        (star, i) => <button
          id={`r${i + 1}`}
          className="btn btn-light px-0 mx-0"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onMouseDown={handleClick}
        >{star ? <i class="fa-solid fa-star"></i>
          : <i class="fa-regular fa-star"></i>}</button>
      )}
    </div>
  );
}