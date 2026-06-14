import React from 'react';

function Navbar({ activeTab, setActiveTab, darkMode, setDarkMode, onOpenModal }) {
  return (
    <nav className="navbar navbar-expand-lg bg-white border-bottom py-3 sticky-top">
      <div className="container-fluid px-4">
        <a 
          className="navbar-brand fw-bold fs-3 text-primary" 
          href="#"
          onClick={(e) => { e.preventDefault(); setActiveTab('explore'); }}
        >
          <span className="text-primary">•</span> BuildMate
        </a>
        <div className="mx-auto d-flex gap-5">
          <a 
            className={`nav-link ${activeTab === 'explore' ? 'active fw-semibold text-primary' : ''}`} 
            href="#"
            onClick={(e) => { e.preventDefault(); setActiveTab('explore'); }}
          >
            Explore
          </a>
          <a 
            className={`nav-link ${activeTab === 'myprojects' ? 'active fw-semibold text-primary' : ''}`} 
            href="#"
            onClick={(e) => { e.preventDefault(); setActiveTab('myprojects'); }}
          >
            My Projects
          </a>
          <a 
            className={`nav-link ${activeTab === 'applications' ? 'active fw-semibold text-primary' : ''}`} 
            href="#"
            onClick={(e) => { e.preventDefault(); setActiveTab('applications'); }}
          >
            Applications
          </a>
        </div>
        <div className="d-flex align-items-center gap-3">
          <button className="btn btn-primary px-4" onClick={onOpenModal}>
            Post Idea
          </button>
          <i 
            id="theme" 
            className={`bi ${darkMode ? 'bi-sun-fill' : 'bi-moon-stars-fill'} fs-4`}
            onClick={() => setDarkMode(!darkMode)}
            style={{ cursor: 'pointer' }}
          ></i>
          <div className="user">
            A
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
