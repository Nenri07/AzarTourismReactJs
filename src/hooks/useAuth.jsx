import { useSelector } from 'react-redux';

export const useAuth = () => {
  const { authStatus, userData } = useSelector((state) => state.auth);

  return {
    isAuthenticated: authStatus,
    user: userData,
    isSuperAdmin: userData?.role === 'super_admin',
    isEmployee: userData?.role === 'employee' || userData?.role === 'staff',
  };
};