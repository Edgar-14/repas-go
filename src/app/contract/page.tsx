'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { useBreakpoints } from '@/hooks/use-mobile';

export default function ContractPage() {
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
            
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                CONTRATO DE PRESTACIÓN DE SERVICIOS DE ENTREGA A DOMICILIO
              </h1>
              <p className="text-sm text-gray-600">
                Que celebran, por una parte, la señora <strong>Rocío Arisema Uribe Macías</strong>, en su carácter de persona física con actividad empresarial, con Registro Federal de Contribuyentes (RFC) <strong>UIMR810603791</strong>, con domicilio en Guillermo Prieto 124-1, Colonia Guadalajara, C.P. 28030, en la ciudad de Colima, Colima, en adelante denominado <strong>"BeFast"</strong> o <strong>"El Prestador"</strong>; y por la otra parte, <strong>[Nombre del Cliente Restaurantero o Negocio]</strong>, representado por <strong>[Nombre del Representante Legal]</strong>, con RFC <strong>[RFC del Cliente]</strong>, con domicilio en <strong>[Domicilio del Cliente]</strong>, en adelante denominado <strong>"El Cliente"</strong>, al tenor de las siguientes:
              </p>
            </div>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-orange-600 mb-4">DECLARACIONES</h2>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Declara BeFast:</h3>
              <div className="mb-4 space-y-3">
                <p><strong>a)</strong> Ser una persona física con actividades empresariales con ingresos a través de plataformas tecnológicas, debidamente registrada ante el <strong>Servicio de Administración Tributaria (SAT)</strong> con RFC <strong>UIMR810603791</strong>.</p>
                
                <p><strong>b)</strong> Operar un ecosistema tecnológico denominado <strong>"BEFAST"</strong>, que conecta a negocios, clientes finales y repartidores. Dicho ecosistema se compone de:</p>
                <ul className="list-disc pl-6 mb-4">
                  <li><strong>(I) BeFast Delivery</strong>, una herramienta de software para que los negocios afiliados gestionen la logística de sus propios pedidos.</li>
                  <li><strong>(II) BeFast Market</strong>, una plataforma de comercio electrónico que permite a los clientes finales realizar pedidos directamente a los negocios afiliados.</li>
                </ul>
                <p>Ambas vertientes utilizan un motor logístico unificado para ofrecer y asignar las tareas de entrega a <strong>"El Trabajador"</strong> (en adelante, <strong>repartidor</strong>).</p>
                
                <p><strong>c)</strong> Comprometerse a cumplir estrictamente con:</p>
                <ul className="list-disc pl-6 mb-4">
                  <li>La <strong>Ley Federal del Trabajo</strong> (artículos 291-F y siguientes, reformada en diciembre de 2024), garantizando que los repartidores operen como trabajadores independientes o subordinados, según corresponda, con contratos laborales registrados ante el <strong>Centro Federal de Conciliación y Registro Laboral</strong>, respetando sus derechos laborales, incluyendo transparencia algorítmica y no discriminación.</li>
                  <li>Las disposiciones fiscales de la <strong>Ley del Impuesto sobre la Renta</strong>, el <strong>Código Fiscal de la Federación</strong>, y el <strong>Reglamento para Plataformas Tecnológicas</strong>, incluyendo la retención y entero de <strong>ISR (2.1% sobre ingresos de los repartidores)</strong> e <strong>IVA (8% o tasa aplicable)</strong>, y la emisión de comprobantes fiscales digitales (<strong>CFDI</strong>).</li>
                  <li>Las reglas del <strong>Instituto Mexicano del Seguro Social (IMSS)</strong> aplicables a plataformas digitales (<strong>Reglas Generales para la Incorporación de Trabajadores de Plataformas Digitales</strong>, publicadas en el <strong>Diario Oficial de la Federación</strong>), asegurando la inscripción de los repartidores al régimen obligatorio, el pago de cuotas obrero-patronales, y la cobertura de seguridad social (enfermedad, maternidad, riesgos de trabajo, invalidez, vejez y cesantía).</li>
                </ul>
                
                <p><strong>d)</strong> Contar con la capacidad técnica, operativa y legal para prestar los servicios de entrega a domicilio descritos en este contrato, a través del <strong>Ecosistema BeFast</strong>.</p>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">Declara El Cliente:</h3>
              <div className="mb-4 space-y-3">
                <p><strong>a)</strong> Ser una persona física o moral con actividad empresarial, debidamente registrada ante el <strong>SAT</strong> con RFC <strong>[RFC del Cliente]</strong>.</p>
                <p><strong>b)</strong> Requerir los servicios de entrega a domicilio para sus productos, ya sea a través de <strong>BeFast Delivery</strong> o de pedidos generados en <strong>BeFast Market</strong>, conforme a las condiciones de este contrato.</p>
                <p><strong>c)</strong> Contar con la capacidad legal para celebrar este contrato mercantil.</p>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">Ambas partes declaran:</h3>
              <div className="space-y-3">
                <p><strong>a)</strong> Que este contrato es de naturaleza mercantil, regulado por el <strong>Código de Comercio</strong> y, supletoriamente, por el <strong>Código Civil del Estado de Colima</strong>, y que no genera una relación laboral entre BeFast y El Cliente.</p>
                <p><strong>b)</strong> Que reconocen la competencia de los tribunales del estado de Colima para resolver cualquier controversia derivada de este contrato.</p>
                <p><strong>c)</strong> Que el presente contrato puede ser firmado electrónicamente, conforme a la cláusula décima primera, con la misma validez legal que una firma autógrafa, según lo dispuesto en el <strong>Código de Comercio</strong> (artículos 89 y 120).</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-orange-600 mb-4">CLÁUSULAS</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">PRIMERA. Objeto del contrato</h3>
                  <p>BeFast se compromete a prestar al Cliente servicios de intermediación para la entrega a domicilio de sus productos a través del <strong>Ecosistema BeFast</strong>, que incluye <strong>BeFast Delivery</strong> y, cuando aplique, <strong>BeFast Market</strong> (únicamente para pedidos generados en esta última), utilizando repartidores independientes, en estricto cumplimiento de la <strong>Ley Federal del Trabajo</strong>, la normativa fiscal aplicable, y las reglas del <strong>IMSS</strong>.</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">SEGUNDA. Naturaleza del contrato</h3>
                  <p className="mb-3">Las partes acuerdan que este contrato es de naturaleza mercantil, conforme al <strong>Código de Comercio</strong>, y no constituye una relación laboral entre BeFast y El Cliente. BeFast declara que cumple con:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>a)</strong> La <strong>Ley Federal del Trabajo</strong> (artículos 291-F a 291-S), garantizando que no se simulan relaciones laborales, que los repartidores tienen contratos laborales registrados, y que se respetan sus derechos a seguridad social, jornadas laborales, y no discriminación algorítmica.</li>
                    <li><strong>b)</strong> La <strong>Ley del Impuesto sobre la Renta</strong> y el <strong>Reglamento para Plataformas Digitales</strong>, reteniendo y enterando al <strong>SAT</strong> el <strong>ISR</strong> e <strong>IVA</strong> correspondientes por los ingresos de los repartidores, y emitiendo los <strong>CFDI</strong> requeridos.</li>
                    <li><strong>c)</strong> Las reglas del <strong>IMSS</strong>, asegurando la inscripción de los repartidores al régimen obligatorio, el pago de cuotas obrero-patronales, y la cobertura de seguridad social.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">TERCERA. Cláusula de exclusividad</h3>
                  <p>El Cliente se compromete a utilizar exclusivamente los servicios de entrega a domicilio del <strong>Ecosistema BeFast</strong>, es decir, <strong>BeFast Delivery</strong> y los servicios de entrega de pedidos generados en <strong>BeFast Market</strong>, durante la vigencia de este contrato. Queda estrictamente prohibido al Cliente contratar servicios de entrega a domicilio con otras plataformas digitales o terceros para los productos ofertados a través de <strong>BeFast Delivery</strong> o <strong>BeFast Market</strong>, salvo autorización expresa por escrito de BeFast. Esta cláusula no limita la libertad del Cliente para realizar entregas propias sin intermediación de plataformas digitales.</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">CUARTA. Tarifas y comisiones</h3>
                  <div className="space-y-3">
                    <p><strong>a) Comisión por pedido para el Cliente:</strong> El Cliente pagará a BeFast una comisión fija de <strong>$15.00 MXN</strong> (quince pesos mexicanos) por cada pedido entregado a través de <strong>BeFast Delivery</strong> o <strong>BeFast Market</strong>.</p>
                    
                    <p><strong>b) Tarifa al usuario final:</strong> La tarifa cobrada al usuario final por el servicio de entrega será:</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li><strong>$45.00 MXN</strong> (cuarenta y cinco pesos mexicanos) para entregas con una distancia de 0 a 3 kilómetros.</li>
                      <li>Un incremento de <strong>$2.50 MXN</strong> (dos pesos con cincuenta centavos mexicanos) por cada kilómetro adicional en la distancia de entrega, calculado desde el punto de recolección hasta el destino final.</li>
                    </ul>
                    
                    <p><strong>Cargos adicionales por condiciones climáticas:</strong></p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Lluvia ligera: <strong>$10.00 MXN</strong> (diez pesos mexicanos) por pedido, con posibles demoras de hasta 1 hora y 30 minutos.</li>
                      <li>Lluvia intensa: <strong>$20.00 MXN</strong> (veinte pesos mexicanos) por pedido, con posibles demoras de hasta 2 horas.</li>
                    </ul>
                    
                    <p><strong>Cargos adicionales por alta demanda:</strong></p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Alta demanda: <strong>$5.00 MXN</strong> (cinco pesos mexicanos) por pedido, con posibles demoras de hasta 1 hora.</li>
                      <li>Alta demanda intensa: <strong>$10.00 MXN</strong> (diez pesos mexicanos) por pedido, con posibles demoras de hasta 1 hora y 30 minutos.</li>
                    </ul>
                    
                    <p><strong>c)</strong> Las tarifas y comisiones no incluyen el <strong>Impuesto al Valor Agregado (IVA)</strong>, el cual será añadido conforme a la normativa fiscal aplicable. BeFast emitirá los comprobantes fiscales digitales (<strong>CFDI</strong>) correspondientes, en cumplimiento de la <strong>Ley del Impuesto sobre la Renta</strong> y el <strong>Código Fiscal de la Federación</strong>.</p>
                    
                    <p><strong>d)</strong> Los pagos se realizarán semanalmente mediante transferencia bancaria a la cuenta designada por BeFast, dentro de los <strong>5 días hábiles</strong> siguientes a la emisión de la factura.</p>
                  </div>
                </div>
              </div>
            </section>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mt-8">
              <p className="font-semibold text-orange-800 mb-2">Información de Contacto</p>
              <p className="text-orange-700 text-sm">
                <strong>Rocío Arisema Uribe Macías</strong><br/>
                RFC: UIMR810603791<br/>
                Dirección: Guillermo Prieto 124-1, Colonia Guadalajara, C.P. 28030, Colima, Colima<br/>
                Email: soporte@befastapp.com.mx<br/>
                Teléfono: +52 312 190 5494
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-500">
                Documento legal válido - Última actualización: {new Date().toLocaleDateString('es-MX', { 
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