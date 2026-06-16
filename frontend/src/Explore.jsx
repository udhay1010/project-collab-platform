import { useState } from 'react';

const SKILLS_LIST = [
  'React', 'Node.js', 'Python', 'UI/UX', 'Figma', 
  'Machine Learning', 'TypeScript', 'Database', 'Vue', 'Flutter'
];

function Explore({ projects, selectedSkills, setSelectedSkills, onApply, appliedProjectIds, currentUser }) {
  const [showMatchesOnly, setShowMatchesOnly] = useState(false);

  const toggleSkill = (skill) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const getMatchPercent = (projectSkills) => {
    if (!currentUser || !currentUser.skills || currentUser.skills.length === 0 || !projectSkills || projectSkills.length === 0) {
      return 0;
    }
    const matched = projectSkills.filter(s => 
      currentUser.skills.some(userSkill => userSkill.toLowerCase() === s.toLowerCase())
    );
    return Math.round((matched.length / projectSkills.length) * 100);
  };

  const getHumanTime = (createdAt) => {
    if (!createdAt) return 'Just now';
    // eslint-disable-next-line react-hooks/purity
    const diff = Date.now() - new Date(createdAt).getTime();
    if (diff < 60000) return 'Just now';
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getColorClass = (title) => {
    const colors = ['purple', 'green'];
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
      hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const getUserInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  };

  // 1. Skill check filtering
  let filteredProjects = selectedSkills.length === 0
    ? projects
    : projects.filter(project => 
        project.skillsNeeded && project.skillsNeeded.some(skill => 
          selectedSkills.some(selected => selected.toLowerCase() === skill.toLowerCase())
        )
      );

  // 2. Match calculation
  const totalMatches = projects.filter(p => getMatchPercent(p.skillsNeeded) > 0).length;

  // 3. Optional match filtering
  if (showMatchesOnly) {
    filteredProjects = filteredProjects.filter(p => getMatchPercent(p.skillsNeeded) > 0);
  }

  const getTagClass = (skill) => {
    const s = skill.toLowerCase();
    if (s === 'react' || s === 'flutter' || s === 'python') return 'tag blue';
    if (s === 'node.js' || s === 'node') return 'tag green';
    if (s === 'database') return 'tag lightgreen';
    if (s === 'machine learning' || s === 'ml') return 'tag yellow';
    if (s === 'typescript') return 'tag gray';
    return 'tag gray';
  };

  return (
    <div className="container-fluid">
      <div className="row">
        {/* Left Sidebar */}
        <div className="col-lg-3 left">
          <h6 className="mt-4 mb-4 text-uppercase fw-bold text-muted" style={{ fontSize: '12px', letterSpacing: '1px' }}>
            Filter By Skill
          </h6>
          <div className="skills">
            {SKILLS_LIST.map((skill) => (
              <div className="skill" key={skill} style={{ cursor: 'pointer' }} onClick={() => toggleSkill(skill)}>
                <span className="fw-medium text-dark" style={{ fontSize: '15px' }}>{skill}</span>
                <input 
                  type="checkbox" 
                  className="form-check-input"
                  checked={selectedSkills.includes(skill)}
                  onChange={() => {}} // click is handled by parent div
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            ))}
          </div>

          {/* Match Widget */}
          <div className="match mt-5 shadow-sm border p-4 bg-white" style={{ borderRadius: '16px' }}>
            <h5 className="fw-bold text-dark mb-2">My Skill Matches</h5>
            <p className="text-muted small mb-4">Find projects that fit your skills ({currentUser?.skills?.join(', ') || 'none selected'})</p>
            
            <div className="d-flex justify-content-between mb-4">
              <div>
                <h2 className="fw-bold text-primary mb-0">{totalMatches}</h2>
                <p className="mb-0 text-muted small">Matches</p>
              </div>
              <div className="border-end"></div>
              <div>
                <h2 className="fw-bold text-dark mb-0">{projects.length}</h2>
                <p className="mb-0 text-muted small">Total Projects</p>
              </div>
            </div>

            <div className="form-check form-switch pt-2 border-top">
              <input 
                className="form-check-input" 
                type="checkbox" 
                role="switch" 
                id="matchesOnlySwitch"
                checked={showMatchesOnly}
                onChange={(e) => setShowMatchesOnly(e.target.checked)}
              />
              <label className="form-check-label small fw-semibold text-dark ms-2" htmlFor="matchesOnlySwitch">
                Show matches only
              </label>
            </div>
          </div>
        </div>

        {/* Project Content */}
        <div className="col-lg-9 p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="fw-bold mb-0 text-dark">
                Open Projects
                <span className="badge bg-light text-dark ms-2 border" style={{ fontSize: '14px', fontWeight: '500' }}>
                  {filteredProjects.length} Projects
                </span>
              </h2>
            </div>
          </div>

          {/* Project Cards */}
          {filteredProjects.length === 0 ? (
            <div className="text-center py-5 text-muted bg-white rounded-4 border p-4 mt-4 shadow-sm">
              <i className="bi bi-search fs-1 text-primary d-block mb-3"></i>
              <h5 className="fw-bold text-dark">No matching projects found</h5>
              <p className="mb-0 text-muted">Try checking other skills or post your own project idea.</p>
            </div>
          ) : (
            filteredProjects.map((project) => {
              const isApplied = appliedProjectIds.includes(project._id);
              const matchPercent = getMatchPercent(project.skillsNeeded);
              const ownerName = project.creator?.name || 'Anonymous';
              
              return (
                <div className="card mt-4 shadow-sm position-relative overflow-hidden" key={project._id}>
                  {matchPercent > 0 && (
                    <div 
                      className="position-absolute px-3 py-1 text-white fw-bold small" 
                      style={{ 
                        top: 0, 
                        right: 0, 
                        background: matchPercent === 100 ? 'linear-gradient(135deg, #2ec4b6, #00f5d4)' : 'linear-gradient(135deg, #6c63ff, #3f37c9)',
                        borderBottomLeftRadius: '14px',
                        fontSize: '11px',
                        textTransform: 'uppercase'
                      }}
                    >
                      {matchPercent === 100 ? 'Perfect Match' : `${matchPercent}% Match`}
                    </div>
                  )}

                  <div className="d-flex justify-content-between align-items-start">
                    <div className="d-flex gap-3">
                      <div className={`dp ${getColorClass(project.title)}`}>
                        {getUserInitials(ownerName)}
                      </div>
                      <div>
                        <h5 className="mb-0 fw-bold text-dark">
                          {ownerName}
                        </h5>
                        <small className="text-muted">
                          {getHumanTime(project.createdAt)}
                        </small>
                      </div>
                    </div>
                    <span className="open">
                      Open
                    </span>
                  </div>

                  <h3 className="mt-4 fw-bold text-dark">
                    {project.title}
                  </h3>
                  <p className="text-muted mt-2">
                    {project.description}
                  </p>
                  
                  <div className="d-flex gap-2 flex-wrap mt-3">
                    {project.skillsNeeded && project.skillsNeeded.map((skill) => (
                      <span className={getTagClass(skill)} key={skill}>
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
                    <div className="text-muted small fw-medium">
                      <i className="bi bi-people me-1"></i> Team Size Limit: {project.maxTeamSize}
                    </div>
                    <button 
                      className={`btn ${isApplied ? 'btn-secondary' : 'btn-primary'} px-4 py-2 fw-semibold`}
                      onClick={() => !isApplied && onApply(project)}
                      disabled={isApplied}
                      style={{ borderRadius: '10px' }}
                    >
                      {isApplied ? 'Applied' : 'Apply Now'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default Explore;
