# API Reference v3.1.0 (2026)

## 🤖 AI Endpoints

### AI Smart Search
```http
GET /api?action=ai.smartSearch&q=keyword&type=surat-masuk&limit=10
Authorization: Bearer [token]

Response (200):
{
  "status": "success",
  "data": {
    "query": "keyword",
    "totalResults": 5,
    "results": [
      {
        "type": "surat-masuk",
        "id": "sm-001",
        "title": "005/KPTS/DPRD/2026",
        "description": "Undangan Rapat",
        "relevanceScore": 95,
        "aiTags": ["Rapat", "Pemerintahan"],
        "aiConfidence": 0.95
      }
    ],
    "aiPowered": true,
    "modelVersion": "3.1.0"
  },
  "version": "3.1.0",
  "apiVersion": "v3"
}