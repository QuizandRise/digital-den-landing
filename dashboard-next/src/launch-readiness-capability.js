export function quotationsCapabilityEnabled(actor) {
  const caps = actor?.agencyCapabilities;
  return Boolean(caps && caps.quotationsEnabled === true);
}

export function deliveriesCapabilityEnabled(actor) {
  const caps = actor?.agencyCapabilities;
  return Boolean(caps && caps.deliveriesEnabled === true);
}

export function projectLifecycleCapabilityEnabled(actor) {
  const caps = actor?.agencyCapabilities;
  return Boolean(caps && caps.projectLifecycleEnabled === true);
}

export function capabilityFieldReferenced(source, field) {
  return new RegExp(field).test(source);
}
