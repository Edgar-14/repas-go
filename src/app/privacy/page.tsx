'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, FileText, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface PrivacyPolicyDocument {
  url: string;
  name: string;
  uploadDate: string;
}

export default function PrivacyPolicyPage() {
  const [privacyPolicyDocument, setPrivacyPolicyDocument] = useState<PrivacyPolicyDocument | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrivacyPolicyDocument = async () => {
      try {
        const configRef = doc(db, 'configuration', 'globalSettings');
        const docSnap = await getDoc(configRef);
        if (docSnap.exists()) {
          const settings = docSnap.data();
          setPrivacyPolicyDocument(settings.privacyPolicyBusiness || null);
        }
      } catch (error) {
        console.error("Error fetching privacy policy document:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrivacyPolicyDocument();
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
          <h1 className="text-3xl font-bold text-gray-900">Políticas de Privacidad</h1>
        </div>

        {/* Documento desde configuración global */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="ml-2">Cargando documento oficial...</span>
            </div>
          </div>
        ) : privacyPolicyDocument?.url ? (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-green-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Documento Oficial</h3>
                  <p className="text-sm text-gray-500">
                    {privacyPolicyDocument.name} - Subido: {privacyPolicyDocument.uploadDate ? new Date(privacyPolicyDocument.uploadDate).toLocaleDateString() : 'Fecha no disponible'}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => window.open(privacyPolicyDocument.url, '_blank')}
                className="bg-green-600 hover:bg-green-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Ver Documento Oficial
              </Button>
            </div>
            <div className="p-4 border rounded-lg bg-green-50">
              <p className="text-sm text-green-700">
                <strong>Nota:</strong> Este es el documento oficial de políticas de privacidad actualizado por la administración.
                El contenido estático a continuación puede estar desactualizado.
              </p>
            </div>
          </div>
        ) : null}

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <p className="text-gray-700 mb-4">
                "BE FAST" autorizo la creación de la aplicación (BEFAST) es una sociedad legalmente constituida conforme a las Leyes de México; teniendo sus oficinas en el domicilio ubicado en GUILLERMO PRIETO 124-1, GUADALAJARITA, COLIMA, COLIMA, C.P. 28030.
              </p>
              <p className="text-gray-700 mb-4">
                “BE FAST” es un desarrollo de una plataforma de entrega de alimentos y diversos artículos a través de la cual “BEFAST” presta los Servicios a los Restaurantes o empresas y Negocios Afiliados en zonas cercanas y geográficas específicas en que los Usuarios pueden realizar Pedidos directos en dichos Restaurantes o empresas y Negocios Afiliados para que los Socios Repartidores recojan y entreguen a los Usuarios de (“BEFAST”).
              </p>
              <p className="text-gray-700 mb-4">
                Esta página se utiliza para informar a los usuarios sobre nuestras políticas con la recopilación, uso y divulgación de información personal si alguien decide usar nuestros servicios. Al aceptar la recopilación y el uso de información personal, se utilizan para proporcionar y mejorar el servicio. No utilizaremos ni compartiremos su información con nadie excepto como se describe en esta política de privacidad.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Recolección de Información de Uso</h2>
              <p className="text-gray-700 mb-4">
                Para una mejor experiencia mientras usa nuestro servicio, es posible que le solicitemos que nos proporcione cierta información de identificación personal, que incluye un número telefónico personal, nombre, entre otros, para el uso de la aplicación. La información que solicitamos será retenida por nosotros y utilizada como se describe en esta política de privacidad.
              </p>
              <p className="text-gray-700 mb-4">
                La aplicación utiliza servicios de terceros que pueden recopilar información utilizada para identificarlo.
              </p>
              <p className="text-gray-700">
                Enlace a la política de privacidad de servicios de terceros utilizados por la aplicación:
              </p>
              <ul className="list-disc pl-6 mt-2 text-gray-700">
                <li>Google Play Services.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Uso de la Ubicación</h2>
              <p className="text-gray-700 mb-4">
                Nuestra aplicación accede a la información de ubicación de los usuarios y repartidores con el fin de proporcionar y mejorar los servicios ofrecidos.
              </p>
              <p className="text-gray-700 mb-4">
                <strong>Para Usuarios:</strong> La aplicación accede a la ubicación del usuario para determinar su posición geográfica actual, lo que nos permite facilitar la asignación y recogida de pedidos de manera eficiente. Además, la ubicación del usuario se utiliza para mostrar su posición en el mapa a través de Google Maps, mejorando así la experiencia de uso dentro de la aplicación. Es importante destacar que la ubicación del usuario no es almacenada ni compartida con nuestro backend ni con terceros.
              </p>
              <p className="text-gray-700">
                <strong>Para Repartidores:</strong> La aplicación accede a la ubicación de los repartidores para las mismas finalidades mencionadas anteriormente, con el objetivo adicional de permitir la actualización continua de su posición en segundo plano (background). Esto nos permite monitorizar y gestionar en tiempo real el progreso de las entregas. A diferencia de los usuarios, la ubicación de los repartidores es almacenada de manera segura en nuestra base de datos para asegurar la prestación adecuada del servicio. Esta información es tratada con estrictas medidas de seguridad y no es compartida con terceros, salvo cuando sea necesario para cumplir con los requisitos legales aplicables o como parte de las funciones críticas del servicio.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Registro de Datos</h2>
              <p className="text-gray-700">
                Queremos informarle que cada vez que utiliza nuestro Servicio, en caso de error en la aplicación, recopilamos datos e información como la dirección de protocolo de internet (“IP”) de su dispositivo, nombre del dispositivo, versión del sistema operativo, la configuración de la aplicación al utilizar nuestro Servicio, y otras estadísticas.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Cookies</h2>
              <p className="text-gray-700">
                Las cookies son archivos con una pequeña cantidad de datos que se usan comúnmente como identificadores únicos anónimos. Estos se envían a su navegador desde los sitios web que visita y se almacenan en la memoria interna del dispositivo. Este servicio no utiliza “cookies” explícitamente. Sin embargo, la aplicación puede usar código de terceros y bibliotecas que usan “cookies” para recopilar información y mejorar sus servicios. Usted tiene la opción de aceptar o rechazar estas cookies y saber cuándo se envía una cookie a su dispositivo. Si elige rechazar nuestras cookies, es posible que no pueda usar algunas partes de nuestro Servicio.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Proveedores de Servicio</h2>
              <p className="text-gray-700 mb-4">
                Podemos emplear empresas e individuos de terceros debido a las siguientes razones:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Para facilitar nuestro servicio;</li>
                <li>Para proporcionar el servicio en nuestro nombre;</li>
                <li>Para realizar servicios relacionados con el servicio; o</li>
                <li>Para ayudarnos a analizar cómo se utiliza nuestro servicio.</li>
              </ul>
              <p className="text-gray-700">
                Estos terceros tienen acceso a su información personal solo para realizar estas tareas en nuestro nombre y están obligados a no divulgarla ni usarla para ningún otro propósito.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Seguridad</h2>
              <p className="text-gray-700">
                Valoramos su confianza en proporcionarnos su información personal, por lo tanto nos esforzamos para utilizar medios comercialmente aceptables para protegerla. Pero recuerde que ningún método de transmisión por internet, o método de almacenamiento electrónico es 100% seguro y confiable, y no podemos garantizar su seguridad absoluta.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Enlaces a Otros Sitios</h2>
              <p className="text-gray-700">
                Este servicio puede contener enlaces a otros sitios. Si hace clic en un enlace de terceros, será dirigido a ese sitio. Tenga en cuenta que estos sitios externos no son operados por nosotros. Por lo tanto, le recomendamos encarecidamente que revise la Política de Privacidad de estos sitios web. No tenemos control ni asumimos ninguna responsabilidad por el contenido, las políticas de privacidad, o prácticas de sitios o servicios de terceros.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Privacidad de los Niños</h2>
              <p className="text-gray-700">
                Este servicio no se dirige a ninguna persona menor de 13 años. No recopilamos a sabiendas información personal identificable de niños menores de 13. Si se da cuenta de que un niño menor de 13 años nos ha proporcionado información personal, contáctenos inmediatamente y tomaremos las medidas necesarias para eliminar dicha información de nuestros servidores.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Cambios a esta Política de Privacidad</h2>
              <p className="text-gray-700">
                Podemos actualizar nuestra Política de Privacidad de vez en cuando. Le notificaremos de cualquier cambio publicando la nueva Política de Privacidad en esta página. Estos cambios son efectivos inmediatamente, después de ser publicados en esta página.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Contacto</h2>
              <p className="text-gray-700">
                Si tiene alguna pregunta o sugerencia sobre nuestra Política de Privacidad, no dude en contactarnos en "BE FAST" (BEFAST).
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}