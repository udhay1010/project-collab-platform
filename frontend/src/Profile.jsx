import { useState } from 'react';

const SKILLS_LIST = [
  'React', 'Node.js', 'Python', 'UI/UX', 'Figma', 
  'Machine Learning', 'TypeScript', 'Database', 'Vue', 'Flutter'
];

function Profile({ user, onProfileUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name || '');
  const [bio, setBio] = useState(user.bio || '');
  const [skills, setSkills] = useState(user.skills || []);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleSkill = (skill) => {
    if (skills.includes(skill)) {
      setSkills(skills.filter(s => s !== skill));
    } else {
      setSkills([...skills, skill]);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/${user._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, bio, skills })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSuccess('Profile updated successfully!');
        onProfileUpdate(data.user);
        setIsEditing(false);
      } else {
        setError(data.message || 'Failed to update profile.');
      }
    } catch {
      setError('Unable to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getUserInitials = (userName) => {
    if (!userName) return 'U';
    const parts = userName.trim().split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  };

  return (
    <div className="container mt-5">
      <style>{`
        .profile-header-card {
          background: white;
          border-radius: 24px;
          border: 1px solid rgb(236, 236, 236);
          box-shadow: 0 8px 24px rgba(0,0,0,0.04);
          overflow: hidden;
          transition: all 0.5s ease;
        }
        .dark .profile-header-card {
          background: rgb(29, 27, 27);
          border-color: rgb(51, 51, 51);
        }
        .profile-banner {
          height: 120px;
          background: linear-gradient(135deg, #6c63ff 0%, #3f37c9 100%);
        }
        .profile-avatar-container {
          margin-top: -60px;
          padding-left: 40px;
        }
        .profile-avatar {
          width: 110px;
          height: 110px;
          border-radius: 50%;
          background: #6c63ff;
          color: white;
          font-size: 36px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 5px solid white;
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }
        .dark .profile-avatar {
          border-color: rgb(29, 27, 27);
        }
        .profile-content {
          padding: 30px 40px;
        }
        .profile-skill-badge {
          display: inline-block;
          padding: 8px 16px;
          background: #eef1ff;
          color: #6c63ff;
          border-radius: 12px;
          font-weight: 600;
          font-size: 14px;
          margin-right: 10px;
          margin-bottom: 10px;
        }
        .dark .profile-skill-badge {
          background: rgb(45, 45, 45);
          color: white;
        }
        .skill-select-pill {
          padding: 8px 14px;
          border-radius: 12px;
          border: 1px solid rgba(108, 99, 255, 0.2);
          background: transparent;
          color: #666;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        .dark .skill-select-pill {
          color: #ddd;
          border-color: rgba(255, 255, 255, 0.1);
        }
        .skill-select-pill.active {
          background: #6c63ff;
          color: white;
          border-color: #6c63ff;
        }
      `}</style>

      <div className="row justify-content-center">
        <div className="col-lg-8">
          {success && (
            <div className="alert alert-success py-2 px-3 mb-4 d-flex align-items-center gap-2" style={{ borderRadius: '12px' }}>
              <i className="bi bi-check-circle-fill"></i>
              {success}
            </div>
          )}
          {error && (
            <div className="alert alert-danger py-2 px-3 mb-4 d-flex align-items-center gap-2" style={{ borderRadius: '12px' }}>
              <i className="bi bi-exclamation-circle-fill"></i>
              {error}
            </div>
          )}

          <div className="profile-header-card">
            <div className="profile-banner"></div>
            <div className="profile-avatar-container">
              <div className="profile-avatar">
                {getUserInitials(user.name)}
              </div>
            </div>

            <div className="profile-content">
              {!isEditing ? (
                <div>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <h2 className="fw-bold mb-1">{user.name}</h2>
                      <p className="text-muted mb-0">
                        <i className="bi bi-envelope me-2"></i>
                        {user.email}
                      </p>
                    </div>
                    <button 
                      className="btn btn-outline-primary px-4" 
                      onClick={() => setIsEditing(true)}
                      style={{ borderRadius: '12px' }}
                    >
                      <i className="bi bi-pencil-square me-2"></i>
                      Edit Profile
                    </button>
                  </div>

                  <div className="border-top my-4"></div>

                  <div className="mb-4">
                    <h5 className="fw-bold mb-3">Bio</h5>
                    <p className="text-muted" style={{ lineHeight: '1.6', whiteSpace: 'pre-line' }}>
                      {user.bio || "No bio added yet. Tell people about yourself!"}
                    </p>
                  </div>

                  <div className="mb-2">
                    <h5 className="fw-bold mb-3">My Skills</h5>
                    <div>
                      {user.skills && user.skills.length > 0 ? (
                        user.skills.map((skill) => (
                          <span key={skill} className="profile-skill-badge">
                            {skill}
                          </span>
                        ))
                      ) : (
                        <p className="text-muted">No skills selected yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSave}>
                  <h4 className="fw-bold mb-4">Edit Profile</h4>
                  
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Full Name</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={name} 
                      onChange={e => setName(e.target.value)} 
                      required 
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Bio</label>
                    <textarea 
                      className="form-control" 
                      rows="3" 
                      value={bio} 
                      onChange={e => setBio(e.target.value)}
                      placeholder="Write a short bio..."
                    ></textarea>
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-semibold mb-2">My Skills</label>
                    <div className="d-flex gap-2 flex-wrap">
                      {SKILLS_LIST.map((skill) => (
                        <button
                          key={skill}
                          type="button"
                          className={`skill-select-pill ${skills.includes(skill) ? 'active' : ''}`}
                          onClick={() => toggleSkill(skill)}
                        >
                          {skill}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="d-flex gap-3 justify-content-end border-top pt-4">
                    <button 
                      type="button" 
                      className="btn btn-secondary px-4" 
                      onClick={() => {
                        setIsEditing(false);
                        setName(user.name);
                        setBio(user.bio);
                        setSkills(user.skills);
                        setError('');
                      }}
                      style={{ borderRadius: '12px' }}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary px-4"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Saving...
                        </>
                      ) : 'Save Changes'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
