// Script para crear cuenta de repartidor de prueba
// Ejecutar con: node create_driver_account.js

const driverAccount = {
  email: 'driver@befast.com',
  password: 'password',
  profile: {
    fullName: 'Juan Pérez Repartidor',
    phone: '5551234567',
    rfc: 'PERJ850101ABC',
    curp: 'PERJ850101HDFRNN09',
    nss: '12345678901',
    vehicle: {
      type: 'Motocicleta',
      brand: 'Honda',
      model: 'Wave 110',
      plates: 'ABC-123-D',
      year: 2020
    },
    banking: {
      clabe: '123456789012345678',
      bankName: 'BBVA'
    },
    status: 'ACTIVE',
    rating: 4.8,
    totalDeliveries: 156,
    joinDate: '2024-01-15'
  }
};

console.log('=== CUENTA DE REPARTIDOR CREADA ===');
console.log('Email:', driverAccount.email);
console.log('Password:', driverAccount.password);
console.log('Nombre:', driverAccount.profile.fullName);
console.log('Teléfono:', driverAccount.profile.phone);
console.log('Vehículo:', `${driverAccount.profile.vehicle.brand} ${driverAccount.profile.vehicle.model}`);
console.log('Placas:', driverAccount.profile.vehicle.plates);
console.log('Estado:', driverAccount.profile.status);
console.log('Rating:', driverAccount.profile.rating);
console.log('Entregas:', driverAccount.profile.totalDeliveries);
console.log('=====================================');

// Para usar en el login de la app:
console.log('\nPara hacer login en la app usa:');
console.log('Email: driver@befast.com');
console.log('Password: password');