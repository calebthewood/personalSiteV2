import "./App.css";
import { RoutesList } from "./RoutesNav/RoutesList";
/** Site has be vastly simplified since previous version. Removed blog, 
 * dashboard, and metrics. See git history for this code. */
export default function App() {

  return (
    <div className="App">
      <main id="main" className="container">
        <RoutesList />
      </main>
      {/* <Metrics /> */}
    </div>
  );
}
