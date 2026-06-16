import { useState, useEffect, useCallback } from 'react';
import Navbar from './Navbar.jsx';
import Explore from './Explore.jsx';
import MyProjects from './MyProjects.jsx';
import Applications from './Applications.jsx';
import Profile from './Profile.jsx';
import LoginRegister from './LoginRegister.jsx';
import NewProjectModal from './NewProjectModal.jsx';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState('explore');
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  
  const [projects, setProjects] = useState([]);
  const [myProjects, setMyProjects] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [showModal, setShowModal] = useState(false);

  // Dark Mode state 
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Auth initialization check
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setAuthLoading(false);
        return;
      }
      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (response.ok && data.success) {
          setCurrentUser(data.user);
        } else {
          localStorage.removeItem('token');
        }
      } catch (err) {
        console.error("Auth check error", err);
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, []);

  // Fetch all projects, my projects, and user applications when logged in
  const fetchData = useCallback(async () => {
    if (!currentUser) return;
    setLoadingData(true);
    try {
      const token = localStorage.getItem('token');
      
      const [projRes, myProjRes, appRes] = await Promise.all([
        fetch('/api/projects'),
        fetch(`/api/projects/user/${currentUser._id}`),
        fetch('/api/applications/mine', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      ]);

      const projData = await projRes.json();
      const myProjData = await myProjRes.json();
      const appData = await appRes.json();

      if (projData.success) {
        setProjects(projData.projects || []);
      }
      if (myProjData.success) {
        // Map user projects to expected UI fields
        const mappedUserProj = (myProjData.projects || []).map(p => ({
          id: p._id,
          title: p.title,
          description: p.description,
          members: 1 // default initial creator
        }));
        setMyProjects(mappedUserProj);
      }
      if (appData.success) {
        // Map applications to expected UI fields
        const mappedApps = (appData.applications || []).map(app => {
          const getHumanTime = (createdAt) => {
            if (!createdAt) return 'Applied just now';
            const diff = Date.now() - new Date(createdAt).getTime();
            const mins = Math.floor(diff / 60000);
            if (mins < 1) return 'Applied just now';
            if (mins < 60) return `Applied ${mins}m ago`;
            const hours = Math.floor(mins / 60);
            if (hours < 24) return `Applied ${hours}h ago`;
            const days = Math.floor(hours / 24);
            return `Applied ${days}d ago`;
          };

          return {
            id: app._id,
            title: app.project?.title || 'Unknown Project',
            time: getHumanTime(app.createdAt),
            status: app.status === 'pending' ? 'Pending Review' : app.status.charAt(0).toUpperCase() + app.status.slice(1),
            statusClass: app.status
          };
        });
        setApplications(mappedApps);
      }
    } catch (err) {
      console.error("Error fetching data", err);
    } finally {
      setLoadingData(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchData();
    }
  }, [currentUser, fetchData]);

  // Handle Authentication success
  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    setActiveTab('explore');
  };

  // Handle Log Out
  const handleLogout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    setProjects([]);
    setMyProjects([]);
    setApplications([]);
    setActiveTab('explore');
  };

  // Handle Profile Update
  const handleProfileUpdate = (updatedUser) => {
    setCurrentUser(updatedUser);
  };

  // Apply to project
  const handleApply = async (project) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          projectId: project._id,
          message: `I'm interested in joining the team for ${project.title}!`
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        // Refresh local applications and projects list
        fetchData();
      } else {
        alert(data.message || 'Failed to submit application');
      }
    } catch (err) {
      console.error("Failed to apply", err);
      alert('Error submitting application. Please try again.');
    }
  };

  // Add new project
  const handleAddProject = async (projectDetails) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(projectDetails)
      });
      
      const data = await response.json();
      if (response.ok && data.success) {
        // Refresh local projects and my projects lists
        fetchData();
      } else {
        alert(data.message || 'Failed to post project idea');
      }
    } catch (err) {
      console.error("Failed to create project", err);
      alert('Error creating project. Please try again.');
    }
  };

  // Find IDs of projects the user has applied to
  const appliedProjectIds = applications.map(app => {
    const match = projects.find(p => p.title.toLowerCase() === app.title.toLowerCase());
    return match ? match._id : null;
  }).filter(Boolean);

  const renderActiveView = () => {
    if (loadingData) {
      return (
        <div className="container text-center py-5 mt-5">
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading data...</span>
          </div>
          <p className="mt-3 text-muted">Updating dashboard state...</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'explore':
        return (
          <Explore 
            projects={projects}
            selectedSkills={selectedSkills}
            setSelectedSkills={setSelectedSkills}
            onApply={handleApply}
            appliedProjectIds={appliedProjectIds}
            currentUser={currentUser}
          />
        );
      case 'myprojects':
        return (
          <MyProjects 
            myProjects={myProjects}
            onOpenModal={() => setShowModal(true)}
          />
        );
      case 'applications':
        return (
          <Applications 
            applications={applications}
          />
        );
      case 'profile':
        return (
          <Profile 
            user={currentUser}
            onProfileUpdate={handleProfileUpdate}
          />
        );
      default:
        return null;
    }
  };

  // Show full-page loader during initial token validation check
  if (authLoading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center bg-white dark" style={{ minHeight: '100vh' }}>
        <div className="spinner-border text-primary" role="status" style={{ width: '3.5rem', height: '3.5rem' }}>
          <span className="visually-hidden">Initializing...</span>
        </div>
        <h4 className="mt-4 fw-bold text-dark">Initializing BuildMate</h4>
        <p className="text-muted small">Loading session settings...</p>
      </div>
    );
  }

  // Render Authentication screen if user session is not active
  if (!currentUser) {
    return (
      <LoginRegister onAuthSuccess={handleAuthSuccess} />
    );
  }

  return (
    <>
      <Navbar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onOpenModal={() => setShowModal(true)}
        currentUser={currentUser}
        onLogout={handleLogout}
      />
      
      {renderActiveView()}
      
      <NewProjectModal 
        show={showModal}
        onClose={() => setShowModal(false)}
        onAddProject={handleAddProject}
      />
    </>
  );
}

export default App;
