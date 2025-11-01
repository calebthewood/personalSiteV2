import { useState } from "react";

export function WhittleButton({ listLen, handleClick }) {
  const [message, setMessage] = useState(`${listLen} words to choose from`);

  return (
    <div className="d-grid gap-2">
      <button
        className="btn btn-outline-dark"
        onClick={handleClick}
        onMouseOver={() => setMessage("Whittle 'em down!")}
        onMouseLeave={() => setMessage(`${listLen} options`)}>
        {message}
      </button>
    </div>);
}