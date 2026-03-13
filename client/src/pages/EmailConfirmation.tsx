import AuthLayout from "../components/auth/AuthLayout";
import EmailConfirmationUI from "../components/auth/EmailConfirmationUI";
import { ToastProvider } from "../components/auth/ToastProvider";

const EmailConfirmation = () => {
  return (
    <ToastProvider>
      <AuthLayout
        title="Email Verification"
        subtitle="Confirming your identity to secure your SwiftPay account."
      >
        <EmailConfirmationUI />
      </AuthLayout>
    </ToastProvider>
  );
};

export default EmailConfirmation;
