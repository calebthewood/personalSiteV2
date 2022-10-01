//Need to install react router and add imports


/**
 * Site-wide Routes
 *
 */

function RoutesList() {

  return (
    <div>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/blog" element={<Blog />} />
        {/* Catch all other routes and route to "/" */}
        <Route path="*" element={<Navigate to="/" />}/>
      </Routes>
    </div>
  );
}