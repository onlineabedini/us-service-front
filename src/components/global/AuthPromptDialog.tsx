import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface AuthPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AuthPromptDialog: React.FC<AuthPromptDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleLogin = () => {
    onOpenChange(false);
    navigate('/login/client');
  };

  const handleRegister = () => {
    onOpenChange(false);
    navigate('/register/client');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            {t('loginRequired') || 'Login Required'}
          </DialogTitle>
          <DialogDescription className="text-gray-600 mt-2">
            {t('loginRequiredForBooking') || 'To book a service, you need to be logged in as a client. Please login or register to continue.'}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 mt-6">
          <Button
            onClick={handleLogin}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white"
          >
            {t('login') || 'Login'}
          </Button>
          <Button
            onClick={handleRegister}
            className="w-full bg-white hover:bg-gray-50 text-teal-600 border border-teal-600"
          >
            {t('registerAsClient') || 'Register as Client'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthPromptDialog; 