---
name: github
description: Manage GitHub Issues and GitHub Projects (v2) via the `gh` CLI. Create/edit/close issues, manage labels, milestones, and project boards. Use when the user wants to manipulate issues, labels, project items, or project fields. Requires a project ID or repo context.
origin: custom
---

# GitHub Issues & Projects

Manage GitHub Issues and GitHub Projects (v2) using the `gh` CLI.

## When to Activate

- User wants to create, edit, close, or list GitHub issues
- User wants to add/remove labels on issues
- User wants to manage milestones
- User wants to add issues to a GitHub Project board
- User wants to update project item fields (status, priority, custom fields)
- User wants to list or filter project items
- User mentions "github project", "project board", "issue", or "label" in a task management context

## Prerequisites

- `gh` CLI installed and authenticated (`gh auth status` to verify)
- For project operations: a **Project ID** (the numeric or node ID from the project URL or API)

## Quick Reference: Repo vs Project Scope

| Scope | What it manages | Key commands |
|-------|----------------|--------------|
| **Repo** (`gh issue`, `gh label`) | Issues, labels, milestones within a single repo | `gh issue list`, `gh label create` |
| **Project** (`gh project`) | Cross-repo project boards (GitHub Projects v2) | `gh project item-list`, `gh project field-list` |

---

## Issues

### List Issues

```bash
# List open issues (current repo)
gh issue list

# List with filters
gh issue list --state open --label "bug" --assignee "@me"
gh issue list --state closed --limit 50
gh issue list --search "keyword in:title"

# List issues in a specific repo
gh issue list --repo owner/repo

# Output as JSON for scripting
gh issue list --json number,title,labels,state,assignees --limit 100
```

### Create Issues

```bash
# Interactive
gh issue create

# Non-interactive
gh issue create --title "Bug: something broken" --body "Description here"

# With labels, assignee, milestone
gh issue create \
  --title "Feature: add export" \
  --body "We need CSV export for reports" \
  --label "enhancement" \
  --label "priority:high" \
  --assignee "username" \
  --milestone "v2.0"

# From a file
gh issue create --title "Bug report" --body-file ./bug-description.md
```

### Edit Issues

```bash
# Add labels
gh issue edit 42 --add-label "bug" --add-label "priority:high"

# Remove labels
gh issue edit 42 --remove-label "needs-triage"

# Change assignee
gh issue edit 42 --add-assignee "username"
gh issue edit 42 --remove-assignee "username"

# Update title and body
gh issue edit 42 --title "New title" --body "Updated description"

# Set milestone
gh issue edit 42 --milestone "v2.0"

# Clear milestone
gh issue edit 42 --milestone ""
```

### Close / Reopen Issues

```bash
gh issue close 42
gh issue close 42 --reason "not planned"   # or "completed"
gh issue reopen 42
```

### View Issue Details

```bash
gh issue view 42
gh issue view 42 --json number,title,body,labels,assignees,state,milestone
```

### Comment on Issues

```bash
gh issue comment 42 --body "This is fixed in PR #50"
```

### Bulk Operations

```bash
# Close all issues with a label
gh issue list --label "wontfix" --json number --jq '.[].number' | \
  xargs -I {} gh issue close {} --reason "not planned"

# Add a label to all open issues matching a search
gh issue list --search "keyword" --json number --jq '.[].number' | \
  xargs -I {} gh issue edit {} --add-label "needs-review"

# Transfer issue to another repo
gh issue transfer 42 owner/other-repo
```

---

## Labels

### List Labels

```bash
gh label list
gh label list --json name,color,description
gh label list --repo owner/repo
```

### Create Labels

```bash
# Create with color (hex without #)
gh label create "priority:critical" --color "FF0000" --description "Immediate attention required"
gh label create "priority:high" --color "FFA500" --description "High priority"
gh label create "priority:medium" --color "FFFF00" --description "Medium priority"
gh label create "priority:low" --color "0E8A16" --description "Low priority"
gh label create "type:bug" --color "D73A4A" --description "Something isn't working"
gh label create "type:feature" --color "A2EEEF" --description "New feature request"
```

### Edit Labels

```bash
gh label edit "bug" --name "type:bug" --color "D73A4A" --description "Something isn't working"
```

