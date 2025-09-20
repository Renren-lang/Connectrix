import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, orderBy, where } from 'firebase/firestore';
import { db } from '../firebase';
import VerificationBadge from '../components/VerificationBadge';
import './AdminVerification.css';

const AdminVerification = () => {
  const [verificationRequests, setVerificationRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchVerificationRequests();
  }, [filter]);

  const fetchVerificationRequests = async () => {
    try {
      setLoading(true);
      let q = query(collection(db, 'verification-requests'), orderBy('submittedAt', 'desc'));
      
      if (filter !== 'all') {
        q = query(q, where('status', '==', filter));
      }
      
      const snapshot = await getDocs(q);
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setVerificationRequests(requests);
    } catch (error) {
      console.error('Error fetching verification requests:', error);
      alert('Failed to load verification requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    if (!confirm('Are you sure you want to approve this verification request?')) {
      return;
    }

    try {
      setIsProcessing(true);
      
      // Update verification request
      const requestRef = doc(db, 'verification-requests', requestId);
      await updateDoc(requestRef, {
        status: 'verified',
        reviewedAt: new Date(),
        reviewedBy: 'admin', // In real app, use actual admin user ID
        rejectionReason: null
      });

      // Update user profile
      const request = verificationRequests.find(r => r.id === requestId);
      if (request) {
        const userRef = doc(db, 'users', request.userId);
        await updateDoc(userRef, {
          verificationStatus: 'verified',
          verifiedAt: new Date(),
          verifiedBy: 'admin'
        });
      }

      alert('Verification request approved successfully!');
      fetchVerificationRequests();
      setSelectedRequest(null);
      
    } catch (error) {
      console.error('Error approving verification:', error);
      alert('Failed to approve verification request');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (requestId) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    if (!confirm('Are you sure you want to reject this verification request?')) {
      return;
    }

    try {
      setIsProcessing(true);
      
      // Update verification request
      const requestRef = doc(db, 'verification-requests', requestId);
      await updateDoc(requestRef, {
        status: 'rejected',
        reviewedAt: new Date(),
        reviewedBy: 'admin',
        rejectionReason: rejectionReason.trim()
      });

      // Update user profile
      const request = verificationRequests.find(r => r.id === requestId);
      if (request) {
        const userRef = doc(db, 'users', request.userId);
        await updateDoc(userRef, {
          verificationStatus: 'rejected',
          rejectionReason: rejectionReason.trim()
        });
      }

      alert('Verification request rejected');
      fetchVerificationRequests();
      setSelectedRequest(null);
      setRejectionReason('');
      
    } catch (error) {
      console.error('Error rejecting verification:', error);
      alert('Failed to reject verification request');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getStatusCounts = () => {
    const counts = { all: 0, pending: 0, verified: 0, rejected: 0 };
    verificationRequests.forEach(request => {
      counts.all++;
      counts[request.status] = (counts[request.status] || 0) + 1;
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className="admin-verification">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading verification requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-verification">
      <div className="admin-header">
        <h1>Verification Management</h1>
        <div className="status-stats">
          <div className="stat-card">
            <span className="stat-number">{statusCounts.all}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-card pending">
            <span className="stat-number">{statusCounts.pending}</span>
            <span className="stat-label">Pending</span>
          </div>
          <div className="stat-card verified">
            <span className="stat-number">{statusCounts.verified}</span>
            <span className="stat-label">Verified</span>
          </div>
          <div className="stat-card rejected">
            <span className="stat-number">{statusCounts.rejected}</span>
            <span className="stat-label">Rejected</span>
          </div>
        </div>
      </div>

      <div className="filter-tabs">
        <button 
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({statusCounts.all})
        </button>
        <button 
          className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pending ({statusCounts.pending})
        </button>
        <button 
          className={`filter-tab ${filter === 'verified' ? 'active' : ''}`}
          onClick={() => setFilter('verified')}
        >
          Verified ({statusCounts.verified})
        </button>
        <button 
          className={`filter-tab ${filter === 'rejected' ? 'active' : ''}`}
          onClick={() => setFilter('rejected')}
        >
          Rejected ({statusCounts.rejected})
        </button>
      </div>

      <div className="requests-list">
        {verificationRequests.length === 0 ? (
          <div className="empty-state">
            <p>No verification requests found</p>
          </div>
        ) : (
          verificationRequests.map(request => (
            <div key={request.id} className="request-card">
              <div className="request-header">
                <div className="request-info">
                  <h3>{request.fullName}</h3>
                  <p className="request-email">{request.userEmail}</p>
                  <div className="request-meta">
                    <span>Student ID: {request.studentId}</span>
                    <span>Batch: {request.batch}</span>
                    <span>Course: {request.course}</span>
                  </div>
                </div>
                <div className="request-status">
                  <VerificationBadge status={request.status} type={request.verificationType} />
                  <p className="submitted-date">
                    Submitted: {formatDate(request.submittedAt)}
                  </p>
                </div>
              </div>

              <div className="request-details">
                <div className="detail-section">
                  <h4>Academic Information</h4>
                  <p><strong>Student ID:</strong> {request.studentId}</p>
                  <p><strong>Batch:</strong> {request.batch}</p>
                  <p><strong>Course:</strong> {request.course}</p>
                  {request.yearGraduated && (
                    <p><strong>Year Graduated:</strong> {request.yearGraduated}</p>
                  )}
                </div>

                {request.verificationType === 'alumni' && (
                  <div className="detail-section">
                    <h4>Professional Information</h4>
                    <p><strong>Current Work:</strong> {request.currentWork}</p>
                    {request.workPosition && (
                      <p><strong>Position:</strong> {request.workPosition}</p>
                    )}
                    {request.workCompany && (
                      <p><strong>Company:</strong> {request.workCompany}</p>
                    )}
                  </div>
                )}

                <div className="detail-section">
                  <h4>Skills</h4>
                  <div className="skills-list">
                    {request.skills && request.skills.map((skill, index) => (
                      <span key={index} className="skill-tag">{skill}</span>
                    ))}
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Documents</h4>
                  <div className="document-links">
                    {request.schoolIdUrl && (
                      <a href={request.schoolIdUrl} target="_blank" rel="noopener noreferrer" className="doc-link">
                        📄 School ID
                      </a>
                    )}
                    {request.transcriptUrl && (
                      <a href={request.transcriptUrl} target="_blank" rel="noopener noreferrer" className="doc-link">
                        📄 Transcript
                      </a>
                    )}
                    {request.diplomaUrl && (
                      <a href={request.diplomaUrl} target="_blank" rel="noopener noreferrer" className="doc-link">
                        📄 Diploma
                      </a>
                    )}
                    {request.workIdUrl && (
                      <a href={request.workIdUrl} target="_blank" rel="noopener noreferrer" className="doc-link">
                        📄 Work ID
                      </a>
                    )}
                  </div>
                </div>

                {request.status === 'rejected' && request.rejectionReason && (
                  <div className="detail-section rejection-reason">
                    <h4>Rejection Reason</h4>
                    <p>{request.rejectionReason}</p>
                  </div>
                )}
              </div>

              {request.status === 'pending' && (
                <div className="request-actions">
                  <button 
                    className="approve-btn"
                    onClick={() => handleApprove(request.id)}
                    disabled={isProcessing}
                  >
                    ✓ Approve
                  </button>
                  <button 
                    className="reject-btn"
                    onClick={() => setSelectedRequest(request)}
                    disabled={isProcessing}
                  >
                    ✗ Reject
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Rejection Modal */}
      {selectedRequest && (
        <div className="modal-overlay">
          <div className="rejection-modal">
            <h3>Reject Verification Request</h3>
            <p>Please provide a reason for rejecting {selectedRequest.fullName}'s verification request:</p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows="4"
            />
            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => {
                  setSelectedRequest(null);
                  setRejectionReason('');
                }}
              >
                Cancel
              </button>
              <button 
                className="confirm-reject-btn"
                onClick={() => handleReject(selectedRequest.id)}
                disabled={isProcessing || !rejectionReason.trim()}
              >
                {isProcessing ? 'Processing...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVerification;
