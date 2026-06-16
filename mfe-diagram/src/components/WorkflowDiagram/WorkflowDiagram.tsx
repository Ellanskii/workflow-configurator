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
    (e: React.MouseEvent, id: number) => {
      e.stopPropagation();
      dispatch(stepSelected(id));
      emitStepSelected(id);
    },
    [dispatch],
  );

  const handleCanvasClick = useCallback(() => {
    dispatch(stepSelected(null));
    emitStepSelected(null);
  }, [dispatch]);

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

  // Returns the point where the line from `from` to box center `to` hits the box edge.
  const edgePoint = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return to;
    const nx = dx / len;
    const ny = dy / len;
    const hw = BLOCK_WIDTH / 2;
    const hh = BLOCK_HEIGHT / 2;
    const tx = nx !== 0 ? hw / Math.abs(nx) : Infinity;
    const ty = ny !== 0 ? hh / Math.abs(ny) : Infinity;
    const t = Math.min(tx, ty);
    return { x: to.x - t * nx, y: to.y - t * ny };
  };

  // Builds SVG polygon points for an arrowhead at `tip` pointing from `from`.
  const arrowPoints = (from: { x: number; y: number }, tip: { x: number; y: number }, size = 10) => {
    const angle = Math.atan2(tip.y - from.y, tip.x - from.x);
    const p1 = `${tip.x},${tip.y}`;
    const p2 = `${tip.x - size * Math.cos(angle - Math.PI / 6)},${tip.y - size * Math.sin(angle - Math.PI / 6)}`;
    const p3 = `${tip.x - size * Math.cos(angle + Math.PI / 6)},${tip.y - size * Math.sin(angle + Math.PI / 6)}`;
    return `${p1} ${p2} ${p3}`;
  };

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
          onClick={handleCanvasClick}
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
            {steps.map((step) =>
              step.transitions.map((targetId) => {
                const target = steps.find((s) => s.id === targetId);
                if (!target) return null;
                const from = centerOf(step);
                const to = centerOf(target);
                const tip = edgePoint(from, to);
                return (
                  <g key={`${step.id}-${targetId}`}>
                    <line
                      x1={from.x}
                      y1={from.y}
                      x2={tip.x}
                      y2={tip.y}
                      stroke="#222222"
                      strokeWidth={1.5}
                    />
                    <polygon points={arrowPoints(from, tip)} fill="#222222" />
                  </g>
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
                color: step.color === '#ffffff' ? '#2c2c30' : step.color,
              }}
              onMouseDown={(e) => handleMouseDown(e, step)}
              onClick={(e) => handleBlockClick(e, step.id)}
            >
              {step.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
