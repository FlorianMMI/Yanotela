"use client";

import Icon from "@/ui/Icon";
import React, { useRef, useEffect, useState } from "react";

export interface DrawingData {
  dataUrl: string;
  timestamp: number;
  width: number;
  height: number;
}

interface DrawingBoardProps {
  isOpen: boolean;
  onSave?: (drawingData: DrawingData) => void;
}

export default function DrawingBoard({ isOpen, onSave }: DrawingBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [open, setIsOpen] = useState(isOpen);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);

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
      
      // Set drawing style
      ctx.strokeStyle = "black";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    };

    resizeCanvas();
    setContext(ctx);

    // Handle window resize
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [open]);

  // Drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!context) return;
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
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    
    // Convert canvas to data URL (base64 PNG)
    const dataUrl = canvas.toDataURL("image/png");
    
    // Create drawing data object
    const drawingData: DrawingData = {
      dataUrl,
      timestamp: Date.now(),
      width: canvas.width,
      height: canvas.height,
    };

    // Log for debugging
    console.log("Drawing saved:", drawingData);
    
    // Call the callback if provided
    if (onSave) {
      onSave(drawingData);
    }
    
    // Close the drawing board after saving
    setIsOpen(false);
    
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
    
    // Reset drawing style
    context.strokeStyle = "black";
    context.lineWidth = 2;
    context.lineCap = "round";
    context.lineJoin = "round";
  };

  if (!open) return (
    <button
      onClick={() => setIsOpen(true)}
      className="absolute right-4 top-4 flex items-center justify-center w-10 h-10 bg-primary text-white rounded-full shadow-lg hover:bg-opacity-90 transition-all duration-200 font-medium"
    >
      <Icon name="modif" size={20} className="inline-block" />
    </button>
  );

  return (
    <div className="absolute z-10 top-0 left-0 w-full h-full bg-white">
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

      {/* Close button in top right corner */}
      <button
        onClick={() => {
          setIsOpen(false);
        }}
        className="absolute top-4 right-4 flex items-center justify-center w-10 h-10 bg-gray-300 text-black rounded-full shadow-lg hover:bg-opacity-90 transition-all duration-200 font-medium"
      >
        <Icon name="close" size={16} className="inline-block" />
      </button>
      
      {/* Clear button in bottom left corner */}
      <button
        onClick={clearDrawing}
        className="absolute bottom-4 left-4 px-6 py-3 bg-gray-300 text-black rounded-lg shadow-lg hover:bg-opacity-90 transition-all duration-200 font-medium"
      >
        Effacer
      </button>

      {/* Save button in bottom right corner */}
      <button
        onClick={saveDrawing}
        className="absolute bottom-4 right-4 px-6 py-3 bg-primary text-white rounded-lg shadow-lg hover:bg-opacity-90 transition-all duration-200 font-medium"
      >
        Sauvegarder
      </button>
    </div>
  );
}
