'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, FileText, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface TermsDocument {
  url: string;
  name: string;
  uploadDate: string;
}

export default function TermsPage() {
  const [termsDocument, setTermsDocument] = useState<TermsDocument | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTermsDocument = async () => {
      try {
        const configRef = doc(db, 'configuration', 'globalSettings');
        const docSnap = await getDoc(configRef);
        if (docSnap.exists()) {
          const settings = docSnap.data();
          setTermsDocument(settings.privacyPolicyBusiness || null);
        }
      } catch (error) {
        console.error("Error fetching terms document:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTermsDocument();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link href="/">
              <Image
                src="/befast-logo-admin.svg"
                alt="BeFast Logo"
                width={120}
                height={80}
                className="h-12 w-auto object-contain"
              />
            </Link>
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft size={16} className="mr-2" />
                Volver al inicio
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Términos y Condiciones</h1>
        </div>

        {/* Documento desde configuración global */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="ml-2">Cargando documento oficial...</span>
            </div>
          </div>
        ) : termsDocument?.url ? (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-green-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Documento Oficial</h3>
                  <p className="text-sm text-gray-500">
                    {termsDocument.name} - Subido: {termsDocument.uploadDate ? new Date(termsDocument.uploadDate).toLocaleDateString() : 'Fecha no disponible'}
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => window.open(termsDocument.url, '_blank')}
                className="bg-green-600 hover:bg-green-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Ver Documento Oficial
              </Button>
            </div>
            <div className="p-4 border rounded-lg bg-green-50">
              <p className="text-sm text-green-700">
                <strong>Nota:</strong> Este es el documento oficial de términos y condiciones actualizado por la administración. 
                El contenido estático a continuación puede estar desactualizado.
              </p>
            </div>
          </div>
        ) : null}

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="prose prose-lg max-w-none">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Términos y Condiciones Generales de BeFast</h2>
              <p className="text-lg text-gray-700 mb-6">
              </p>
            </div>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Aceptación de los Términos</h2>
              <p className="text-gray-700 mb-4">
                Bienvenido a BeFast. Estos Términos y Condiciones ("T&C") rigen el uso de la aplicación móvil y los servicios ofrecidos por <strong>TECNOLOGIA Y SOLUCIONES DE INFRAESTRUCTURA</strong> ("BeFast"). Al descargar, instalar o utilizar la aplicación BeFast, usted (en adelante "Usuario", "Negocio Afiliado" o "Socio Repartidor") acepta y se obliga a cumplir con los presentes T&C en su totalidad. Si no está de acuerdo, no utilice nuestros servicios.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Descripción de los Servicios</h2>
              <p className="text-gray-700 mb-4">
                BeFast es un ecosistema tecnológico que conecta a negocios, clientes finales y repartidores para facilitar la entrega de alimentos y diversos artículos. Nuestros servicios se prestan a través de:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li><strong>BeFast Market:</strong> Una plataforma de comercio electrónico que permite a los Usuarios realizar pedidos directamente a los Negocios Afiliados para su entrega a domicilio.</li>
                <li><strong>BeFast Delivery:</strong> Una herramienta de software para que los Negocios Afiliados gestionen la logística y el envío de sus propios pedidos, utilizando el motor logístico de BeFast.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Cuentas de Usuario</h2>
              <p className="text-gray-700 mb-4">
                Para acceder a ciertas funciones, es necesario crear una cuenta. Usted se compromete a proporcionar información veraz, actual y completa.
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li><strong>Para Negocios Afiliados:</strong> Deben completar un registro, aceptar el Contrato de Prestación de Servicios Mercantil y operar mediante un sistema de créditos prepago, donde 1 crédito equivale a 1 envío.</li>
                <li><strong>Para Socios Repartidores:</strong> El registro es un proceso de solicitud riguroso que no garantiza la activación inmediata. La aprobación está sujeta a la validación de documentos y cumplimiento de todos los requisitos.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Nuestro Compromiso: Legalidad y Formalidad Laboral</h2>
              <p className="text-gray-700 mb-4">
                BeFast se diferencia por su estricto apego a la legalidad y la formalidad, garantizando un ecosistema justo y sostenible.
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li><strong>Empleados Formales:</strong> Los Socios Repartidores son considerados empleados formales bajo la normativa mexicana, no contratistas independientes.</li>
                <li><strong>Cumplimiento Integral:</strong> BeFast se compromete a cumplir con la <strong>Ley Federal del Trabajo</strong>, las regulaciones del <strong>Servicio de Administración Tributaria (SAT)</strong> (incluyendo la retención de ISR e IVA) y las reglas del <strong>Instituto Mexicano del Seguro Social (IMSS)</strong>.</li>
                <li><strong>Requisito Indispensable (IMSS):</strong> La activación de un Socio Repartidor está condicionada a la validación de su alta formal en el IMSS a través del <strong>Acta IDSE</strong>, siendo este un requisito indispensable para operar en la plataforma.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Tarifas y Pagos del Servicio de Entrega</h2>
              <p className="text-gray-700 mb-4">
                Las tarifas cobradas al Usuario final por el servicio de entrega son transparentes y se componen de la siguiente manera:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li><strong>Tarifa Base:</strong> <strong>$45.00 MXN</strong> para entregas en un radio de 0 a 3 kilómetros.</li>
                <li><strong>Costo por Distancia Adicional:</strong> Un incremento de <strong>$2.50 MXN</strong> por cada kilómetro adicional.</li>
                <li><strong>Cargos Adicionales:</strong> Se podrán aplicar cargos por condiciones de alta demanda o climáticas (lluvia ligera o intensa), los cuales serán claramente indicados al Usuario antes de confirmar el pedido.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Obligaciones y Conducta del Usuario</h2>
              <p className="text-gray-700 mb-4">
                Al utilizar BeFast, usted se compromete a:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Utilizar los servicios únicamente para fines lícitos.</li>
                <li>No suplantar la identidad de otras personas ni proporcionar información falsa.</li>
                <li>Mantener la confidencialidad de sus credenciales de acceso.</li>
              </ul>
              <p className="text-gray-700 mb-4">
                Queda estrictamente prohibido cualquier acto considerado como <strong>Falta Grave</strong>, incluyendo:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Fraude o robo comprobado.</li>
                <li>Acoso a clientes, personal de BeFast u otros Socios Repartidores.</li>
                <li>Utilizar una aplicación de la competencia durante un pedido activo de BeFast (multi-apping).</li>
                <li>Permitir que terceros no autorizados utilicen su cuenta.</li>
              </ul>
              <p className="text-gray-700">
                El incumplimiento de estas normas podrá resultar en la suspensión o desactivación inmediata y permanente de su cuenta.
              </p>
            </section>


            <h2>8. Limitación de Responsabilidad</h2>
            <p>
              BeFast actúa como intermediario tecnológico y no asume responsabilidad por:
            </p>
            <ul>
              <li>La calidad, seguridad o legalidad de productos ofrecidos por negocios</li>
              <li>Daños resultantes del servicio de entrega</li>
              <li>Interrupciones del servicio debido a mantenimiento o fallas técnicas</li>
              <li>Pérdidas económicas derivadas del uso de la plataforma</li>
            </ul>

            <h2>9. Terminación del Servicio</h2>
            <p>
              BeFast se reserva el derecho de suspender o terminar cuentas de usuario en caso de:
            </p>
            <ul>
              <li>Violación de estos términos y condiciones</li>
              <li>Actividad fraudulenta o ilegal</li>
              <li>Incumplimiento de estándares de calidad</li>
              <li>Falta de documentación requerida</li>
            </ul>

            <h2>10. Modificaciones de los Términos</h2>
            <p>
              BeFast se reserva el derecho de modificar estos términos en cualquier momento. 
              Los cambios serán notificados a través de la plataforma y entrarán en vigor 
              después del período de notificación establecido.
            </p>

            <h2>11. Ley Aplicable y Jurisdicción</h2>
            <p>
              Estos términos se rigen por las leyes de México. Cualquier disputa será resuelta 
              en los tribunales competentes de Guadalajara, Jalisco, México.
            </p>

            <h2>12. Contacto</h2>
            <p>
              Para preguntas sobre estos términos y condiciones, puede contactarnos en:
            </p>
            <ul>
              <li>Email: legal@befastapp.com.mx</li>
              <li>Teléfono: +52 (312) 213-7033</li>
              <li>Dirección: [Dirección de la empresa]</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}