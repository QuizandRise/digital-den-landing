# 10. Financial Fairness and Account Actions

## 10.1 Role-specific financial visibility

| **Role**     | **Must see**                                                                                          | **Must not see**                                                                      |
|--------------|-------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------|
| Client       | Total, amount paid, outstanding amount, milestones, invoices, receipts, refunds and hold status.      | Internal margin, other users’ earnings, private payout data.                          |
| Professional | Agreed gross share, fees/deductions, pending, held, approved and paid earnings, next settlement date. | Client private billing data, platform internal margin, other professionals’ earnings. |
| Manager      | Full authorised project financial state, fees, shares, holds, refunds, settlement history and audit.  | Information outside authorised organisational scope.                                  |

## 10.2 Separation of account enforcement from money

- Account suspension must not automatically cancel lawful access to statements, contracts or purchased deliverables.
- Undisputed earnings must follow the published settlement schedule unless a separate lawful restriction applies.
- Disputed sums must be isolated from undisputed sums.
- Every hold must show amount, reason category, date applied, reviewer and next review date.
- No undisclosed fee change after Offer acceptance.

# 11. Accessibility and Inclusive Design

Accessibility is a core trust mechanism. WorkforceDen will serve
professionals and clients with low vision, blindness, hearing loss,
motor impairments, cognitive disabilities, learning differences and
temporary impairments. UK guidance requires service providers to
anticipate disabled users’ needs and make reasonable adjustments; WCAG
2.2 provides the technical baseline. \[10\]–\[13\]

> **Accessibility target**  
> WorkforceDen MUST meet WCAG 2.2 Level AA for the public website and authenticated web app. Critical account, payment, dispute and project flows should be tested with disabled users and assistive technologies, not only automated tools.

## 11.1 Browser zoom and low-vision reflow

- The interface MUST remain usable at 200% text zoom and 400% browser zoom.
- At 400% zoom, content MUST reflow to an equivalent width of 320 CSS pixels without loss of information or functionality and without two-dimensional scrolling, except genuinely two-dimensional content such as complex data grids. This reflects WCAG 2.2 Success Criterion 1.4.10. \[12\]
- Zoom MUST not hide navigation, action buttons, validation messages, payment states or dispute controls.
- Tables on small or zoomed screens MUST either reflow into labelled cards or use a clearly indicated single-direction scroll region.
- Users MUST be able to enlarge text without overlapping, clipping or truncation.
- Focus indicators and selected states MUST remain visible under magnification.
- An optional in-product text-size control may be provided, but native browser zoom must still work correctly.

## 11.2 Screen-reader support

Full compatibility with system screen readers is mandatory. This is more
important than building a proprietary voice reader because screen
readers provide navigation, control labels, form context, table
semantics, error announcements and interaction—not only speech output.

- Semantic HTML landmarks, headings and lists.
- Every input has an explicit label and accessible error association.
- Buttons and links have meaningful accessible names.
- Dynamic status changes are announced through appropriate live regions without excessive interruption.
- Data tables include correct headers and relationships.
- Modals trap focus appropriately and return focus on close.
- No function depends only on colour, hover or pointer movement.
- Project status, payment status and dispute state are expressed in text.
- Uploaded images and portfolio media include meaningful alternative text or are marked decorative.
- Testing includes current versions of NVDA with Chrome/Firefox, VoiceOver with Safari, and TalkBack with Android Chrome.

## 11.3 Built-in Read Aloud

A built-in Read Aloud function is recommended as an enhancement for
low-vision users, people with dyslexia, cognitive fatigue, limited
literacy or users reviewing long briefs. It should be optional and
user-controlled. It must not replace screen-reader compatibility.

- Read the main content area, offer terms, messages or project brief on demand.
- Provide play, pause, stop, sentence navigation and speed controls.
- Never auto-play.
- Do not speak passwords, full banking details, verification documents or concealed moderation data.
- Respect language metadata and allow users to choose a suitable voice where the browser supports it.
- Provide a visible reading highlight only if it does not interfere with zoom or screen-reader focus.

## 11.4 Keyboard, contrast and cognitive accessibility

- All functionality operable by keyboard with logical focus order.
- Visible focus states meeting WCAG 2.2 expectations.
- Colour contrast meeting AA thresholds; critical states should exceed minimums where practical.
- No time limit without warning, extension or save-and-return capability.
- Plain-language explanations for fees, holds, disputes and verification failures.
- Consistent navigation and action placement across roles.
- Forms divided into manageable steps with progress indicators and saved drafts.
- Error messages that state the problem and how to correct it.
- Reduced-motion support and no flashing content.

## 11.5 Accessibility statement and support

- Publish an accessibility statement describing conformance, known limitations, testing and contact route.
- Provide a dedicated method to request an accessible format or reasonable adjustment.
- Do not charge users for reasonable adjustments.
- Record accessibility issues in the same severity system as security and payment defects.

# 12. Support, Safety and Data Portability

## 12.1 Human support triggers

- Account suspension or permanent restriction.
- Identity or right-to-work rejection after automated checks.
- Withheld or inaccessible funds.
- Formal dispute escalation.
- Harassment, discrimination or threats.
- Account recovery where normal methods fail.
- Data access, correction, export or deletion requests.
- Accessibility barriers that block a core service.

## 12.2 Account action notice

A material account-action notice should include: decision category,
affected features, effective date, whether projects or funds are
affected, policy basis, evidence that can be safely disclosed, required
corrective action, appeal deadline, response service level and a unique
case reference.

## 12.3 Data continuity

- Clients retain lawful access to purchased deliverables, contracts and invoices after account closure.
- Professionals can export earning statements, contracts and permitted portfolio records.
- Messages and evidence are retained according to published retention rules and legal holds.
- Platform closure or migration must include an orderly export pathway.
