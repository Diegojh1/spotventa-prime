import { AuthModal } from "@/components/auth/AuthModal";
import { useNavigate } from "react-router-dom";

export function Auth() {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate('/');
  };

  const handleSuccess = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <AuthModal
        isOpen={true}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
