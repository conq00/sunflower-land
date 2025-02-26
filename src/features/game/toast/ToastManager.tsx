import React, { useContext, useState, useEffect } from "react";
import { Panel } from "components/ui/Panel";
import { ToastContext } from "./ToastQueueProvider";
import { useIsMobile } from "lib/utils/hooks/useIsMobile";

export const ToastManager: React.FC = () => {
  const { toastList } = useContext(ToastContext);
  const [isMobile] = useIsMobile();
  const [listed, setListed] = useState<boolean>(false);

  useEffect(() => {
    if (toastList.length >= 1) {
      setListed(true);
    } else {
      setListed(false);
    }
  }, [toastList]);

  return (
    <div>
      {listed && (
        <div
          className={`text-shadow p-0.5 text-white shadow-lg flex flex-col items-end mr-2 sm:block fixed left-2 z-[99999] ${
            isMobile ? "top-24" : "top-32"
          }`}
        >
          <Panel>
            {toastList.map(({ content, id, icon }) => (
              <div className="flex items-center relative" key={id}>
                {icon && (
                  <img className="h-6 mr-3" src={icon} alt="toast-icon" />
                )}
                <span>{content}</span>
              </div>
            ))}
          </Panel>
        </div>
      )}
    </div>
  );
};
