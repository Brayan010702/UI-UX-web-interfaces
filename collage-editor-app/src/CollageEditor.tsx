import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
  DragEvent,
  ChangeEvent,
  JSX,
} from "react";

import { BiRectangle } from "react-icons/bi";
import { BsCircle } from "react-icons/bs";
import { TbTriangle } from "react-icons/tb";

import { 
  FaImage,
  FaFont, 
  FaShapes,
  FaEye, 
  FaEyeSlash, 
  FaTrash, 
  FaArrowUp, 
  FaArrowDown,
  FaFileUpload,
  FaFileDownload,
  FaTimes,
  FaTrashAlt,
  FaLayerGroup
} from 'react-icons/fa';

const pastelColors = [
  "#7A8D9B",
  "#B2B9BF",
];

type LayerType = "Image" | "text" | "shape";
type ShapeType = "rect" | "ellipse" | "triangle";

type BaseLayer = {
  id: string;
  type: LayerType;
  opacity: number;
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
};

type ImageLayer = BaseLayer & {
  type: "Image";
  src: string;
  name: string;
};

type TextLayer = BaseLayer & {
  type: "text";
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor: string; 
};

type ShapeLayer = BaseLayer & {
  type: "shape";
  shape: ShapeType;
  fill: string;
  stroke: string;
  strokeWidth: number;
};

type Layer = ImageLayer | TextLayer | ShapeLayer;

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

const COLLAGE_WIDTH = 900;
const COLLAGE_HEIGHT = 600;

const fontFamilies = [
  "Inter",
  "Arial",
  "Georgia",
  "Courier New",
  "Comic Sans MS",
] as const;

const defaultFontFamily = "Space Grotesk";

const defaultTextLayer: Partial<TextLayer> = {
  text: "New Text",
  fontSize: 28,
  fontFamily: defaultFontFamily,
  color: "#333",
  backgroundColor: "transparent",
};

const defaultShapeLayer: Partial<ShapeLayer> = {
  shape: "rect",
  fill: "#FFFFFF",  
  stroke: "#000000", 
  strokeWidth: 1,    
};

function clamp(val: number, min: number, max: number) {
  return Math.min(Math.max(val, min), max);
}

const pastelBg = "#7A8D9B"; 
const pastelPanel = "#B2B9BF"; 
const pastelPanel2 = "#B2B9BF"; 
const pastelBtn = "#AECBFA"; 
const pastelWorkspace = "#F6F5F2"; 

const layerTypeIcons: Record<LayerType | ShapeType, JSX.Element> = {
  Image: <FaImage />,
  text: <FaFont />,
  shape: <FaShapes />,
  rect: <BiRectangle />,
  ellipse: <BsCircle />,
  triangle: <TbTriangle />,
};

const shapeNames: Record<ShapeType, string> = {
  rect: "",
  ellipse: "",
  triangle: "",
};

interface DragState {
  id: string | null;
  offsetX: number;
  offsetY: number;
  resizing: boolean;
  resizeDir: "se" | null;
}

