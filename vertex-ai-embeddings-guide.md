# Guía para usar Qodo-Embed-1-7B / Dig-Embed-1-7B en Vertex AI

Esta guía resume los pasos necesarios para desplegar el modelo de incrustaciones Qodo-Embed-1-7B (también listado como Dig-Embed-1-7B) en Vertex AI y consumirlo desde la línea de comandos o mediante Python. Sigue el flujo para habilitar la API, crear el endpoint y ejecutar solicitudes `rawPredict` que devuelvan los vectores de embedding.

> **Nota:** Si ya gestionas variables sensibles en `ENVIRONMENT_VARIABLES.md`, reutiliza el mismo enfoque para almacenar `ENDPOINT_ID`, `PROJECT_ID` y `REGION`.

---

## 1. Requisitos previos

1. Proyecto de Google Cloud con facturación activa.
2. **Vertex AI API** habilitada: `gcloud services enable aiplatform.googleapis.com`.
3. Acceso al modelo Qodo-Embed-1-7B/Dig-Embed-1-7B (se obtiene por el flujo “Contactar con ventas”).
4. Endpoint desplegado mediante la opción "Opciones de despliegue" en Vertex AI > Model Garden.
5. `gcloud CLI` 465+ autenticado (`gcloud auth login`) y con credenciales de aplicación (`gcloud auth application-default login`).
6. Python 3.10+ si planeas usar el SDK.

---

## 2. Configurar el entorno

Establece las variables que reutilizarás en los comandos. Sustituye los valores en mayúsculas por los de tu proyecto.

### 2.1. Bash / Cloud Shell

```bash
export ENDPOINT_ID="ENDPOINT-ID"
export PROJECT_ID="YOUR_PROJECT_ID"
export REGION="us-central1"
```

### 2.2. PowerShell (Windows)

```powershell
$env:ENDPOINT_ID="ENDPOINT-ID"
$env:PROJECT_ID="YOUR_PROJECT_ID"
$env:REGION="us-central1"
```

### 2.3. Archivo de entrada opcional

Puedes mantener el cuerpo de la petición en un JSON externo:

```bash
cat <<'EOF' > request.json
{
  "instances": [
    {
      "input": [
        "def hello_world():\n  print('hello_world')"
      ]
    }
  ]
}
EOF
```

---

## 3. Consumir el modelo con `curl`

1. Abre Cloud Shell o tu terminal con `gcloud` instalado.
2. Asegúrate de tener un token válido: `gcloud auth application-default print-access-token`.
3. Envía la solicitud `rawPredict`:

```bash
curl \
  -X POST \
  -H "Authorization: Bearer $(gcloud auth application-default print-access-token)" \
  -H "Content-Type: application/json" \
  "https://${REGION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${REGION}/endpoints/${ENDPOINT_ID}:rawPredict" \
  -d @request.json
```

Si prefieres no crear un archivo adicional, sustituye `-d @request.json` por `-d '{"instances":[{"input":["texto"]}]}'` (recuerda escapar comillas en PowerShell).

---

## 4. Consumir el modelo con Python

1. (Opcional) Crea un entorno virtual y actívalo.
2. Instala el SDK de Vertex AI:
   ```bash
   pip install --upgrade google-cloud-aiplatform
   ```
3. Autentica tus credenciales de aplicación (`gcloud auth application-default login`).
4. Ejecuta el siguiente script y reemplaza los identificadores por los de tu proyecto:

```python
from google.cloud import aiplatform

MODEL_ID = "Qodo-Embed-1-7B"
PROJECT_ID = "YOUR_PROJECT_ID"
LOCATION = "REGION"
ENDPOINT_ID = "ENDPOINT-ID"

prompt = "def hello_world():\n  print('hello_world')"

aiplatform.init(project=PROJECT_ID, location=LOCATION)
endpoint = aiplatform.Endpoint(endpoint_name=ENDPOINT_ID)

response = endpoint.raw_predict({
    "instances": [
        {
            "input": [prompt]
        }
    ]
})

print(response)
```

> **Importante:** `streamRawPredict` no está soportado para este modelo; usa `raw_predict`/`rawPredict` únicamente.

---

## 5. Extraer el vector de embedding

La respuesta típica contiene un objeto `predictions` con metadatos de uso y la matriz de embedding. Para aislar el vector:

```python
embedding = response["predictions"][0]["data"][0]["embedding"]
print(len(embedding))  # Dimensión del vector
```

En shell, puedes utilizar `jq`:

```bash
cat response.json | jq '.predictions[0].data[0].embedding'
```

---

## 6. Buenas prácticas y depuración

- **Cuotas y latencia:** Consulta los límites vigentes en la consola de Vertex AI; ajusta el tamaño de lote (`instances`) si necesitas más throughput.
- **Errores de autenticación (`401`):** Verifica que estás usando `gcloud auth application-default print-access-token` y que la cuenta tiene permisos `aiplatform.endpoints.predict`.
- **Errores `404`/`403`:** Confirma `PROJECT_ID`, `REGION` y que el endpoint esté desplegado y en estado "Serving".
- **Versionado:** El recurso `dig-embed-1-7b` se liberó el 23 de febrero de 2025 (fase *Avance*). Monitorea nuevas versiones en Model Garden para actualizaciones de calidad.
- **Registro y monitoreo:** Habilita Cloud Logging/Monitoring para auditar las invocaciones si integras el modelo en producción.

---

## 7. Próximos pasos

1. Añade tus prompts reales (textos de código, documentación, etc.) al campo `input`.
2. Guarda los embeddings en tu base vectorial preferida antes de usarlos en búsquedas semánticas o RAG.
3. Automatiza la rotación de tokens y la validación de cuotas como parte de tus pipelines CI/CD.

Con esto ya cuentas con una referencia rápida para operar el modelo tanto desde scripts como desde tus servicios backend.

