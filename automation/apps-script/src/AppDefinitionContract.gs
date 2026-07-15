/**
 * Canonical AppSheet workflow definitions that cannot be inferred by Regenerate.
 * Show_If is presentation only and is never treated as authorization.
 */
const HVDQ_APP_DEFINITION_VERSION = '1.0.0';

const HVDQ_PRODUCT_WORKFLOW_ACTIONS = Object.freeze([
  Object.freeze({
    name: 'Submit for Review',
    table: 'PRODUCTS',
    type: 'Data: set the values of some columns in this row',
    set: Object.freeze({
      'Submit for Review': 'TRUE',
      'Workflow Status': '"READY_FOR_REVIEW"',
      'Last Updated': 'NOW()',
      'Updated By': 'USEREMAIL()'
    }),
    onlyIf: 'AND([Validation Status]="VALID", IN([Workflow Status], {"DRAFT", "NEEDS_REVISION"}), IN(LOOKUP(USEREMAIL(), "USERS", "Email", "Role"), {"CONTENT", "MANAGER", "ADMIN", "FOUNDER"}))'
  }),
  Object.freeze({
    name: 'Return for Revision',
    table: 'PRODUCTS',
    type: 'Data: set the values of some columns in this row',
    set: Object.freeze({
      'Submit for Review': 'FALSE',
      'Workflow Status': '"NEEDS_REVISION"',
      'Last Updated': 'NOW()',
      'Updated By': 'USEREMAIL()'
    }),
    onlyIf: 'AND([Workflow Status]="READY_FOR_REVIEW", IN(LOOKUP(USEREMAIL(), "USERS", "Email", "Role"), {"MANAGER", "ADMIN", "FOUNDER"}))'
  }),
  Object.freeze({
    name: 'Approve Content',
    table: 'PRODUCTS',
    type: 'Data: set the values of some columns in this row',
    set: Object.freeze({
      'Workflow Status': '"APPROVED"',
      'Content Reviewer': 'USEREMAIL()',
      'Last Updated': 'NOW()',
      'Updated By': 'USEREMAIL()'
    }),
    onlyIf: 'AND([Workflow Status]="READY_FOR_REVIEW", [Validation Status]="VALID", IN(LOOKUP(USEREMAIL(), "USERS", "Email", "Role"), {"MANAGER", "ADMIN", "FOUNDER"}))'
  }),
  Object.freeze({
    name: 'Approve Legal Review',
    table: 'PRODUCTS',
    type: 'Data: set the values of some columns in this row',
    set: Object.freeze({
      'Legal Review': '"APPROVED"',
      'Last Updated': 'NOW()',
      'Updated By': 'USEREMAIL()'
    }),
    onlyIf: 'IN(LOOKUP(USEREMAIL(), "USERS", "Email", "Role"), {"ADMIN", "FOUNDER"})'
  }),
  Object.freeze({
    name: 'Approve Product — Founder',
    table: 'PRODUCTS',
    type: 'Data: set the values of some columns in this row',
    set: Object.freeze({
      'Founder Approval': '"APPROVED"',
      'Last Updated': 'NOW()',
      'Updated By': 'USEREMAIL()'
    }),
    onlyIf: 'AND([Workflow Status]="APPROVED", [Validation Status]="VALID", LOOKUP(USEREMAIL(), "USERS", "Email", "Role")="FOUNDER")'
  }),
  Object.freeze({
    name: 'Reject Product — Founder',
    table: 'PRODUCTS',
    type: 'Data: set the values of some columns in this row',
    set: Object.freeze({
      'Founder Approval': '"REJECTED"',
      'Workflow Status': '"NEEDS_REVISION"',
      'Submit for Review': 'FALSE',
      'Last Updated': 'NOW()',
      'Updated By': 'USEREMAIL()'
    }),
    onlyIf: 'LOOKUP(USEREMAIL(), "USERS", "Email", "Role")="FOUNDER"'
  })
]);

const HVDQ_PRODUCT_WORKFLOW_BOTS = Object.freeze([
  Object.freeze({
    name: 'Queue product review',
    event: 'PRODUCTS updated: [Workflow Status] becomes READY_FOR_REVIEW',
    effect: 'Add one APPROVAL_QUEUE row with Type=CONTENT, Validation Status, Review Status=PENDING, Requested At=NOW(), Requested By=USEREMAIL()'
  })
]);
