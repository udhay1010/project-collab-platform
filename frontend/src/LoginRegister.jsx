import { useState } from 'react';

const SKILLS_LIST = [
  'React', 'Node.js', 'Python', 'UI/UX', 'Figma', 
  'Machine Learning', 'TypeScript', 'Database', 'Vue', 'Flutter'
];

function LoginRegister({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleSkill = (skill) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(false);

    if (!email || !password || (!isLogin && !name)) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin 
      ? { email, password } 
      : { name, email, password, bio, skills: selectedSkills };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      if (response.ok && data.success) {
        localStorage.setItem('token', data.token);
        onAuthSuccess(data.user);
      } else {
        setError(data.message || 'Authentication failed. Please verify your credentials.');
      }
    } catch {
      setError('Unable to connect to the server. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <style>{`
        .auth-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          transition: background 0.5s ease;
        }
        .dark .auth-container {
          background: linear-gradient(135deg, #121212 0%, #1e1e1e 100%);
        }
        .auth-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 24px;
          padding: 40px;
          width: 100%;
          max-width: 500px;
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
          transition: all 0.5s ease;
        }
        .dark .auth-card {
          background: rgba(29, 27, 27, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
        }
        .auth-toggle {
          display: flex;
          background: rgba(0, 0, 0, 0.05);
          padding: 6px;
          border-radius: 14px;
          margin-bottom: 30px;
        }
        .dark .auth-toggle {
          background: rgba(255, 255, 255, 0.05);
        }
        .auth-toggle-btn {
          flex: 1;
          border: none;
          background: transparent;
          padding: 10px;
          border-radius: 10px;
          font-weight: 600;
          color: #666;
          transition: all 0.3s ease;
        }
        .dark .auth-toggle-btn {
          color: #aaa;
        }
        .auth-toggle-btn.active {
          background: #6c63ff;
          color: white;
          box-shadow: 0 4px 10px rgba(108, 99, 255, 0.2);
        }
        .auth-skill-tag {
          padding: 8px 14px;
          border-radius: 20px;
          border: 1px solid rgba(108, 99, 255, 0.2);
          background: transparent;
          color: #555;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .dark .auth-skill-tag {
          color: #ddd;
          border-color: rgba(255, 255, 255, 0.1);
        }
        .auth-skill-tag.active {
          background: #6c63ff;
          color: white;
          border-color: #6c63ff;
        }
        .auth-skill-tag:hover {
          transform: translateY(-2px);
        }
      `}</style>
      
      <div className="auth-card">
        <div className="text-center mb-4">
          <h2 className="fw-bold text-primary mb-1">
            <span className="text-primary">•</span> BuildMate
          </h2>
          <p className="text-muted">Connect, Collaborate, and Build Projects Together</p>
        </div>

        <div className="auth-toggle">
          <button 
            type="button" 
            className={`auth-toggle-btn ${isLogin ? 'active' : ''}`}
            onClick={() => { setIsLogin(true); setError(''); }}
          >
            Sign In
          </button>
          <button 
            type="button" 
            className={`auth-toggle-btn ${!isLogin ? 'active' : ''}`}
            onClick={() => { setIsLogin(false); setError(''); }}
          >
            Sign Up
          </button>
        </div>

        {error && (
          <div className="alert alert-danger py-2 px-3 mb-4" role="alert" style={{ borderRadius: '12px', fontSize: '14px' }}>
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="mb-3">
              <label className="form-label fw-semibold">Full Name</label>
              <div className="input-group">
                <span className="input-group-text bg-transparent border-end-0">
                  <i className="bi bi-person text-muted"></i>
                </span>
                <input 
                  type="text" 
                  className="form-control border-start-0 ps-0" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="John Doe"
                  required 
                />
              </div>
            </div>
          )}

          <div className="mb-3">
            <label className="form-label fw-semibold">Email Address</label>
            <div className="input-group">
              <span className="input-group-text bg-transparent border-end-0">
                <i className="bi bi-envelope text-muted"></i>
              </span>
              <input 
                type="email" 
                className="form-control border-start-0 ps-0" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="you@example.com"
                required 
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Password</label>
            <div className="input-group">
              <span className="input-group-text bg-transparent border-end-0">
                <i className="bi bi-lock text-muted"></i>
              </span>
              <input 
                type="password" 
                className="form-control border-start-0 ps-0" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="••••••••"
                minLength="6"
                required 
              />
            </div>
          </div>

          {!isLogin && (
            <>
              <div className="mb-3">
                <label className="form-label fw-semibold">Bio</label>
                <div className="input-group">
                  <span className="input-group-text bg-transparent border-end-0">
                    <i className="bi bi-file-earmark-text text-muted"></i>
                  </span>
                  <textarea 
                    className="form-control border-start-0 ps-0" 
                    value={bio} 
                    onChange={e => setBio(e.target.value)} 
                    placeholder="Tell us about your background or interests..."
                    rows="2"
                  ></textarea>
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label fw-semibold mb-2">Select Your Skills</label>
                <div className="d-flex gap-2 flex-wrap">
                  {SKILLS_LIST.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      className={`auth-skill-tag ${selectedSkills.includes(skill) ? 'active' : ''}`}
                      onClick={() => toggleSkill(skill)}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <button 
            type="submit" 
            className="btn btn-primary w-100 py-3 fw-bold mt-2 d-flex justify-content-center align-items-center gap-2"
            style={{ borderRadius: '14px' }}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Processing...
              </>
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginRegister;
