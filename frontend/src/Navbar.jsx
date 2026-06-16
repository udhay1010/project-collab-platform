import { useState } from 'react';

function Navbar({ activeTab, setActiveTab, darkMode, setDarkMode, onOpenModal, currentUser, onLogout }) {
  const [showDropdown, setShowDropdown] = useState(false);

  const getUserInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  };

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
          <a 
            className={`nav-link ${activeTab === 'profile' ? 'active fw-semibold text-primary' : ''}`} 
            href="#"
            onClick={(e) => { e.preventDefault(); setActiveTab('profile'); }}
          >
            Profile
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
          
          <div className="position-relative">
            <div 
              className="user" 
              onClick={() => setShowDropdown(!showDropdown)}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              {getUserInitials(currentUser?.name)}
            </div>

            {showDropdown && (
              <>
                <div 
                  style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }} 
                  onClick={() => setShowDropdown(false)}
                />
                <div 
                  className="position-absolute bg-white border rounded shadow p-2" 
                  style={{ 
                    top: '60px', 
                    right: 0, 
                    zIndex: 1000, 
                    minWidth: '200px',
                    borderRadius: '12px' 
                  }}
                >
                  <div className="px-3 py-2 border-bottom mb-2">
                    <div className="fw-bold text-dark text-truncate">{currentUser?.name}</div>
                    <div className="text-muted small text-truncate">{currentUser?.email}</div>
                  </div>
                  <a 
                    className="d-flex align-items-center gap-2 px-3 py-2 nav-link text-dark text-decoration-none dropdown-hover-item" 
                    href="#" 
                    onClick={(e) => { 
                      e.preventDefault(); 
                      setActiveTab('profile'); 
                      setShowDropdown(false); 
                    }}
                    style={{ borderRadius: '8px' }}
                  >
                    <i className="bi bi-person"></i> View Profile
                  </a>
                  <a 
                    className="d-flex align-items-center gap-2 px-3 py-2 nav-link text-danger text-decoration-none dropdown-hover-item" 
                    href="#" 
                    onClick={(e) => { 
                      e.preventDefault(); 
                      onLogout(); 
                      setShowDropdown(false); 
                    }}
                    style={{ borderRadius: '8px' }}
                  >
                    <i className="bi bi-box-arrow-right"></i> Sign Out
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
