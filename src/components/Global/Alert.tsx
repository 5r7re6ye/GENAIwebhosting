import { useEffect } from "react";

interface AlertProps {
  show: boolean;
  message: string;
  type: "success" | "error" | "warning" | "info";
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
}

function Alert({
  show,
  message,
  type,
  onClose,
  autoClose = true,
  duration = 3000,
}: AlertProps) {
  useEffect(() => {
    if (show && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, autoClose, duration, onClose]);

  if (!show) return null;

  const getAlertClass = () => {
    switch (type) {
      case "success":
        return "alert-success";
      case "error":
        return "alert-danger";
      case "warning":
        return "alert-warning";
      case "info":
        return "alert-info";
      default:
        return "alert-info";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return "fas fa-check-circle";
      case "error":
        return "fas fa-exclamation-circle";
      case "warning":
        return "fas fa-exclamation-triangle";
      case "info":
        return "fas fa-info-circle";
      default:
        return "fas fa-info-circle";
    }
  };

  return (
    <div
      className={`alert ${getAlertClass()} alert-dismissible fade show position-fixed`}
      style={{ top: "20px", right: "20px", zIndex: 9999, minWidth: "300px" }}
    >
      <i className={`${getIcon()} me-2`}></i>
      {message}
      <button
        type="button"
        className="btn-close"
        onClick={onClose}
        aria-label="Close"
      ></button>
    </div>
  );
}

export default Alert;
