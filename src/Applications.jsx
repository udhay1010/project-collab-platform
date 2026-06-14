import React from 'react';

function Applications({ applications }) {
  return (
    <div className="container mt-5">
      <h1 className="fw-bold mb-4">
        Applications
      </h1>

      {applications.length === 0 ? (
        <div className="text-center py-5 text-muted bg-white rounded-4 border p-4">
          <i className="bi bi-file-earmark-person fs-1 text-primary d-block mb-3"></i>
          <h5>No applications yet</h5>
          <p className="mb-0">Go to the Explore tab and apply to some projects!</p>
        </div>
      ) : (
        applications.map((app) => (
          <div className="project p-4 mb-4" key={app.id}>
            <h4 className="fw-bold">
              {app.title}
            </h4>
            <p className="text-muted mt-2">
              {app.time}
            </p>
            <div className="foot mt-3">
              <span className={app.statusClass || 'pending'}>
                {app.status}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default Applications;
