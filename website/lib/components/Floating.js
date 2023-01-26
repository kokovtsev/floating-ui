import * as FloatingUI from '@floating-ui/react-dom';
import {autoUpdate} from '@floating-ui/react-dom';
import {cloneElement, useEffect, useRef} from 'react';
import {createPortal} from 'react-dom';

export function Floating({
  children,
  content,
  strategy: strategyOption,
  tooltipStyle = {},
  middleware = [],
  portaled,
  minHeight,
  transition,
  arrow,
  lockedFromArrow,
  ...options
}) {
  const arrowRef = useRef();
  const {
    x,
    y,
    reference,
    floating,
    middlewareData,
    refs,
    placement,
    strategy,
  } = FloatingUI.useFloating({
    whileElementsMounted: autoUpdate,
    strategy: strategyOption,
    middleware:
      [
        ...middleware,
        ...(arrow
          ? [FloatingUI.arrow({element: arrowRef, padding: 5})]
          : []),
        ...(lockedFromArrow
          ? [
              FloatingUI.shift(
                middleware.find((m) => m.name === 'shift')
                  .options
              ),
            ]
          : []),
      ]
        ?.map(({name, options}) => {
          if (name === 'size') {
            return FloatingUI.size?.({
              ...options,
              apply: ({availableHeight}) => {
                Object.assign(
                  refs.floating.current.style ?? {},
                  {
                    maxHeight: minHeight
                      ? `${Math.max(
                          availableHeight,
                          minHeight
                        )}px`
                      : `${Math.max(availableHeight, 0)}px`,
                  }
                );
              },
            });
          }

          if (name === 'hide') {
            return [
              FloatingUI.hide(),
              FloatingUI.hide({strategy: 'escaped'}),
            ];
          }

          return FloatingUI[name]?.(options);
        })
        .flat()
        .filter((v) => v) ?? [],
    ...options,
  });

  useEffect(() => {
    function addTransition() {
      if (transition) {
        requestAnimationFrame(() => {
          if (refs.floating.current) {
            refs.floating.current.style.transition =
              'transform 0.65s cubic-bezier(0.22, 1, 0.36, 1)';
          }
        });
      }
    }

    function removeTransition() {
      if (refs.floating.current) {
        refs.floating.current.style.transition = '';
      }
    }

    if (x != null && transition) {
      addTransition();
    }

    window.addEventListener('resize', () => {
      removeTransition();
      addTransition();
    });

    return () => {
      window.removeEventListener('resize', removeTransition);
    };
  }, [x, transition, refs.floating]);

  const staticSide = {
    left: 'right',
    right: 'left',
    top: 'bottom',
    bottom: 'top',
  }[placement.split('-')[0]];

  const tooltipJsx = (
    <div
      className="grid place-items-center bg-gray-800 text-gray-50 z-10 rounded"
      ref={floating}
      style={{
        ...tooltipStyle,
        position: strategy,
        left: 0,
        top: 0,
        transform:
          x != null
            ? `translate3d(${Math.round(x)}px,${Math.round(
                y
              )}px,0)`
            : undefined,
        backgroundColor: middlewareData.hide?.escaped
          ? 'red'
          : undefined,
        visibility:
          middlewareData.hide?.referenceHidden || x == null
            ? 'hidden'
            : undefined,
      }}
    >
      <div className="px-2 py-2">{content ?? 'Floating'}</div>
      {arrow && (
        <div
          ref={arrowRef}
          className="w-4 h-4 bg-gray-800 [left:-0.5rem]"
          style={{
            position: 'absolute',
            left:
              middlewareData.arrow?.x != null
                ? middlewareData.arrow?.x
                : '',
            top:
              middlewareData.arrow?.y != null
                ? middlewareData?.arrow?.y
                : '',
            right: '',
            bottom: '',
            [staticSide]: lockedFromArrow ? -7 : '-1rem',
            background: lockedFromArrow ? '' : 'red',
            transition: lockedFromArrow
              ? 'transform 0.2s ease'
              : 'none',
            transform: lockedFromArrow
              ? middlewareData.arrow?.centerOffset !== 0
                ? 'translateX(1rem) rotate(45deg)'
                : 'rotate(45deg)'
              : '',
          }}
        />
      )}
    </div>
  );

  return (
    <>
      {cloneElement(children, {ref: reference})}
      {portaled && typeof document !== 'undefined'
        ? createPortal(
            tooltipJsx,
            document.getElementById('floating-root')
          )
        : tooltipJsx}
    </>
  );
}
