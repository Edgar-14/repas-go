// Archivo: src/lib/shipday.ts

/**
 * Obtiene el estado de una orden desde la API de Shipday.
 * @param {string} shipdayId - El ID de la orden en Shipday.
 * @returns {Promise<any>} Una promesa que se resuelve con los datos del estado de la orden.
 */
export async function fetchShipdayOrderStatus(shipdayId: string): Promise<any> {
  try {
    const response = await fetch(`${process.env.SHIPDAY_API_URL}/orders/${shipdayId}`, {
      headers: {
        'Authorization': `Basic ${process.env.SHIPDAY_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Shipday API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    throw new Error(`Failed to fetch order status: ${error}`);
  }
}