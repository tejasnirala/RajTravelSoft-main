import { useEffect } from "react";

const useDisableInspect = () => {
  useEffect(() => {
    // Right click disable
    const handleContextMenu = (e) => e.preventDefault();
    document.addEventListener("contextmenu", handleContextMenu);

    // Disable shortcut keys
    const handleKeyDown = (e) => {
      if (
        e.keyCode === 123 || // F12
        (e.ctrlKey && e.shiftKey && e.keyCode === 73) || // Ctrl+Shift+I
        (e.ctrlKey && e.shiftKey && e.keyCode === 74) || // Ctrl+Shift+J
        (e.ctrlKey && e.keyCode === 85) // Ctrl+U
      ) {
        e.preventDefault();
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    // DevTools detection (reload hone par bhi check kare)
    const detectDevTools = () => {
      if (
        window.outerWidth - window.innerWidth > 200 ||
        window.outerHeight - window.innerHeight > 200
      ) {
        console.clear();
        // alert("Developer Tools are disabled!");
        window.location.href = "/"; // 👈 redirect kar do agar inspect open hai
      }
    };

    detectDevTools(); // 👈 page load होते ही check
    const interval = setInterval(detectDevTools, 2000);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      clearInterval(interval);
    };
  }, []);
};

export default useDisableInspect;
