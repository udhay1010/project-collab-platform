import React, { useState, useEffect } from 'react';
import Navbar from './Navbar.jsx';
import Explore from './Explore.jsx';
import MyProjects from './MyProjects.jsx';
import Applications from './Applications.jsx';
import NewProjectModal from './NewProjectModal.jsx';

const INITIAL_OPEN_PROJECTS = [
  {
    id: 1,
    title: 'AI Study Buddy Chrome Extension',
    description: 'A Chrome extension that uses LLMs to summarize lecture slides, generate flashcards and quiz students in real time.',
    skills: ['React', 'TypeScript', 'Machine Learning'],
    slots: 3,
    interested: 0,
    owner: 'Udhay',
    time: '2h ago',
    initial: 'U',
    color: 'green'
  },
  {
    id: 2,
    title: 'Campus Lost & Found Platform',
    description: 'A web app where students post lost/found items with photo uploads and messaging.',
    skills: ['React', 'Node.js', 'Database'],
    slots: 1,
    interested: 0,
    owner: 'Narayanan',
    time: '5h ago',
    initial: 'N',
    color: 'purple'
  },
  {
    id: 3,
    title: 'Smart Attendance System',
    description: 'Face recognition based attendance management system for colleges.',
    skills: ['Python', 'Machine Learning', 'Database'],
    slots: 2,
    interested: 3,
    owner: 'Rishab Ganesh',
    time: '8h ago',
    initial: 'RG',
    color: 'green'
  },
  {
    id: 4,
    title: 'AI Resume Analyzer',
    description: 'Analyze resumes and provide suggestions using artificial intelligence.',
    skills: ['Machine Learning', 'Python'],
    slots: 1,
    interested: 5,
    owner: 'Harini',
    time: '10h ago',
    initial: 'H',
    color: 'purple'
  },
  {
    id: 5,
    title: 'Fitness Tracking App',
    description: 'Mobile application to track workouts, calories and fitness goals.',
    skills: ['Flutter', 'Node.js'],
    slots: 4,
    interested: 2,
    owner: 'Danush',
    time: '12h ago',
    initial: 'D',
    color: 'green'
  },
  {
    id: 6,
    title: 'Online Quiz Platform',
    description: 'Create and conduct quizzes with automatic evaluation.',
    skills: ['React', 'Node.js'],
    slots: 3,
    interested: 1,
    owner: 'Sathyam Kumar',
    time: '1d ago',
    initial: 'SK',
    color: 'purple'
  },
  {
    id: 7,
    title: 'Expense Tracker',
    description: 'Track daily expenses and generate monthly spending reports.',
    skills: ['React', 'Database'],
    slots: 2,
    interested: 4,
    owner: 'Shardul Rawal',
    time: '1d ago',
    initial: 'SR',
    color: 'green'
  }
];

const INITIAL_MY_PROJECTS = [
  {
    id: 101,
    title: 'Student Dashboard',
    description: 'Responsive dashboard built using HTML, CSS, Bootstrap and JavaScript.',
    members: 4
  },
  {
    id: 102,
    title: 'AI Resume Analyzer',
    description: 'AI-powered resume screening and feedback system.',
    members: 2
  },
  {
    id: 103,
    title: 'Campus Lost & Found',
    description: 'Platform for students to report and find lost items.',
    members: 5
  }
];

const INITIAL_APPLICATIONS = [
  {
    id: 201,
    title: 'AI Study Buddy Chrome Extension',
    time: 'Applied 2 days ago',
    status: 'Pending Review',
    statusClass: 'pending'
  },
  {
    id: 202,
    title: 'Campus Lost & Found Platform',
    time: 'Applied 5 days ago',
    status: 'Accepted',
    statusClass: 'accepted'
  },
  {
    id: 203,
    title: 'Fitness Tracker App',
    time: 'Applied 1 week ago',
    status: 'Rejected',
    statusClass: 'rejected'
  }
];

function App() {
  const [activeTab, setActiveTab] = useState('explore');
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  
  const [projects, setProjects] = useState(INITIAL_OPEN_PROJECTS);
  const [myProjects, setMyProjects] = useState(INITIAL_MY_PROJECTS);
  const [applications, setApplications] = useState(INITIAL_APPLICATIONS);
  
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

  // Apply project
  const handleApply = (project) => {
    const newApp = {
      id: Date.now(),
      title: project.title,
      time: 'Applied just now',
      status: 'Pending Review',
      statusClass: 'pending'
    };
    setApplications([newApp, ...applications]);
    
    // open project
    setProjects(projects.map(p => {
      if (p.id === project.id) {
        return {
          ...p,
          interested: p.interested + 1,
          slots: Math.max(0, p.slots - 1)
        };
      }
      return p;
    }));
  };

  // Add new project
  const handleAddProject = (projectDetails) => {
    const newId = Date.now();
    
    const newProject = {
      ...projectDetails,
      id: newId
    };
    setProjects([newProject, ...projects]);
    
    const newMyProject = {
      id: newId + 1,
      title: projectDetails.title,
      description: projectDetails.description,
      members: 1
    };
    setMyProjects([newMyProject, ...myProjects]);
  };

  // projects already applied
  const appliedProjectIds = applications.map(app => {
    // Find matching project 
    const match = projects.find(p => p.title.toLowerCase() === app.title.toLowerCase());
    return match ? match.id : null;
  }).filter(Boolean);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'explore':
        return (
          <Explore 
            projects={projects}
            selectedSkills={selectedSkills}
            setSelectedSkills={setSelectedSkills}
            onApply={handleApply}
            appliedProjectIds={appliedProjectIds}
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
      default:
        return null;
    }
  };

  return (
    <>
      <Navbar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onOpenModal={() => setShowModal(true)}
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
