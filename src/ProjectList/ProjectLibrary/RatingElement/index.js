import { useState } from "react";
import "./ratingElement.css";

/**
 * The visual component to a simple 5 point rating system.
 * Full system requires integration with item being rated.
 */
export function RatingElement() {
  const [score, setScore] = useState(0);
  const [ratings, setRatings] = useState(
    [false, false, false, false, false]
  );

  /** Updates star icon as cursor hovers over buttons */
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

  /** Sets current score which will determine which stars stay selected */
  function handleClick(evt) {
    if (evt.target.nodeName === 'BUTTON') {
      const score = Number(evt.target.id[1]);
      setScore(score);
    }
  }

  /** Activates all stars <= current score, deactivates remaining stars */
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
    <div className="col-12 col-md-10 col-lg-8 col-xl-7">
      <div className="card">
        <div className="card-body">
          <h5 className="card-title">5-Star Rating Component</h5>
          <h6 className="card-subtitle mb-2 text-muted">This is the over-sized visual element of a
            5-point rating system. The mouseOver event triggers the hover effect, highlighting stars
            as you'd expect. The mouseDown event sets state so that the selected rating is persisted.
            Lastly, the mouseLeave event deactivates any stars that had been hovered over, and only
            highlights the stars at or below the selected rating.</h6>

    <div className="row">
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
          </div>
          </div>
      </div>
    </div>
  );
}