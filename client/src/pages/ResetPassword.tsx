import AuthLayout from "../components/auth/AuthLayout";
import ResetPasswordForm from "../components/auth/ResetPasswordForm";
import { ToastProvider } from "../components/auth/ToastProvider";

const ResetPassword = () => {
  return (
    <ToastProvider>
      <AuthLayout
        title="Set New Password"
        subtitle="Enter your new password below to complete the reset."
      >
        <ResetPasswordForm />
      </AuthLayout>
    </ToastProvider>
  );
};

export default ResetPassword;
