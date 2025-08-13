import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Square, 
  Circle, 
  Square as PolygonIcon, 
  Trash2, 
  X,
  MousePointer
} from 'lucide-react';

interface FloatingDrawingToolsProps {
  onToolSelect: (tool: 'rectangle' | 'polygon' | 'circle') => void;
  onClear: () => void;
  isDrawing: boolean;
  hasDrawnArea: boolean;
  onClose: () => void;
}

export function FloatingDrawingTools({
  onToolSelect,
  onClear,
  isDrawing,
  hasDrawnArea,
  onClose
}: FloatingDrawingToolsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const tools = [
    {
      id: 'rectangle',
      icon: Square,
      label: 'Rectángulo',
      description: 'Dibuja un área rectangular'
    },
    {
      id: 'polygon',
      icon: PolygonIcon,
      label: 'Polígono',
      description: 'Dibuja un área personalizada'
    },
    {
      id: 'circle',
      icon: Circle,
      label: 'Círculo',
      description: 'Dibuja un área circular'
    }
  ];

  return (
    <div className="fixed top-4 right-4 z-50">
      {/* Botón principal flotante */}
      <Button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`h-12 w-12 rounded-full shadow-lg transition-all duration-300 ${
          isDrawing 
            ? 'bg-blue-500 hover:bg-blue-600 text-white' 
            : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
        }`}
      >
        <MousePointer className="h-5 w-5" />
      </Button>

      {/* Burbuja de herramientas */}
      {isExpanded && (
        <Card className="absolute top-16 right-0 w-80 bg-white shadow-2xl border border-gray-200 rounded-xl overflow-hidden tools-bubble floating-tools">
          <CardContent className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Herramientas de dibujo</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>

            {/* Herramientas */}
            <div className="space-y-3">
              {tools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <Button
                    key={tool.id}
                    variant="outline"
                    className="w-full justify-start h-auto p-3 hover:bg-blue-50 hover:border-blue-200 transition-all tool-button"
                    onClick={() => {
                      onToolSelect(tool.id as 'rectangle' | 'polygon' | 'circle');
                      setIsExpanded(false);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Icon className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-gray-900">{tool.label}</div>
                        <div className="text-xs text-gray-500">{tool.description}</div>
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>

            {/* Botón de limpiar */}
            {hasDrawnArea && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto p-3 hover:bg-red-50 hover:border-red-200 text-red-600"
                  onClick={() => {
                    onClear();
                    setIsExpanded(false);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Limpiar zona</div>
                      <div className="text-xs text-red-500">Eliminar área dibujada</div>
                    </div>
                  </div>
                </Button>
              </div>
            )}

            {/* Instrucciones */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>Instrucciones:</strong> Selecciona una herramienta y haz clic + arrastra en el mapa para dibujar tu zona de búsqueda.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