### Delete Labels

```bash
gh label delete "old-label" --yes
```

---

## Milestones

```bash
# List milestones (uses the API)
gh api repos/{owner}/{repo}/milestones --jq '.[] | {number, title, state, due_on, open_issues, closed_issues}'

# Create milestone
gh api repos/{owner}/{repo}/milestones -f title="v2.0" -f due_on="2026-06-01T00:00:00Z" -f description="Version 2.0 release"

# Close milestone
gh api repos/{owner}/{repo}/milestones/1 -X PATCH -f state="closed"

# Delete milestone
gh api repos/{owner}/{repo}/milestones/1 -X DELETE
```

---

## GitHub Projects (v2)

GitHub Projects v2 uses GraphQL under the hood. The `gh project` commands wrap this.

### Key Concepts

- **Project Number**: The number visible in the project URL (e.g., `https://github.com/orgs/myorg/projects/5` -> number is `5`)
- **Project ID**: The internal node ID (starts with `PVT_...`), needed for some API calls
- **Item ID**: Each issue/PR/draft added to a project gets an item ID (`PVTI_...`)
- **Field ID**: Each column/field in the project has a field ID
- **Option ID**: For single-select fields, each option has an ID

### List Projects

```bash
# List your projects
gh project list

# List org projects
gh project list --owner myorg

# Get project details as JSON
gh project list --owner myorg --format json
```

### View a Project

```bash
# View project details (interactive)
gh project view 5 --owner myorg

# View project as JSON with all fields
gh project view 5 --owner myorg --format json
```

### List Project Items

```bash
# List all items in a project
gh project item-list 5 --owner myorg

# As JSON (includes item IDs, field values)
gh project item-list 5 --owner myorg --format json --limit 200
```

### List Project Fields

```bash
# List fields and their options (needed for setting values)
gh project field-list 5 --owner myorg

# As JSON
gh project field-list 5 --owner myorg --format json
```

This returns field names, IDs, types, and for single-select fields, the option IDs and names.

### Add Issues to a Project

```bash
# Add an issue by URL
gh project item-add 5 --owner myorg --url "https://github.com/owner/repo/issues/42"

# Add a PR
gh project item-add 5 --owner myorg --url "https://github.com/owner/repo/pull/10"

# Create a draft item (not linked to an issue)
gh project item-create 5 --owner myorg --title "Draft task" --body "Details here"
```

### Update Project Item Fields

To update a field on a project item, you need:
1. The **project ID** (node ID, `PVT_...`)
2. The **item ID** (`PVTI_...`)
3. The **field ID**
4. The **value** (or **option ID** for single-select fields)

#### Step-by-step: Update a Single-Select Field (e.g., Status)

```bash
# 1. Get the project node ID
PROJECT_ID=$(gh project view 5 --owner myorg --format json --jq '.id')

# 2. Get field IDs and option IDs
gh project field-list 5 --owner myorg --format json | jq '.fields[] | select(.name == "Status")'
# Note the field id and the option id for the desired status

# 3. Get the item ID for a specific issue
ITEM_ID=$(gh project item-list 5 --owner myorg --format json --jq '.items[] | select(.content.number == 42) | .id')

# 4. Update the field
gh project item-edit \
  --project-id "$PROJECT_ID" \
  --id "$ITEM_ID" \
  --field-id "PVTSSF_abc123" \
  --single-select-option-id "opt_xyz789"
```

#### Update a Text Field

```bash
gh project item-edit \
  --project-id "$PROJECT_ID" \
  --id "$ITEM_ID" \
  --field-id "PVTF_abc123" \
  --text "Some text value"
```

#### Update a Number Field

```bash
gh project item-edit \
  --project-id "$PROJECT_ID" \
  --id "$ITEM_ID" \
  --field-id "PVTF_abc123" \
  --number 42
```

#### Update a Date Field

```bash
gh project item-edit \
  --project-id "$PROJECT_ID" \
  --id "$ITEM_ID" \
  --field-id "PVTF_abc123" \
  --date "2026-06-01"
```

#### Update an Iteration Field

