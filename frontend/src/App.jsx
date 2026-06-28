import { useState, useEffect } from 'react';
import { db } from './db';
import './App.css';

// Helper to get name initials for avatar
const getInitials = (name) => {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState('home'); // home, user-login, admin-login, user-dashboard, admin-dashboard, branch-view, student-detail
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [notification, setNotification] = useState(null);

  // Automatically show toast message and clear it
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
  };

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Handle auto-login if user is in localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('lib_current_user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      if (user.role === 'admin') {
        setView('admin-dashboard');
      } else {
        setView('user-dashboard');
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('lib_current_user');
    setCurrentUser(null);
    setView('home');
    showNotification('Logged out successfully.');
  };

  const handleNavigateHome = () => {
    if (currentUser) {
      setView(currentUser.role === 'admin' ? 'admin-dashboard' : 'user-dashboard');
    } else {
      setView('home');
    }
  };


  return (
    <div className="app-container">
      {/* Toast Notification */}
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          <span>{notification.type === 'success' ? '⚡' : '⚠️'}</span>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Global Header */}
      <header className="app-header">
        <div className="logo-section" onClick={handleNavigateHome}>
          <div className="logo-icon">V</div>
          <div className="logo-text">Vanguard Library</div>
        </div>
        <div className="nav-actions">
          {currentUser ? (
            <>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginRight: '0.5rem' }}>
                Hello, <strong>{currentUser.name.split(' ')[0]}</strong>
              </span>
              <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            view !== 'home' && (
              <button className="btn btn-secondary btn-sm" onClick={() => setView('home')}>
                Back to Portal
              </button>
            )
          )}
        </div>
      </header>

      {/* Content views */}
      {view === 'home' && <HomeView setView={setView} showNotification={showNotification} />}
      {view === 'user-login' && (
        <LoginView
          role="user"
          setView={setView}
          setCurrentUser={setCurrentUser}
          showNotification={showNotification}
        />
      )}
      {view === 'admin-login' && (
        <LoginView
          role="admin"
          setView={setView}
          setCurrentUser={setCurrentUser}
          showNotification={showNotification}
        />
      )}
      {view === 'user-dashboard' && currentUser && (
        <UserDashboardView currentUser={currentUser} />
      )}
      {view === 'admin-dashboard' && currentUser && (
        <AdminDashboardView
          setSelectedYear={setSelectedYear}
          setSelectedBranch={setSelectedBranch}
          setView={setView}
        />
      )}
      {view === 'branch-view' && currentUser && (
        <BranchView
          selectedYear={selectedYear}
          selectedBranch={selectedBranch}
          setView={setView}
          setSelectedStudentId={setSelectedStudentId}
        />
      )}
      {view === 'student-detail' && currentUser && (
        <StudentDetailView
          studentId={selectedStudentId}
          setView={setView}
          showNotification={showNotification}
        />
      )}
    </div>
  );
}

/* ==========================================================================
   1. HOME VIEW
   ========================================================================== */
function HomeView({ setView, showNotification }) {
  const [seeding, setSeeding] = useState(false);

  const handleSeed = async () => {
    setSeeding(true);
    const res = await db.seedServerDatabase();
    setSeeding(false);
    if (res.success) {
      showNotification(res.message, 'success');
    } else {
      showNotification(res.message + ' (Make sure your backend Node server is running on port 5000)', 'error');
    }
  };

  return (
    <>
      <div className="hero-section">
        <h1 className="hero-title">
          Welcome to the <span>Vanguard</span> Library
        </h1>
        <p className="hero-subtitle">
          An advanced repository management system designed with the modern student and librarian in mind.
        </p>
        
        {/* Helper DB Seeder for Backend Mode */}
        <div style={{ margin: '-1.5rem auto 3rem auto', animation: 'fadeIn 0.5s' }}>
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={handleSeed}
            disabled={seeding}
            style={{ border: '1px dashed var(--accent-purple)' }}
          >
            ⚙️ {seeding ? 'Seeding MongoDB...' : 'One-Click Seed MongoDB Data'}
          </button>
        </div>
      </div>

      <div className="portal-grid">
        <div className="portal-card glass-card" onClick={() => setView('user-login')}>
          <div className="portal-icon-wrapper">🎓</div>
          <h2>Student Portal</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Log in to view borrowed books, check upcoming return deadlines, and track your library history.
          </p>
          <button className="btn btn-primary" style={{ marginTop: 'auto' }}>
            Access Account
          </button>
        </div>

        <div className="portal-card glass-card" onClick={() => setView('admin-login')}>
          <div className="portal-icon-wrapper">🛡️</div>
          <h2>Librarian Portal</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Administrative panel to register records, track branch borrowings, and manage transactions.
          </p>
          <button className="btn btn-secondary" style={{ marginTop: 'auto' }}>
            Admin Console
          </button>
        </div>
      </div>
    </>
  );
}

