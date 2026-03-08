/**
 * Seeded demo messages — shapes match getMessages return type.
 */

export const demoMessages = [
  {
    id: "demo-msg-1",
    job_id: "demo-job-1",
    sender_id: "demo-homeowner-1",
    recipient_id: "demo-contractor-1",
    body: "Hi! Can you tell me a bit more about the repair process? Will you need to shut off the water for long?",
    created_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    jobs: { title: "Kitchen Sink Leak Repair" },
    sender: { full_name: "Jordan M." },
  },
  {
    id: "demo-msg-2",
    job_id: "demo-job-1",
    sender_id: "demo-contractor-1",
    recipient_id: "demo-homeowner-1",
    body: "The water will only be off for about 15-20 minutes during the repair. Everything will be back to normal the same visit.",
    created_at: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(),
    jobs: { title: "Kitchen Sink Leak Repair" },
    sender: { full_name: "Austin All-Pro Home Services" },
  },
  {
    id: "demo-msg-3",
    job_id: "demo-job-2",
    sender_id: "demo-homeowner-1",
    recipient_id: "demo-contractor-1",
    body: "The system is a 2016 Carrier unit, 3-ton. Let me know if you need the model number.",
    created_at: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    jobs: { title: "HVAC System Diagnosis & Repair" },
    sender: { full_name: "Jordan M." },
  },
  {
    id: "demo-msg-4",
    job_id: "demo-job-2",
    sender_id: "demo-contractor-1",
    recipient_id: "demo-homeowner-1",
    body: "That helps a lot — 2016 Carrier is a great unit. Refrigerant is the most common cause of what you're describing. I can be there Tuesday between 9am and noon.",
    created_at: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
    jobs: { title: "HVAC System Diagnosis & Repair" },
    sender: { full_name: "Austin All-Pro Home Services" },
  },
];
