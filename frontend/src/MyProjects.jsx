
function MyProjects({ myProjects, onOpenModal }) {
  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-0">
            My Projects
          </h2>
        </div>
        <button className="btn btn-primary" onClick={onOpenModal}>
          + New Project
        </button>
      </div>

      {myProjects.length === 0 ? (
        <div className="text-center py-5 text-muted bg-white rounded-4 border p-4 mt-4">
          <i className="bi bi-folder2-open fs-1 text-primary d-block mb-3"></i>
          <h5>No projects created yet</h5>
          <p className="mb-0">Click "+ New Project" to post your first project idea.</p>
        </div>
      ) : (
        myProjects.map((project) => (
          <div className="project p-4" key={project.id}>
            <h4 className="fw-bold">
              {project.title}
            </h4>
            <p className="text-muted mt-2">
              {project.description}
            </p>
            <div className="bottom d-flex justify-content-between align-items-center mt-3">
              <span className="text-muted">
                👥 {project.members} {project.members === 1 ? 'Member' : 'Members'}
              </span>
              <button className="btn btn-primary">
                Manage
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default MyProjects;
