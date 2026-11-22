import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-cron-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
      headers: cors,
    });
  }

  try {
    // Require cron authentication.
    const expected = Deno.env.get('CRON_SECRET');

    if (!expected) {
      return new Response('CRON_SECRET is not configured', {
        status: 500,
        headers: cors,
      });
    }

    const supplied = req.headers.get('x-cron-secret');

    if (!supplied || supplied !== expected) {
      return new Response('Forbidden', {
        status: 403,
        headers: cors,
      });
    }

    // Read Supabase's automatically provided keys.
    const url = Deno.env.get('SUPABASE_URL');
    const secretRaw = Deno.env.get('SUPABASE_SECRET_KEYS');

    if (!url || !secretRaw) {
      throw new Error('Supabase environment variables are missing');
    }

    const secretKeys = JSON.parse(secretRaw);
    const secret = secretKeys.default;

    if (!secret) {
      throw new Error('Default Supabase secret key was not found');
    }

    // Admin client uses secret key through apikey header.
    const db = createClient(url, secret, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          Authorization: '',
        },
      },
    });

    const today = new Date();

    let created = 0;
    let emailSent = 0;

    const { data: docs, error: docsError } = await db
      .from('documents')
      .select('id, number, title, type, data, created_by')
      .eq('status', 'valid')
      .eq('type', 'certificate');

    if (docsError) {
      throw docsError;
    }

    for (const doc of docs || []) {
      const expiry = doc.data?.end;

      if (!expiry) continue;

      const expiryDate = new Date(`${expiry}T00:00:00Z`);

      if (Number.isNaN(expiryDate.getTime())) continue;

      const days = Math.ceil(
        (expiryDate.getTime() - today.getTime()) / 86400000
      );

      if (days < 0 || days > 30) continue;

      // Prevent duplicate reminders for the same certificate and expiry.
      const reminderType = `expiry-${days}`;

      const { data: existing, error: existingError } = await db
        .from('document_reminders')
        .select('id')
        .eq('document_id', doc.id)
        .eq('due_on', expiry)
        .eq('reminder_type', reminderType)
        .maybeSingle();

      if (existingError) {
        console.error('Reminder lookup failed:', existingError);
        continue;
      }

      if (existing) continue;

      const { error: insertError } = await db
        .from('document_reminders')
        .insert({
          document_id: doc.id,
          due_on: expiry,
          reminder_type: reminderType,
        });

      if (insertError) {
        console.error('Reminder insert failed:', insertError);
        continue;
      }

      // Find document creator.
      if (!doc.created_by) continue;

      const { data: profile, error: profileError } = await db
        .from('profiles')
        .select('id, email, name')
        .eq('id', doc.created_by)
        .maybeSingle();

      if (profileError || !profile) continue;

      // Create in-app notification.
      const { error: notificationError } = await db
        .from('notifications')
        .insert({
          user_id: profile.id,
          title: 'Certificate expiry reminder',
          message:
            `${doc.number} (${doc.title || 'Certificate'}) expires in ${days} day(s).`,
          category: 'expiry',
        });

      if (notificationError) {
        console.error('Notification creation failed:', notificationError);
        continue;
      }

      created++;

      // Send email only if Resend is configured.
      const resendKey = Deno.env.get('RESEND_API_KEY');
      const from = Deno.env.get('REMINDER_FROM');

      if (resendKey && from && profile.email) {
        try {
          const response = await fetch(
            'https://api.resend.com/emails',
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${resendKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from,
                to: [profile.email],
                subject: 'Lucuma Docs: Certificate Expiry Reminder',
                text:
                  `Hello ${profile.name || ''},\n\n` +
                  `Your certificate ${doc.number} expires on ${expiry}.\n\n` +
                  `Please review it in Lucuma Docs.`,
              }),
            }
          );

          if (response.ok) {
            emailSent++;
          } else {
            console.error(
              'Resend error:',
              await response.text()
            );
          }
        } catch (emailError) {
          console.error('Email sending failed:', emailError);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        notificationsCreated: created,
        emailsSent: emailSent,
      }),
      {
        status: 200,
        headers: {
          ...cors,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Expiry reminder error:', error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error
          ? error.message
          : 'Expiry reminder processing failed',
      }),
      {
        status: 500,
        headers: {
          ...cors,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});