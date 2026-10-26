---
name: create-skill
description: "Use when: packaging a repeatable workflow into a reusable skill; turning a chat process into a SKILL.md; defining a multi-step workflow, branching logic, and quality checks for a team or personal workflow."
---
Related skill: `agent-customization`. Load and follow the skill and customizations guidance for template, scope, and quality rules.

Guide the user to create a reusable `SKILL.md` from a real workflow.

## Goal
Turn a step-by-step process, decision tree, or implementation pattern into a reusable workflow skill that another agent or user can invoke consistently.

## Extract from the Conversation
Review the current conversation and identify:
- The actual step-by-step process being followed
- Decision points and branching logic
- Quality criteria, completion checks, and success conditions
- Any constraints, anti-patterns, or guardrails that matter

Generalize the process into a reusable skill rather than describing one-off actions.

## Clarify if Needed
If the workflow is not yet clear, ask targeted questions:
- What should this skill produce?
- Is this workspace-scoped or personal?
- Should the result be a short checklist or a fuller multi-stage workflow?
- Are there user-specific preferences or acceptance criteria to include?

## Workflow to Follow
1. Identify the workflow's purpose and scope.
2. Extract the concrete steps in order.
3. Note any branching logic or alternative paths.
4. Convert the process into a clear, actionable structure.
5. Define quality gates or completion checks.
6. Draft the `SKILL.md` using the standard skill template.
7. Save it in the correct location for the scope chosen.
8. Review the draft for ambiguity, missing conditions, or weak instructions.
9. Ask the user about the most uncertain parts before finalizing.
10. Summarize what the skill produces, suggest example prompts, and note related customizations to create next.

## Quality Criteria
A good skill should:
- Be reusable across similar situations, not tied to one isolated task
- Have a clear purpose and trigger description
- Include practical sequencing and explicit decision points
- State what “done” looks like
- Be specific enough to reduce drift without becoming bloated
- Prefer concise, actionable instructions over generic commentary

## Output Expectations
When finalizing, provide:
- A brief summary of the workflow captured in the skill
- The location of the saved `SKILL.md`
- Example prompts that would invoke it effectively
- Any related customizations worth creating next, such as prompts, instructions, or custom agents

## Template Shape
A skill should usually include:
- YAML frontmatter with `name` and `description`
- A clear purpose statement
- A workflow or process section
- Decision points and branching guidance
- Completion checks or quality criteria
- Example invocations or usage notes if helpful

## Anti-Patterns to Avoid
- Creating a skill that is too broad to be useful
- Omitting decision points where the workflow changes course
- Writing vague instructions with no completion criteria
- Mixing multiple unrelated workflows into one skill
- Forgetting to make the skill description discoverable and specific

## Final Check
Before finishing, verify:
- The skill matches the real workflow discussed
- The directory and filename are correct
- The YAML frontmatter is valid
- The description is specific enough to be discoverable
- The skill is usable by a future agent or user without extra explanation
