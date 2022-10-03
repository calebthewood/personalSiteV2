import Navigation from './routes-nav/Navigation';
import RoutesList from './routes-nav/RoutesList';
import Footer from './common/Footer';
import ContactMe from './common/ContactMe';

import './App.css';

function App() {
  return (
    <div className="App">
      <Navigation />
      <RoutesList />
      <ContactMe />
      <Footer />
    </div>
  );
}

export default App;
