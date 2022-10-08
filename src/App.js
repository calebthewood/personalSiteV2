import Navigation from './routes-nav/Navigation';
import RoutesList from './routes-nav/RoutesList';
import Footer from './common/Footer';
import Header from './common/Header';
import './App.css';

function App() {
  return (
    <div className="App">
      <Navigation />
      <div className="container">
        <Header />
        <RoutesList />
        <Footer />
      </div>
    </div>
  );
}

export default App;
