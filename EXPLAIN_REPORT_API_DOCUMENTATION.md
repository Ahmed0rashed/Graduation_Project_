# Explain Report API Documentation

## Overview
This API endpoint uses Google's Gemini AI to explain radiology reports in simple Egyptian Arabic for patients with no medical background.

## Endpoint
**POST** `/api/gemini/explain-report`

## Request

### Headers
```
Content-Type: application/json
```

### Request Body
```json
{
  "report": "final radiology report text"
}
```

### Example Request
```json
{
  "report": "Chest X-ray shows clear lung fields bilaterally. No acute cardiopulmonary process. Heart size normal. No pleural effusion or pneumothorax."
}
```

## Response

### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "report": "Chest X-ray shows clear lung fields bilaterally. No acute cardiopulmonary process. Heart size normal. No pleural effusion or pneumothorax.",
    "patient_explanation": "الأشعة السينية للصدر تظهر أن الرئتين سليمتين من الجهتين. لا توجد مشاكل في القلب أو الرئتين. حجم القلب طبيعي. لا توجد مياه على الرئة أو هواء خارج الرئة.",
    "originalResponse": "Original response from Gemini AI",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "language": "Egyptian Arabic",
    "disclaimer": "This explanation is for educational purposes and should not replace professional medical consultation."
  }
}
```

### Error Responses

#### 400 Bad Request
```json
{
  "success": false,
  "error": "Report is required and must be a non-empty string"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Failed to generate explanation",
  "details": "Gemini API error details"
}
```

## Usage Examples

### cURL Example
```bash
curl -X POST http://localhost:3000/api/gemini/explain-report \
  -H "Content-Type: application/json" \
  -d '{
    "report": "MRI brain shows no acute intracranial abnormality. Normal brain parenchyma. No mass lesions or hemorrhage."
  }'
```

### JavaScript Example
```javascript
const response = await fetch('/api/gemini/explain-report', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    report: 'CT abdomen shows normal liver, spleen, and kidneys. No acute findings.'
  })
});

const data = await response.json();
console.log('Patient explanation:', data.data.patient_explanation);
```

### Python Example
```python
import requests

url = "http://localhost:3000/api/gemini/explain-report"
data = {
    "report": "Ultrasound shows normal gallbladder. No gallstones or wall thickening."
}

response = requests.post(url, json=data)
result = response.json()
print("Patient explanation:", result['data']['patient_explanation'])
```

## Features

### ✅ **Arabic Translation**
- Converts medical terminology to simple Egyptian Arabic
- Uses colloquial Egyptian Arabic expressions
- Avoids scientific jargon

### ✅ **Patient-Friendly Language**
- Simple, understandable explanations
- No complex medical terms
- Clear and concise descriptions

### ✅ **Error Handling**
- Input validation
- API error handling
- Comprehensive error messages

### ✅ **Rate Limiting**
- 100 requests per 15 minutes per IP
- Prevents API abuse

## Sample Reports and Expected Outputs

### Input: Chest X-ray Report
```json
{
  "report": "Bilateral clear lung fields. No acute cardiopulmonary process."
}
```

**Expected Output:**
```
"الأشعة تظهر أن الرئتين نظيفتين من الجهتين. لا توجد مشاكل في القلب أو الرئتين."
```

### Input: MRI Brain Report
```json
{
  "report": "No acute intracranial abnormality. Normal brain parenchyma."
}
```

**Expected Output:**
```
"الرنين المغناطيسي للدماغ طبيعي. لا توجد مشاكل في الدماغ. الأنسجة سليمة."
```

## Configuration

### Environment Variables Required
```env
GEMINI_API_KEY=your-gemini-api-key
```

### Rate Limiting Configuration
```env
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Security Notes

- ✅ **Input Validation**: All inputs are validated
- ✅ **Rate Limiting**: Prevents abuse
- ✅ **Error Handling**: Secure error responses
- ✅ **Disclaimers**: Medical disclaimers included

## Testing

### Test with Sample Report
```bash
curl -X POST http://localhost:3000/api/gemini/explain-report \
  -H "Content-Type: application/json" \
  -d '{
    "report": "Normal chest X-ray. No acute findings."
  }'
```

### Expected Response
```json
{
  "success": true,
  "data": {
    "patient_explanation": "الأشعة السينية للصدر طبيعية. لا توجد مشاكل حادة.",
    "language": "Egyptian Arabic",
    "disclaimer": "This explanation is for educational purposes and should not replace professional medical consultation."
  }
}
```

## Integration Notes

- **Base URL**: `/api/gemini/explain-report`
- **Method**: POST
- **Content-Type**: application/json
- **Rate Limit**: 100 requests/15 minutes
- **Response Format**: JSON
- **Language**: Egyptian Arabic
