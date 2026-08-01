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
  { project:"MealDen Campaign Launch", item:"Final motion sequence", owner:"Motion team", age:"42 min" },
  { project:"Quiz & Rise Magazine Assets", item:"Cover concept v3", owner:"Design team", age:"3 hr" },
];

export const messages = [
  { project:"MealDen Campaign Launch", from:"Client", text:"Please confirm the final caption format.", state:"clear" },
  { project:"Local Brand Website Refresh", from:"System", text:"A message containing off-platform contact details requires review.", state:"flagged" },
];

export const files = [
  { name:"mealden-campaign-preview-v3.mp4", project:"MealDen Campaign Launch", scan:"Clean", availability:"Available" },
  { name:"magazine-cover-concept-v3.pdf", project:"Quiz & Rise Magazine Assets", scan:"Clean", availability:"Available" },
];
