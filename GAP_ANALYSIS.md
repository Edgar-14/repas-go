# GAP ANALYSIS - BeFast GO

Este documento detalla las diferencias encontradas entre la implementación actual del código y las especificaciones del documento maestro (`BEFAST_GO_DOCUMENTO_MAESTRO.md`).

## 1. Lógica de Autenticación (`src/store/slices/authSlice.ts`)

La función `validateDriverEligibility` es responsable de la "Validación 360°" al momento del login. La implementación actual está incompleta.

### Validaciones Faltantes:

- **`trainingStatus`**: El código no verifica si el conductor ha completado la capacitación (`trainingStatus === 'COMPLETED'`).
- **`pendingDebts`**: El código no comprueba si la deuda pendiente del conductor está por debajo del límite de 300 MXN. Aunque esta validación es más crítica al aceptar pedidos en efectivo, el documento maestro la incluye como parte de las validaciones generales para poder operar.

### Implementación Actual:
```typescript
// src/store/slices/authSlice.ts

const validateDriverEligibility = async (driverId: string): Promise<ValidationResult> => {
  // ...
  // Faltan las validaciones de trainingStatus y pendingDebts.
  // ...
};
```

### Acción Requerida:
- Modificar `validateDriverEligibility` para incluir las dos validaciones faltantes y asegurar que el conductor no pueda operar si no cumple con todos los requisitos.

---

## 2. Flujo de Registro (`src/screens/RegistrationScreen.tsx`)

La pantalla de registro implementa una versión simplificada del flujo de 5 pasos. Faltan varios campos y la lógica no coincide completamente con las especificaciones.

### Discrepancias por Paso:

*   **Paso 1: Datos Personales y Vehículo**
    *   **Campos Faltantes:** No se solicita el `año` del vehículo (`vehicle.year`) ni el `nombre del banco` (`bankAccount.bankName`).
    *   **Estructura de Datos:** El estado `formData` en el componente es plano, en lugar de seguir la estructura anidada (`personal`, `vehicle`, `bankAccount`) del documento maestro, lo que puede complicar la integración con la Cloud Function `submitDriverApplication`.

*   **Paso 2: Documentos Obligatorios**
    *   **Campos Faltantes:** Solo hay un campo para el documento de identidad (`idDoc`), pero el documento maestro requiere campos separados para el anverso (`ineFront`) y el reverso (`ineBack`). Tampoco se solicita el seguro del vehículo (`vehicleInsurance`).

*   **Paso 3: Contrato y Términos Legales**
    *   **Lógica Simplificada:** Se presenta una única casilla de aceptación (`agreementsAccepted`), en lugar de mostrar los enlaces a los documentos legales específicos (`Política de Gestión Algorítmica`, `Contrato`, etc.) y requerir su aceptación individual.

*   **Paso 4: Capacitación y Evaluación**
    *   **Lógica Simplificada:** El cuestionario (`quiz`) consiste en una única pregunta con una respuesta predefinida en el código (`quizAnswer === 'B'`). El documento maestro especifica un cuestionario de 10 preguntas con una puntuación mínima del 80%.

### Acción Requerida:
- **Añadir los campos faltantes** a la interfaz de usuario y al estado del componente.
- **Reestructurar el estado `formData`** para que coincida con el modelo de datos anidado del documento.
- **Separar el campo de subida del INE** en dos: anverso y reverso.
- **Modificar el paso 3** para listar los documentos legales y requerir su aceptación explícita.
- **Reemplazar el cuestionario simple** por una lógica que presente múltiples preguntas y calcule una puntuación.

---

## 3. Pantalla de Billetera (`src/screens/WalletScreen.tsx`)

La pantalla de la billetera (`WalletScreen`) implementa las funcionalidades básicas, como mostrar el saldo y el historial de transacciones, pero omite los componentes de análisis financiero que son clave en el documento maestro.

### Características Faltantes:

*   **Resumen por Período:** La interfaz no incluye las tarjetas de resumen que deberían mostrar las ganancias y los pedidos completados para "Hoy", "Esta Semana" y "Este Mes". Esta es una característica importante para que el conductor pueda ver su rendimiento de un vistazo.
*   **Desglose de Ingresos:** Falta el gráfico de desglose de ingresos (`IncomeBreakdownChart`), que debería proporcionar una representación visual de las fuentes de ganancias (tarifas, propinas, etc.).
*   **Acciones Rápidas:** Aunque hay botones para "Pagar Deuda" y "Retirar Fondos", no están integrados con la lógica de `walletSlice` para ejecutar estas acciones (actualmente solo navegan a otras pantallas).

### Acción Requerida:
- **Implementar el componente `PeriodSummary`** y añadirlo a la pantalla `WalletScreen`.
- **Crear e integrar el componente `IncomeBreakdownChart`** para visualizar el desglose de ingresos.
- **Conectar los botones de acción** con los *thunks* correspondientes en `walletSlice` para procesar los pagos de deuda y las solicitudes de retiro.

---
*Esta es una lista en progreso. Se añadirán más puntos a medida que avance el análisis.*
