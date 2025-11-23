import { useState, useEffect, useCallback } from "react";
import { useBlocker } from "react-router-dom";

const useLeaveConfirm = (enabled) => {
  const blocker = useBlocker(enabled);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (blocker.state === "blocked") setOpen(true);
    if (blocker.state === "unblocked") setOpen(false);
  }, [blocker.state]);

  useEffect(() => {
    if (!enabled && blocker.state === "blocked") {
      setOpen(false);
      blocker.proceed();
    }
  }, [enabled, blocker]);

  const confirm = useCallback(() => {
    setOpen(false);
    blocker.proceed();
  }, [blocker]);

  const cancel = useCallback(() => {
    setOpen(false);
    blocker.reset();
  }, [blocker]);

  return { open, confirm, cancel };
};

export { useLeaveConfirm };
