# WorkforceDen dashboard foundation V1

The dashboard remains the Digital Den project-delivery workspace while its frontend presentation is prepared for WorkforceDen. Digital Den is represented as a service team/network affiliation, not as a second marketplace platform.

`platform-config.js` owns non-security presentation defaults: platform and organisation names, role labels, feature availability, service affiliation and placeholder tenant metadata. `financial-contract.js` defines normalized read-only fields and per-role visibility. Missing values remain unavailable; the frontend does not invent financial data.

The backend-compatible roles remain `manager`, `client` and `team_member`. The UI presents `team_member` as “Professional”. Route policy and presentation policy determine which modules and fields appear, but they are not security enforcement.

Real tenant isolation must later be enforced in authentication, database queries, project scopes, API authorization and audit boundaries. Real marketplace accounts, identity verification, billing, payouts, settlement calculations and tenant configuration remain backend work. No frontend tenant identifier or hidden element should be treated as an authorization boundary.
