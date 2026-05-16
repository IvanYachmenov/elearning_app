import { useLayoutEffect, useRef, type TextareaHTMLAttributes } from 'react';

type AutoGrowTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

/** Textarea that grows with its content instead of showing a scrollbar. */
function AutoGrowTextarea(props: AutoGrowTextareaProps) {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [props.value]);

  return <textarea {...props} ref={ref} />;
}

export default AutoGrowTextarea;
