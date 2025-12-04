import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseClient";

export async function POST(request: Request) {
  try {
    const { targetId, templateId } = await request.json();
    
    if (!targetId || !templateId) {
      return NextResponse.json({ error: "Missing targetId or templateId" }, { status: 400 });
    }

    const supabase = supabaseServer();
    
    // Start a transaction-like operation
    // 1. Insert into email_sends
    const { data: emailSend, error: emailSendError } = await supabase
      .from('email_sends')
      .insert({
        target_id: targetId,
        template_id: templateId,
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (emailSendError) {
      console.error("Error creating email_send:", emailSendError);
      return NextResponse.json({ error: emailSendError.message }, { status: 500 });
    }

    // 2. Update target status to 'emailed'
    const { data: updatedTarget, error: updateError } = await supabase
      .from('targets')
      .update({ status: 'emailed' })
      .eq('id', targetId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating target status:", updateError);
      // Note: In a real app, you'd want to rollback the email_send insert here
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      emailSend, 
      updatedTarget,
      message: "Email sent successfully" 
    });

  } catch (error) {
    console.error("Error in email-sends API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = supabaseServer();
    
    const { data: emailSends, error } = await supabase
      .from('email_sends')
      .select(`
        *,
        targets (
          owner_name,
          company,
          email
        ),
        email_templates (
          name,
          subject
        )
      `)
      .order('sent_at', { ascending: false });

    if (error) {
      console.error("Error fetching email sends:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ emailSends });

  } catch (error) {
    console.error("Error in email-sends GET API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}