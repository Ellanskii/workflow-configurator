import { useCallback, useEffect, useRef, useState } from 'react';

import { emitStepMoved, emitStepSelected, onStepCreated, onStepDeleted, onStepSelected } from '../../events';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchWorkflow, moveStep, stepCreated, stepDeleted, stepMoved, stepSelected } from '../../store/workflowSlice';
import type { Step } from '../../types';
import styles from './WorkflowDiagram.module.scss';

const BLOCK_WIDTH = 160;
const BLOCK_HEIGHT = 48;
const CANVAS_PADDING = 40;

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.1;

interface DragState {
  id: number;
  startMouseX: number;
  startMouseY: number;
  startX: number;
  startY: number;
}

export function WorkflowDiagram() {
  const dispatch = useAppDispatch();
  const steps = useAppSelector((state) => state.workflow.steps);
  const selectedStepId = useAppSelector((state) => state.workflow.selectedStepId);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);

  const [zoom, setZoom] = useState(1);
  const [origin, setOrigin] = useState({ x: 0, y: 0 });

  useEffect(() => {
    dispatch(fetchWorkflow());
    const unsubs = [
      onStepSelected((id) => {
        dispatch(stepSelected(id));
      }),
      onStepDeleted((id) => {
        dispatch(stepDeleted(id));
      }),
      onStepCreated((step) => {
        dispatch(stepCreated(step));
      }),
    ];
    return () => unsubs.forEach((fn) => fn());
  }, [dispatch]);

  const handleBlockClick = useCallback(
    (id: number) => {
      const next = selectedStepId === id ? null : id;
      dispatch(stepSelected(next));
      emitStepSelected(next);
    },
    [dispatch, selectedStepId],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, step: Step) => {
      e.preventDefault();
      dragRef.current = {
        id: step.id,
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        startX: step.x,
        startY: step.y,
      };
    },
    [],
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const dx = (e.clientX - drag.startMouseX) / zoom;
      const dy = (e.clientY - drag.startMouseY) / zoom;
      dispatch(
        stepMoved({
          id: drag.id,
          x: Math.round(drag.startX + dx),
          y: Math.round(drag.startY + dy),
        }),
      );
    };

    const handleMouseUp = () => {
      const drag = dragRef.current;
      if (!drag) return;
      dragRef.current = null;
      const step = steps.find((s) => s.id === drag.id);
      if (step) {
        dispatch(moveStep({ id: step.id, x: step.x, y: step.y })).then(() => {
          emitStepMoved(step.id, step.x, step.y);
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dispatch, steps, zoom]);

  const applyZoom = useCallback(
    (newZoom: number, cursor?: { x: number; y: number }) => {
      const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, newZoom));
      const container = containerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        const cursorX = cursor ? cursor.x - rect.left + container.scrollLeft : rect.width / 2;
        const cursorY = cursor ? cursor.y - rect.top + container.scrollTop : rect.height / 2;
        setOrigin({ x: cursorX, y: cursorY });
      }
      setZoom(clamped);
    },
    [],
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      applyZoom(zoom + delta, { x: e.clientX, y: e.clientY });
    },
    [zoom, applyZoom],
  );

  const canvasWidth =
    Math.max(0, ...steps.map((s) => s.x + BLOCK_WIDTH)) + CANVAS_PADDING;
  const canvasHeight =
    Math.max(0, ...steps.map((s) => s.y + BLOCK_HEIGHT)) + CANVAS_PADDING;

  const centerOf = (step: Step) => ({
    x: step.x + BLOCK_WIDTH / 2,
    y: step.y + BLOCK_HEIGHT / 2,
  });

  return (
    <div className={styles.diagram}>
      <div className={styles.diagram__toolbar}>
        <button
          type="button"
          className={styles.diagram__zoomBtn}
          aria-label="Уменьшить"
          onClick={() => applyZoom(zoom - ZOOM_STEP)}
        >
          <i className="fa-solid fa-minus"></i>
        </button>
        <span className={styles.diagram__zoomValue}>{Math.round(zoom * 100)}%</span>
        <button
          type="button"
          className={styles.diagram__zoomBtn}
          aria-label="Увеличить"
          onClick={() => applyZoom(zoom + ZOOM_STEP)}
        >
          <i className="fa-solid fa-plus"></i>
        </button>
      </div>

      <div ref={containerRef} className={styles.diagram__viewport} onWheel={handleWheel}>
        <div
          className={styles.diagram__canvas}
          style={{
            width: canvasWidth,
            height: canvasHeight,
            transform: `scale(${zoom})`,
            transformOrigin: `${origin.x}px ${origin.y}px`,
          }}
        >
          <svg
            className={styles.diagram__arrows}
            width={canvasWidth}
            height={canvasHeight}
          >
            <defs>
              <marker
                id="arrow"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#8a8a92" />
              </marker>
            </defs>
            {steps.map((step) =>
              step.transitions.map((targetId) => {
                const target = steps.find((s) => s.id === targetId);
                if (!target) return null;
                const from = centerOf(step);
                const to = centerOf(target);
                return (
                  <line
                    key={`${step.id}-${targetId}`}
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke="#8a8a92"
                    strokeWidth={1.5}
                    markerEnd="url(#arrow)"
                  />
                );
              }),
            )}
          </svg>

          {steps.map((step) => (
            <div
              key={step.id}
              data-testid="diagram-block"
              data-step-id={step.id}
              className={[
                styles.diagram__block,
                selectedStepId === step.id && styles['diagram__block--selected'],
              ]
                .filter(Boolean)
                .join(' ')}
              style={{
                left: step.x,
                top: step.y,
                width: BLOCK_WIDTH,
                minHeight: BLOCK_HEIGHT,
                borderColor: step.color,
                color: step.color,
              }}
              onMouseDown={(e) => handleMouseDown(e, step)}
              onClick={() => handleBlockClick(step.id)}
            >
              {step.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