const CollageEditor: React.FC = () => {
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toolbarPos, setToolbarPos] = useState(() => {
    const toolbarWidth = 310;
    const toolbarHeight = 760;
    const centerX = window.innerWidth / 2 - toolbarWidth / 2;
    const centerY = COLLAGE_HEIGHT / 2 - toolbarHeight / 2 + 170;
    return { 
      x: centerX, 
      y: centerY 
    };
  });
  const [isDraggingToolbar, setIsDraggingToolbar] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleToolbarMouseDown = (e: React.MouseEvent) => {
    setIsDraggingToolbar(true);
    setDragOffset({
      x: e.clientX - toolbarPos.x,
      y: e.clientY - toolbarPos.y
    });
    e.preventDefault();
  };

  const [notifications, setNotifications] = useState<{
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }[]>([]);

  const addNotification = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      const id = genId();
      setNotifications((prev) => [...prev, { id, message, type }]);
      
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, 3000);
    },
    []
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingToolbar) return;
      setToolbarPos({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    };

    const handleMouseUp = () => {
      setIsDraggingToolbar(false);
    };

    if (isDraggingToolbar) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingToolbar, dragOffset]);

  const [drag, setDrag] = useState<DragState>({
    id: null,
    offsetX: 0,
    offsetY: 0,
    resizing: false,
    resizeDir: null,
  });

  const [showExport, setShowExport] = useState(false);
  const [exportFormat, setExportFormat] = useState<"png" | "svg">("png");
  const [exportWidth, setExportWidth] = useState(COLLAGE_WIDTH);
  const [exportHeight, setExportHeight] = useState(COLLAGE_HEIGHT);

  const wsRef = useRef<HTMLDivElement | null>(null);

  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [textEditValue, setTextEditValue] = useState("");

  function selectLayer(id: string) {
    setSelectedId(id);
    setEditingTextId(null);
  }

  function moveLayer(id: string, dir: "up" | "down") {
    setLayers((prev) => {
      const idx = prev.findIndex((l) => l.id === id);
      if (dir === "up" && idx < prev.length - 1) {
        const arr = prev.slice();
        [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
        return arr;
      }
      if (dir === "down" && idx > 0) {
        const arr = prev.slice();
        [arr[idx], arr[idx - 1]] = [arr[idx - 1], arr[idx]];
        return arr;
      }
      return prev;
    });
  }

  function deleteLayer(id: string) {
    setLayers((prev) => prev.filter((l) => l.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  function addImageLayer(file: File) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      setLayers((prev) => [
        ...prev,
        {
          id: genId(),
          type: "Image",
          name: file.name,
          src: ev.target?.result as string, 
          opacity: 1,
          x: COLLAGE_WIDTH / 4 + Math.random() * 60,
          y: COLLAGE_HEIGHT / 4 + Math.random() * 60,
          width: 240,
          height: 180,
          visible: true,
        },
      ]);
    };
    reader.readAsDataURL(file); 
  }

  function addTextLayer() {
    setLayers((prev) => [
      ...prev,
      {
        id: genId(),
        type: "text",
        opacity: 1,
        x: COLLAGE_WIDTH / 2 - 60 + Math.random() * 40,
        y: COLLAGE_HEIGHT / 2 - 20 + Math.random() * 40,
        width: 200,
        height: 40,
        visible: true,
        ...defaultTextLayer,
      } as TextLayer,
    ]);
  }

  function addShapeLayer(shape: ShapeType) {
    setLayers((prev) => [
      ...prev,
      {
        id: genId(),
        type: "shape",
        opacity: 1,
        x: COLLAGE_WIDTH / 3 + Math.random() * 40,
        y: COLLAGE_HEIGHT / 3 + Math.random() * 40,
        width: 120,
        height: 90,
        visible: true,
        ...defaultShapeLayer,
        shape,
      } as ShapeLayer,
    ]);
  }

  function updateLayer(
    id: string,
    updater: (prev: Layer) => Layer
  ) {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? updater(l) : l))
    );
  }

  const onPointerDown = (
    e: React.PointerEvent,
    id: string,
    mode: "move" | "resize" = "move"
  ) => {
    const wsRect = wsRef.current?.getBoundingClientRect();
    if (!wsRect) return;
    
    const layer = layers.find((l) => l.id === id);
    if (!layer) return;

    const offsetX = e.clientX - wsRect.left;
    const offsetY = e.clientY - wsRect.top;

    if (mode === "resize") {
      setDrag({
        id,
        offsetX: offsetX - layer.width,
        offsetY: offsetY - layer.height,
        resizing: true,
        resizeDir: "se",
      });
    } else {
      setDrag({
        id,
        offsetX: offsetX - layer.x,
        offsetY: offsetY - layer.y,
        resizing: false,
        resizeDir: null,
      });
    }
    
    selectLayer(id);
    (document.activeElement as HTMLElement)?.blur();
    e.stopPropagation();
  };

  useEffect(() => {
    function up() {
      setDrag((d) => ({ ...d, id: null, resizing: false, resizeDir: null }));
    }
    
    function move(e: PointerEvent) {
      if (!drag.id || !wsRef.current) return;
      
      const wsRect = wsRef.current.getBoundingClientRect();
      const mx = e.clientX - wsRect.left; 
      const my = e.clientY - wsRect.top;  
      
      setLayers((prev) =>
        prev.map((l) => {
          if (l.id !== drag.id) return l;
          
          if (drag.resizing && drag.resizeDir === "se") {
            const newWidth = clamp(mx - l.x, 30, COLLAGE_WIDTH - l.x);
            const newHeight = clamp(my - l.y, 30, COLLAGE_HEIGHT - l.y);
            return { ...l, width: newWidth, height: newHeight };
          } else {
            const newX = clamp(mx - drag.offsetX, 0, COLLAGE_WIDTH - l.width);
            const newY = clamp(my - drag.offsetY, 0, COLLAGE_HEIGHT - l.height);
            return { ...l, x: newX, y: newY };
          }
        })
      );
    }
    
    if (drag.id) {
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up, { once: true });
      return () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      };
    }
  }, [drag, layers]);

  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const onWorkspaceDrop = (ev: DragEvent) => {
    ev.preventDefault();
    setIsDraggingOver(false);
    const files = Array.from(ev.dataTransfer.files);
    files
      .filter((f) => f.type.startsWith("image/")) 
      .forEach((file) => addImageLayer(file));
  };

  const onWorkspaceDragOver = (ev: DragEvent) => {
    ev.preventDefault();
    setIsDraggingOver(true);
  };

  const onWorkspaceDragLeave = (ev: DragEvent) => {
    ev.preventDefault();
    setIsDraggingOver(false);
  };

  function beginEditText(id: string, initial: string) {
    setEditingTextId(id);
    setTextEditValue(initial);
  }

  function commitEditText() {
    if (editingTextId) {
      updateLayer(editingTextId, (l) => {
        if (l.type === "text") {
          return { ...l, text: textEditValue };
        }
        return l;
      });
      setEditingTextId(null);
    }
  }

  function renderSVG(layersToRender: Layer[], width: number, height: number) {
    const nodes: string[] = [];
    for (const l of layersToRender) {
      if (!l.visible) continue;
      const opacity = l.opacity;
      if (l.type === "Image") {
        nodes.push(
          `<image x="${l.x}" y="${l.y}" width="${l.width}" height="${l.height}" href="${l.src}" opacity="${opacity}"/>`
        );
      }  else if (l.type === "text") {
        const font = l.fontFamily || defaultFontFamily;
        nodes.push(
          `<rect x="${l.x}" y="${l.y}" width="${l.width}" height="${l.height}" fill="${l.backgroundColor}" opacity="${opacity}"/>`,
          `<text x="${l.x + 5}" y="${
            l.y + l.height / 2 + l.fontSize / 2.5
          }" font-size="${l.fontSize}" font-family="${font}" fill="${
            l.color
          }" opacity="${opacity}">${escapeXML(l.text)}</text>`
        );
      }else if (l.type === "shape") {
        const fill = l.fill;
        const stroke = l.stroke;
        const strokeW = l.strokeWidth;
        if (l.shape === "rect") {
          nodes.push(
            `<rect x="${l.x}" y="${l.y}" width="${l.width}" height="${l.height}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeW}" opacity="${opacity}"/>`
          );
        } else if (l.shape === "ellipse") {
          nodes.push(
            `<ellipse cx="${l.x + l.width / 2}" cy="${
              l.y + l.height / 2
            }" rx="${l.width / 2}" ry="${
              l.height / 2
            }" fill="${fill}" stroke="${stroke}" stroke-width="${strokeW}" opacity="${opacity}"/>`
          );
        } else if (l.shape === "triangle") {
          const x1 = l.x;
          const y1 = l.y + l.height;
          const x2 = l.x + l.width;
          const y2 = l.y + l.height;
          const x3 = l.x + l.width / 2;
          const y3 = l.y;
          nodes.push(
            `<polygon points="${x1},${y1} ${x2},${y2} ${x3},${y3}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeW}" opacity="${opacity}"/>`
          );
        }
      }
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${nodes.join("")}</svg>`;
  }

  function escapeXML(text: string) {
    return text.replace(/[<>&"']/g, function (ch) {
      switch (ch) {
        case "<":
          return "&lt;";
        case ">":
          return "&gt;";
        case "&":
          return "&amp;";
        case '"':
          return "&quot;";
        case "'":
          return "&apos;";
      }
      return ch;
    });
  }

  function downloadSVG() {
    try {
      const svgStr = renderSVG(layers, exportWidth, exportHeight);
      const blob = new Blob([svgStr], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      
      addNotification("File ready, please select download destination", "success");
      
      setTimeout(() => {
        const a = document.createElement("a");
        a.href = url;
        a.download = "collage.svg";
        a.click();
        URL.revokeObjectURL(url);
      }, 2000);
      
    } catch (error) {
      console.error("Error downloading SVG:", error);
      addNotification("Failed to generate SVG file", "error");
    }
  }

async function downloadPNG() {
  try {
    const layersWithDataUrls = await Promise.all(
      layers.map(async (layer) => {
        if (layer.type !== "Image") return layer;
        if (layer.src.startsWith("data:")) return layer;
        const dataUrl = await urlToDataUrl(layer.src);
        return { ...layer, src: dataUrl };
      })
    );
    const svgStr = renderSVG(layersWithDataUrls, exportWidth, exportHeight);
    const img = new Image();
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgStr)));
    
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = exportWidth;
      canvas.height = exportHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = pastelWorkspace;
      ctx.fillRect(0, 0, exportWidth, exportHeight);
      ctx.drawImage(img, 0, 0);
      
      addNotification("File ready, please select download destination", "success");
      
      setTimeout(() => {
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "collage.png";
            a.click();
            URL.revokeObjectURL(url);
          } else {
            addNotification("Failed to generate PNG file", "error");
          }
        }, "image/png");
      }, 2000);
    };
    
    img.onerror = () => {
      console.error("Error loading SVG image");
      addNotification("Error generating PNG image", "error");
    };
  } catch (error) {
    console.error("Error downloading PNG:", error);
    addNotification("Failed to generate PNG file", "error");
  }
}
function urlToDataUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL());
    };
    img.onerror = reject;
    img.src = url;
  });
}

  function doExport() {
    try {
      if (exportFormat === "svg") {
        downloadSVG();
      } else {
        downloadPNG();
      }
      setShowExport(false);
    } catch (error) {
      addNotification("Export failed. Please try again.", "error");
      console.error("Export error:", error);
    }
  }

  const [dragLayerId, setDragLayerId] = useState<string | null>(null);
  function onLayerDragStart(id: string) {
    setDragLayerId(id);
  }
  function onLayerDragEnd() {
    setDragLayerId(null);
  }
  function onLayerDrop(targetId: string) {
    if (!dragLayerId || dragLayerId === targetId) return;
    setLayers((prev) => {
      const arr = [...prev];
      const fromIdx = arr.findIndex((l) => l.id === dragLayerId);
      const toIdx = arr.findIndex((l) => l.id === targetId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const [item] = arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, item);
      return arr;
    });
    setDragLayerId(null);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (selectedId && e.key === "Delete") {
        deleteLayer(selectedId);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId]);

  return (
    <div
      style={{
        minHeight: "100vh",
        height: "100vh",
        background: "linear-gradient(135deg, #E8F5E9 0%, #F1F8E9 25%, #FFF8E1 50%, #FFEBEE 75%, #F3E5F5 100%)",
        fontFamily: "Inter, sans-serif",
        color: "#000000",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <div style={{ 
        width: "100%", 
        height: "calc(100vh - 90px)", 
        display: "flex",
        marginTop: "90px",
        paddingBottom: "300px",
        overflow: "hidden" 
      }}>
        <div style={{
          position: 'fixed',
          left: '18px',
          top: '90px',
          width: "250px",
          height: "calc(100vh - 140px)",
          background: "#f2f4f4",
          borderRadius: "12px",
          padding: "16px",
          border: "1px solid #e0e0e0",
          boxShadow: "0 2px 7px rgba(0,0,0,0.05)",
          overflowY: 'auto',
          zIndex: 100,
        }}>
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            marginBottom: "16px",
            paddingBottom: "12px",
            borderBottom: "1px solid #7A8D9B"
          }}>
            <span style={{ 
              fontSize: 19, 
              marginRight: 8,
              color: "#4a5568",
              display: "flex",
              alignItems: "center"
            }}>
              <FaLayerGroup />
            </span>
            <span style={{ 
              fontWeight: 600, 
              fontSize: "16px",
              color: "#2D3748"
            }}>
              Layers
            </span>
          </div>
          
          <div style={{ flex: 1, overflowY: "auto" }}>
            {layers
              .slice()
              .reverse()
              .map((layer, i) => {
                const idx = layers.length - 1 - i;
                const isSelected = selectedId === layer.id;
                return (
                  <div
                    key={layer.id}
                    draggable
                    onClick={() => selectLayer(layer.id)}
                    onDoubleClick={() => {
                      if (layer.type === "text") beginEditText(layer.id, layer.text);
                    }}
                    onDragStart={() => onLayerDragStart(layer.id)}
                    onDragEnd={onLayerDragEnd}
                    onDragOver={(e) => {
                      e.preventDefault();
                    }}
                    onDrop={() => onLayerDrop(layer.id)}
                    style={{
                      padding: "8px 12px",
                      marginBottom: 8,
                      borderRadius: "8px",
                      background: isSelected ? "#e2e8f0" : "#ffffff",
                      border: isSelected 
                        ? "1px solid #cbd5e0" 
                        : "1px solid #e2e8f0",
                      display: "flex",
                      alignItems: "center",
                      cursor: "pointer",
                      opacity: layer.visible ? 1 : 0.6,
                      gap: 8,
                      fontSize: 14,
                      transition: "all 0.2s ease",
                    }}
                  >
                    <span style={{ 
                      fontSize: 16, 
                      marginRight: 8, 
                      display: "flex", 
                      alignItems: "center",
                      opacity: 0.8
                    }}>
                      {layer.type === "shape"
                        ? layerTypeIcons[layer.shape]
                        : layerTypeIcons[layer.type]}
                    </span>
                    <span style={{ 
                      flex: 1, 
                      overflow: "hidden", 
                      textOverflow: "ellipsis", 
                      whiteSpace: "nowrap",
                      color: "#2D3748"
                    }}>
                      {layer.type === "Image"
                        ? layer.name
                        : layer.type === "text"
                        ? layer.text
                        : shapeNames[layer.shape]}
                    </span>
                    <div style={{ 
                      display: "flex", 
                      alignItems: "center",
                      gap: 4
                    }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateLayer(layer.id, (l) => ({ ...l, visible: !l.visible }));
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          fontSize: 14,
                          opacity: 0.7,
                          cursor: "pointer",
                          color: "#4a5568",
                        }}
                        title={layer.visible ? "Hide" : "Show"}
                      >
                        {layer.visible ? <FaEye /> : <FaEyeSlash />}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteLayer(layer.id);
                        }}
                        title="Delete layer"
                        style={{
                          background: "none",
                          border: "none",
                          fontSize: 14,
                          opacity: 0.7,
                          cursor: "pointer",
                          color: "#4a5568",
                        }}
                      >
                        <FaTrashAlt/>
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
        <header style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '70px',
          background: `
            linear-gradient(135deg, #f2f4f4 0%, #e5e8e8 100%),
            repeating-linear-gradient(
              45deg,
              rgba(255,255,255,0.1) 0px,
              rgba(255,255,255,0.1) 1px,
              transparent 1px,
              transparent 4px
            )`,
          display: 'flex',
          alignItems: 'center',
          padding: '0 30px',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)'
        }}>
          <img 
            src="https://cdn-icons-png.freepik.com/256/4507/4507929.png?ga=GA1.1.127740609.1749899556&semt=ais_hybrid" 
            alt="Logo" 
            style={{ 
              height: '40px',
              width: '40px',
              objectFit: 'contain',
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))'
            }} 
          />
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            marginLeft: '15px'
          }}>
            <h1 style={{
              margin: 0,
              fontSize: '22px',
              fontWeight: 700,
              color: '#2D3748',
              letterSpacing: '0.5px',
              lineHeight: '1.2'
            }}>
              Collage Editor
            </h1>
            
            <div style={{
              color: '#2D3748',
              fontSize: '14px',
              fontWeight: 300,
              fontStyle: 'italic',
              marginTop: '4px'
            }}>
              Transform photos into visual poetry
            </div>
          </div>
        </header>
        <div
          style={{
            position: "relative",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            overflow: "auto",
            zIndex: 1,
            width: "100%",
            height: "calc(100vh - 80px)", 
            boxSizing: "border-box"
          }}
        >
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            <div
              ref={wsRef}
              tabIndex={-1}
              onDrop={onWorkspaceDrop}
              onDragOver={onWorkspaceDragOver}
              onDragLeave={onWorkspaceDragLeave}
              style={{
                width: COLLAGE_WIDTH,
                height: COLLAGE_HEIGHT,
                background: `
                  radial-gradient(circle, #e0e0e0 1px, transparent 1px),
                  #ffffff
                `,
                backgroundSize: "20px 20px",
                borderRadius: "38px",
                border: isDraggingOver ? "2px dashed #4a5568" : "2px solid #e0e0e0",
                boxShadow: "0 4px 28px rgba(0, 0, 0, 0.1)",
                position: "relative",
                overflow: "hidden",
                outline: "none",
                cursor: drag.id
                  ? drag.resizing
                    ? "nwse-resize"
                    : "grabbing"
                  : "default",
                transition: "all 0.15s",
                flexShrink: 0 
              }}
            >
              {isDraggingOver && (
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(255, 255, 255, 0.7)",
                  zIndex: 100,
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#4a5568"
                }}>
                  Drop the image here
                </div>
              )}
              {layers.map((layer, i) => {
                if (!layer.visible) return null;
                const isSelected = selectedId === layer.id;
                const commonStyle: React.CSSProperties = {
                  position: "absolute",
                  left: layer.x,
                  top: layer.y,
                  width: layer.width,
                  height: layer.height,
                  opacity: layer.opacity,
                  border:
                    isSelected && !editingTextId
                      ? "2.3px solid #AECBFA"
                      : undefined,
                  borderRadius: 13,
                  boxShadow:
                    isSelected && !editingTextId
                      ? "0 3px 24px #AECBFA18"
                      : undefined,
                  zIndex: 1 + i,
                  cursor: drag.id === layer.id
                    ? drag.resizing
                      ? "nwse-resize"
                      : "grabbing"
                    : "move",
                  transition: "border 0.14s",
                  background: "#fff0",
                };
                const resizeHandle = (
                  <div
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      onPointerDown(e, layer.id, "resize");
                    }}
                    style={{
                      position: "absolute",
                      right: -7,
                      bottom: -7,
                      width: 16,
                      height: 16,
                      background: "#AECBFA",
                      borderRadius: 8,
                      border: "0.5px solid #AECBFA",
                      boxShadow: "0 1px 7px #AECBFA29",
                      cursor: "nwse-resize",
                      zIndex: 5,
                      display: isSelected ? "block" : "none",
                    }}
                  ></div>
                );

                switch (layer.type) {
                  case "Image":
                    return (
                      <div
                        key={layer.id}
                        tabIndex={-1}
                        style={commonStyle}
                        onPointerDown={(e) => onPointerDown(e, layer.id, "move")}
                        onDoubleClick={() => selectLayer(layer.id)}
                      >
                        <img
                          src={layer.src}
                          alt={layer.name}
                          draggable={false}
                          style={{
                            width: "100%",
                            height: "100%",
                            borderRadius: 11,
                            pointerEvents: "none",
                            objectFit: "cover",
                          }}
                        />
                        {resizeHandle}
                      </div>
                    );
                    case "text":
                      return (
                        <div
                          key={layer.id}
                          style={{
                            ...commonStyle,
                            borderStyle: editingTextId === layer.id ? "dashed" : "solid",
                            padding: "8px 12px",
                            background: layer.backgroundColor === "transparent" 
                              ? "#fff8" 
                              : layer.backgroundColor,
                            minWidth: 70,
                            width: "fit-content",
                            maxWidth: "100%",
                            height: "auto",
                            whiteSpace: "pre-wrap",
                          }}
                          onPointerDown={(e) => onPointerDown(e, layer.id, "move")}
                          onDoubleClick={() => beginEditText(layer.id, layer.text)}
                        >
                        {editingTextId === layer.id ? (
                          <textarea
                            autoFocus
                            value={textEditValue}
                            rows={1}
                            onBlur={commitEditText}
                            onChange={(e) => setTextEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                commitEditText();
                              }
                            }}
                            style={{
                              fontSize: layer.fontSize,
                              fontFamily: layer.fontFamily,
                              color: layer.color,
                              width: "100%",
                              resize: "none",
                              border: "none",
                              background: "transparent",
                              outline: "none",
                              minHeight: "40px", 
                              height: "auto",    
                              overflow: "hidden", 
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              fontSize: layer.fontSize,
                              fontFamily: layer.fontFamily,
                              color: layer.color,
                              whiteSpace: "pre-wrap", 
                              wordBreak: "break-word",
                              pointerEvents: "none",
                            }}
                          >
                            {layer.text}
                          </div>
                        )}
                        {resizeHandle}
                      </div>
                    );
                  case "shape":
                    return (
                      <div
                        key={layer.id}
                        style={commonStyle}
                        onPointerDown={(e) => onPointerDown(e, layer.id, "move")}
                        onDoubleClick={() => selectLayer(layer.id)}
                      >
                        <svg
                          width={layer.width}
                          height={layer.height}
                          style={{
                            width: "100%",
                            height: "100%",
                            pointerEvents: "none",
                          }}
                        >
                          {layer.shape === "rect" && (
                            <rect
                              x={0}
                              y={0}
                              width={layer.width}
                              height={layer.height}
                              rx={17}
                              fill={layer.fill}
                              stroke={layer.stroke}
                              strokeWidth={layer.strokeWidth}
                            />
                          )}
                          {layer.shape === "ellipse" && (
                            <ellipse
                              cx={layer.width / 2}
                              cy={layer.height / 2}
                              rx={layer.width / 2}
                              ry={layer.height / 2}
                              fill={layer.fill}
                              stroke={layer.stroke}
                              strokeWidth={layer.strokeWidth}
                            />
                          )}
                          {layer.shape === "triangle" && (
                            <polygon
                              points={`${0},${layer.height} ${
                                layer.width
                              },${layer.height} ${layer.width / 2},0`}
                              fill={layer.fill}
                              stroke={layer.stroke}
                              strokeWidth={layer.strokeWidth}
                            />
                          )}
                        </svg>
                        {resizeHandle}
                      </div>
                    );
                  default:
                    return null;
                }
              })}
            </div>
            <div style={{
              position: 'fixed',
              right: '18px',
              top: '90px', 
              width: "250px",
              height: "calc(100vh - 140px)", 
              background: "#f2f4f4",
              borderRadius: "12px",
              padding: "16px",
              border: "1px solid #e0e0e0", 
              boxShadow: "0 2px 7px rgba(0, 0, 0, 0.05)",
              overflowY: 'auto',
              zIndex: 100,
            }}>
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                marginBottom: "16px",
                paddingBottom: "12px",
                borderBottom: "1px solid #7A8D9B"
              }}>
                <span style={{ 
                  fontSize: 19, 
                  marginRight: 8,
                  color: "#4a5568",
                  display: "flex",
                  alignItems: "center"
                }}>
                  <svg 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                    <circle cx="8" cy="8" r="2"></circle>
                    <line x1="22" y1="12" x2="16" y2="12"></line>
                    <line x1="22" y1="15" x2="16" y2="15"></line>
                    <line x1="22" y1="18" x2="16" y2="18"></line>
                  </svg>
                </span>
                <span style={{ 
                  fontWeight: 600, 
                  fontSize: "16px",
                  color: "#2D3748"
                }}>
                  Preview
                </span>
              </div>

              <svg
                width="100%"
                height="auto"
                viewBox={`0 0 ${COLLAGE_WIDTH} ${COLLAGE_HEIGHT}`}
                style={{
                  width: "100%",
                  height: "auto",
                  borderRadius: "13px",
                  background: "#ffffff",
                  border: "1px solid #e0e0e0",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
              >
                {layers
                  .filter((l) => l.visible)
                  .map((l, i) => {
                    const opacity = l.opacity;
                    if (l.type === "Image") {
                      return (
                        <image
                          key={l.id}
                          x={l.x}
                          y={l.y}
                          width={l.width}
                          height={l.height}
                          href={l.src}
                          opacity={opacity}
                        />
                      );
                      } else if (l.type === "text") {
                        return (
                          <>
                            <rect
                              key={`${l.id}-bg`}
                              x={l.x}
                              y={l.y}
                              width={l.width}
                              height={l.height}
                              fill={l.backgroundColor}
                              opacity={opacity}
                            />
                            <text
                              key={`${l.id}-text`}
                              x={l.x + 5}
                              y={l.y + l.height / 2 + l.fontSize / 2.5}
                              fontSize={l.fontSize}
                              fontFamily={l.fontFamily}
                              fill={l.color}
                              opacity={opacity}
                            >
                              {l.text}
                            </text>
                          </>
                        );
                      } else if (l.type === "shape") {
                      if (l.shape === "rect") {
                        return (
                          <rect
                            key={l.id}
                            x={l.x}
                            y={l.y}
                            width={l.width}
                            height={l.height}
                            rx={17}
                            fill={l.fill}
                            stroke={l.stroke}
                            strokeWidth={l.strokeWidth}
                            opacity={opacity}
                          />
                        );
                      } else if (l.shape === "ellipse") {
                        return (
                          <ellipse
                            key={l.id}
                            cx={l.x + l.width / 2}
                            cy={l.y + l.height / 2}
                            rx={l.width / 2}
                            ry={l.height / 2}
                            fill={l.fill}
                            stroke={l.stroke}
                            strokeWidth={l.strokeWidth}
                            opacity={opacity}
                          />
                        );
                      } else if (l.shape === "triangle") {
                        const x1 = l.x;
                        const y1 = l.y + l.height;
                        const x2 = l.x + l.width;
                        const y2 = l.y + l.height;
                        const x3 = l.x + l.width / 2;
                        const y3 = l.y;
                        return (
                          <polygon
                            key={l.id}
                            points={`${x1},${y1} ${x2},${y2} ${x3},${y3}`}
                            fill={l.fill}
                            stroke={l.stroke}
                            strokeWidth={l.strokeWidth}
                            opacity={opacity}
                          />
                        );
                      }
                    }
                    return null;
                  })}
              </svg>
              {selectedId && (
                <div style={{
                  width: "100%",
                  maxWidth: "250px",
                  background: "f2f4f4",
                  borderRadius: "12px",
                  padding: "12px",
                  marginTop: "10px",
                  border: "1px solid #e0e0e0", 
                  position: "relative",
                  boxShadow: "0 2px 7px rgba(0, 0, 0, 0.05)", 
                }}>
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    marginBottom: "16px",
                    paddingBottom: "12px",
                    borderBottom: "1px solid #7A8D9B"
                  }}>
                    <span style={{ fontSize: 19, marginRight: 8 }}>
                      {(() => {
                        const l = layers.find(l => l.id === selectedId);
                        return l ? (l.type === "shape" ? layerTypeIcons[l.shape] : layerTypeIcons[l.type]) : null;
                      })()}
                    </span>
                    <span style={{ fontWeight: 600, fontSize: "16px" }}>
                      {(() => {
                        const l = layers.find(l => l.id === selectedId);
                        if (!l) return "";
                        return l.type === "Image" 
                          ? "Image Properties" 
                          : l.type === "text" 
                          ? "Text Properties" 
                          : "Shape Properties";
                      })()}
                    </span>
                  </div>

                  {(() => {
                    const l = layers.find(l => l.id === selectedId);
                    if (!l) return null;
                    
                    return (
                      <>
                        <div style={{ marginBottom: "16px" }}>
                          <div style={{ 
                            display: "flex", 
                            alignItems: "center", 
                            justifyContent: "space-between",
                            marginBottom: "8px"
                          }}>
                            <span style={{ fontWeight: 600, fontSize: "14px" }}>Opacity</span>
                            <span style={{ fontSize: "14px" }}>
                              {Math.round(l.opacity * 100)}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min={0.1}
                            max={1}
                            step={0.01}
                            value={l.opacity}
                            onChange={(e) =>
                              updateLayer(l.id, (old) => ({
                                ...old,
                                opacity: parseFloat(e.target.value),
                              }))
                            }
                            style={{ 
                              width: "100%",
                              background: "linear-gradient(135deg, #C8E6C9 0%, #DCEDC8 25%, #FFECB3 50%, #FFCDD2 75%, #E1BEE7 100%)",
                              height: "8px",
                              borderRadius: "4px",
                              outline: "none",
                              WebkitAppearance: "none",
                            }}
                          />
                        </div>
                        {l.type === "text" && (
                          <>
                            <div style={{ 
                              marginBottom: "16px",
                              paddingBottom: "12px",
                              borderBottom: "1px solid #7A8D9B",
                            }}>
                              <div style={{ marginBottom: "12px" }}>
                                <label style={{ 
                                  display: "block", 
                                  fontWeight: 600, 
                                  fontSize: "14px",
                                  marginBottom: "6px",
                                  
                                }}>
                                  Text Content
                                </label>
                                <textarea
                                  value={l.text}
                                  onChange={(e) =>
                                    updateLayer(l.id, (old) => ({
                                      ...old,
                                      text: e.target.value,
                                    }))
                                  }
                                  style={{
                                    width: "95%",
                                    minHeight: "60px",
                                    fontSize: "13px",
                                    padding: "8px",
                                    borderRadius: "8px",
                                    border: "0.5px solid #000",
                                    background: "#fff",
                                    resize: "vertical"
                                  }}
                                />
                              </div>

                              <div style={{ 
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: "12px",
                                marginBottom: "12px"
                              }}>
                                <div>
                                  <label style={{ 
                                    display: "block", 
                                    fontWeight: 600, 
                                    fontSize: "14px",
                                    marginBottom: "6px"
                                  }}>
                                    Font
                                  </label>
                                  <select
                                    value={l.fontFamily}
                                    onChange={(e) =>
                                      updateLayer(l.id, (old) => ({
                                        ...old,
                                        fontFamily: e.target.value,
                                      }))
                                    }
                                    style={{
                                      width: "95%",
                                      padding: "6px",
                                      fontSize: "13px",
                                      borderRadius: "8px",
                                      border: "0.5px solid #000",
                                      background: "#fff",
                                    }}
                                  >
                                    {fontFamilies.map((f) => (
                                      <option key={f} value={f}>{f}</option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <label style={{ 
                                    display: "block", 
                                    fontWeight: 600, 
                                    fontSize: "14px",
                                    marginBottom: "6px"
                                  }}>
                                    Size
                                  </label>
                                  <input
                                    type="number"
                                    min={10}
                                    max={120}
                                    value={l.fontSize}
                                    onChange={(e) =>
                                      updateLayer(l.id, (old) => ({
                                        ...old,
                                        fontSize: parseInt(e.target.value) || 1,
                                      }))
                                    }
                                    style={{
                                      width: "95%",
                                      padding: "6px",
                                      fontSize: "13px",
                                      borderRadius: "8px",
                                      border: "0.5px solid #000",
                                      background: "#fff",
                                    }}
                                  />
                                </div>
                              </div>

                              <div>
                                <label style={{ 
                                  display: "block", 
                                  fontWeight: 600, 
                                  fontSize: "14px",
                                  marginBottom: "6px"
                                }}>
                                  Color
                                </label>
                                <input
                                  type="color"
                                  value={l.color}
                                  onChange={(e) =>
                                    updateLayer(l.id, (old) => ({
                                      ...old,
                                      color: e.target.value,
                                    }))
                                  }
                                  style={{
                                    width: "100%",
                                    height: "40px",
                                    borderRadius: "8px",
                                    border: "none",
                                    cursor: "pointer"
                                  }}
                                />
                              </div>
                                <div style={{ marginBottom: "12px" }}>
                                  <label style={{ 
                                    display: "block", 
                                    fontWeight: 600, 
                                    fontSize: "14px",
                                    marginBottom: "6px"
                                  }}>
                                    Background Color
                                  </label>
                                  <div style={{
                                    position: 'relative',
                                    width: '100%',
                                    height: '40px',
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    border: 'none', 
                                  }}>
                                    {l.backgroundColor === 'transparent' && (
                                      <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        backgroundImage: 'linear-gradient(45deg, #e0e0e0 25%, transparent 25%, transparent 75%, #e0e0e0 75%, #e0e0e0), linear-gradient(45deg, #e0e0e0 25%, transparent 25%, transparent 75%, #e0e0e0 75%, #e0e0e0)',
                                        backgroundSize: '20px 20px',
                                        backgroundPosition: '0 0, 10px 10px',
                                      }} />
                                    )}
                                    <input
                                      type="color"
                                      value={l.backgroundColor === 'transparent' ? '#ffffff' : l.backgroundColor}
                                      onChange={(e) =>
                                        updateLayer(l.id, (old) => ({
                                          ...old,
                                          backgroundColor: e.target.value,
                                        }))
                                      }
                                      style={{
                                        position: 'relative',
                                        width: '100%',
                                        height: '100%',
                                        opacity: l.backgroundColor === 'transparent' ? 0.5 : 1,
                                        cursor: 'pointer',
                                        border: 'none', 
                                      }}
                                    />
                                  </div>
                                  <div style={{ 
                                    display: "flex", 
                                    gap: "8px", 
                                    marginTop: "8px"
                                  }}>
                                      {["transparent", "#ffffff", "#cccccc", "#ffb3ba", "#baffc9", "#bae1ff", "#ffffba"].map((color) => (
                                      <button
                                        key={color}
                                        onClick={() => 
                                          updateLayer(l.id, (old) => ({
                                            ...old,
                                            backgroundColor: color,
                                          }))
                                        }
                                        style={{
                                          width: "24px",
                                          height: "24px",
                                          borderRadius: "4px",
                                          background: color === 'transparent' 
                                            ? 'repeating-linear-gradient(45deg, #e0e0e0, #e0e0e0 2px, white 2px, white 4px)' 
                                            : color,
                                          border: color === "transparent" 
                                            ? "1px dashed #ccc" 
                                            : "1px solid #eee",
                                          cursor: "pointer"
                                        }}
                                        title={color === "transparent" ? "Transparent" : color}
                                      />
                                    ))}
                                  </div>
                                </div>
                            </div>
                          </>
                        )}
                        {l.type === "shape" && (
                          <>
                            <div style={{ 
                              marginBottom: "16px",
                              paddingBottom: "12px",
                              borderBottom: "1px solid #7A8D9B"
                            }}>
                              <div style={{ 
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: "12px",
                                marginBottom: "12px"
                              }}>
                                <div>
                                  <label style={{ 
                                    display: "block", 
                                    fontWeight: 600, 
                                    fontSize: "14px",
                                    marginBottom: "6px"
                                  }}>
                                    Fill Color
                                  </label>
                                  <input
                                    type="color"
                                    value={l.fill}
                                    onChange={(e) =>
                                      updateLayer(l.id, (old) =>
                                        old.type === "shape"
                                          ? { ...old, fill: e.target.value }
                                          : old
                                      )
                                    }
                                    style={{
                                      width: "100%",
                                      height: "40px",
                                      borderRadius: "8px",
                                      border: "none", 
                                      cursor: "pointer"
                                    }}
                                  />
                                </div>

                                <div>
                                  <label style={{ 
                                    display: "block", 
                                    fontWeight: 600, 
                                    fontSize: "14px",
                                    marginBottom: "6px"
                                  }}>
                                    Stroke Color
                                  </label>
                                  <input
                                    type="color"
                                    value={l.stroke}
                                    onChange={(e) =>
                                      updateLayer(l.id, (old) =>
                                        old.type === "shape"
                                          ? { ...old, stroke: e.target.value }
                                          : old
                                      )
                                    }
                                    style={{
                                      width: "100%",
                                      height: "40px",
                                      borderRadius: "8px",
                                      border: "none", 
                                      cursor: "pointer"
                                    }}
                                  />
                                </div>
                              </div>

                              <div>
                                <label style={{ 
                                  display: "block", 
                                  fontWeight: 600, 
                                  fontSize: "14px",
                                  marginBottom: "6px"
                                }}>
                                  Stroke Width
                                </label>
                                <input
                                  type="number"
                                  min={0}
                                  max={20}
                                  value={l.strokeWidth}
                                  onChange={(e) =>
                                    updateLayer(l.id, (old) =>
                                      old.type === "shape"
                                        ? {
                                            ...old,
                                            strokeWidth: parseInt(e.target.value) || 1,
                                          }
                                        : old
                                    )
                                  }
                                  style={{
                                    width: "95%",
                                    padding: "6px",
                                    borderRadius: "8px",
                                    border: "0.5px solid #000",
                                    background: "#fff",
                                  }}
                                />
                              </div>
                            </div>
                          </>
                        )}

                        {l.type === "Image" && (
                          <div style={{ 
                            marginBottom: "16px",
                            paddingBottom: "12px",
                            borderBottom: "1px solid #7A8D9B"
                          }}>
                            <div style={{ marginBottom: "12px" }}>
                              <label style={{ 
                                display: "block", 
                                fontWeight: 600, 
                                fontSize: "14px",
                                marginBottom: "6px"
                              }}>
                                Image Name
                              </label>
                              <div style={{
                                padding: "8px",
                                borderRadius: "8px",
                                background: "#ffffff",
                                border: "0.5px solid #000"
                              }}>
                                {l.name}
                              </div>
                            </div>
                          </div>
                        )}

                        <div style={{ 
                          display: "flex",
                          justifyContent: "space-between",
                          marginTop: "16px"
                        }}>
                          <button
                            onClick={() => moveLayer(l.id, "up")}
                            title="Move layer up"
                            style={{
                              padding: "8px 12px",
                              background: "#0000",
                              border: "0.5 px solid #000",
                              borderRadius: "8px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <FaArrowUp />
                          </button>
                          <button
                            onClick={() => moveLayer(l.id, "down")}
                            title="Move layer down"
                            style={{
                              padding: "8px 15px",
                              background: "#0000",
                              border: "none",
                              borderRadius: "8px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <FaArrowDown />
                          </button>
                          <button
                            onClick={() => deleteLayer(l.id)}
                            title="Delete layer"
                            style={{
                              padding: "8px 12px",
                              background: "#0000",
                              border: "0.5 px solid #000",
                              borderRadius: "8px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <FaTrashAlt />
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
        <div
          style={{
            position: "fixed",
            left: `${toolbarPos.x}px`,
            top: `${toolbarPos.y}px`,
            background: "#0000",
            borderRadius: "12px",
            border: "1px solid #e0e0e0", 
            boxShadow: "0 2px 7px rgba(0, 0, 0, 0.05)", 
            zIndex: 9000,
            padding: "10px",
            display: "flex",
            flexDirection: "row",
            gap: "12px",
            userSelect: "none",
            cursor: isDraggingToolbar ? "grabbing" : "grab",
          }}
          onMouseDown={handleToolbarMouseDown}
        >
          <label
            htmlFor="collage-editor-file-upload"
            title="Upload Image"
            style={{
              borderRadius: "15px",
              padding: "6px 15px",
              fontSize: "18px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              background: "#0000",
            }}
          >
            <FaImage />
          </label>

          <input
            id="collage-editor-file-upload"
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                addImageLayer(e.target.files[0]);
              }
              e.target.value = "";
            }}
          />

          <button
            onClick={() => setShowExport(true)}
            title="Export"
            style={{
              borderRadius: "15px",
              padding: "6px 15px",
              fontSize: "18px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              background: "#0000",
              border: "none",
            }}
          >
            <FaFileDownload />
          </button>

          <button
            onClick={addTextLayer}
            title="Add Text"
            style={{
              borderRadius: "15px",
              padding: "6px 15px",
              fontSize: "18px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              background: "#0000",
              border: "none",
            }}
          >
            <FaFont />
          </button>

          {(["rect", "ellipse", "triangle"] as ShapeType[]).map((shape) => (
            <button
              key={shape}
              onClick={() => addShapeLayer(shape)}
              title={`Add ${shapeNames[shape]}`}
              style={{
                borderRadius: "15px",
                padding: "6px 11px",
                fontSize: "18px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                background: "#0000",
                border: "none",
              }}
            >
              {layerTypeIcons[shape]}
            </button>
          ))}
        </div>
      </div>
      {showExport && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 90000,
            background: "#0000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "Inter,sans-serif",
          }}
          onClick={() => setShowExport(false)}
        >
        <div
          style={{
            background: '#f2f4f4',
            borderRadius: '12px',           
            padding: '24px',               
            border: '1px solid #e0e0e0',   
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)', 
            minWidth: '340px',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 600, 
            fontSize: '16px', 
            color: '#2D3748',
          }}
          onClick={(e) => e.stopPropagation()}
        >
            <div style={{ fontWeight: 700, fontSize: 19, marginBottom: 23 }}>
              Export Collage
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 25 }}>
              <span>
                <label>
                  Format:{" "}
                  <select
                    value={exportFormat}
                    onChange={(e) =>
                      setExportFormat(e.target.value as "png" | "svg")
                    }
                    style={{
                      border: "0.5 solid black",
                      borderRadius: 8,
                      fontSize: 16,
                      background: "#fff",
                    }}
                  >
                    <option value="png">PNG</option>
                    <option value="svg">SVG</option>
                  </select>
                </label>
              </span>
              <span>
                Resolution:{" "}
                <input
                  value={exportWidth}
                  min={100}
                  max={4000}
                  style={{
                    width: 60,
                    border: "0.5 solid black",
                    borderRadius: 7,
                  }}
                  type="number"
                  onChange={(e) =>
                    setExportWidth(parseInt(e.target.value) || 1)
                  }
                />{" "}
                x{" "}
                <input
                  value={exportHeight}
                  min={100}
                  max={4000}
                  style={{
                    width: 60,
                    border: "0.5 solid black",
                    borderRadius: 7,
                  }}
                  type="number"
                  onChange={(e) =>
                    setExportHeight(parseInt(e.target.value) || 1)
                  }
                />{" "}
                px
              </span>
            </div>

<div style={{ 
  display: "flex", 
  justifyContent: "flex-end", 
  gap: "18px",
  marginTop: "32px"
}}>
  <button
    onClick={() => setShowExport(false)}
    style={{
      padding: "13px 16px",
      background: "transparent",
      color: "#718096",
      fontWeight: 600,
      fontSize: 17,
      borderRadius: '0px', 
      border: 'none', 
      borderBottom: '2px solid #718096', 
      cursor: "pointer",
      transition: 'all 0.2s ease',
    }}
    onMouseOver={(e) => e.currentTarget.style.color = "#4A5568"}
    onMouseOut={(e) => e.currentTarget.style.color = "#718096"} 
  >
    Cancel
  </button>
  <button
    onClick={doExport}
    style={{
      padding: "13px 38px",
      background: "#718096", 
      color: "#ffffff", 
      fontWeight: 600,
      fontSize: 17,
      borderRadius: '8px',
      border: 'none', 
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      cursor: "pointer",
      letterSpacing: 0.5,
      transition: 'all 0.2s ease', 
    }}
    onMouseOver={(e) => e.currentTarget.style.background = "#4A5568"} 
    onMouseOut={(e) => e.currentTarget.style.background = "#718096"} 
  >
    Download
  </button>
</div>
          </div>
        </div>
      )}
      <link
        rel="preconnect"
        href="https://fonts.googleapis.com"
      />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap"
        rel="stylesheet"
      />
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 100000,
      }}>
        {notifications.map((notification) => (
          <div
            key={notification.id}
            style={{
              background: '#f2f4f4',
              borderRadius: '12px',
              padding: '16px 20px',
              border: '1px solid #e0e0e0',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              animation: 'fadeInScale 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              minWidth: '300px',
              maxWidth: '90vw',
              fontFamily: 'Inter, sans-serif',
              transformOrigin: 'center',
            }}
          >
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: notification.type === 'success' 
                ? '#4CAF50' 
                : notification.type === 'error' 
                  ? '#F44336' 
                  : '#2196F3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              flexShrink: 0,
            }}>
            </div>
            <div style={{ 
              color: '#2D3748',
              fontSize: '16px',
              fontWeight: 600,
              fontFamily: 'Inter, sans-serif',
            }}>
              {notification.message}
            </div>
          </div>
        ))}
      </div>
        <style>
          {`
            @keyframes fadeInScale {
              from { 
                opacity: 0;
                transform: scale(0.95);
              }
              to { 
                opacity: 1;
                transform: scale(1);
              }
            }
          `}
        </style>

      <footer style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '50px',
        background: '#0000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderTop: 'none',
        zIndex: 1000,
      }}>
        <p style={{
          margin: 0,
          fontSize: '14px',
          color: '#2D3748',
          fontStyle: 'italic',
        }}>
          © 2025 Collage Editor — Crafted with creativity. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default CollageEditor;