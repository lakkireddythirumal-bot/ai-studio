import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/plant';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (role: User['role'], plantName?: string, name?: string) => void;
  logout: () => void;
}

const DEFAULT_USER: User = {
  id: 'usr_001',
  name: 'L. Thirumal Reddy',
  email: 'lakkireddythirumal@gmail.com',
  role: 'Plant Manager',
  plant: 'Khammam Feed Plant Unit-1',
  avatar: '🏭',
};

const AuthContext = createContext<AuthContextType>({
  currentUser: DEFAULT_USER,
  isAuthenticated: true,
  login: () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('feed_plant_user_session');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_USER;
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('feed_plant_user_session', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('feed_plant_user_session');
    }
  }, [currentUser]);

  const login = (role: User['role'], plantName = 'Khammam Feed Plant Unit-1', name?: string) => {
    const namesByRole: Record<string, string> = {
      'Plant Manager': 'L. Thirumal Reddy',
      'Production Incharge': 'R. Rajesh Kumar',
      'Maintenance Engineer': 'K. Srinivas Rao',
      'Stores Manager': 'V. Murali Krishna',
      'Director': 'P. Venkat Reddy',
    };

    const user: User = {
      id: `usr_${Date.now()}`,
      name: name || namesByRole[role] || 'Plant Operator',
      email: `${role.toLowerCase().replace(/\s+/g, '.')}@feedplant.com`,
      role,
      plant: plantName,
      avatar: role === 'Plant Manager' ? '🏭' : role === 'Production Incharge' ? '⚙️' : role === 'Maintenance Engineer' ? '🔧' : '📦',
    };
    setCurrentUser(user);
  };

  const logout = () => {
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
