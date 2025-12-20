import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Redirect to forgot password page (contact support)
const ResetPasswordPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to forgot password page which now shows contact support
    navigate('/forgot-password', { replace: true });
  }, [navigate]);

  return null;
};

export default ResetPasswordPage;
