import React from 'react';

const SKILLS_LIST = [
  'React', 'Node.js', 'Python', 'UI/UX', 'Figma', 
  'Machine Learning', 'TypeScript', 'Database', 'Vue', 'Flutter'
];

function Explore({ projects, selectedSkills, setSelectedSkills, onApply, appliedProjectIds }) {
  
  const toggleSkill = (skill) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };


  const filteredProjects = selectedSkills.length === 0
    ? projects
    : projects.filter(project => 
        project.skills.some(skill => 
          selectedSkills.some(selected => selected.toLowerCase() === skill.toLowerCase())
        )
      );

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
          <h6 className="mt-4 mb-4 text-uppercase fw-bold">
            Filter By Skill
          </h6>
          <div className="skills">
            {SKILLS_LIST.map((skill) => (
              <div className="skill" key={skill}>
                <span>{skill}</span>
                <input 
                  type="checkbox" 
                  checked={selectedSkills.includes(skill)}
                  onChange={() => toggleSkill(skill)}
                />
              </div>
            ))}
          </div>

          {/* Match Widget */}
          <div className="match mt-5">
            <h5 className="fw-bold mb-3">Your Match</h5>
            <div className="d-flex justify-content-between mt-4">
              <div>
                <h1 className="fw-bold">{filteredProjects.length}</h1>
                <p className="mb-0 text-muted">Projects</p>
              </div>
              <div>
                <h1 className="fw-bold">{selectedSkills.length}</h1>
                <p className="mb-0 text-muted">Skills</p>
              </div>
            </div>
          </div>
        </div>

        {/* Project Content */}
        <div className="col-lg-9 p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="fw-bold">
                Open Projects
                <span className="badge bg-light text-dark ms-2 border">
                  {filteredProjects.length} Projects
                </span>
              </h2>
            </div>
          </div>

          {/* Project Cards */}
          {filteredProjects.length === 0 ? (
            <div className="text-center py-5 text-muted bg-white rounded-4 border p-4 mt-4">
              <i className="bi bi-search fs-1 text-primary d-block mb-3"></i>
              <h5>No matching projects found</h5>
              <p className="mb-0">Try checking other skills or post your own project idea.</p>
            </div>
          ) : (
            filteredProjects.map((project) => {
              const isApplied = appliedProjectIds.includes(project.id);
              return (
                <div className="card mt-4" key={project.id}>
                  <div className="d-flex justify-content-between">
                    <div className="d-flex gap-3">
                      <div className={`dp ${project.color || 'purple'}`}>
                        {project.initial}
                      </div>
                      <div>
                        <h5 className="mb-0 fw-bold">
                          {project.owner}
                        </h5>
                        <small className="text-muted">
                          {project.time}
                        </small>
                      </div>
                    </div>
                    <span className="open">
                      Open
                    </span>
                  </div>
                  <h3 className="mt-4 fw-bold">
                    {project.title}
                  </h3>
                  <p className="text-muted mt-2">
                    {project.description}
                  </p>
                  <div className="d-flex gap-2 flex-wrap mt-3">
                    {project.skills.map((skill) => (
                      <span className={getTagClass(skill)} key={skill}>
                        {skill}
                      </span>
                    ))}
                  </div>
                  <div className="d-flex justify-content-between align-items-center mt-4">
                    <div className="text-muted">
                      {project.interested} interested | {project.slots} slots left
                    </div>
                    <button 
                      className={`btn ${isApplied ? 'btn-secondary' : 'btn-primary'} px-4`}
                      onClick={() => !isApplied && onApply(project)}
                      disabled={isApplied}
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