/* ==========================================================================
   2. LOGIN VIEW
   ========================================================================== */
function LoginView({ role, setView, setCurrentUser, showNotification }) {
  const [pin, setPin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pin.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const user = await db.authenticate(pin, password);
      
      if (user.role !== role) {
        throw new Error(`Access denied. This portal is for ${role}s only.`);
      }

      // Save login state
      localStorage.setItem('lib_current_user', JSON.stringify(user));
      setCurrentUser(user);
      showNotification(`Welcome back, ${user.name}!`);

      if (role === 'admin') {
        setView('admin-dashboard');
      } else {
        setView('user-dashboard');
      }
    } catch (err) {
      setError(err.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="glass-card">
        <h2 className="login-title">
          {role === 'admin' ? 'Librarian Console' : 'Student Portal'}
        </h2>
        <p className="login-subtitle">Please enter your credentials to authenticate</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">{role === 'admin' ? 'Admin ID' : 'Student PIN / ID'}</label>
            <input
              type="text"
              className="form-input"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError('');
              }}
              placeholder={role === 'admin' ? 'e.g., admin' : 'e.g., STU001'}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          {error && <div className="form-error">{error}</div>}

          <button type="submit" className="btn btn-primary form-submit-btn" disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ==========================================================================
   3. USER DASHBOARD VIEW (STUDENT PAGE)
   ========================================================================== */
function UserDashboardView({ currentUser }) {
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('loans'); // loans, history

  useEffect(() => {
    const fetchDashboard = async () => {
      const studentData = await db.getStudentDashboardData(currentUser.id);
      setData(studentData);
    };
    fetchDashboard();
  }, [currentUser]);

  if (!data) return <div style={{ color: 'var(--text-secondary)' }}>Loading student metrics...</div>;

  const { student, activeLoans, history } = data;

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* Top Section: Profile Banner */}
      <div className="glass-card profile-banner">
        <div className="profile-avatar">{getInitials(student.name)}</div>
        <div className="profile-info">
          <h2 className="profile-name">{student.name}</h2>
          <div className="profile-meta">
            <span><strong>PIN:</strong> {student.pin}</span>
            <span><strong>Branch:</strong> {student.branch}</span>
            <span><strong>Year:</strong> {student.year}</span>
          </div>
        </div>
        <div className="profile-stats">
          <div className="stat-box">
            <div className="stat-value">{activeLoans.length}</div>
            <div className="stat-label">Active Loans</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{history.length}</div>
            <div className="stat-label">Returned Books</div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Book Lists */}
      <div className="glass-card">
        <div className="section-header">
          <h3 className="section-title">My Book Logs</h3>
          <div className="tabs-container">
            <button
              className={`tab-btn ${activeTab === 'loans' ? 'active' : ''}`}
              onClick={() => setActiveTab('loans')}
            >
              Borrowed ({activeLoans.length})
            </button>
            <button
              className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              History ({history.length})
            </button>
          </div>
        </div>

        {activeTab === 'loans' ? (
          activeLoans.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
              📭 No books currently borrowed.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="glass-table">
                <thead>
                  <tr>
                    <th>Book Title</th>
                    <th>Author</th>
                    <th>ISBN</th>
                    <th>Borrow Date</th>
                    <th>Due Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {activeLoans.map((loan) => {
                    const overdue = new Date(loan.dueDate) < new Date();
                    return (
                      <tr key={loan.id}>
                        <td><strong>{loan.book?.title}</strong></td>
                        <td>{loan.book?.author}</td>
                        <td style={{ fontFamily: 'monospace' }}>{loan.book?.isbn}</td>
                        <td>{loan.borrowDate}</td>
                        <td style={{ color: overdue ? 'var(--accent-rose)' : 'inherit' }}>
                          {loan.dueDate}
                        </td>
                        <td>
                          <span className={`badge ${overdue ? 'badge-overdue' : 'badge-borrowed'}`}>
                            {overdue ? 'Overdue' : 'Borrowed'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : (
          history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
              📭 No past transaction history.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="glass-table">
                <thead>
                  <tr>
                    <th>Book Title</th>
                    <th>Author</th>
                    <th>ISBN</th>
                    <th>Borrow Date</th>
                    <th>Return Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((record) => (
                    <tr key={record.id}>
                      <td><strong>{record.book?.title}</strong></td>
                      <td>{record.book?.author}</td>
                      <td style={{ fontFamily: 'monospace' }}>{record.book?.isbn}</td>
                      <td>{record.borrowDate}</td>
                      <td>{record.returnDate}</td>
                      <td>
                        <span className="badge badge-returned">Returned</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  );
}

/* ==========================================================================
   4. ADMIN DASHBOARD VIEW (YEARS & BRANCHES LIST)
   ========================================================================== */
function AdminDashboardView({ setSelectedYear, setSelectedBranch, setView }) {
  const years = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
  const branches = [
    "Computer Science (CSE)",
    "Electronics & Comm (ECE)",
    "Electrical & Electronics (EEE)",
    "Mechanical Eng (MECH)"
  ];

  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);

  // Load department student counts asynchronously to avoid render issues
  useEffect(() => {
    const fetchCounts = async () => {
      setLoading(true);
      const newCounts = {};
      for (const y of years) {
        for (const b of branches) {
          const students = await db.getStudentsByBranch(y, b);
          newCounts[`${y}_${b}`] = students ? students.length : 0;
        }
      }
      setCounts(newCounts);
      setLoading(false);
    };
    fetchCounts();
  }, []);

  const handleBranchClick = (year, branch) => {
    setSelectedYear(year);
    setSelectedBranch(branch);
    setView('branch-view');
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div className="section-header" style={{ marginBottom: '2rem' }}>
        <h2 className="section-title">🏫 Student Directory by Year & Branch</h2>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-secondary)', padding: '2rem 0' }}>Loading department rosters...</div>
      ) : (
        <div className="admin-grid">
          {years.map((year) => {
            const totalYearStudents = branches.reduce((acc, br) => acc + (counts[`${year}_${br}`] || 0), 0);

            return (
              <div className="year-card glass-card" style={{ padding: '0' }} key={year}>
                <div className="year-header">
                  <span>{year}</span>
                  <span className="year-badge">{totalYearStudents} Students</span>
                </div>
                <div className="branch-list">
                  {branches.map((branch) => {
                    const count = counts[`${year}_${branch}`] || 0;
                    return (
                      <div
                        className="branch-item"
                        key={branch}
                        onClick={() => handleBranchClick(year, branch)}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                            {branch.split(' ')[0]}
                          </span>
                          <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                            {branch.match(/\(([^)]+)\)/)?.[1] || branch}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="badge badge-borrowed" style={{ padding: '0.1rem 0.4rem' }}>
                            {count}
                          </span>
                          <span className="branch-arrow">→</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   5. BRANCH VIEW (STUDENTS LIST)
   ========================================================================== */
function BranchView({ selectedYear, selectedBranch, setView, setSelectedStudentId }) {
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      const data = await db.getStudentsByBranch(selectedYear, selectedBranch);
      setStudents(data || []);
      setLoading(false);
    };
    fetchStudents();
  }, [selectedYear, selectedBranch]);

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.pin.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStudentSelect = (id) => {
    setSelectedStudentId(id);
    setView('student-detail');
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* Back navigation */}
      <div style={{ marginBottom: '1.5rem' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => setView('admin-dashboard')}>
          ← Back to Directory
        </button>
      </div>

      <div className="glass-card">
        <div className="section-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '2rem' }}>
          <h2 className="section-title">
            👥 {selectedBranch}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Showing students in <strong>{selectedYear}</strong>
          </p>
        </div>

        {/* Search */}
        <div className="search-bar-container">
          <input
            type="text"
            className="form-input search-input"
            placeholder="🔍 Search student by name or PIN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <div style={{ color: 'var(--text-secondary)', padding: '2rem 0' }}>Loading department students...</div>
        ) : filteredStudents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
            🔍 No students match the search criteria.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Avatar</th>
                  <th>Student Name</th>
                  <th>Student PIN</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.id}>
                    <td>
                      <div className="profile-avatar" style={{ width: '40px', height: '40px', fontSize: '1rem', boxShadow: 'none' }}>
                        {getInitials(student.name)}
                      </div>
                    </td>
                    <td><strong>{student.name}</strong></td>
                    <td style={{ fontFamily: 'monospace' }}>{student.pin}</td>
                    <td>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleStudentSelect(student.id)}
                      >
                        Edit Loans / Modify
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ==========================================================================
   6. STUDENT DETAIL & TRANSACTION MODIFICATION VIEW (ADMIN WORKSPACE)
   ========================================================================== */
function StudentDetailView({ studentId, setView, showNotification }) {
  const [data, setData] = useState(null);
  const [bookSearch, setBookSearch] = useState('');
  const [booksList, setBooksList] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load and refresh details
  const refreshDetails = async () => {
    setLoading(true);
    const studentData = await db.getStudentDetailByAdmin(studentId);
    setData(studentData);
    const books = await db.getBooks();
    setBooksList(books || []);
    setLoading(false);
  };

  useEffect(() => {
    refreshDetails();
  }, [studentId]);

  // Live filter books for the issue selector
  useEffect(() => {
    if (bookSearch.trim() === '') {
      setSearchResults([]);
      return;
    }
    const filtered = booksList.filter(b =>
      b.title.toLowerCase().includes(bookSearch.toLowerCase()) ||
      b.author.toLowerCase().includes(bookSearch.toLowerCase()) ||
      b.isbn.includes(bookSearch)
    );
    setSearchResults(filtered);
  }, [bookSearch, booksList]);

  if (loading && !data) return <div style={{ color: 'var(--text-secondary)' }}>Retrieving student profile...</div>;
  if (!data) return <div style={{ color: 'var(--text-secondary)' }}>No student records found.</div>;

  const { student, activeLoans, history } = data;

  const handleReturn = async (txId, bookTitle) => {
    const res = await db.returnBook(txId);
    if (res.success) {
      showNotification(`Returned "${bookTitle}" successfully!`, 'success');
      await refreshDetails();
    } else {
      showNotification(res.message, 'error');
    }
  };

  const handleIssue = async (book) => {
    const res = await db.issueBook(student.id, book.id);
    if (res.success) {
      showNotification(`Issued "${book.title}" successfully!`, 'success');
      setBookSearch('');
      setSearchResults([]);
      await refreshDetails();
    } else {
      showNotification(res.message, 'error');
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* Back button */}
      <div style={{ marginBottom: '1.5rem' }}>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setView('branch-view')}
        >
          ← Back to Branch
        </button>
      </div>

      <div className="student-view-grid">
        {/* Left Column: Profile Card + Issue Form */}
        <div className="glass-card student-card-left">
          <div className="profile-avatar">{getInitials(student.name)}</div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{student.name}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              ID: {student.pin}
            </p>
          </div>

          <div style={{ width: '100%', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
            <div><strong>Branch:</strong> {student.branch}</div>
            <div><strong>Academic Year:</strong> {student.year}</div>
            <div><strong>Active Borrowings:</strong> {activeLoans.length} books</div>
          </div>

          {/* Issue Book Section */}
          <div className="issue-book-box" style={{ position: 'relative' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', fontWeight: 700 }}>Issue a Book</h3>
            <div className="form-group" style={{ marginBottom: '0' }}>
              <input
                type="text"
                className="form-input"
                placeholder="🔍 Search title, author, or ISBN..."
                value={bookSearch}
                onChange={(e) => setBookSearch(e.target.value)}
              />
            </div>

            {/* Dropdown suggestions */}
            {searchResults.length > 0 && (
              <div className="book-search-results">
                {searchResults.map((book) => (
                  <div
                    className="book-search-item"
                    key={book.id}
                    onClick={() => handleIssue(book)}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{book.title}</div>
                      <div className="book-search-author">By {book.author}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="badge badge-returned" style={{ fontSize: '0.65rem' }}>
                        {book.availableCopies} left
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {bookSearch.trim() !== '' && searchResults.length === 0 && (
              <div className="book-search-results" style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                No books found.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Loan Editor (List and Return choice) */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div>
            <h3 className="section-title" style={{ marginBottom: '1rem' }}>
              📋 Active Loans ({activeLoans.length})
            </h3>

            {activeLoans.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(0,0,0,0.1)', borderRadius: '10px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                No books currently checked out.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="glass-table">
                  <thead>
                    <tr>
                      <th>Book Title</th>
                      <th>Borrow Date</th>
                      <th>Due Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeLoans.map((loan) => {
                      const overdue = new Date(loan.dueDate) < new Date();
                      return (
                        <tr key={loan.id}>
                          <td>
                            <strong>{loan.book?.title}</strong>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              By {loan.book?.author}
                            </div>
                          </td>
                          <td>{loan.borrowDate}</td>
                          <td style={{ color: overdue ? 'var(--accent-rose)' : 'inherit', fontWeight: overdue ? '700' : 'normal' }}>
                            {loan.dueDate} {overdue && '(Overdue)'}
                          </td>
                          <td>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleReturn(loan.id, loan.book?.title)}
                            >
                              Return Book
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div>
            <h3 className="section-title" style={{ marginBottom: '1rem' }}>
              🕰️ Returned History ({history.length})
            </h3>

            {history.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(0,0,0,0.1)', borderRadius: '10px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                No borrowing history records.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="glass-table">
                  <thead>
                    <tr>
                      <th>Book Title</th>
                      <th>Borrow Date</th>
                      <th>Return Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((record) => (
                      <tr key={record.id}>
                        <td>
                          <strong>{record.book?.title}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            By {record.book?.author}
                          </div>
                        </td>
                        <td>{record.borrowDate}</td>
                        <td>{record.returnDate}</td>
                        <td>
                          <span className="badge badge-returned">Returned</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
