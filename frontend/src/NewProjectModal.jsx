import { useState } from 'react';

function NewProjectModal({ show, onClose, onAddProject }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState('');
  const [slots, setSlots] = useState(4);

  if (!show) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !description) return;

    // Convert comma-separated skills into array
    const skillsArray = skills
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    onAddProject({
      title,
      description,
      skillsNeeded: skillsArray.length > 0 ? skillsArray : ['React'],
      maxTeamSize: parseInt(slots) || 4
    });

    // Reset form
    setTitle('');
    setDescription('');
    setSkills('');
    setSlots(4);
    onClose();
  };

  return (
    <div className="modal-backdrop-custom" onClick={onClose}>
      <style>{`
        .modal-backdrop-custom {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background-color: rgba(0, 0, 0, 0.6);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1050;
          backdrop-filter: blur(4px);
        }
        .modal-content-custom {
          background: white;
          border-radius: 20px;
          max-width: 500px;
          width: 90%;
          padding: 30px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.15);
          border: 1px solid rgba(236, 236, 236, 0.1);
          animation: modalSlideUp 0.3s ease;
        }
        .dark .modal-content-custom {
          background: rgb(29, 27, 27);
          color: white;
          border: 1px solid rgb(68, 68, 68);
        }
        @keyframes modalSlideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      <div className="modal-content-custom" onClick={(e) => e.stopPropagation()}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="fw-bold mb-0">Post Project Idea</h3>
          <button className="btn-close" onClick={onClose} aria-label="Close"></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-semibold">Project Title</label>
            <input 
              type="text" 
              className="form-control" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="e.g. AI Chrome Extension"
              required 
            />
          </div>
          <div className="mb-3">
            <label className="form-label fw-semibold">Description</label>
            <textarea 
              className="form-control" 
              rows="3" 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="Provide a short overview of the project idea..."
              required
            ></textarea>
          </div>
          <div className="mb-3">
            <label className="form-label fw-semibold">Skills Required (comma separated)</label>
            <input 
              type="text" 
              className="form-control" 
              value={skills} 
              onChange={e => setSkills(e.target.value)} 
              placeholder="e.g. React, Node.js, Python" 
            />
          </div>
          <div className="mb-4">
            <label className="form-label fw-semibold">Max Team Size</label>
            <input 
              type="number" 
              className="form-control" 
              min="2" 
              max="20" 
              value={slots} 
              onChange={e => setSlots(e.target.value)} 
            />
          </div>
          <div className="d-flex gap-3 justify-content-end">
            <button type="button" className="btn btn-secondary px-4" onClick={onClose} style={{ borderRadius: '12px' }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary px-4">
              Post Idea
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewProjectModal;
