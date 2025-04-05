# POA&M Architect Deployment Guide

This guide provides step-by-step instructions for deploying the POA&M Architect application to a production environment.

## Prerequisites

- Node.js 18.x or later
- npm 9.x or later
- Git
- A Vercel, Netlify, or AWS account for hosting
- A PostgreSQL database (can be hosted on services like AWS RDS, DigitalOcean, or Supabase)
- A Clerk account for authentication
- An Upstash account for Redis caching and rate limiting

## Step 1: Export the Codebase

First, you'll need to export the codebase from the sandbox environment:

1. Create a new repository on GitHub or another Git hosting service
2. Clone the repository to your local machine
3. Copy all files from the `/home/ubuntu/poam-architect-app` directory to your local repository
4. Commit and push the changes to your repository

## Step 2: Set Up Environment Variables

Create a `.env.local` file in the root of your project with the following variables:

```
# Database
DATABASE_URL=postgresql://username:password@hostname:port/database

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret

# Upstash Redis
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token

# Upstash QStash
UPSTASH_QSTASH_TOKEN=your_upstash_qstash_token
UPSTASH_QSTASH_CURRENT_SIGNING_KEY=your_upstash_qstash_signing_key
UPSTASH_QSTASH_NEXT_SIGNING_KEY=your_upstash_qstash_next_signing_key
```

Replace the placeholder values with your actual credentials.

## Step 3: Set Up the Database

1. Create a PostgreSQL database on your preferred hosting service
2. Update the `DATABASE_URL` in your `.env.local` file
3. Run the database migrations:

```bash
npx drizzle-kit push:pg
```

## Step 4: Configure Clerk Authentication

1. Create a new application in your Clerk dashboard
2. Configure the application with the following settings:
   - Enable email/password authentication
   - Enable organizations
   - Set up the JWT template with custom claims for tenant ID
3. Add the Clerk API keys to your `.env.local` file
4. Configure the redirect URLs in your Clerk dashboard to match your production domain

## Step 5: Deploy to Vercel (Recommended)

1. Install the Vercel CLI:

```bash
npm install -g vercel
```

2. Log in to Vercel:

```bash
vercel login
```

3. Deploy the application:

```bash
vercel --prod
```

4. Follow the prompts to link your project to your Vercel account
5. Add all environment variables from your `.env.local` file to your Vercel project settings

## Step 6: Alternative Deployment Options

### Deploy to Netlify

1. Install the Netlify CLI:

```bash
npm install -g netlify-cli
```

2. Log in to Netlify:

```bash
netlify login
```

3. Deploy the application:

```bash
netlify deploy --prod
```

4. Add all environment variables from your `.env.local` file to your Netlify project settings

### Deploy to AWS Amplify

1. Install the AWS Amplify CLI:

```bash
npm install -g @aws-amplify/cli
```

2. Configure the AWS Amplify CLI:

```bash
amplify configure
```

3. Initialize your project:

```bash
amplify init
```

4. Add hosting:

```bash
amplify add hosting
```

5. Deploy the application:

```bash
amplify publish
```

6. Add all environment variables from your `.env.local` file to your AWS Amplify project settings

## Step 7: Verify Deployment

1. Visit your deployed application URL
2. Sign up for a new account
3. Create a new organization
4. Verify that you can create and manage POA&M items
5. Test multi-tenant functionality by creating multiple organizations

## Step 8: Set Up Monitoring (Optional)

For production monitoring, consider setting up:

1. Prometheus for metrics collection
2. Grafana for visualization
3. Sentry for error tracking
4. LogRocket for session replay

## Troubleshooting

If you encounter any issues during deployment:

1. Check that all environment variables are correctly set
2. Verify that your database connection string is correct
3. Ensure that your Clerk application is properly configured
4. Check the deployment logs for any specific error messages

## Next Steps

After successful deployment, consider:

1. Setting up a CI/CD pipeline for automated deployments
2. Implementing automated testing
3. Adding additional features like export to PDF or CSV
4. Integrating with other security tools via APIs

For any questions or support, please refer to the documentation or contact the development team.
