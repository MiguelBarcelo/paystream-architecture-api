const URL = 'http://localhost:3000/payments';
const IDEMPOTENCY_KEY = '94362dcd-e34c-415b-8bf1-235ab80f93bd';

async function sendRequest(id) {
  try {
    const response = await fetch(URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-idempotency-key': IDEMPOTENCY_KEY,
      },
      body: JSON.stringify({
        amount: 3500,
        currency: 'MXN',
        description: 'Nintendo Switch',
        email: 'miguel.barcelo@gmail.com',
        storeId: 1,
      }),
    });
    const status = response.status;
    const data = await response.json();
    console.log(`Req ${id} -> Status: ${status}`, data);
  } catch (error) {
    console.error(`Req ${id} -> Error:`, error.message);
  }
}

// Ejecuta las 20 peticiones en paralelo estrictamente al mismo tiempo
const requests = Array.from({ length: 20 }, (_, i) => sendRequest(i + 1));
Promise.all(requests).then(() => console.log('!Prueba finalizada!'));
