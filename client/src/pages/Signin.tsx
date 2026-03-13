import AuthLayout from '../components/auth/AuthLayout';
import SignInForm from '../components/auth/SignInForm';
import { ToastProvider } from '../components/auth/ToastProvider';

const Signin = () => {
  return (
    <ToastProvider>
      <AuthLayout 
        title="Welcome back" 
        subtitle="Enter your details to access your account."
      >
        <SignInForm />
      </AuthLayout>
    </ToastProvider>
  );
};

export default Signin;