```bash
gh project item-edit \
  --project-id "$PROJECT_ID" \
  --id "$ITEM_ID" \
  --field-id "PVTIF_abc123" \
  --iteration-id "iter_xyz789"
```

### Remove Items from a Project

```bash
gh project item-delete 5 --owner myorg --id "$ITEM_ID"
```

### Archive / Unarchive Items

```bash
gh project item-archive 5 --owner myorg --id "$ITEM_ID"
gh project item-archive 5 --owner myorg --id "$ITEM_ID" --undo
```

---

## Common Workflows

### Triage New Issues

```bash
# Find untriaged issues (no labels)
gh issue list --json number,title,labels --jq '.[] | select(.labels | length == 0)'

# Add triage label
gh issue edit 42 --add-label "needs-triage"

# Add to project board
gh project item-add 5 --owner myorg --url "https://github.com/owner/repo/issues/42"
```

### Move Issue Across Project Statuses

```bash
# Get project metadata
PROJECT_ID=$(gh project view 5 --owner myorg --format json --jq '.id')

# Get Status field info
STATUS_FIELD=$(gh project field-list 5 --owner myorg --format json --jq '.fields[] | select(.name == "Status")')
FIELD_ID=$(echo "$STATUS_FIELD" | jq -r '.id')

# Get the "In Progress" option ID
OPTION_ID=$(echo "$STATUS_FIELD" | jq -r '.options[] | select(.name == "In Progress") | .id')

# Get the item ID for issue #42
ITEM_ID=$(gh project item-list 5 --owner myorg --format json --jq '.items[] | select(.content.number == 42) | .id')

# Move to "In Progress"
gh project item-edit \
  --project-id "$PROJECT_ID" \
  --id "$ITEM_ID" \
  --field-id "$FIELD_ID" \
  --single-select-option-id "$OPTION_ID"
```

### Bulk-Add Issues to a Project

```bash
# Add all open issues with a label to a project
gh issue list --label "sprint-3" --json url --jq '.[].url' | \
  xargs -I {} gh project item-add 5 --owner myorg --url "{}"
```

### Create Issue + Add to Project + Set Fields

```bash
# Create the issue
ISSUE_URL=$(gh issue create \
  --title "New feature" \
  --body "Description" \
  --label "enhancement" \
  --json url --jq '.url')

# Add to project
gh project item-add 5 --owner myorg --url "$ISSUE_URL"

# Then set status/priority fields as shown above
```

---

## GraphQL API (Advanced)

For operations not covered by `gh project` commands, use the GraphQL API directly:

```bash
# Generic GraphQL query
gh api graphql -f query='
  query {
    node(id: "PVT_kwHOABcdef") {
      ... on ProjectV2 {
        title
        items(first: 20) {
          nodes {
            id
            content {
              ... on Issue { number title }
              ... on PullRequest { number title }
            }
            fieldValues(first: 10) {
              nodes {
                ... on ProjectV2ItemFieldSingleSelectValue {
                  name
                  field { ... on ProjectV2SingleSelectField { name } }
                }
                ... on ProjectV2ItemFieldTextValue {
                  text
                  field { ... on ProjectV2Field { name } }
                }
              }
            }
          }
        }
      }
    }
  }
'

# Mutation: update a field value
gh api graphql -f query='
  mutation {
    updateProjectV2ItemFieldValue(input: {
      projectId: "PVT_kwHOABcdef"
      itemId: "PVTI_lAHOABcdef"
      fieldId: "PVTSSF_abc123"
      value: { singleSelectOptionId: "opt_xyz789" }
    }) {
      projectV2Item { id }
    }
  }
'
```

---

## Tips

- Always use `--format json` or `--json` flags when scripting to get structured output
- Use `jq` for parsing JSON output (`--jq` flag is built into `gh`)
- Project item operations require node IDs (`PVT_...`, `PVTI_...`), not numbers
- When the user provides a project number (from URL), use `gh project view N --owner ORG --format json --jq '.id'` to get the node ID
- For org projects use `--owner orgname`; for personal projects use `--owner @me`
- Rate limits apply: batch operations should include small delays for large sets
- Use `gh auth status` to verify authentication and available scopes
- Project write access requires the `project` scope: `gh auth refresh -s project`
