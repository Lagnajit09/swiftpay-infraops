import AuthLayout from "../components/auth/AuthLayout";
import ForgotPasswordForm from "../components/auth/ForgotPasswordForm";
import { ToastProvider } from "../components/auth/ToastProvider";

const ForgotPassword = () => {
  return (
    <ToastProvider>
      <AuthLayout
        title="Reset Password"
        subtitle="Enter your email to receive a password reset link."
      >
        <ForgotPasswordForm />
      </AuthLayout>
    </ToastProvider>
  );
};

export default ForgotPassword;
