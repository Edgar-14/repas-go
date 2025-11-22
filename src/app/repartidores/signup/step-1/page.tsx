'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ArrowRight, User, Phone, Mail, Car } from 'lucide-react';
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface SignupStep1State {
  email: string;
  fullName: string;
  phone: string;
  rfc: string;
  curp: string;
  umf: string;
  vehicleType: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: string;
  vehiclePlate: string;
  vehicleColor: string;
  bankClabe: string;
  bankName: string;
  bankAccountNumber: string;
}

const emptyState: SignupStep1State = {
  email: '',
  fullName: '',
  phone: '',
  rfc: '',
  curp: '',
  umf: '',
  vehicleType: '',
  vehicleBrand: '',
  vehicleModel: '',
  vehicleYear: '',
  vehiclePlate: '',
  vehicleColor: '',
  bankClabe: '',
  bankName: '',
  bankAccountNumber: '',
};

export default function SignupStep1() {
  const router = useRouter();
  const { toast } = useToast();
  const [formData, setFormData] = useState<SignupStep1State>(emptyState);
  const [verifiedEmail, setVerifiedEmail] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const verified = localStorage.getItem('driverVerified');
    const signupRaw = localStorage.getItem('signupData');

    if (verified !== 'true' || !signupRaw) {
      router.replace('/repartidores/signup');
      return;
    }

    try {
      const saved = JSON.parse(signupRaw);
      const emailFromAuth = auth.currentUser?.email ?? null;
      const pendingEmail = localStorage.getItem('driverPendingVerificationEmail');
      const resolvedEmail = saved.email ?? emailFromAuth ?? pendingEmail ?? '';

      if (!resolvedEmail) {
        router.replace('/repartidores/signup');
        return;
      }

      setVerifiedEmail(resolvedEmail);

      setFormData((prev) => ({
        ...prev,
        email: resolvedEmail,
        fullName: saved.fullName ?? saved.personalData?.fullName ?? prev.fullName,
        phone: saved.phone ?? saved.personalData?.phone ?? prev.phone,
        rfc: saved.rfc ?? saved.personalData?.rfc ?? prev.rfc,
        curp: saved.curp ?? saved.personalData?.curp ?? prev.curp,
        umf: saved.umf ?? saved.personalData?.umf ?? prev.umf,
        vehicleType: saved.vehicleType ?? saved.vehicle?.type ?? prev.vehicleType,
        vehicleBrand: saved.vehicleBrand ?? saved.vehicle?.brand ?? prev.vehicleBrand,
        vehicleModel: saved.vehicleModel ?? saved.vehicle?.model ?? prev.vehicleModel,
        vehicleYear: saved.vehicleYear ?? saved.vehicle?.year ?? prev.vehicleYear,
        vehiclePlate: saved.vehiclePlate ?? saved.vehicle?.plate ?? prev.vehiclePlate,
        vehicleColor: saved.vehicleColor ?? saved.vehicle?.color ?? prev.vehicleColor,
        bankClabe: saved.bankClabe ?? saved.bank?.clabe ?? prev.bankClabe,
        bankName: saved.bankName ?? saved.bank?.name ?? saved.bank?.bankName ?? prev.bankName,
        bankAccountNumber: saved.bankAccountNumber ?? saved.bank?.accountNumber ?? prev.bankAccountNumber,
      }));
    } catch (error) {
      console.error('Error parsing signupData for step-1:', error);
      router.replace('/repartidores/signup');
    }
  }, [router]);

  // CORRECCIÓN: Se elimina el useEffect que guardaba en localStorage en cada cambio.
  // El guardado debe ocurrir únicamente al presionar "Continuar" para garantizar consistencia.
  // Esto elimina el conflicto de guardado.

  const handleInputChange = (field: keyof SignupStep1State, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const requiredFields = useMemo(
    () => ['fullName', 'phone', 'rfc', 'curp', 'vehicleType'] as (keyof SignupStep1State)[],
    [],
  );

  const handleNext = () => {
    // CORRECCIÓN: Validación más estricta para campos requeridos, incluyendo cadenas vacías.
    const missingFields = requiredFields.filter((field) => {
      const value = formData[field];
      return !value || (typeof value === 'string' && value.trim() === '');
    });

    if (missingFields.length > 0) {
      toast({
        title: 'Campos requeridos',
        description: `Por favor completa todos los campos marcados con *. Faltan: ${missingFields.join(', ')}`,
        variant: 'destructive',
      });
      return;
    }

    try {
      const existingRaw = localStorage.getItem('signupData');
      const existing = existingRaw ? JSON.parse(existingRaw) : {};

      // CORRECCIÓN: Se crea el objeto de datos de forma limpia y estructurada.
      // Se elimina `...formData` para evitar duplicados y corrupción.
      const finalDataForStep1 = {
        ...existing,
        email: verifiedEmail, // Aseguramos que el email verificado se mantenga
        // Los datos se guardan en objetos anidados, como los demás pasos esperan.
        personalData: {
          fullName: formData.fullName.trim(),
          phone: formData.phone.trim(),
          rfc: formData.rfc.trim(),
          curp: formData.curp.trim(),
          umf: formData.umf.trim(),
        },
        vehicle: {
          type: formData.vehicleType,
          brand: formData.vehicleBrand.trim(),
          model: formData.vehicleModel.trim(),
          year: formData.vehicleYear.trim(),
          plate: formData.vehiclePlate.trim(),
          color: formData.vehicleColor.trim(),
        },
        bank: {
          clabe: formData.bankClabe.trim(),
          bankName: formData.bankName.trim(),
          accountNumber: formData.bankAccountNumber.trim(),
        },
      };

      // Se guarda el objeto completo y correcto en localStorage.
      localStorage.setItem('signupData', JSON.stringify(finalDataForStep1));

      // Se guarda el borrador en Firestore con la misma estructura correcta.
      if (verifiedEmail && db) {
        setDoc(doc(db, 'driverRegistrationDrafts', verifiedEmail), finalDataForStep1, { merge: true });
      }

    } catch (error) {
      console.error('No se pudo persistir signupData antes de continuar:', error);
      toast({
        title: "Error al guardar",
        description: "No se pudieron guardar los datos. Por favor, intenta de nuevo.",
        variant: "destructive"
      })
      return; // Detenemos la navegación si hay un error al guardar.
    }

    router.push('/repartidores/signup/step-2');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center p-2 sm:p-4">
      <Card className="w-full max-w-4xl shadow-[15px_15px_30px_#bebebe,-15px_-15px_30px_#ffffff] border-0">
        <CardHeader className="text-center pb-6 sm:pb-8">
          <div className="flex flex-col items-center space-y-4 sm:space-y-6 mb-6 sm:mb-8">
            <Image
              src="/logo-befast-repartidores.svg"
              alt="BeFast Repartidores"
              width={80}
              height={30}
              className="h-6 sm:h-8 w-auto object-contain"
            />
            <h1 className="text-xl sm:text-2xl font-bold text-emerald-800">Registro de Repartidor BeFast</h1>
          </div>
          <div className="flex flex-col items-center space-y-3 sm:space-y-4 mb-6 sm:mb-8">
            <div className="flex items-center justify-center space-x-1 sm:space-x-2">
              <div className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">1</div>
              <div className="w-12 h-1 bg-gray-300 rounded flex-shrink-0"></div>
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm flex-shrink-0">2</div>
              <div className="w-12 h-1 bg-gray-300 rounded flex-shrink-0"></div>
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm flex-shrink-0">3</div>
              <div className="w-12 h-1 bg-gray-300 rounded flex-shrink-0"></div>
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm flex-shrink-0">4</div>
            </div>
            <p className="text-gray-700 text-sm sm:text-base font-medium px-4 text-center">
              Paso 1 de 4: Información Personal y Laboral
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 sm:space-y-8 px-4 sm:px-6">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2 text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">
              <Mail className="flex-shrink-0" />
              Datos de contacto
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label className="text-sm">Email verificado</Label>
                <div className="mt-1 h-10 sm:h-12 px-3 flex items-center rounded-md border border-gray-200 bg-gray-100 text-sm sm:text-base text-gray-700">
                  {verifiedEmail || 'Correo no disponible. Regresa al inicio para revalidar.'}
                </div>
              </div>
              <div>
                <Label htmlFor="phone" className="text-sm">Teléfono *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="312 123 4567"
                  required
                  className="mt-1 text-sm sm:text-base h-10 sm:h-12"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2 text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">
              <User className="flex-shrink-0" />
              Información Personal Completa
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="sm:col-span-2">
                <Label htmlFor="fullName" className="text-sm">Nombre Completo *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  placeholder="Nombre(s) Apellido Paterno Apellido Materno"
                  required
                  className="mt-1 text-sm sm:text-base h-10 sm:h-12"
                />
              </div>
              <div>
                <Label htmlFor="rfc" className="text-sm">RFC *</Label>
                <Input
                  id="rfc"
                  value={formData.rfc}
                  onChange={(e) => handleInputChange('rfc', e.target.value.toUpperCase())}
                  placeholder="ABCD123456EFG"
                  maxLength={13}
                  required
                  className="mt-1 text-sm sm:text-base h-10 sm:h-12"
                />
              </div>
              <div className="sm:col-span-2"> {/* Cambié md:col-span-2 a sm:col-span-2 para consistencia */}
                <Label htmlFor="curp">CURP *</Label>
                <Input
                  id="curp"
                  value={formData.curp}
                  onChange={(e) => handleInputChange('curp', e.target.value.toUpperCase())}
                  placeholder="ABCD123456EFGHIJ01"
                  maxLength={18}
                  required
                  className="mt-1 text-sm sm:text-base h-10 sm:h-12"
                />
              </div>
              <div>
                <Label htmlFor="umf" className="text-sm">Unidad Médica Familiar (UMF)</Label>
                <Input
                  id="umf"
                  type="number"
                  value={formData.umf}
                  onChange={(e) => handleInputChange('umf', e.target.value)}
                  placeholder="Ej: 018"
                  maxLength={3}
                  className="mt-1 text-sm sm:text-base h-10 sm:h-12"
                />
                <p className="text-xs text-gray-500 mt-1">Número de 3 dígitos de tu clínica del IMSS</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-4">
              <Car className="flex-shrink-0" />
              Información del Vehículo
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vehicleType">Tipo de Vehículo *</Label>
                <Select onValueChange={(value) => handleInputChange('vehicleType', value)} value={formData.vehicleType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tu vehículo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MOTO">Motocicleta</SelectItem>
                    <SelectItem value="BICICLETA">Bicicleta</SelectItem>
                    <SelectItem value="AUTO">Automóvil</SelectItem>
                    <SelectItem value="CAMINANDO">A pie</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="vehicleBrand">Marca</Label>
                <Input
                  id="vehicleBrand"
                  value={formData.vehicleBrand}
                  onChange={(e) => handleInputChange('vehicleBrand', e.target.value)}
                  placeholder="Honda, Yamaha, etc."
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="vehicleModel">Modelo</Label>
                <Input
                  id="vehicleModel"
                  value={formData.vehicleModel}
                  onChange={(e) => handleInputChange('vehicleModel', e.target.value)}
                  placeholder="XR 150, Wave, etc."
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="vehicleYear">Año</Label>
                <Input
                  id="vehicleYear"
                  type="number"
                  value={formData.vehicleYear}
                  onChange={(e) => handleInputChange('vehicleYear', e.target.value)}
                  placeholder="2020"
                  min="1990"
                  max={new Date().getFullYear() + 1} // Permitimos el año siguiente
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="vehiclePlate">Placas</Label>
                <Input
                  id="vehiclePlate"
                  value={formData.vehiclePlate}
                  onChange={(e) => handleInputChange('vehiclePlate', e.target.value.toUpperCase())}
                  placeholder="ABC-123-D"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="vehicleColor">Color</Label>
                <Input
                  id="vehicleColor"
                  value={formData.vehicleColor}
                  onChange={(e) => handleInputChange('vehicleColor', e.target.value)}
                  placeholder="Rojo, Azul, etc."
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-4">
              <Phone className="w-5 h-5" />
              Información Bancaria
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bankClabe">CLABE Interbancaria</Label>
                <Input
                  id="bankClabe"
                  value={formData.bankClabe}
                  onChange={(e) => handleInputChange('bankClabe', e.target.value)}
                  placeholder="18 dígitos"
                  maxLength={18}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="bankName">Banco</Label>
                <Input
                  id="bankName"
                  value={formData.bankName}
                  onChange={(e) => handleInputChange('bankName', e.target.value)}
                  placeholder="BBVA, Santander, etc."
                  className="mt-1"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="bankAccountNumber">Número de Cuenta</Label>
                <Input
                  id="bankAccountNumber"
                  value={formData.bankAccountNumber}
                  onChange={(e) => handleInputChange('bankAccountNumber', e.target.value)}
                  placeholder="Número de cuenta bancaria"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-6">
            <Link href="/repartidores/login">
              <Button variant="outline" className="px-8">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </Link>
            <Button
              onClick={handleNext}
              className="px-8 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
            >
              Continuar
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}