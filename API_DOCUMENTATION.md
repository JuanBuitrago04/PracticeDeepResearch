# DeepResearch API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
Include the user identifier in the request header:
```
x-user: admin
```

Or in the request body:
```json
{
  "usuario": "admin"
}
```

## Endpoints

### Health Check
**GET** `/api/health`

Check if the API is running.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "2.0.0"
}
```

---

### Start Research
**POST** `/api/research`

Start a new research session.

**Request Body:**
```json
{
  "query": "How will AI impact healthcare?",
  "maxIteraciones": 5,
  "usuario": "admin"
}
```

**Response:**
```json
{
  "sessionId": "session_1234567890_abc123",
  "status": "started",
  "message": "Investigación iniciada",
  "query": "How will AI impact healthcare?"
}
```

**Status Codes:**
- `200` - Research started successfully
- `400` - Invalid request (missing query)
- `500` - Server error

---

### Get Research Results
**GET** `/api/research/:sessionId`

Retrieve results from a research session.

**Response:**
```json
{
  "session": {
    "id": "session_1234567890_abc123",
    "query": "How will AI impact healthcare?",
    "usuario": "admin",
    "status": "completed",
    "created_at": "2024-01-01T00:00:00.000Z",
    "completed_at": "2024-01-01T00:05:00.000Z"
  },
  "results": [
    {
      "id": "result_1",
      "iteration": 1,
      "analisis": "...",
      "efectividad": 78.5,
      "cobertura": 0.75,
      "mejora": 0.15
    }
  ],
  "sources": [
    {
      "id": 1,
      "fuente": "Wikipedia",
      "contenido": "...",
      "tipo": "web"
    }
  ],
  "latestResult": {
    "analisis": "...",
    "efectividad": 92.3,
    "cobertura": 0.88,
    "observaciones": "Análisis profundo..."
  }
}
```

**Status Codes:**
- `200` - Success
- `404` - Session not found
- `500` - Server error

---

### List Sessions
**GET** `/api/sessions?limit=50`

List research sessions for the authenticated user.

**Query Parameters:**
- `limit` (optional): Maximum number of sessions to return (default: 50)

**Response:**
```json
{
  "sessions": [
    {
      "id": "session_1234567890_abc123",
      "query": "How will AI impact healthcare?",
      "usuario": "admin",
      "status": "completed",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### Get Statistics
**GET** `/api/statistics`

Get research statistics for the authenticated user.

**Response:**
```json
{
  "statistics": {
    "total_sessions": 42,
    "completed_sessions": 38,
    "avg_effectiveness": 87.5,
    "avg_iterations": 3.2
  }
}
```

---

### Export Research Result
**GET** `/api/export/:sessionId/:format`

Export a research result in the specified format.

**Path Parameters:**
- `sessionId`: The session ID
- `format`: Export format (`json`, `markdown`, or `pdf`)

**Response:**
Returns the file content with appropriate Content-Type header.

**Status Codes:**
- `200` - Success
- `404` - Session or result not found
- `500` - Server error

---

### Concurrent Research
**POST** `/api/research/concurrent`

Start multiple research queries concurrently.

**Request Body:**
```json
{
  "queries": [
    "Impact of AI on healthcare",
    "Sustainable energy trends",
    "Future of remote work"
  ],
  "maxIteraciones": 3,
  "usuario": "admin"
}
```

**Response:**
```json
{
  "exitosos": [
    {
      "index": 0,
      "query": "Impact of AI on healthcare",
      "resultado": { ... }
    }
  ],
  "fallidos": [
    {
      "index": 1,
      "query": "Invalid query",
      "error": "Error message"
    }
  ]
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message description"
}
```

Common status codes:
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (access denied)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

---

## Rate Limiting

Currently, there are no rate limits implemented. Consider implementing rate limiting for production deployments.

---

## Examples

### cURL Examples

**Start Research:**
```bash
curl -X POST http://localhost:3000/api/research \
  -H "Content-Type: application/json" \
  -H "x-user: admin" \
  -d '{
    "query": "How will quantum computing change cryptography?",
    "maxIteraciones": 5
  }'
```

**Get Results:**
```bash
curl http://localhost:3000/api/research/session_1234567890_abc123 \
  -H "x-user: admin"
```

**Export as PDF:**
```bash
curl http://localhost:3000/api/export/session_1234567890_abc123/pdf \
  -H "x-user: admin" \
  -o research.pdf
```

### JavaScript Examples

```javascript
// Start research
const response = await fetch('http://localhost:3000/api/research', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-user': 'admin'
  },
  body: JSON.stringify({
    query: 'Impact of climate change',
    maxIteraciones: 5
  })
});

const { sessionId } = await response.json();

// Poll for results
const pollResults = async () => {
  const res = await fetch(`http://localhost:3000/api/research/${sessionId}`, {
    headers: { 'x-user': 'admin' }
  });
  const data = await res.json();
  
  if (data.latestResult) {
    console.log('Research completed!', data.latestResult);
  } else {
    setTimeout(pollResults, 2000);
  }
};

pollResults();
```

---

## WebSocket Support (Future)

Real-time updates via WebSocket are planned for future releases.

