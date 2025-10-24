import "./Header.css";

function GHeader() {
  return (
    <div className="header-container">
      <div className="container-fluid">
        <div className="row align-items-center">
          <div className="col-md-6">
            <h1 className="fw-bold mb-0 header-title">CWRS</h1>
          </div>
          <div className="col-md-6 text-end">
            <nav className="nav-links">
              <a href="#" className="nav-link">
                About Us
              </a>
              <a href="#" className="nav-link">
                Contact
              </a>
              <a href="#" className="nav-link">
                Update
              </a>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}
export default GHeader;
