import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDraft } from '../context/DraftContext';
import { useSettings } from '../context/SettingsContext';
import ReCAPTCHA from 'react-google-recaptcha';
import { ref, get } from 'firebase/database';
import { database } from '../services/firebase'; // Percorso corretto

/**
 * Login Page component
 * Handles creation of new drafts and joining existing ones
 */
const LoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { createDraft, joinDraft, generateAccessCodes } = useDraft();
  
  // State for joining a draft
  const [draftCode, setDraftCode] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  
  // State for creating a draft
  const [isCreating, setIsCreating] = useState(false);
  const [newDraftSettings, setNewDraftSettings] = useState({
    timePerPick: settings.timePerPick,
    timePerBan: settings.timePerBan,
    numberOfBans: settings.numberOfBans,
    mirrorPicks: settings.mirrorPicks
  });
  
  // State for the captcha verification
  const [captchaVerified, setCaptchaVerified] = useState(false);
  
  // State for created draft info
  const [createdDraft, setCreatedDraft] = useState(null);
  
  // State for error messages
  const [error, setError] = useState(null);
  
  // State for active view tab
  const [activeTab, setActiveTab] = useState('join'); // 'join' or 'create'
  
  // Handle captcha verification
  const handleCaptchaVerify = (token) => {
    console.log("Captcha verified:", !!token);
    setCaptchaVerified(!!token);
    setError(null); // Clear any previous errors
  };
  
  // Handle joining a draft
  const handleJoinDraft = async (e) => {
    e.preventDefault();
    
    console.log("Join draft button clicked");
    
    if (!captchaVerified) {
      setError('Please verify that you are not a robot');
      return;
    }
    
    if (!draftCode) {
      setError('Please enter a draft code');
      return;
    }
    
    setIsJoining(true);
    setError(null);
    
    try {
      // Verify draft exists
      console.log("Checking if draft exists:", draftCode);
      const draftRef = ref(database, `drafts/${draftCode}`);
      const snapshot = await get(draftRef);
      
      if (!snapshot.exists()) {
        console.error("Draft not found:", draftCode);
        setError("Draft not found. Please check the code and try again.");
        setIsJoining(false);
        return;
      }
      
      console.log("Draft found, preparing to join");
      
      // If access code provided, store it in sessionStorage
      if (accessCode) {
        console.log("Storing access code in sessionStorage:", accessCode);
        sessionStorage.setItem('draftAccessCode', accessCode);
      }
      
      // Navigate to draft page
      console.log("Navigating to draft page:", draftCode);
      navigate(`/draft/${draftCode}`);
      
    } catch (error) {
      console.error("Error joining draft:", error);
      setError(`Error joining draft: ${error.message}`);
      setIsJoining(false);
    }
  };
  
  // Handle creating a new draft
  const handleCreateDraft = async () => {
    console.log("Create draft button clicked");
    
    if (!captchaVerified) {
      setError('Please verify that you are not a robot');
      return;
    }
    
    setIsCreating(true);
    setError(null);
    
    try {
      console.log("Creating new draft with settings:", newDraftSettings);
      const draftId = await createDraft();
      
      if (draftId) {
        console.log("Draft created successfully:", draftId);
        
        // Generate access codes
        const accessCodes = generateAccessCodes(draftId);
        console.log("Generated access codes:", accessCodes);
        
        // Set created draft info
        setCreatedDraft({
          draftId,
          accessCodes,
          settings: newDraftSettings
        });
        
      } else {
        throw new Error("Failed to create draft");
      }
    } catch (error) {
      console.error("Error creating draft:", error);
      setError(`Error creating draft: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  };
  
  // Handle starting a created draft
  const handleStartDraft = () => {
    if (!createdDraft) return;
    
    console.log("Starting created draft:", createdDraft.draftId);
    
    // Store admin access code in sessionStorage
    sessionStorage.setItem('draftAccessCode', createdDraft.accessCodes.admin);
    
    // Navigate to draft page
    navigate(`/draft/${createdDraft.draftId}`);
  };
  
  // Handle copying to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        //alert("Copied to clipboard!");
      })
      .catch(err => {
        console.error('Could not copy text:', err);
      });
  };
  
  // If a draft was just created, show the success view with access codes
  if (createdDraft) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h1 className="login-title">Draft Created Successfully!</h1>
          
          <div className="draft-code-info">
            <p>Your draft has been created. Here are the access codes:</p>
            
            <div className="code-box">
              <h3>Draft Code</h3>
              <div className="code-value main-code">{createdDraft.draftId}</div>
              <button 
                className="copy-btn" 
                onClick={() => copyToClipboard(createdDraft.draftId)}
                title="Copy to clipboard"
              >
                <i class="fas fa-solid fa-copy"></i> Copy
              </button>
              <p className="code-note">Share this code with all participants</p>
            </div>
            
            <div className="access-codes">
              <div className="code-box admin-code">
                <h3>Admin Code</h3>
                <div className="code-value">{createdDraft.accessCodes.admin}</div>
                <button 
                  className="copy-btn" 
                  onClick={() => copyToClipboard(createdDraft.accessCodes.admin)}
                  title="Copy to clipboard"
                >
                  <i class="fas fa-solid fa-copy"></i> Copy
                </button>
                <p className="code-note">For you only (full control)</p>
              </div>
              <br></br>
              <div className="code-box blue-code">
                <h3>Blue Team Code</h3>
                <div className="code-value">{createdDraft.accessCodes.blue}</div>
                <button 
                  className="copy-btn" 
                  onClick={() => copyToClipboard(createdDraft.accessCodes.blue)}
                  title="Copy to clipboard"
                >
                  <i class="fa-solid fa-copy"></i> Copy
                </button>
                <p className="code-note">Share with Blue Team captain</p>
              </div>
              
              <div className="code-box red-code">
                <h3>Red Team Code</h3>
                <div className="code-value">{createdDraft.accessCodes.red}</div>
                <button 
                  className="copy-btn" 
                  onClick={() => copyToClipboard(createdDraft.accessCodes.red)}
                  title="Copy to clipboard"
                >
                  <i className="fas fa-copy"></i> Copy
                </button>
                <p className="code-note">Share with Red Team captain</p>
              </div>
            </div>
            
            <div className="info-alert">
              <i className="fas fa-info-circle"></i>
              <p>
                <strong>Important:</strong> Save these codes! You will only see them again in admin settings.<br/>
                To access as a spectator, no access code is needed.
              </p>
            </div>
            
            <button 
              onClick={handleStartDraft} 
              className="start-draft-btn"
            >
              Go to Draft
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Normal login page (Join or Create)
  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">MOBA Draft System</h1>
        
        <div className="mode-tabs">
          <button 
            className={`mode-tab ${activeTab === 'join' ? 'active' : ''}`}
            onClick={() => setActiveTab('join')}
          >
            Join a Draft
          </button>
          <button 
            className={`mode-tab ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            Create New Draft
          </button>
        </div>
        
        {activeTab === 'join' ? (
          <form onSubmit={handleJoinDraft} className="login-form">
            <div className="form-group">
              <label htmlFor="draftCode">Draft Code</label>
              <input
                type="text"
                id="draftCode"
                value={draftCode}
                onChange={(e) => setDraftCode(e.target.value.toUpperCase())}
                placeholder="Enter draft code"
                className="form-control"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="accessCode">Access Code (optional)</label>
              <input
                type="text"
                id="accessCode"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="Example: AD123456XX, BL123456XX, RD123456XX"
                className="form-control"
              />
              <p className="form-help">
                The access code determines your role (Admin, Blue Team Captain, or Red Team Captain).<br/>
                <b>If you don't have a code, you will join as a spectator.</b>
              </p>
            </div>
            
            <div className="captcha-container">
              <ReCAPTCHA
                sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI" // Replace with your real key
                onChange={handleCaptchaVerify}
              />
            </div>
            
            {error && <div className="error-message">{error}</div>}
            
            <button 
              type="submit" 
              className="submit-btn"
              disabled={isJoining || !draftCode || !captchaVerified}
            >
              {isJoining ? 'Joining...' : 'Join Draft'}
            </button>
          </form>
        ) : (
          <div className="create-form">
            <p className="create-info">
              When creating a new draft, you'll get access codes for all roles.
              You can share these codes with team captains.
              Spectators can access without a specific code.
            </p>
            
            <div className="captcha-container">
              <ReCAPTCHA
                sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI" // Replace with your real key
                onChange={handleCaptchaVerify}
              />
            </div>
            
            {error && <div className="error-message">{error}</div>}
            
            <button 
              onClick={handleCreateDraft} 
              className="create-btn"
              disabled={isCreating || !captchaVerified}
            >
              {isCreating ? 'Creating...' : 'Create New Draft'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;