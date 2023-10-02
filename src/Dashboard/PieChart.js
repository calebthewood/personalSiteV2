import { useRef, useEffect } from "react";
import "./dashboard.css";


export function PieChart({ results }) {

  const canvasRef = useRef(null);

  let total = results.reduce(
    (sum, { count }) => sum + count, 0);

  useEffect(() => {
    function draw(ctx) {
      ctx.fillStyle = '#000000';

      //start at top
      let currentAngle = 0.5 * Math.PI;
      for (let result of results) {
        let sliceAngle = (result.count / total) * 2 * Math.PI;
        ctx.beginPath();
        ctx.arc(100, 100, 100, currentAngle, currentAngle + sliceAngle);
        currentAngle += sliceAngle;
        ctx.lineTo(100, 100);
        ctx.fillStyle = result.color;
        ctx.fill();
      }
    };
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    draw(context);
  }, [results, total]);

  return (
    <div>
      <div className="row enter-from-below">
        {results.map((item, i) => {
          let style = { background: item.color };
          return (
            <div key={"pie-slice-" + i} className="col-6 card-subtitle mb-1 text-muted">
              <div className="legend" style={style}></div>
              {" /" + item.name}
            </div>);
        })}
      </div>

      <div className="row text-center justify-content-center">
        <div id="pie-chart" className="col-md-auto">
          <canvas width="200" height="200" ref={canvasRef} />
        </div>
      </div>
    </div>
  );
}