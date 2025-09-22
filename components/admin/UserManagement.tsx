import React, { useState } from 'react';
import { User } from '../../types';

interface UserManagementProps {
  users: User[];
  onAddUser: (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateUser: (userId: string, userData: Partial<User>) => void;
  onDeleteUser: (userId: string) => void;
}

const UserManagement: React.FC<UserManagementProps> = ({
  users,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user' as 'admin' | 'user',
    avatarUrl: '',
    phone: '',
    department: '',
    position: '',
    location: '',
    bio: '',
    skills: [] as string[],
    startDate: '',
    profilePicture: '',
    socialLinks: {
      linkedin: '',
      twitter: '',
      github: ''
    },
    preferences: {
      timezone: 'America/Los_Angeles',
      language: 'en',
      notifications: true,
      theme: 'light' as 'light' | 'dark' | 'auto'
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: 'user',
      avatarUrl: '',
      phone: '',
      department: '',
      position: '',
      location: '',
      bio: '',
      skills: [],
      startDate: '',
      profilePicture: '',
      socialLinks: {
        linkedin: '',
        twitter: '',
        github: ''
      },
      preferences: {
        timezone: 'America/Los_Angeles',
        language: 'en',
        notifications: true,
        theme: 'light'
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim()) {
      alert('Name and email are required');
      return;
    }

    const userData = {
      ...formData,
      avatarUrl: formData.avatarUrl || `https://i.pravatar.cc/150?u=${formData.email}`,
      isActive: true,
    };

    if (editingUser) {
      onUpdateUser(editingUser.id, userData);
      setEditingUser(null);
    } else {
      onAddUser(userData);
      setIsModalOpen(false);
    }
    
    resetForm();
  };

  const handleEdit = (user: User) => {
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      phone: user.phone || '',
      department: user.department || '',
      position: user.position || '',
      location: user.location || '',
      bio: user.bio || '',
      skills: user.skills || [],
      startDate: user.startDate || '',
      profilePicture: user.profilePicture || '',
      socialLinks: {
        linkedin: user.socialLinks?.linkedin || '',
        twitter: user.socialLinks?.twitter || '',
        github: user.socialLinks?.github || ''
      },
      preferences: {
        timezone: user.preferences?.timezone || 'America/Los_Angeles',
        language: user.preferences?.language || 'en',
        notifications: user.preferences?.notifications ?? true,
        theme: user.preferences?.theme || 'light'
      }
    });
    setEditingUser(user);
  };

  const handleDelete = (user: User) => {
    if (confirm(`Are you sure you want to delete user: ${user.name}?`)) {
      onDeleteUser(user.id);
    }
  };

  const handleToggleActive = (user: User) => {
    onUpdateUser(user.id, { isActive: !user.isActive });
  };

  // Admin access is handled by App.tsx routing

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              👥 User Management
            </h2>
            <p className="text-slate-600 mt-1">Manage team members and their permissions</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            + Add User
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">{users.length}</div>
            <div className="text-sm text-blue-800">Total Users</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">
              {users.filter(u => u.isActive).length}
            </div>
            <div className="text-sm text-green-800">Active Users</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600">
              {users.filter(u => u.role === 'admin').length}
            </div>
            <div className="text-sm text-purple-800">Administrators</div>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-4 bg-slate-50 border-b">
          <h3 className="font-semibold text-slate-800">Team Members</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-4 font-medium text-slate-700">User</th>
                <th className="text-left p-4 font-medium text-slate-700">Email</th>
                <th className="text-left p-4 font-medium text-slate-700">Phone</th>
                <th className="text-left p-4 font-medium text-slate-700">Role</th>
                <th className="text-left p-4 font-medium text-slate-700">Status</th>
                <th className="text-left p-4 font-medium text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img 
                        src={user.avatarUrl} 
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <div className="font-medium text-slate-800">{user.name}</div>
                        {user.department && (
                          <div className="text-xs text-slate-500">{user.department}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-slate-600">{user.email}</td>
                  <td className="p-4 text-slate-600">
                    {user.phone ? (
                      <span className="flex items-center gap-1">
                        📱 {user.phone}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">No phone</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.role === 'admin' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleActive(user)}
                        className={`text-sm font-medium ${
                          user.isActive 
                            ? 'text-orange-600 hover:text-orange-800' 
                            : 'text-green-600 hover:text-green-800'
                        }`}
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
                        className="text-sm font-medium text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit User Modal */}
      {(isModalOpen || editingUser) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-800">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingUser(null);
                  resetForm();
                }}
                className="text-slate-500 hover:text-slate-700 text-xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  📱 Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  placeholder="+1-555-0123"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as 'admin' | 'user' }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                >
                  <option value="user">User</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Avatar URL (optional)
                </label>
                <input
                  type="url"
                  value={formData.avatarUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, avatarUrl: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  placeholder="https://example.com/avatar.jpg"
                />
                <p className="text-xs text-slate-500 mt-1">
                  If empty, a random avatar will be generated
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingUser(null);
                    resetForm();
                  }}
                  className="flex-1 bg-slate-500 hover:bg-slate-600 text-white py-2 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-brand-600 hover:bg-brand-700 text-white py-2 rounded-lg font-medium transition-colors"
                >
                  {editingUser ? 'Update User' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;