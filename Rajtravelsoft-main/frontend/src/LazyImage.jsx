import { useState, useEffect } from "react";

export default function UltraOptimizedImage({ src, alt, className }) {
  const [finalSrc, setFinalSrc] = useState(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // Max width allowed (reduce memory!)
      const maxW = 900;
      const scale = maxW / img.width;

      canvas.width = maxW;
      canvas.height = img.height * scale;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Convert to 80% quality JPEG (very fast)
      const compressed = canvas.toDataURL("image/jpeg", 0.7);

      setFinalSrc(compressed);
    };
  }, [src]);

  return (
    <div className={className}>
      {!finalSrc && (
        <div className="w-full h-full bg-gray-300 animate-pulse"></div>
      )}

      {finalSrc && (
        <img
          src={finalSrc}
          alt={alt}
          className="w-full h-full object-cover"
        />
      )}
    </div>
  );
}
