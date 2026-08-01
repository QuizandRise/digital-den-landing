export const previewActors = {
  manager: { name: "Abdul Hamid", initials: "AM", label: "Manager preview" },
  team_member: { name: "Team Member", initials: "TM", label: "Team member preview" },
  client: { name: "Client User", initials: "CU", label: "Client preview" },
};

export const projects = [
  { id:"DD-2401", title:"MealDen Campaign Launch", client:"MealDen", service:"Promotional video", status:"awaiting_review", progress:78, updated:"Today, 16:20" },
  { id:"DD-2398", title:"Quiz & Rise Magazine Assets", client:"Quiz & Rise", service:"Editorial design", status:"active", progress:54, updated:"Today, 11:05" },
  { id:"DD-2391", title:"Local Brand Website Refresh", client:"North Studio", service:"Website refinement", status:"ready_for_delivery", progress:100, updated:"Yesterday" },
];

export const reviews = [
  { project:"MealDen Campaign Launch", item:"Final motion sequence", owner:"Motion team", age:"42 min", priority:"High" },
  { project:"Quiz & Rise Magazine Assets", item:"Cover concept v3", owner:"Design team", age:"3 hr", priority:"Normal" },
];

export const messages = [
  { project:"MealDen Campaign Launch", from:"Client", text:"Please confirm the final caption format.", state:"clear", time:"10 min ago" },
  { project:"Local Brand Website Refresh", from:"System", text:"A message containing off-platform contact details requires review.", state:"flagged", time:"34 min ago" },
];

export const files = [
  { name:"mealden-campaign-preview-v3.mp4", project:"MealDen Campaign Launch", scan:"Clean", availability:"Available" },
  { name:"magazine-cover-concept-v3.pdf", project:"Quiz & Rise Magazine Assets", scan:"Clean", availability:"Available" },
];

export const clients = [
  { name:"MealDen", contact:"Operations team", projects:1, status:"Active", lastActivity:"Today, 16:20" },
  { name:"Quiz & Rise Magazine", contact:"Editorial team", projects:1, status:"Active", lastActivity:"Today, 11:05" },
  { name:"North Studio", contact:"Project owner", projects:1, status:"Delivery", lastActivity:"Yesterday" },
];

export const teamMembers = [
  { name:"Motion team", role:"Video production", active:2, capacity:"75%", state:"Available" },
  { name:"Design team", role:"Brand and editorial", active:1, capacity:"55%", state:"Available" },
  { name:"Web team", role:"Website refinement", active:1, capacity:"90%", state:"Near capacity" },
];

export const auditEvents = [
  { event:"Review submitted", actor:"Motion team", target:"DD-2401", time:"42 min ago" },
  { event:"Project updated", actor:"Design team", target:"DD-2398", time:"3 hr ago" },
  { event:"Delivery marked ready", actor:"Manager", target:"DD-2391", time:"Yesterday" },
];

export const communicationPolicy = [
  { rule:"External contact details", action:"Flag for manager review", state:"Enforced in preview" },
  { rule:"Off-platform payment request", action:"Block and escalate", state:"Enforced in preview" },
  { rule:"Untrusted attachment", action:"Quarantine until scan", state:"Planned" },
];
