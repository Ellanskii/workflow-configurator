export const STEP_SELECTED = 'workflow:step-selected';

export function emitStepSelected(stepId: number | null): void {
  window.dispatchEvent(
    new CustomEvent(STEP_SELECTED, { detail: { stepId } }),
  );
}

export function onStepSelected(
  cb: (stepId: number | null) => void,
): () => void {
  const handler = (e: Event): void =>
    cb((e as CustomEvent<{ stepId: number | null }>).detail.stepId);
  window.addEventListener(STEP_SELECTED, handler);
  return () => window.removeEventListener(STEP_SELECTED, handler);
}
