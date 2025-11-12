"use client";

import React, { useRef, useEffect, useState } from "react";
import Icon from "@/ui/Icon";

export interface DrawingData {
  dataUrl: string;
  timestamp: number;
  width: number;
  height: number;
}

interface DrawingBoardProps {
  isOpen: boolean;
  onSave?: (drawingData: DrawingData) => void;
  onClose?: () => void;
  initialImage?: string; // Base64 data URL of an existing image to edit
}

export default function DrawingBoard({ isOpen, onSave, onClose, initialImage }: DrawingBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [open, setIsOpen] = useState(isOpen);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [customColor, setCustomColor] = useState("#000000");
  const [lineWidth, setLineWidth] = useState(2);

  // Sync internal state with prop
  useEffect(() => {
    setIsOpen(isOpen);
  }, [isOpen]);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current || !open) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size to match container
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      // Reset canvas background
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Load initial image if provided
      if (initialImage) {
        const img = new Image();
        img.onload = () => {
          // Draw the image centered on the canvas
          const scale = Math.min(
            canvas.width / img.width,
            canvas.height / img.height,
            1 // Don't scale up, only down if needed
          );
          const x = (canvas.width - img.width * scale) / 2;
          const y = (canvas.height - img.height * scale) / 2;
          ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        };
        img.src = initialImage;
      }
      
      // Set drawing style
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    };

    resizeCanvas();
    setContext(ctx);

    // Handle window resize
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [open, initialImage]);

  // Update drawing style when color or line width changes (without clearing canvas)
  useEffect(() => {
    if (!context) return;
    
    context.strokeStyle = strokeColor;
    context.lineWidth = lineWidth;
    context.lineCap = "round";
    context.lineJoin = "round";
  }, [context, strokeColor, lineWidth]);

  // Drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!context) return;
    
    // Update context with current color and line width
    context.strokeStyle = strokeColor;
    context.lineWidth = lineWidth;
    
    setIsDrawing(true);
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    context.beginPath();
    context.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !context) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    context.lineTo(x, y);
    context.stroke();
  };

  const stopDrawing = () => {
    if (!context) return;
    setIsDrawing(false);
    context.closePath();
  };

  const saveDrawing = () => {
    if (!canvasRef.current || !context) return;

    const canvas = canvasRef.current;
    
    // Get the bounding box of the actual drawing content
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    
    let minX = canvas.width;
    let minY = canvas.height;
    let maxX = 0;
    let maxY = 0;
    
    // Scan all pixels to find the bounding box
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const index = (y * canvas.width + x) * 4;
        const alpha = pixels[index + 3];
        
        // Check if pixel is not fully white (has been drawn on)
        const r = pixels[index];
        const g = pixels[index + 1];
        const b = pixels[index + 2];
        const isWhite = r === 255 && g === 255 && b === 255;
        
        if (!isWhite && alpha > 0) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }
    
    // Check if anything was drawn
    if (minX > maxX || minY > maxY) {
      return;
    }
    
    // Add padding around the drawing
    const padding = 10;
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(canvas.width, maxX + padding);
    maxY = Math.min(canvas.height, maxY + padding);
    
    // Calculate cropped dimensions
    const croppedWidth = maxX - minX;
    const croppedHeight = maxY - minY;
    
    // Create a temporary canvas for the cropped image
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = croppedWidth;
    tempCanvas.height = croppedHeight;
    const tempCtx = tempCanvas.getContext("2d");
    
    if (!tempCtx) return;
    
    // Draw white background on temp canvas
    tempCtx.fillStyle = "white";
    tempCtx.fillRect(0, 0, croppedWidth, croppedHeight);
    
    // Copy the cropped area to the temp canvas
    tempCtx.drawImage(
      canvas,
      minX, minY, croppedWidth, croppedHeight,
      0, 0, croppedWidth, croppedHeight
    );
    
    // Convert temp canvas to data URL
    const dataUrl = tempCanvas.toDataURL("image/png");
    
    // Create drawing data object with cropped dimensions
    const drawingData: DrawingData = {
      dataUrl,
      timestamp: Date.now(),
      width: croppedWidth,
      height: croppedHeight,
    };
    
    // Call the callback if provided
    if (onSave) {
      onSave(drawingData);
    }
    
    // Close the drawing board after saving
    setIsOpen(false);
    onClose?.();
    
    return drawingData;
  };

  const clearDrawing = () => {
    if (!canvasRef.current || !context) return;
    
    const canvas = canvasRef.current;
    
    // Clear the canvas
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // Redraw white background
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // If there's an initial image, reload it
    if (initialImage) {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(
          canvas.width / img.width,
          canvas.height / img.height,
          1
        );
        const x = (canvas.width - img.width * scale) / 2;
        const y = (canvas.height - img.height * scale) / 2;
        context.drawImage(img, x, y, img.width * scale, img.height * scale);
      };
      img.src = initialImage;
    }
    
    // Reset drawing style
    context.strokeStyle = strokeColor;
    context.lineWidth = lineWidth;
    context.lineCap = "round";
    context.lineJoin = "round";
  };

  // Don't render the floating button anymore - controlled by parent
  if (!open) return null;

  return (
    <div className="fixed md:sticky md:top-4 z-30 top-0 left-0 w-screen h-full md:w-full md:max-h-[calc(100vh-200px)] md:h-[600px] bg-white rounded-lg overflow-hidden shadow-xl md:mb-4">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />

      {/* Color Picker and Line Width Controls - Top Left */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg space-y-3">
        {/* Color Presets */}
        <div className="flex gap-2 items-center">
          <span className="text-xs font-medium text-gray-700">Couleur:</span>
          <button
            onClick={() => setStrokeColor("#000000")}
            className={`w-8 h-8 rounded-full bg-black border-2 transition-all ${
              strokeColor === "#000000" ? "border-blue-500 scale-110" : "border-gray-300"
            }`}
            title="Noir"
          />
          <button
            onClick={() => setStrokeColor("#FFFFFF")}
            className={`w-8 h-8 rounded-full bg-white border-2 transition-all ${
              strokeColor === "#FFFFFF" ? "border-blue-500 scale-110" : "border-gray-400"
            }`}
            title="Blanc"
          />
          <input
            type="color"
            value={customColor}
            onChange={(e) => {
              setCustomColor(e.target.value);
              setStrokeColor(e.target.value);
            }}
            className="w-8 h-8 rounded-full cursor-pointer border-2 border-gray-300"
            title="Couleur personnalisée"
          />
        </div>
        
        {/* Line Width Slider */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-700">
            Épaisseur: {lineWidth}px
          </label>
          <input
            type="range"
            min="1"
            max="20"
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
            className="w-32 accent-primary"
          />
        </div>
      </div>

      {/* Close button in top right corner */}
      <button
        onClick={() => {
          setIsOpen(false);
          onClose?.();
        }}
        className="absolute top-5 right-5 flex items-center justify-center w-10 h-10 bg-gray-300 text-black rounded-full shadow-lg hover:bg-opacity-90 transition-all duration-200 font-medium"
        title="Fermer l'outil de dessin"
      >
        <Icon name="close" size={16} className="inline-block" />
      </button>
      
      {/* Clear button in bottom left corner */}
      <button
        onClick={clearDrawing}
        className="absolute bottom-24 md:bottom-4 left-4 px-6 py-3 bg-gray-300 text-black rounded-lg shadow-lg hover:bg-opacity-90 transition-all duration-200 font-medium"
        title="Effacer l'ensemble du dessin"
      >
        Effacer
      </button>

      {/* Save button in bottom right corner */}
      <button
        onClick={saveDrawing}
        className="absolute bottom-24 md:bottom-4 right-4 px-6 py-3 bg-primary text-white rounded-lg shadow-lg hover:bg-opacity-90 transition-all duration-200 font-medium"
        title="Sauvegarder le dessin"
      >
        Sauvegarder
      </button>
    </div>
  );
}
