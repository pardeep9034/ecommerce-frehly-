import { useEffect, useState } from "react";

// `value`, once it has stopped changing for `delay` ms. Keeps a search box from sending a request per keystroke.
export const useDebouncedValue = (value, delay = 300) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
};
