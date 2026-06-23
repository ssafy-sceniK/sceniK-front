const easeOut = [0.22, 1, 0.36, 1];

const shortTransition = {
  duration: 0.2,
  ease: easeOut,
};

function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function createMotionProps({ initial, animate, exit, transition = shortTransition }) {
  if (prefersReducedMotion()) {
    return {
      initial: false,
      animate,
      exit: { ...animate, transition: { duration: 0 } },
    };
  }

  return { initial, animate, exit, transition };
}

export const motionVariants = {
  toast: () => createMotionProps({
    initial: { opacity: 0, x: '-50%', y: 10 },
    animate: { opacity: 1, x: '-50%', y: 0 },
    exit: { opacity: 0, x: '-50%', y: 6 },
  }),
  backdrop: () => createMotionProps({
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.16, ease: 'easeOut' },
  }),
  bottomSheet: () => createMotionProps({
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 12 },
  }),
  dialog: () => createMotionProps({
    initial: { opacity: 0, scale: 0.98, y: 6 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.98, y: 4 },
  }),
  popover: () => createMotionProps({
    initial: { opacity: 0, scale: 0.98, y: -4 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.98, y: -2 },
    transition: { duration: 0.16, ease: easeOut },
  }),
  listItem: (index = 0) => createMotionProps({
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 4 },
    transition: { duration: 0.18, delay: Math.min(index, 5) * 0.025, ease: easeOut },
  }),
};
