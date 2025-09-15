import { NextRequest, NextResponse } from 'next/server';
import { initializeTenant } from '@/db/migrations';
import { Webhook } from 'svix';
import { headers } from 'next/headers';

// Clerk webhook handler for organization events
export async function POST(req: NextRequest) {
  try {
    // Get the webhook secret from environment variables
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error('Missing CLERK_WEBHOOK_SECRET');
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }
    
    // Get the headers
    const headerPayload = headers();
    const svix_id = headerPayload.get('svix-id');
    const svix_timestamp = headerPayload.get('svix-timestamp');
    const svix_signature = headerPayload.get('svix-signature');
    
    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
      return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 });
    }
    
    // Get the body
    const payload = await req.json();
    const body = JSON.stringify(payload);
    
    // Create a new Svix instance with the webhook secret
    const wh = new Webhook(webhookSecret);
    
    let evt: unknown;
    
    try {
      evt = wh.verify(body, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      });
    } catch (err) {
      console.error('Error verifying webhook:', err);
      return NextResponse.json({ error: 'Error verifying webhook' }, { status: 400 });
    }
    
    // Handle the webhook
    const { type, data } = evt as { type: string; data: { id: string; name: string } };
    
    // Handle organization creation
    if (type === 'organization.created') {
      const tenantId = data.id;
      const tenantName = data.name;
      
      // Initialize tenant in the database
      await initializeTenant(tenantId, tenantName);
      
      console.log(`Tenant ${tenantName} (${tenantId}) created successfully`);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
