import AuthLayout from '../components/auth/AuthLayout';
import SignUpForm from '../components/auth/SignUpForm';
import { ToastProvider } from '../components/auth/ToastProvider';

const Signup = () => {
  return (
    <ToastProvider>
      <AuthLayout 
        title="Create an account" 
        subtitle="Join SwiftPay and start sending money instantly."
      >
        <SignUpForm />
      </AuthLayout>
    </ToastProvider>
  );
};

export default Signup;
