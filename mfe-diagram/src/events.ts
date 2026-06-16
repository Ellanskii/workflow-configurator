export const STEP_SELECTED = 'workflow:step-selected';
export const STEP_MOVED = 'workflow:step-moved';
export const STEP_DELETED = 'workflow:step-deleted';
export const STEP_CREATED = 'workflow:step-created';
export const STEP_RENAMED = 'workflow:step-renamed';

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

export function emitStepMoved(id: number, x: number, y: number): void {
  window.dispatchEvent(new CustomEvent(STEP_MOVED, { detail: { id, x, y } }));
}

export function onStepMoved(
  cb: (id: number, x: number, y: number) => void,
): () => void {
  const handler = (e: Event): void => {
    const { id, x, y } = (e as CustomEvent<{ id: number; x: number; y: number }>).detail;
    cb(id, x, y);
  };
  window.addEventListener(STEP_MOVED, handler);
  return () => window.removeEventListener(STEP_MOVED, handler);
}

export function emitStepDeleted(id: number): void {
  window.dispatchEvent(new CustomEvent(STEP_DELETED, { detail: { id } }));
}

export function onStepDeleted(cb: (id: number) => void): () => void {
  const handler = (e: Event): void =>
    cb((e as CustomEvent<{ id: number }>).detail.id);
  window.addEventListener(STEP_DELETED, handler);
  return () => window.removeEventListener(STEP_DELETED, handler);
}

export interface StepCreatedPayload {
  id: number;
  name: string;
  x: number;
  y: number;
  color: string;
  transitions: number[];
}

export function onStepCreated(cb: (step: StepCreatedPayload) => void): () => void {
  const handler = (e: Event): void =>
    cb((e as CustomEvent<StepCreatedPayload>).detail);
  window.addEventListener(STEP_CREATED, handler);
  return () => window.removeEventListener(STEP_CREATED, handler);
}

export function onStepRenamed(cb: (id: number, name: string) => void): () => void {
  const handler = (e: Event): void => {
    const { id, name } = (e as CustomEvent<{ id: number; name: string }>).detail;
    cb(id, name);
  };
  window.addEventListener(STEP_RENAMED, handler);
  return () => window.removeEventListener(STEP_RENAMED, handler);
}
