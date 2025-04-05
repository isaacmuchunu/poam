import { SignIn } from '@clerk/nextjs';
import { dark } from '@clerk/themes';

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md">
        <SignIn
          appearance={{
            baseTheme: dark,
            elements: {
              formButtonPrimary: 'bg-primary hover:bg-primary/90',
              footerActionLink: 'text-primary hover:text-primary/90',
            },
          }}
          path="/login"
          routing="path"
          signUpUrl="/sign-up"
        />
      </div>
    </div>
  );
}
