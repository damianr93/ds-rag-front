import React, { useState } from "react";
import { FileText, X, Lock, Check } from "lucide-react";

interface DisclaimerPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  showCheckbox?: boolean;
  isFirstTime?: boolean;
}

const DisclaimerPopup: React.FC<DisclaimerPopupProps> = ({ 
  isOpen, 
  onClose, 
  onAccept,
  showCheckbox = false,
  isFirstTime = false
}) => {
  const [hasReadDisclaimer, setHasReadDisclaimer] = useState(false);

  if (!isOpen) return null;

  const handleAccept = () => {
    if (showCheckbox && !hasReadDisclaimer) return;
    onAccept();
    onClose();
  };

  const handleClose = () => {
    if (isFirstTime && showCheckbox && !hasReadDisclaimer) return;
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-700 flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="bg-blue-600 w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl font-bold text-white truncate">Descargo de Responsabilidades</h2>
              <p className="text-slate-400 text-xs sm:text-sm">
                {isFirstTime ? "Bienvenido - Por favor lee antes de continuar" : "Términos de uso y limitaciones"}
              </p>
            </div>
          </div>
          {!isFirstTime && (
            <button
              onClick={handleClose}
              className="text-slate-400 hover:text-white hover:bg-slate-700 p-2 rounded-lg transition-colors flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0">
          <div className="prose prose-slate prose-invert max-w-none">
            <div className="space-y-4 text-slate-300">
              {isFirstTime && (
                <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2 text-blue-400 mb-2">
                    <FileText className="w-4 h-4" />
                    <span className="font-semibold">Primera vez en la plataforma</span>
                  </div>
                  <p className="text-blue-200 text-sm">
                    Es importante que leas y aceptes los términos de uso antes de continuar.
                  </p>
                </div>
              )}

              <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 text-yellow-400 mb-2">
                  <Lock className="w-4 h-4" />
                  <span className="font-semibold">Aviso Importante</span>
                </div>
                <p className="text-yellow-200 text-sm">
                  Esta herramienta está en desarrollo y es solo para uso interno de la organización.
                </p>
              </div>

              <h3 className="text-lg font-semibold text-white mb-3">1. Propósito y Uso</h3>
              <p>
                Esta aplicación de inteligencia artificial está diseñada exclusivamente para uso interno 
                de nuestra organización. Proporciona análisis de noticias, generación de resúmenes y 
                funcionalidades de chat con IA para apoyar las actividades operativas.
              </p>

              <h3 className="text-lg font-semibold text-white mb-3">2. Limitaciones de Responsabilidad</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>La información generada por la IA puede contener errores o imprecisiones</li>
                <li>Los análisis y resúmenes no constituyen asesoramiento profesional</li>
                <li>Los usuarios deben verificar independientemente la información crítica</li>
                <li>La herramienta no reemplaza el juicio humano en decisiones importantes</li>
              </ul>

              <h3 className="text-lg font-semibold text-white mb-3">3. Privacidad y Seguridad</h3>
              <p>
                Toda la información procesada a través de esta herramienta debe considerarse confidencial. 
                Los usuarios son responsables de cumplir con las políticas de seguridad y privacidad 
                de la organización.
              </p>

              <h3 className="text-lg font-semibold text-white mb-3">4. Uso Responsable</h3>
              <p>
                Al utilizar esta herramienta, los usuarios se comprometen a:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Usar la aplicación únicamente para fines laborales autorizados</li>
                <li>No compartir credenciales de acceso</li>
                <li>Reportar cualquier mal funcionamiento o problema de seguridad</li>
                <li>Seguir las mejores prácticas de seguridad informática</li>
              </ul>

              <div className="bg-slate-700/50 rounded-lg p-4 mt-6">
                <p className="text-sm text-slate-400">
                  <strong>Versión:</strong> Beta 1.0 | <strong>Última actualización:</strong> {new Date().toLocaleDateString('es-ES')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-slate-700 flex-shrink-0">
          {showCheckbox && (
            <div className="mb-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <div className="relative flex-shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    checked={hasReadDisclaimer}
                    onChange={(e) => setHasReadDisclaimer(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 border-2 rounded transition-all ${
                    hasReadDisclaimer 
                      ? 'bg-blue-600 border-blue-600' 
                      : 'border-slate-400 hover:border-blue-400'
                  }`}>
                    {hasReadDisclaimer && (
                      <Check className="w-3 h-3 text-white absolute top-0.5 left-0.5" />
                    )}
                  </div>
                </div>
                <span className="text-slate-300 text-sm leading-relaxed">
                  He leído y acepto los términos de uso y descargo de responsabilidades
                </span>
              </label>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3">
            {!isFirstTime && (
              <button
                onClick={handleClose}
                className="w-full sm:flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-3 sm:py-2 rounded-lg font-medium transition-colors"
              >
                Cerrar
              </button>
            )}
            <button
              onClick={handleAccept}
              disabled={showCheckbox && !hasReadDisclaimer}
              className={`w-full sm:flex-1 px-4 py-3 sm:py-2 rounded-lg font-medium transition-colors ${
                showCheckbox && !hasReadDisclaimer
                  ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {showCheckbox ? 'Aceptar y Continuar' : 'Entendido'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisclaimerPopup;
