# Client / Projet / Scoring Binding

This file documents the technical link between client data, project data and the
flexible scoring model.

## Main goals
- pre-fill evaluation answers from client/project data
- keep the source of each value for auditability
- allow controlled overrides with reason
- let the scoring engine work from the final resolved value

## Key models
- Client
- Project
- ScoringNode
- ScoringNodeDataBinding
- ScoringEvaluation
- ScoringEvaluationAnswer
- ScoringEvaluationNodeResult
- ScoringDataFieldRegistry
- ScoringCalculatedField

## Binding modes
- AUTO_READONLY
- AUTO_EDITABLE
- AUTO_IF_EMPTY
- MANUAL_ONLY
- CALCULATED_ONLY

## Override rules
If allowOverride is false, the UI and API must reject changes.
If overrideRequiresReason is true, the UI and API must require a reason.
