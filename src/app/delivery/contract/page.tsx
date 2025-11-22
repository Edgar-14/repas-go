'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { useBreakpoints } from '@/hooks/use-mobile';

export default function DeliveryContractPage() {
  const { isMobile } = useBreakpoints();

  const handleDownload = () => {
    const element = document.getElementById('contract-content');
    if (element) {
      const content = element.innerText;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Terminos_y_Condiciones_BeFast_Delivery.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 font-montserrat">
      <ResponsiveContainer 
        maxWidth="2xl" 
        padding={isMobile ? 'sm' : 'lg'}
        className="py-6"
      >
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white rounded-[30px] shadow-[15px_15px_30px_#bebebe,-15px_-15px_30px_#ffffff] p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <Link href="/delivery/signup">
                <Image
                  src="/logo-befast-delivery.svg"
                  alt="BeFast Delivery Logo"
                  width={120}
                  height={80}
                  className="h-12 w-auto object-contain"
                />
              </Link>
              <div className="flex gap-2">
                <Link href="/delivery/signup">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="bg-white border-orange-200 text-orange-600 hover:bg-orange-50 shadow-[8px_8px_12px_-2px_rgba(72,79,96,0.4),-6px_-6px_12px_-1px_rgba(255,255,255,1)]"
                  >
                    <ArrowLeft size={16} className="mr-2" />
                    Volver al registro
                  </Button>
                </Link>
                <Button 
                  onClick={handleDownload}
                  size="sm"
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-[8px_8px_12px_-2px_rgba(255,115,0,0.4),-6px_-6px_12px_-1px_rgba(255,255,255,1)]"
                >
                  <Download size={16} className="mr-2" />
                  Descargar
                </Button>
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
                Términos y Condiciones
              </h1>
              <p className="text-gray-600 text-sm md:text-base">
                Portal de Empresas BeFast Delivery
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div 
          id="contract-content"
          className="bg-white rounded-[30px] shadow-[15px_15px_30px_#bebebe,-15px_-15px_30px_#ffffff] p-6 md:p-8"
        >
          <div className="prose prose-lg max-w-none text-gray-700">
            
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-6 h-6 text-orange-600" />
                <h2 className="text-xl font-semibold text-gray-900 m-0">1. Información General</h2>
              </div>
              <p className="mb-4">
                "BE FAST" es una sociedad legalmente constituida conforme a las Leyes de México, con domicilio en GUILLERMO PRIETO 124-1, GUADALAJARITA, COLIMA, COLIMA, C.P. 28030.
              </p>
              <p className="mb-4">
                "BE FAST" es una plataforma de entrega de alimentos y diversos artículos que conecta restaurantes y negocios afiliados con usuarios finales a través de nuestros socios repartidores.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Registro de Empresas</h2>
              <p className="mb-4">
                Al registrarse como empresa en la plataforma BeFast Delivery, usted acepta proporcionar información veraz y actualizada sobre su negocio, incluyendo pero no limitándose a:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Razón social y datos fiscales</li>
                <li>Dirección comercial verificable</li>
                <li>Información de contacto válida</li>
                <li>Documentación legal requerida</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Sistema de Créditos</h2>
              <p className="mb-4">
                La plataforma opera bajo un sistema de créditos prepagados:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Cada pedido consume créditos de su cuenta empresarial</li>
                <li>Los créditos deben adquirirse antes de crear pedidos</li>
                <li>Los créditos no utilizados no tienen fecha de vencimiento</li>
                <li>No se realizan reembolsos de créditos no utilizados</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Creación y Gestión de Pedidos</h2>
              <p className="mb-4">
                Como empresa registrada, usted puede:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Crear pedidos para sus clientes</li>
                <li>Monitorear el estado de las entregas en tiempo real</li>
                <li>Acceder al historial completo de pedidos</li>
                <li>Generar reportes de actividad</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Responsabilidades de la Empresa</h2>
              <p className="mb-4">
                La empresa se compromete a:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Proporcionar información precisa sobre los pedidos</li>
                <li>Mantener actualizada la información de contacto</li>
                <li>Cumplir con las regulaciones sanitarias aplicables</li>
                <li>Tratar con respeto a los repartidores de BeFast</li>
                <li>Reportar cualquier incidencia de manera oportuna</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Tarifas y Pagos</h2>
              <p className="mb-4">
                Las tarifas por el servicio de entrega se deducen automáticamente de los créditos disponibles en su cuenta. Las tarifas pueden variar según:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Distancia de entrega</li>
                <li>Horario del pedido</li>
                <li>Condiciones especiales (clima, tráfico, etc.)</li>
                <li>Tipo de producto a entregar</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Privacidad y Protección de Datos</h2>
              <p className="mb-4">
                BeFast se compromete a proteger la información de su empresa y sus clientes conforme a nuestra política de privacidad. Los datos recopilados se utilizan exclusivamente para:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Procesar y gestionar pedidos</li>
                <li>Mejorar nuestros servicios</li>
                <li>Cumplir con obligaciones legales</li>
                <li>Comunicaciones relacionadas con el servicio</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Limitaciones de Responsabilidad</h2>
              <p className="mb-4">
                BeFast actúa como intermediario entre empresas, clientes y repartidores. Nuestra responsabilidad se limita a facilitar el servicio de entrega, sin asumir responsabilidad por:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Calidad de los productos entregados</li>
                <li>Daños causados por terceros</li>
                <li>Retrasos debido a circunstancias fuera de nuestro control</li>
                <li>Pérdidas indirectas o consecuenciales</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Terminación del Servicio</h2>
              <p className="mb-4">
                Cualquiera de las partes puede terminar este acuerdo en cualquier momento. BeFast se reserva el derecho de suspender o terminar cuentas que:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Violen estos términos y condiciones</li>
                <li>Proporcionen información falsa</li>
                <li>Realicen actividades fraudulentas</li>
                <li>Afecten negativamente la operación de la plataforma</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Modificaciones</h2>
              <p className="mb-4">
                BeFast se reserva el derecho de modificar estos términos y condiciones en cualquier momento. Las modificaciones serán notificadas a través de la plataforma y entrarán en vigor inmediatamente después de su publicación.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Ley Aplicable</h2>
              <p className="mb-4">
                Estos términos y condiciones se rigen por las leyes de México. Cualquier disputa será resuelta en los tribunales competentes de Colima, México.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">12. Contacto</h2>
              <p className="mb-4">
                Para cualquier consulta relacionada con estos términos y condiciones, puede contactarnos:
              </p>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="font-semibold text-orange-800 mb-2">BeFast Delivery</p>
                <p className="text-orange-700 text-sm">
                  Dirección: GUILLERMO PRIETO 124-1, GUADALAJARITA, COLIMA, COLIMA, C.P. 28030<br/>
                  Email: soporte@befastapp.com.mx<br/>
                  Teléfono: +52 312 190 5494
                </p>
              </div>
            </section>

            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-500">
                Última actualización: {new Date().toLocaleDateString('es-MX', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
        </div>
      </ResponsiveContainer>
    </div>
  );
}