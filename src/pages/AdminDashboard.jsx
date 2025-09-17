import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import logoImage from '../components/Logo2.png';

function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalAlumni: 0,
    totalPosts: 0,
    totalMentorships: 0,
    recentUsers: [],
    recentPosts: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Fetch users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Fetch posts (if you have a posts collection)
      let posts = [];
      try {
        const postsSnapshot = await getDocs(collection(db, 'posts'));
        posts = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (error) {
        console.log('Posts collection not found or empty');
      }

      // Calculate stats
      const totalUsers = users.length;
      const totalStudents = users.filter(user => user.role === 'student').length;
      const totalAlumni = users.filter(user => user.role === 'alumni').length;
      const totalPosts = posts.length;
      
      // Get recent users (last 10)
      const recentUsers = users
        .sort((a, b) => new Date(b.createdAt?.toDate?.() || b.createdAt || 0) - new Date(a.createdAt?.toDate?.() || a.createdAt || 0))
        .slice(0, 10);

      // Get recent posts (last 10)
      const recentPosts = posts
        .sort((a, b) => new Date(b.createdAt?.toDate?.() || b.createdAt || 0) - new Date(a.createdAt?.toDate?.() || a.createdAt || 0))
        .slice(0, 10);

      setStats({
        totalUsers,
        totalStudents,
        totalAlumni,
        totalPosts,
        totalMentorships: 0, // You can implement this based on your mentorship system
        recentUsers,
        recentPosts
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('adminUser');
    navigate('/');
  };

  const StatCard = ({ title, value, icon, color, change }) => (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
      border: '1px solid #e5e7eb',
      transition: 'all 0.3s ease'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.05)';
    }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 8px 0', fontWeight: '500' }}>
            {title}
          </p>
          <p style={{ color: '#111827', fontSize: '32px', margin: '0', fontWeight: '700' }}>
            {value}
          </p>
          {change && (
            <p style={{ 
              color: change > 0 ? '#10b981' : '#ef4444', 
              fontSize: '12px', 
              margin: '4px 0 0 0',
              fontWeight: '500'
            }}>
              {change > 0 ? '+' : ''}{change}% from last month
            </p>
          )}
        </div>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          background: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          color: 'white'
        }}>
          <i className={icon}></i>
        </div>
      </div>
    </div>
  );

  const UserTable = () => (
    <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)' }}>
      <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
        <h3 style={{ margin: 0, color: '#111827', fontSize: '18px', fontWeight: '600' }}>
          Recent Users
        </h3>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                User
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                Role
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                Email
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                Joined
              </th>
            </tr>
          </thead>
          <tbody>
            {stats.recentUsers.map((user, index) => (
              <tr key={user.id} style={{ borderBottom: index < stats.recentUsers.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: user.role === 'alumni' ? '#3b82f6' : '#10b981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}>
                      {user.firstName?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p style={{ margin: 0, color: '#111827', fontSize: '14px', fontWeight: '500' }}>
                        {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.displayName || 'Unknown User'}
                      </p>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '500',
                    background: user.role === 'alumni' ? '#dbeafe' : '#d1fae5',
                    color: user.role === 'alumni' ? '#1e40af' : '#065f46'
                  }}>
                    {user.role || 'student'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: '14px' }}>
                  {user.email}
                </td>
                <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: '14px' }}>
                  {user.createdAt ? new Date(user.createdAt.toDate?.() || user.createdAt).toLocaleDateString() : 'Unknown'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f9fafb'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #dc2626',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#6b7280', fontSize: '16px' }}>Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Header */}
      <header style={{
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '0 24px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img 
            src={logoImage} 
            alt="Connectrix Logo" 
            style={{
              height: '40px',
              width: '40px',
              objectFit: 'cover',
              borderRadius: '8px'
            }}
          />
          <div>
            <h1 style={{ margin: 0, color: '#111827', fontSize: '20px', fontWeight: '700' }}>
              Connectrix Admin Dashboard
            </h1>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
              Analytics & User Management
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={fetchAnalytics}
            style={{
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#2563eb';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#3b82f6';
            }}
          >
            <i className="fas fa-sync-alt" style={{ marginRight: '8px' }}></i>
            Refresh
          </button>
          <button
            onClick={handleLogout}
            style={{
              background: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#b91c1c';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#dc2626';
            }}
          >
            <i className="fas fa-sign-out-alt" style={{ marginRight: '8px' }}></i>
            Logout
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '0 24px'
      }}>
        <div style={{ display: 'flex', gap: '32px' }}>
          {[
            { id: 'overview', label: 'Overview', icon: 'fas fa-chart-pie' },
            { id: 'users', label: 'Users', icon: 'fas fa-users' },
            { id: 'content', label: 'Content', icon: 'fas fa-file-alt' },
            { id: 'settings', label: 'Settings', icon: 'fas fa-cog' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                padding: '16px 0',
                fontSize: '14px',
                fontWeight: '500',
                color: activeTab === tab.id ? '#dc2626' : '#6b7280',
                cursor: 'pointer',
                borderBottom: activeTab === tab.id ? '2px solid #dc2626' : '2px solid transparent',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <i className={tab.icon}></i>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main style={{ padding: '24px' }}>
        {activeTab === 'overview' && (
          <div>
            {/* Stats Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '24px',
              marginBottom: '32px'
            }}>
              <StatCard
                title="Total Users"
                value={stats.totalUsers}
                icon="fas fa-users"
                color="linear-gradient(135deg, #3b82f6, #1d4ed8)"
              />
              <StatCard
                title="Students"
                value={stats.totalStudents}
                icon="fas fa-graduation-cap"
                color="linear-gradient(135deg, #10b981, #059669)"
              />
              <StatCard
                title="Alumni"
                value={stats.totalAlumni}
                icon="fas fa-user-tie"
                color="linear-gradient(135deg, #8b5cf6, #7c3aed)"
              />
              <StatCard
                title="Total Posts"
                value={stats.totalPosts}
                icon="fas fa-file-alt"
                color="linear-gradient(135deg, #f59e0b, #d97706)"
              />
            </div>

            {/* Charts Section */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr',
              gap: '24px',
              marginBottom: '32px'
            }}>
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                border: '1px solid #e5e7eb'
              }}>
                <h3 style={{ margin: '0 0 20px 0', color: '#111827', fontSize: '18px', fontWeight: '600' }}>
                  User Growth
                </h3>
                <div style={{
                  height: '200px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6b7280',
                  fontSize: '16px'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <i className="fas fa-chart-line" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}></i>
                    <p>Chart visualization would go here</p>
                    <p style={{ fontSize: '14px', margin: '8px 0 0 0' }}>
                      Students: {stats.totalStudents} | Alumni: {stats.totalAlumni}
                    </p>
                  </div>
                </div>
              </div>

              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                border: '1px solid #e5e7eb'
              }}>
                <h3 style={{ margin: '0 0 20px 0', color: '#111827', fontSize: '18px', fontWeight: '600' }}>
                  Quick Stats
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>Active Users</span>
                    <span style={{ color: '#111827', fontSize: '16px', fontWeight: '600' }}>{stats.totalUsers}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>Student Ratio</span>
                    <span style={{ color: '#111827', fontSize: '16px', fontWeight: '600' }}>
                      {stats.totalUsers > 0 ? Math.round((stats.totalStudents / stats.totalUsers) * 100) : 0}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>Alumni Ratio</span>
                    <span style={{ color: '#111827', fontSize: '16px', fontWeight: '600' }}>
                      {stats.totalUsers > 0 ? Math.round((stats.totalAlumni / stats.totalUsers) * 100) : 0}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>Total Posts</span>
                    <span style={{ color: '#111827', fontSize: '16px', fontWeight: '600' }}>{stats.totalPosts}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Users Table */}
            <UserTable />
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
              border: '1px solid #e5e7eb',
              marginBottom: '24px'
            }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#111827', fontSize: '18px', fontWeight: '600' }}>
                All Users ({stats.totalUsers})
              </h3>
              <UserTable />
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div>
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#111827', fontSize: '18px', fontWeight: '600' }}>
                Content Management
              </h3>
              <div style={{
                height: '200px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6b7280',
                fontSize: '16px'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <i className="fas fa-file-alt" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}></i>
                  <p>Content management features coming soon</p>
                  <p style={{ fontSize: '14px', margin: '8px 0 0 0' }}>
                    Total Posts: {stats.totalPosts}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div>
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#111827', fontSize: '18px', fontWeight: '600' }}>
                Admin Settings
              </h3>
              <div style={{
                height: '200px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6b7280',
                fontSize: '16px'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <i className="fas fa-cog" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}></i>
                  <p>Admin settings coming soon</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default AdminDashboard;
