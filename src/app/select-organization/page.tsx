import { CreateOrganization } from '@clerk/nextjs';
import { dark } from '@clerk/themes';

export default function SelectOrganizationPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md">
        <CreateOrganization
          appearance={{
            baseTheme: dark,
            elements: {
              formButtonPrimary: 'bg-primary hover:bg-primary/90',
              footerActionLink: 'text-primary hover:text-primary/90',
            },
          }}
          path="/select-organization"
          routing="path"
        />
      </div>
    </div>
  );
}
