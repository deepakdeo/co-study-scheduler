import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FROM_EMAIL = "Co-Study Scheduler <onboarding@resend.dev>";

serve(async (req) => {
  try {
    const { bookingId } = await req.json();

    if (!bookingId) {
      return new Response(JSON.stringify({ error: "Missing bookingId" }), {
        status: 400,
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch booking with room details
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*, rooms(*)")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return new Response(
        JSON.stringify({ error: "Booking not found" }),
        { status: 404 }
      );
    }

    const room = booking.rooms;
    const bookerTz = booking.booker_timezone || "UTC";

    // Format date/time for display
    const startDate = new Date(booking.slot_start_utc);
    const endDate = new Date(booking.slot_end_utc);

    const dateStr = startDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: bookerTz,
    });

    const startTime = startDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: bookerTz,
    });

    const endTime = endDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: bookerTz,
    });

    const hostDateStr = startDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: room.host_timezone,
    });

    const hostStartTime = startDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: room.host_timezone,
    });

    const hostEndTime = endDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: room.host_timezone,
    });

    const emails: Promise<Response>[] = [];

    // Email to booker (if they provided an email)
    if (booking.email) {
      emails.push(
        fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: FROM_EMAIL,
            to: [booking.email],
            subject: `Booking Confirmed: ${room.title}`,
            html: `
              <h2>You're booked!</h2>
              <p>Your co-study session with <strong>${room.host_name}</strong> is confirmed.</p>
              <table style="margin: 16px 0; border-collapse: collapse;">
                <tr><td style="padding: 4px 12px 4px 0; color: #666;">Room</td><td style="padding: 4px 0;"><strong>${room.title}</strong></td></tr>
                <tr><td style="padding: 4px 12px 4px 0; color: #666;">Date</td><td style="padding: 4px 0;">${dateStr}</td></tr>
                <tr><td style="padding: 4px 12px 4px 0; color: #666;">Time</td><td style="padding: 4px 0;">${startTime} – ${endTime} (${bookerTz})</td></tr>
                <tr><td style="padding: 4px 12px 4px 0; color: #666;">Meeting Link</td><td style="padding: 4px 0;"><a href="${room.meeting_link}">${room.meeting_link}</a></td></tr>
              </table>
              <h3>Session Format</h3>
              <ul>
                <li>5–10 min: Hello & share goals</li>
                <li>~100 min: Focused study</li>
                <li>10–15 min: Wrap-up & chat</li>
              </ul>
              <p style="color: #999; font-size: 12px; margin-top: 24px;">Sent by Co-Study Scheduler</p>
            `,
          }),
        })
      );
    }

    // Email to host (always — using a simple notification)
    // Note: We don't have the host's email stored in the room.
    // For v1, we skip host email. The admin view shows all bookings.
    // To enable host emails, add a host_email column to the rooms table.

    await Promise.all(emails);

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    );
  }
});
