// Database Client for Vanguard Library Backend API

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper to fetch authorization headers from localStorage
const getAuthHeaders = () => {
  const savedUser = localStorage.getItem('lib_current_user');
  if (savedUser) {
    const user = JSON.parse(savedUser);
    if (user.token) {
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`
      };
    }
  }
  return { 'Content-Type': 'application/json' };
};

export const db = {
  getBooks: async () => {
    const res = await fetch(`${API_BASE_URL}/books`, { headers: getAuthHeaders() });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Failed to fetch books from server');
    }
    const serverBooks = await res.json();
    // Map database _id to id for frontend compatibility
    return serverBooks.map(b => ({ ...b, id: b._id }));
  },

  authenticate: async (pin, password) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin, password })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || 'Authentication failed');
    }
    // Compatibility mapper
    return {
      id: data._id,
      name: data.name,
      pin: data.pin,
      role: data.role,
      branch: data.branch,
      year: data.year,
      token: data.token
    };
  },

  getStudentDashboardData: async (studentId) => {
    const res = await fetch(`${API_BASE_URL}/transactions/student/dashboard`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Failed to load student dashboard data');
    }
    const data = await res.json();

    // Convert populated MongoDB transactions back into frontend structure
    const activeLoans = data.activeLoans.map(t => ({
      id: t._id,
      studentId: t.student,
      bookId: t.book?._id,
      borrowDate: t.borrowDate.split('T')[0],
      dueDate: t.dueDate.split('T')[0],
      returnDate: t.returnDate ? t.returnDate.split('T')[0] : null,
      status: t.status,
      book: { ...t.book, id: t.book?._id }
    }));

    const history = data.history.map(t => ({
      id: t._id,
      studentId: t.student,
      bookId: t.book?._id,
      borrowDate: t.borrowDate.split('T')[0],
      dueDate: t.dueDate.split('T')[0],
      returnDate: t.returnDate ? t.returnDate.split('T')[0] : null,
      status: t.status,
      book: { ...t.book, id: t.book?._id }
    }));

    return {
      student: {
        id: data.student._id,
        name: data.student.name,
        pin: data.student.pin,
        branch: data.student.branch,
        year: data.student.year
      },
      activeLoans,
      history
    };
  },

  getStudentsByBranch: async (year, branch) => {
    const res = await fetch(`${API_BASE_URL}/transactions/admin/students/${encodeURIComponent(year)}/${encodeURIComponent(branch)}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Failed to fetch branch student directory');
    }
    const serverStudents = await res.json();
    return serverStudents.map(s => ({
      id: s._id,
      name: s.name,
      pin: s.pin,
      role: s.role,
      branch: s.branch,
      year: s.year
    }));
  },

  getStudentDetailByAdmin: async (studentId) => {
    const res = await fetch(`${API_BASE_URL}/transactions/admin/student/${studentId}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Failed to fetch student details');
    }
    const data = await res.json();

    const activeLoans = data.activeLoans.map(t => ({
      id: t._id,
      studentId: t.student,
      bookId: t.book?._id,
      borrowDate: t.borrowDate.split('T')[0],
      dueDate: t.dueDate.split('T')[0],
      returnDate: t.returnDate ? t.returnDate.split('T')[0] : null,
      status: t.status,
      book: { ...t.book, id: t.book?._id }
    }));

    const history = data.history.map(t => ({
      id: t._id,
      studentId: t.student,
      bookId: t.book?._id,
      borrowDate: t.borrowDate.split('T')[0],
      dueDate: t.dueDate.split('T')[0],
      returnDate: t.returnDate ? t.returnDate.split('T')[0] : null,
      status: t.status,
      book: { ...t.book, id: t.book?._id }
    }));

    return {
      student: {
        id: data.student._id,
        name: data.student.name,
        pin: data.student.pin,
        branch: data.student.branch,
        year: data.student.year
      },
      activeLoans,
      history
    };
  },

  issueBook: async (studentId, bookId) => {
    const res = await fetch(`${API_BASE_URL}/transactions/admin/issue`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ studentId, bookId })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, message: data.message || 'Failed to issue book' };
    }
    return { success: true, message: 'Book issued successfully.' };
  },

  returnBook: async (transactionId) => {
    const res = await fetch(`${API_BASE_URL}/transactions/admin/return`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ transactionId })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, message: data.message || 'Failed to return book' };
    }
    return { success: true, message: 'Book returned successfully.' };
  },

  seedServerDatabase: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/seed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(result.message || 'Database seeding failed');
      }
      return { success: true, message: result.message };
    } catch (err) {
      return { success: false, message: err.message || 'Failed to communicate with server.' };
    }
  }
};
