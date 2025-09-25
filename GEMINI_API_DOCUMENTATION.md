# Gemini API Documentation

## Overview
This API provides access to Google's Gemini AI model for text generation, medical advice, and radiology summaries.

## Base URL
```
/api/gemini
```

## Endpoints

### 1. Generate Text
**POST** `/api/gemini/generate`

Generate text based on a custom prompt.

#### Request Body
```json
{
  "prompt": "Your custom prompt here"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "prompt": "Your custom prompt here",
    "response": "Generated text response",
    "originalResponse": "Original response from Gemini",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Example
```bash
curl -X POST http://localhost:3000/api/gemini/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Explain the benefits of regular exercise"}'
```

### 2. Generate Medical Advice
**POST** `/api/gemini/medical-advice`

Generate medical advice based on symptoms and patient information.

#### Request Body
```json
{
  "symptoms": "Chest pain and shortness of breath",
  "age": "45",
  "gender": "Male",
  "medicalHistory": "Previous heart condition"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "symptoms": "Chest pain and shortness of breath",
    "age": "45",
    "gender": "Male",
    "medicalHistory": "Previous heart condition",
    "advice": "Generated medical advice...",
    "originalResponse": "Original response from Gemini",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "disclaimer": "This is for informational purposes only and should not replace professional medical advice."
  }
}
```

### 3. Generate Radiology Summary
**POST** `/api/gemini/radiology-summary`

Generate a comprehensive summary of radiology findings.

#### Request Body
```json
{
  "findings": "No acute abnormalities detected",
  "impression": "Normal chest X-ray",
  "patientAge": "30",
  "patientGender": "Female"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "findings": "No acute abnormalities detected",
    "impression": "Normal chest X-ray",
    "patientAge": "30",
    "patientGender": "Female",
    "summary": "Generated radiology summary...",
    "originalResponse": "Original response from Gemini",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "disclaimer": "This is for educational purposes and should be reviewed by a qualified radiologist."
  }
}
```

## Rate Limiting
All endpoints are protected by rate limiting:
- **Limit**: 100 requests per 15 minutes per IP
- **Headers**: Rate limit information is included in response headers

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Prompt is required and must be a non-empty string"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error",
  "details": "Error message details"
}
```

## Usage Examples

### Basic Text Generation
```javascript
const response = await fetch('/api/gemini/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    prompt: 'What are the symptoms of diabetes?'
  })
});

const data = await response.json();
console.log(data.data.response);
```

### Medical Advice
```javascript
const response = await fetch('/api/gemini/medical-advice', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    symptoms: 'Headache and fever',
    age: '25',
    gender: 'Female',
    medicalHistory: 'No significant history'
  })
});

const data = await response.json();
console.log(data.data.advice);
```

## Security Notes
- All responses include appropriate disclaimers
- Medical advice is for informational purposes only
- Radiology summaries should be reviewed by qualified professionals
- Rate limiting prevents abuse of the API

## Configuration
The API uses the following environment variables:
- `GEMINI_API_KEY`: Your Google Gemini API key
- Rate limiting configuration in `config.env`
