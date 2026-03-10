import React, { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import './FindMySize.css';

const API_BASE_URL = 'http://localhost:5000';

function FindMySize({ isOpen, onClose, onSizeSelect, productSizes = [] }) {
  const [step, setStep] = useState(1);
  const [analysisMethod, setAnalysisMethod] = useState(null);
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [sessionId] = useState(() => 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9));
  
  const fileInputRef = useRef(null);
  const webcamRef = useRef(null);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [webcamStream, setWebcamStream] = useState(null);

  // Attach stream to video element once both are available
  useEffect(() => {
    if (webcamStream && webcamRef.current) {
      webcamRef.current.srcObject = webcamStream;
      webcamRef.current.play().catch(() => {});
    }
  }, [webcamStream, isWebcamActive]);

  const resetForm = useCallback(() => {
    setStep(1);
    setAnalysisMethod(null);
    setHeight('');
    setWeight('');
    setImage(null);
    setImagePreview(null);
    setResult(null);
    setIsWebcamActive(false);
    if (webcamStream) {
      webcamStream.getTracks().forEach(track => track.stop());
      setWebcamStream(null);
    }
  }, [webcamStream]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image size should be less than 10MB');
        return;
      }
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 640, height: 480 } 
      });
      setWebcamStream(stream);
      setIsWebcamActive(true);
    } catch (error) {
      toast.error('Unable to access camera. Please allow camera permissions.');
      console.error('Webcam error:', error);
    }
  };

  const capturePhoto = () => {
    if (webcamRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = webcamRef.current.videoWidth;
      canvas.height = webcamRef.current.videoHeight;
      canvas.getContext('2d').drawImage(webcamRef.current, 0, 0);
      
      canvas.toBlob((blob) => {
        const file = new File([blob], 'webcam-capture.jpg', { type: 'image/jpeg' });
        setImage(file);
        setImagePreview(canvas.toDataURL('image/jpeg'));
        
        // Stop webcam
        if (webcamStream) {
          webcamStream.getTracks().forEach(track => track.stop());
          setWebcamStream(null);
        }
        setIsWebcamActive(false);
      }, 'image/jpeg', 0.8);
    }
  };

  const handleQuickAnalysis = async () => {
    if (!height || !weight) {
      toast.error('Please enter your height and weight');
      return;
    }

    const heightNum = parseFloat(height);
    const weightNum = parseFloat(weight);

    if (heightNum < 100 || heightNum > 250) {
      toast.error('Height must be between 100 and 250 cm');
      return;
    }

    if (weightNum < 30 || weightNum > 200) {
      toast.error('Weight must be between 30 and 200 kg');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/size/quick-recommend', {
        height: heightNum,
        weight: weightNum
      });

      if (response.data.success) {
        setResult(response.data.data);
        setStep(4);
        toast.success('Size recommendation ready!');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error analyzing measurements');
    } finally {
      setLoading(false);
    }
  };

  const handleImageAnalysis = async () => {
    if (!image) {
      toast.error('Please upload a full-body photo');
      return;
    }

    setLoading(true);
    try {
      let imageId = null;

      const formData = new FormData();
      formData.append('image', image);
      formData.append('sessionId', sessionId);

      const uploadResponse = await api.post('/size/upload-image', formData, {
        headers: { 'Content-Type': undefined }
      });

      if (uploadResponse.data.success) {
        imageId = uploadResponse.data.data.imageId;
      }

      // Analyze measurements (image-only, no height/weight)
      const analyzeResponse = await api.post('/size/analyze', {
        sessionId,
        imageId
      });

      if (analyzeResponse.data.success) {
        setResult(analyzeResponse.data.data);
        setStep(4);
        toast.success('AI analysis complete!');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error analyzing image');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSize = (size) => {
    if (onSizeSelect) {
      onSizeSelect(size);
    }
    toast.success(`Size ${size} selected!`);
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="find-my-size-overlay" onClick={handleClose}>
      <div className="find-my-size-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={handleClose}>&times;</button>
        
        <div className="modal-header">
          <h2>🧠 AI Size Recommendation</h2>
          <p>Find your perfect fit using smart body analysis</p>
        </div>

        {/* Progress Steps */}
        <div className="progress-steps">
          <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
            <span className="step-number">1</span>
            <span className="step-label">Method</span>
          </div>
          <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
            <span className="step-number">2</span>
            <span className="step-label">Input</span>
          </div>
          <div className={`step ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
            <span className="step-number">3</span>
            <span className="step-label">Analyze</span>
          </div>
          <div className={`step ${step >= 4 ? 'active' : ''}`}>
            <span className="step-number">4</span>
            <span className="step-label">Result</span>
          </div>
        </div>

        <div className="modal-content">
          {/* Step 1: Choose Analysis Method */}
          {step === 1 && (
            <div className="step-content">
              <h3>Choose Analysis Method</h3>
              <div className="method-cards">
                <div 
                  className={`method-card ${analysisMethod === 'quick' ? 'selected' : ''}`}
                  onClick={() => { setAnalysisMethod('quick'); setStep(2); }}
                >
                  <div className="method-icon">⚡</div>
                  <h4>Quick Measure</h4>
                  <p>Enter height & weight for instant size recommendation</p>
                  <span className="method-time">~10 seconds</span>
                </div>
                <div 
                  className={`method-card ${analysisMethod === 'image' ? 'selected' : ''}`}
                  onClick={() => { setAnalysisMethod('image'); setStep(2); }}
                >
                  <div className="method-icon">📷</div>
                  <h4>Photo Analysis</h4>
                  <p>Upload a full-body photo for AI-powered precise measurement</p>
                  <span className="method-time">~30 seconds</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Input Details */}
          {step === 2 && (
            <div className="step-content">
              <h3>{analysisMethod === 'image' ? 'Upload Your Photo' : 'Enter Your Details'}</h3>
              
              {analysisMethod === 'quick' && (
                <>
                  <div className="input-group">
                    <label>Height (cm) *</label>
                    <div className="input-with-icon">
                      <input
                        type="number"
                        placeholder="e.g., 175"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        min="100"
                        max="250"
                      />
                      <span className="unit">cm</span>
                    </div>
                    <p className="input-hint">Your height in centimeters (100-250 cm)</p>
                  </div>

                  <div className="input-group">
                    <label>Weight (kg) *</label>
                    <div className="input-with-icon">
                      <input
                        type="number"
                        placeholder="e.g., 70"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        min="30"
                        max="200"
                      />
                      <span className="unit">kg</span>
                    </div>
                    <p className="input-hint">Your weight in kilograms (30-200 kg)</p>
                  </div>
                </>
              )}

              {analysisMethod === 'image' && (
                <div className="image-upload-section">
                  <h4>Upload Full-Body Photo *</h4>
                  <p className="upload-hint">Upload a front-facing full-body photo in normal standing position for accurate AI analysis</p>
                  
                  <div className="upload-options">
                    <button 
                      className="upload-option-btn"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      📁 Upload Image
                    </button>
                    <button 
                      className="upload-option-btn"
                      onClick={startWebcam}
                    >
                      📷 Use Webcam
                    </button>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    style={{ display: 'none' }}
                  />

                  {isWebcamActive && (
                    <div className="webcam-container">
                      <video 
                        ref={webcamRef} 
                        autoPlay 
                        playsInline
                        className="webcam-preview"
                      />
                      <div className="webcam-overlay">
                        <div className="body-guide"></div>
                      </div>
                      <button className="capture-btn" onClick={capturePhoto}>
                        📸 Capture Photo
                      </button>
                    </div>
                  )}

                  {imagePreview && !isWebcamActive && (
                    <div className="image-preview">
                      <img src={imagePreview} alt="Uploaded" />
                      <button 
                        className="remove-image"
                        onClick={() => { setImage(null); setImagePreview(null); }}
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  <div className="photo-tips">
                    <h5>📋 Photo Guidelines:</h5>
                    <ul>
                      <li>Stand naturally facing the camera</li>
                      <li>Wear fitted clothing for better accuracy</li>
                      <li>Ensure good lighting</li>
                      <li>Keep arms slightly away from body</li>
                      <li>Include full body from head to feet</li>
                    </ul>
                  </div>
                </div>
              )}

              <div className="step-actions">
                <button className="btn-secondary" onClick={() => setStep(1)}>Back</button>
                <button className="btn-primary" onClick={() => {
                  if (analysisMethod === 'image' && !image) {
                    toast.error('Please upload a full-body photo for AI analysis');
                    return;
                  }
                  if (analysisMethod === 'quick' && (!height || !weight)) {
                    toast.error('Please enter your height and weight');
                    return;
                  }
                  setStep(3);
                }}>Continue</button>
              </div>
            </div>
          )}

          {/* Step 3: Analyze */}
          {step === 3 && (
            <div className="step-content">
              <h3>Ready to Analyze</h3>
              
              <div className="summary-card">
                <h4>Your Input</h4>
                {analysisMethod === 'quick' && (
                  <>
                    <div className="summary-item">
                      <span>Height:</span>
                      <strong>{height} cm</strong>
                    </div>
                    <div className="summary-item">
                      <span>Weight:</span>
                      <strong>{weight} kg</strong>
                    </div>
                  </>
                )}
                <div className="summary-item">
                  <span>Analysis Method:</span>
                  <strong>{analysisMethod === 'image' ? 'AI Photo Analysis' : 'Quick Measure'}</strong>
                </div>
                {image && (
                  <div className="summary-item">
                    <span>Photo:</span>
                    <strong>✅ Uploaded</strong>
                  </div>
                )}
              </div>

              <div className="privacy-notice">
                <h5>🔒 Privacy Notice</h5>
                <p>Your data is processed securely. Photos are automatically deleted after analysis. We do not store your personal measurements permanently.</p>
              </div>

              <div className="step-actions">
                <button className="btn-secondary" onClick={() => setStep(2)}>Back</button>
                <button 
                  className="btn-primary btn-analyze"
                  onClick={analysisMethod === 'image' ? handleImageAnalysis : handleQuickAnalysis}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Analyzing...
                    </>
                  ) : (
                    <>🧠 Analyze My Size</>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Results */}
          {step === 4 && result && (
            <div className="step-content results-content">
              <h3>Your Size Recommendation</h3>
              
              <div className="body-type-badge">
                <span className="body-type-icon">
                  {result.bodyType === 'ectomorph' && '🏃'}
                  {result.bodyType === 'mesomorph' && '💪'}
                  {result.bodyType === 'endomorph' && '🐻'}
                  {result.bodyType === 'athletic' && '🏋️'}
                  {result.bodyType === 'average' && '👤'}
                </span>
                <span>Body Type: <strong>{result.bodyType?.charAt(0).toUpperCase() + result.bodyType?.slice(1)}</strong></span>
              </div>

              <div className="size-cards">
                {/* Shirt Size */}
                <div className="size-card">
                  <div className="size-icon">👔</div>
                  <h4>Shirt Size</h4>
                  <div className="recommended-size">{result.recommendations?.shirt?.size}</div>
                  <div className="fit-type">
                    <span>Fit: </span>
                    <strong>{result.recommendations?.shirt?.fitType}</strong>
                  </div>
                  <div className="confidence-bar">
                    <div 
                      className="confidence-fill"
                      style={{ width: `${result.recommendations?.shirt?.confidence || 0}%` }}
                    ></div>
                  </div>
                  <span className="confidence-text">
                    {result.recommendations?.shirt?.confidence}% confidence
                  </span>
                  {productSizes.includes(result.recommendations?.shirt?.size) && (
                    <button 
                      className="btn-select-size"
                      onClick={() => handleSelectSize(result.recommendations.shirt.size)}
                    >
                      Select This Size
                    </button>
                  )}
                </div>

                {/* Pant Size */}
                <div className="size-card">
                  <div className="size-icon">👖</div>
                  <h4>Pant Size</h4>
                  <div className="recommended-size">{result.recommendations?.pant?.size}</div>
                  <div className="fit-type">
                    <span>Fit: </span>
                    <strong>{result.recommendations?.pant?.fitType}</strong>
                  </div>
                  <div className="fit-type">
                    <span>Length: </span>
                    <strong>{result.recommendations?.pant?.length}</strong>
                  </div>
                  <div className="confidence-bar">
                    <div 
                      className="confidence-fill"
                      style={{ width: `${result.recommendations?.pant?.confidence || 0}%` }}
                    ></div>
                  </div>
                  <span className="confidence-text">
                    {result.recommendations?.pant?.confidence}% confidence
                  </span>
                  {productSizes.includes(result.recommendations?.pant?.size) && (
                    <button 
                      className="btn-select-size"
                      onClick={() => handleSelectSize(result.recommendations.pant.size)}
                    >
                      Select This Size
                    </button>
                  )}
                </div>
              </div>

              {/* Measurements */}
              {result.measurements && (
                <div className="measurements-section">
                  <h4>Estimated Measurements</h4>
                  <div className="measurements-grid">
                    <div className="measurement-item">
                      <span>Chest</span>
                      <strong>{result.measurements.chest} cm</strong>
                    </div>
                    <div className="measurement-item">
                      <span>Waist</span>
                      <strong>{result.measurements.waist} cm</strong>
                    </div>
                    <div className="measurement-item">
                      <span>Shoulder</span>
                      <strong>{result.measurements.shoulder} cm</strong>
                    </div>
                    <div className="measurement-item">
                      <span>Hip</span>
                      <strong>{result.measurements.hip} cm</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Tips */}
              {result.tips && (
                <div className="tips-section">
                  <h4>💡 Style Tips for You</h4>
                  <ul>
                    {result.tips.map((tip, index) => (
                      <li key={index}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="step-actions">
                <button className="btn-secondary" onClick={resetForm}>
                  Try Again
                </button>
                <button className="btn-primary" onClick={handleClose}>
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FindMySize;
