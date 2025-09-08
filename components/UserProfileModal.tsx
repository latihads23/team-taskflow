import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { CloseIcon, CameraIcon } from './Icons';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSaveAvatar: (userId: string, newAvatarUrl: string) => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, user, onSaveAvatar }) => {
  const [newAvatarUrl, setNewAvatarUrl] = useState(user.avatarUrl);

  useEffect(() => {
    setNewAvatarUrl(user.avatarUrl);
  }, [user.avatarUrl]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAvatarUrl.trim()) {
      onSaveAvatar(user.id, newAvatarUrl);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSave}>
          <div className="p-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-800">My Profile</h2>
              <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-500">
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 flex flex-col items-center">
              <div className="relative group">
                <img src={newAvatarUrl} alt={user.name} className="h-28 w-28 rounded-full object-cover ring-4 ring-white shadow-md"/>
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <CameraIcon className="h-8 w-8 text-white" />
                </div>
              </div>
              <h3 className="mt-4 text-2xl font-bold text-slate-800">{user.name}</h3>
              <p className="mt-1 text-sm text-slate-500">{user.email}</p>
            </div>
            
            <div className="mt-6">
              <label htmlFor="avatarUrl" className="block text-sm font-medium text-slate-700 mb-1">
                Avatar Image URL
              </label>
              <input
                type="url"
                id="avatarUrl"
                name="avatarUrl"
                value={newAvatarUrl}
                onChange={(e) => setNewAvatarUrl(e.target.value)}
                placeholder="https://example.com/image.png"
                className="w-full border-slate-300 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
          </div>
          <div className="bg-slate-50 px-6 py-4 rounded-b-xl flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-brand-600 border border-transparent rounded-md shadow-sm hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserProfileModal;
