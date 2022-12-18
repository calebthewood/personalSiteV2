import "./LoadingSpinner.css";
export function LoadingSpinner() {

  return (
    <div className="row justify-content-center align-items-center spinner-container">
      <div className="col-2 loading-spinner"></div>
      <div className="col-3 mx-2">
        <span className="h1">Loading...</span>
      </div>
    </div>
  );
}